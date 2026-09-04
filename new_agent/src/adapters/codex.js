import { spawn } from 'node:child_process';
import fs from 'node:fs';
import readline from 'node:readline';
import { EventEmitter } from 'node:events';

const DEFAULT_TIMEOUT = 45_000;
const TURN_TIMEOUT = Number(process.env.SLOT_AGENT_TURN_TIMEOUT_MS || 120_000);

function spawnCodex(command, args, options = {}) {
  if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(command)) {
    const quote = (value) => /[\s&()]/.test(value) ? `"${String(value).replaceAll('"', '\\"')}"` : String(value);
    const commandLine = [command, ...args].map(quote).join(' ');
    return spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', commandLine], { ...options, shell: false });
  }
  return spawn(command, args, { ...options, shell: false });
}

/**
 * Minimal Codex App Server JSONL client.
 * The gateway owns policy and UI state; this class only owns transport and
 * thread/turn lifecycle. It intentionally starts one local app-server process.
 */
export class CodexAdapter extends EventEmitter {
  constructor({ provider = process.env.OPENAI_BASE_URL || 'configured provider', model = process.env.SLOT_AGENT_MODEL || 'gpt-5.6-sol' } = {}) {
    super();
    this.provider = provider;
    this.model = model;
    this.command = process.env.CODEX_BIN || (process.platform === 'win32' ? 'codex.cmd' : 'codex');
    this.process = null;
    this.available = null;
    this.lastError = null;
    this.nextId = 1;
    this.pending = new Map();
    this.activeTurn = null;
    this.turnWaiters = new Map();
  }

  describe() {
    return {
      provider: this.provider,
      model: this.model,
      transport: 'app-server stdio JSONL',
      command: this.command,
      connected: Boolean(this.process),
      available: this.available,
      mode: this.process ? 'harness' : 'simulation',
      lastError: this.lastError,
      note: this.process ? 'Codex App Server 已连接。' : '点击连接 Harness 启动本机 Codex App Server。'
    };
  }

