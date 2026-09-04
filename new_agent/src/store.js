import { cloneState, createInitialState, timestamp } from './contracts.js';

export class StateStore {
  constructor() {
    this.state = createInitialState();
    this.listeners = new Set();
  }

  read() {
    return cloneState(this.state);
  }

  update(mutator) {
    mutator(this.state);
    for (const listener of this.listeners) listener(this.read());
    return this.read();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  reset() {
    this.state = createInitialState();
    return this.read();
  }

  activity(actor, text, tone = 'slate') {
    const date = new Date();
    const time = date.toLocaleTimeString('zh-CN', { hour12: false });
    this.state.activity.unshift({ time, actor, text, tone });
    this.state.activity = this.state.activity.slice(0, 10);
  }

  audit(action, risk, result, actor = 'operator') {
    this.state.audit.unshift({ id: `audit-${Date.now()}`, action, risk, result, actor, time: timestamp() });
    this.state.audit = this.state.audit.slice(0, 30);
  }
}
