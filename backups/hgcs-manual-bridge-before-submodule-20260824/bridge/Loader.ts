/**
 * Loader - ExternalModules 动态载入器
 *
 * 职责：
 * 1. 动态载入 ExternalModules bundle.js
 * 2. 检查模组可用性
 * 3. 包装成标准接口
 * 4. 提供重试机制
 * 5. 错误处理和日志
 */

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./types/global.d.ts" />

import type { ISlotGameExtModule, ILoaderResult } from "./types/bridge";
import { LOADER_CONFIG } from "../config/ProjectConfig";

/**
 * ExternalModules Loader（单例）
 */
export class Loader {
  private static readonly SCRIPT_CACHE_NAME = "slot-external-modules-v2";
  private static instance: Loader | null = null;
  private static debugMode: boolean = false; // Debug 模式（可由外部设置）

  private isLoaded = false;
  private isLoading = false;
  private externalModules: ISlotGameExtModule | null = null;
  private loadPromise: Promise<ISlotGameExtModule> | null = null;

  /**
   * 私有构造函数（单例模式）
   */
  private constructor() {}

  /**
   * 获取 Loader 单例实例
   */
  static getInstance(): Loader {
    if (!this.instance) {
      this.instance = new Loader();
    }
    return this.instance;
  }

  /**
   * 设置 Debug 模式（由 Bootstrap 调用）
   */
  static setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * 载入 ExternalModules
   * @param bundleUrl - bundle.js 的 URL（可选，默认使用 Config 配置）
   * @returns ExternalModules 实例
   */
  async load(bundleUrl?: string): Promise<ISlotGameExtModule> {
    // 如果已经载入成功，直接返回
    if (this.isLoaded && this.externalModules) {
      this.log("[Loader] ExternalModules 已载入，返回现有实例");
      return this.externalModules;
    }

    // 如果正在载入中，等待现有的载入完成
    if (this.isLoading && this.loadPromise) {
      this.log("[Loader] ExternalModules 载入中，等待完成...");
      return this.loadPromise;
    }

    // 开始新的载入流程
    this.isLoading = true;

    if (!bundleUrl) {
      throw new Error("[Loader] bundleUrl 未提供！请在 Bootstrap 中传入 GameConfig.externalModulesUrl");
    }

    const url = bundleUrl;

    this.loadPromise = this.loadWithRetry(url)
      .then((modules) => {
        this.isLoaded = true;
        this.isLoading = false;
        this.externalModules = modules;
        this.log(
          `[Loader] ✅ ExternalModules 载入成功 (version: ${modules.version})`
        );
        return modules;
      })
      .catch((error) => {
        this.isLoading = false;
        this.loadPromise = null;
        this.error("[Loader] ❌ ExternalModules 载入失败", error);
        throw error;
      });

    return this.loadPromise;
  }

