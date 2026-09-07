/**
 * Bridge 配置类型定义
 *
 * 定义 Bridge 层的所有配置接口
 */

/**
 * 游戏配置（由各游戏专案自定义）
 */
export interface IGameConfig {
    /**
     * 游戏 ID
     */
    gameId: string;

    /**
     * 游戏名称
     */
    gameName: string;

    /**
     * 游戏版本
     */
    gameVersion: string;

    /**
     * 是否为开发模式（可选）
     * - 同时控制 Debug 日志级别
     * - 影响 ExternalModules URL（开发模式会添加时间戳避免快取）
     * @default false
     */
    isDev?: boolean;

    /**
     * 是否为Demo模式（可选）
     * @default false
     */
    isDemo?: boolean;

    /**
     * ExternalModules 基础域名或完整 URL
     *
     * 两种使用方式：
     * 1. 基础域名：自动组合 /${version}/bundle.js
     *    @example "https://yourdomain/ext-module"
     *    => "https://.../ext-module/1.0/bundle.js"
     *
     * 2. 完整 URL：包含 "bundle.js" 时直接使用，不组合
     *    @example "https://storage.googleapis.com/.../2.0/bundle.js?custom=true"
     *    => 直接使用此 URL
     *
     * 开发环境可在 gameConfig.json 中覆盖
     */
    externalModulesBaseDomain: string;

    /**
     * API 基础 URL（可选）
     * 用于游戏 API 请求的根 URL
     * @example "https://api.example.com"
     */
    apiBaseUrl?: string;

    /**
     * 其他游戏特定配置（由各游戏自行扩展）
     */
    [key: string]: any;
}