  async probe() {
    if (this.available !== null) return this.available;
    this.available = await new Promise((resolve) => {
      let settled = false;
      const child = spawnCodex(this.command, ['--version'], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      const finish = (value, error = null) => {
        if (settled) return;
        settled = true;
        this.lastError = error;
        resolve(value);
      };
      const timer = setTimeout(() => {
        child.kill();
        finish(false, `无法在 4 秒内执行 ${this.command}`);
      }, 4000);
      child.once('error', (error) => { clearTimeout(timer); finish(false, error.message); });
      child.once('close', (code) => { clearTimeout(timer); finish(code === 0, code === 0 ? null : `${this.command} 退出码 ${code}`); });
    });
    return this.available;
  }

  async connect() {
    if (this.process) return true;
    if (!(await this.probe())) throw new Error(this.lastError || `${this.command} 不可用`);
    const child = spawnCodex(this.command, ['app-server', '--listen', 'stdio://'], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    this.process = child;
    this.attachProcess(child);
    try {
      await this.request('initialize', {
        clientInfo: { name: 'slot_agent_mvp', title: 'Slot Agent MVP', version: '0.1.0' },
        capabilities: { experimentalApi: false }
      });
      this.send({ method: 'initialized', params: {} });
      this.lastError = null;
      this.emit('connected', this.describe());
      return true;
    } catch (error) {
      this.lastError = error.message;
      this.disconnect();
      throw error;
    }
  }

  async runReadOnly({ cwd, prompt, onEvent } = {}) {
    await this.connect();
    const safeCwd = cwd && fs.existsSync(cwd) ? cwd : process.cwd();
    const threadResult = await this.request('thread/start', {
      model: this.model,
      cwd: safeCwd,
      approvalPolicy: 'never',
      sandbox: 'read-only',
      serviceName: 'slot_agent_mvp'
    });
    const threadId = threadResult?.thread?.id;
    if (!threadId) throw new Error('Codex App Server 未返回 thread id');
    const turnResult = await this.request('turn/start', {
      threadId,
      input: [{ type: 'text', text: prompt }],
      cwd: safeCwd,
      approvalPolicy: 'never',
      // Codex 0.150 accepts the stable read-only policy here. Restricted
      // read roots are a named permission profile in newer app-server builds.
      sandboxPolicy: { type: 'readOnly' },
      model: this.model,
      effort: 'high',
      summary: 'concise'
    });
    const turnId = turnResult?.turn?.id;
    if (!turnId) throw new Error('Codex App Server 未返回 turn id');
    this.activeTurn = { threadId, turnId };
    return new Promise((resolve, reject) => {
      const key = `${threadId}:${turnId}`;
      const timer = setTimeout(() => {
        this.turnWaiters.delete(key);
        this.activeTurn = null;
        this.request('turn/interrupt', { threadId, turnId }, 10_000).catch(() => {});
        reject(new Error(`Codex turn 超时（${Math.round(TURN_TIMEOUT / 1000)} 秒）`));
      }, TURN_TIMEOUT);
      this.turnWaiters.set(key, { resolve, reject, onEvent, timer, response: '' });
    });
  }

  send(message) {
    if (!this.process?.stdin?.writable) throw new Error('Codex App Server stdin 不可写');
    this.process.stdin.write(`${JSON.stringify(message)}\n`);
  }

  request(method, params = {}, timeout = DEFAULT_TIMEOUT) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} 请求超时`));
      }, timeout);
      this.pending.set(id, { resolve, reject, timer });
      try {
        this.send({ method, id, params });
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(error);
      }
    });
  }

  attachProcess(child) {
    const rl = readline.createInterface({ input: child.stdout });
    rl.on('line', (line) => {
      if (!line.trim()) return;
      let message;
      try { message = JSON.parse(line); } catch { return; }
      if (message.id !== undefined && this.pending.has(message.id)) {
        const pending = this.pending.get(message.id);
        this.pending.delete(message.id);
        clearTimeout(pending.timer);
        if (message.error) pending.reject(new Error(message.error.message || 'App Server error'));
        else pending.resolve(message.result || {});
        return;
      }
      this.handleNotification(message);
    });
    child.stderr.on('data', (chunk) => {
      const text = String(chunk).trim();
      if (text) this.emit('stderr', text.slice(0, 500));
    });
    child.once('error', (error) => {
      this.lastError = error.message;
      this.emit('error', error);
    });
    child.once('close', (code) => {
      if (this.process === child) this.process = null;
      const error = code === 0 ? null : new Error(`Codex App Server 退出码 ${code}`);
      for (const pending of this.pending.values()) {
        clearTimeout(pending.timer);
        pending.reject(error || new Error('Codex App Server 已关闭'));
      }
      this.pending.clear();
      for (const waiter of this.turnWaiters.values()) {
        clearTimeout(waiter.timer);
        waiter.reject(error || new Error('Codex App Server 已关闭'));
      }
      this.turnWaiters.clear();
      this.emit('disconnected', { code, error: error?.message || null });
    });
  }

  handleNotification(message) {
    this.emit('notification', message);
    const params = message.params || {};
    if (message.method === 'turn/completed' && params.turn?.id) {
      const threadId = params.threadId || this.activeTurn?.threadId;
      const key = `${threadId}:${params.turn.id}`;
      const waiter = this.turnWaiters.get(key) || [...this.turnWaiters.values()][0];
      if (!waiter) return;
      this.turnWaiters.delete(key);
      clearTimeout(waiter.timer);
      this.activeTurn = null;
      if (params.turn.status === 'completed') waiter.resolve({ threadId, turn: params.turn, response: this.extractResponse(params.turn) || waiter.response });
      else waiter.reject(new Error(params.turn.error?.message || `Codex turn ${params.turn.status}`));
      return;
    }
    if (message.method && message.method.toLowerCase().includes('approval')) this.emit('approvalRequest', message);
    const delta = params.delta || params.text || params.part?.text || params.item?.text || '';
    for (const waiter of this.turnWaiters.values()) {
      if (typeof delta === 'string' && delta) waiter.response += delta;
      waiter.onEvent?.(message);
    }
  }

  extractResponse(turn) {
    const item = (turn.items || []).find((entry) => entry.type === 'agentMessage' || entry.type === 'message');
    if (!item) return '';
    return item.text || item.message || item.content?.map((part) => part.text || '').join('') || '';
  }

  disconnect() {
    if (this.process) this.process.kill();
    this.process = null;
  }
}