  /**
   * 带重试机制的载入
   */
  private async loadWithRetry(url: string): Promise<ISlotGameExtModule> {
    const maxRetries = LOADER_CONFIG.maxRetries;
    const retryDelay = LOADER_CONFIG.retryDelay;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.log(
          `[Loader] 尝试载入 ExternalModules (${attempt}/${maxRetries})...`
        );
        this.log(`[Loader] URL: ${url}`);

        // 载入脚本
        await this.loadScript(url);

        // 检查模组可用性
        if (!this.isModuleAvailable()) {
          throw new Error(
            "ExternalModules 载入失败：window.ExternalModules 不存在"
          );
        }

        // 包装成标准接口
        const modules = this.createExternalModulesWrapper();
        return modules;
      } catch (error) {
        lastError = error as Error;
        this.warn(`[Loader] ⚠️ 载入失败 (${attempt}/${maxRetries})`, error);

        // 如果还有重试机会，等待后重试
        if (attempt < maxRetries) {
          this.log(`[Loader] ${retryDelay}ms 后重试...`);
          await this.sleep(retryDelay);
        }
      }
    }

    throw new Error(
      `ExternalModules 载入失败（已重试 ${maxRetries} 次）: ${lastError?.message}`
    );
  }

  /**
   * 动态载入脚本
   */
  private async loadScript(src: string): Promise<void> {
    const scriptSource = await this.resolveScriptSource(src);

    try {
      await new Promise<void>((resolve, reject) => {
      // 检查是否已经载入过
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        this.log("[Loader] 脚本已存在，跳过载入");
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = scriptSource.url;
      script.async = false; // 确保按顺序执行
      let settled = false;
      let timeoutId = 0;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        script.onload = null;
        script.onerror = null;
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };

      script.onload = () => {
        if (settled) return;
        settled = true;
        cleanup();
        this.log("[Loader] 脚本载入完成");
        resolve();
      };

      script.onerror = (error) => {
        if (settled) return;
        settled = true;
        cleanup();
        this.warn(`[Loader] 脚本载入失败: ${src}`, error);
        reject(new Error(`Failed to load script: ${src}`));
      };

      // 添加到 head
      document.head.appendChild(script);

      // 超时保护
      const timeout = LOADER_CONFIG.timeout;
      timeoutId = window.setTimeout(() => {
        if (settled) return;
        if (!this.isModuleAvailable()) {
          settled = true;
          cleanup();
          reject(new Error(`Script load timeout after ${timeout}ms: ${src}`));
        }
      }, timeout);
      });
    } finally {
      scriptSource.revoke?.();
    }
  }

  private async resolveScriptSource(src: string): Promise<{ url: string; revoke?(): void }> {
    if (!("caches" in window) || !("fetch" in window) || !("URL" in window)) {
      return { url: src };
    }

    const cacheKey = src;
    const forceRefresh = new URLSearchParams(window.location.search).has("refreshExternalModules");

    try {
      const cache = await caches.open(Loader.SCRIPT_CACHE_NAME);
      let response = forceRefresh ? undefined : await cache.match(cacheKey);

      if (!response) {
        response = await this.fetchAndCacheScript(cache, cacheKey, src);
        this.log("[Loader] ExternalModules 已写入持久缓存");
      } else {
        this.log("[Loader] ExternalModules 使用持久缓存");
        // 不阻塞本次启动；后台更新后，下一次启动会使用最新版本。
        void this.fetchAndCacheScript(cache, cacheKey, src).catch((error) => {
          this.warn("[Loader] ExternalModules 后台更新失败，继续使用现有缓存", error);
        });
      }

      const objectUrl = URL.createObjectURL(await response.blob());
      return {
        url: objectUrl,
        revoke: () => URL.revokeObjectURL(objectUrl),
      };
    } catch (error) {
      this.warn("[Loader] 持久缓存不可用，回退到网络脚本", error);
      return { url: src };
    }
  }

  private async fetchAndCacheScript(cache: Cache, cacheKey: string, src: string): Promise<Response> {
    const response = await fetch(src, { cache: "no-store", mode: "cors" });
    if (!response.ok) {
      throw new Error(`Failed to fetch script: ${response.status} ${response.statusText}`);
    }
    await cache.put(cacheKey, response.clone());
    return response;
  }

  /**
   * 检查 ExternalModules 是否可用
   */
  private isModuleAvailable(): boolean {
    return typeof window.ExternalModules !== "undefined";
  }

  /**
   * 包装 window.ExternalModules 成标准接口
   */
  private createExternalModulesWrapper(): ISlotGameExtModule {
    const modules = window.ExternalModules;

    if (!modules) {
      throw new Error("window.ExternalModules 不存在");
    }

    const { container, SERVICE_IDENTIFIERS } = modules;

    // 返回 ExternalModules 包装对象
    return {
      version: modules.VERSION || "unknown",
      container: container,
      SERVICE_IDENTIFIERS: SERVICE_IDENTIFIERS,

      // 通用服务获取方法
      get: <T>(identifier: symbol): T => {
        return container.get(identifier) as T;
      },

      // Core Infrastructure
      getLogger: () => {
        return container.get(SERVICE_IDENTIFIERS.LOGGER);
      },

      getEventSystem: () => {
        return container.get(SERVICE_IDENTIFIERS.EVENT_SYSTEM);
      },

      getNetworkService: () => {
        return container.get(SERVICE_IDENTIFIERS.NETWORK_SERVICE);
      },

      // UI/UX Layer
      getToastManager: () => {
        return container.get(SERVICE_IDENTIFIERS.TOAST_MANAGER);
      },

      getDialogManager: () => {
        return container.get(SERVICE_IDENTIFIERS.DIALOG_MANAGER);
      },

      getLoadingManager: () => {
        return container.get(SERVICE_IDENTIFIERS.LOADING_MANAGER);
      },

      // Services
      getSettingsManager: () => {
        return container.get(SERVICE_IDENTIFIERS.SETTINGS_MANAGER);
      },

      getAudioManager: () => {
        return container.get(SERVICE_IDENTIFIERS.AUDIO_MANAGER);
      },

      getAnalytics: () => {
        return container.get(SERVICE_IDENTIFIERS.ANALYTICS);
      },
    };
  }

  /**
   * 获取载入结果（包含详细信息）
   */
  getResult(): ILoaderResult {
    return {
      success: this.isLoaded,
      version: this.externalModules?.version || "unknown",
      slotGameExtModule: this.externalModules,
      error: this.isLoaded ? undefined : new Error("未载入或载入失败"),
    };
  }

  /**
   * 重置 Loader 状态（用于测试）
   */
  reset(): void {
    this.isLoaded = false;
    this.isLoading = false;
    this.externalModules = null;
    this.loadPromise = null;
  }

  // ==================== 辅助方法 ====================

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private log(...args: any[]): void {
    if (Loader.debugMode) {
      console.log(...args);
    }
  }

  private warn(...args: any[]): void {
    console.warn(...args);
  }

  private error(...args: any[]): void {
    console.error(...args);
  }
}
