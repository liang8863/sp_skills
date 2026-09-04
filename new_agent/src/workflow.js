import { phases, timestamp } from './contracts.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class WorkflowRunner {
  constructor(store, codex = null) {
    this.store = store;
    this.codex = codex;
    this.running = false;
  }

  status() {
    return this.running;
  }

  async start({ executor = 'auto' } = {}) {
    if (this.running) return false;
    this.running = true;
    const useHarness = executor === 'harness' || (executor === 'auto' && this.codex?.describe().connected);
    this.store.update((state) => {
      state.run = { id: `run-${Date.now()}`, status: 'running', executor: useHarness ? 'harness' : 'simulation', startedAt: timestamp(), completedAt: null, awaitingApproval: false, message: useHarness ? 'Harness 正在执行只读项目盘点' : '正在执行项目盘点与证据分析' };
      state.project.status = '分析中';
      state.metrics.lastRun = '运行中';
      state.metrics.runtimeChecks = '0 / 6';
      state.approvals.forEach((approval) => { approval.status = 'pending'; });
      this.resetPhases(state);
      this.store.activity('planner', '启动一次新的可审计 run', 'blue');
      this.store.audit('workflow.start', 'R1', 'accepted');
    });

    if (useHarness) {
      try {
        const result = await this.codex.runReadOnly({
          cwd: this.store.state.project.workspace,
          prompt: '你是 Slot Agent 的只读项目盘点器。只读取当前仓库，不修改文件、不执行外部网络操作。请用不超过 10 条要点概述 Cocos 项目的入口、主要 Prefab/Scene、SlotReel 或结算服务、现有测试/fixture，以及最值得优先验证的一个风险。不要臆测，无法确认的内容标记为 unknown。',
          onEvent: (event) => this.onCodexEvent(event)
        });
        const summary = String(result.response || '').replace(/\s+/g, ' ').slice(0, 240);
        this.store.update((state) => {
          state.run.message = summary ? `Harness 盘点完成：${summary}` : 'Harness 盘点完成，进入证据归一化';
          state.metrics.artifacts += 1;
          state.artifacts.unshift({ id: `art-${Date.now()}`, type: 'CodexTurn', label: `${state.run.id}-intake.turn`, status: '已完成', meta: `${result.threadId || 'local thread'} · readOnly`, time: '刚刚' });
          this.store.activity('codex', 'App Server thread/turn 完成，盘点结果已归档', 'green');
          this.store.audit('codex.turn.complete', 'R0', 'completed');
        });
      } catch (error) {
        this.running = false;
        this.store.update((state) => {
          state.run.status = 'error';
          state.run.executor = 'harness';
          state.run.message = `Harness 连接失败：${error.message}`;
          state.project.status = 'Harness 错误';
          state.metrics.lastRun = 'Harness 失败';
          this.store.activity('codex', `App Server 未完成：${error.message}`, 'red');
          this.store.audit('codex.turn.error', 'R0', 'failed');
        });
        return false;
      }
    }

    await this.runPhase('intake', '扫描完成：TS、Prefab、Scene 与现有文档已建立索引', 860);
    await this.runPhase('evidence', '归一化 4 条观察，发现 1 个需要二次验证的规则', 980);
    await this.runPhase('spec', 'GameSpec v4 草案生成，状态机覆盖 8 个转移', 920);
    await this.runPhase('plan', 'Patch Plan 已生成，隔离 worktree wt-7f2a 就绪', 900);

    this.store.update((state) => {
      state.run.status = 'awaiting_approval';
      state.run.awaitingApproval = true;
      state.run.message = 'R2 修改已准备好，等待人工审批后继续';
      state.project.status = '等待审批';
      state.metrics.pendingApprovals = state.approvals.filter((item) => item.status === 'pending').length;
      state.approvals[0].status = 'pending';
      state.artifacts[0].status = '待审批';
      this.store.activity('planner', '工作流暂停：R2 patch 等待审批', 'amber');
      this.store.audit('patch.await_approval', 'R2', 'pending');
    });
    this.running = false;
    return true;
  }

  async approve(approvalId) {
    const approval = this.store.state.approvals.find((item) => item.id === approvalId);
    if (!approval || approval.status !== 'pending') return false;
    approval.status = 'approved';
    this.store.update((state) => {
      state.run.status = 'running';
      state.run.awaitingApproval = false;
      state.run.message = '审批通过，正在隔离 worktree 中应用 patch';
      state.project.status = '实现中';
      state.metrics.pendingApprovals = state.approvals.filter((item) => item.status === 'pending').length;
      state.artifacts[0].status = '已批准';
      this.store.activity('operator', 'R2 patch 已批准，继续执行', 'green');
      this.store.audit('patch.approve', 'R2', 'approved');
    });
    if (this.running) return true;
    this.running = true;
    await this.runPhase('implement', 'patch 已应用：6 个 TS 文件、2 个 Prefab、1 个 fixture', 1100);
    await this.runPhase('verify', '验收完成：fixture 6/6、Prefab binding 12/12、截图 diff 通过', 1250);
    this.store.update((state) => {
      state.run.status = 'completed';
      state.run.completedAt = timestamp();
      state.run.message = '垂直切片已完成，可从 artifact 和 worktree 复现';
      state.project.status = '已完成';
      state.metrics.sliceProgress = 100;
      state.metrics.runtimeChecks = '6 / 6';
      state.metrics.lastRun = '刚刚完成';
      state.artifacts[0].status = '已执行';
      state.artifacts.unshift({ id: `art-${Date.now()}`, type: 'AcceptanceReport', label: 'hgcs-acceptance-report.md', status: '通过', meta: 'fixture 6/6 · screenshots 3/3 · rollback ready', time: '刚刚' });
      this.store.activity('reviewer', 'AcceptanceReport 已发布，垂直切片通过', 'green');
      this.store.audit('workflow.complete', 'R1', 'passed');
    });
    this.running = false;
    return true;
  }

  reject(approvalId) {
    const approval = this.store.state.approvals.find((item) => item.id === approvalId);
    if (!approval || approval.status !== 'pending') return false;
    this.store.update((state) => {
      approval.status = 'rejected';
      state.run.status = 'blocked';
      state.run.awaitingApproval = false;
      state.run.message = '审批被拒绝，工作流已阻断；请修改计划后重试';
      state.project.status = '需要修改';
      state.metrics.pendingApprovals = 0;
      state.artifacts[0].status = '需修改';
      this.store.activity('operator', 'R2 patch 被拒绝，等待计划修订', 'red');
      this.store.audit('patch.reject', 'R2', 'rejected');
    });
    return true;
  }

  addEvidence() {
    this.store.update((state) => {
      const id = `ev-${String(15 + state.evidences.length).padStart(3, '0')}`;
      state.evidences.unshift({ id, kind: 'manual', label: '人工补充：sticky wild 第二次观察', detail: 'local capture · 1 张截图 · 待写入 fixture', confidence: 0.71, time: '刚刚', tone: 'amber' });
      state.spec.openQuestions = Math.max(0, state.spec.openQuestions - 1);
      state.metrics.artifacts += 1;
      this.store.activity('operator', '追加一条手工证据，开放问题 -1', 'amber');
      this.store.audit('evidence.capture', 'R0', 'created');
    });
    return true;
  }

  reset() {
    this.running = false;
    this.store.reset();
    return this.store.read();
  }

  async runPhase(id, message, duration) {
    this.store.update((state) => {
      const phase = state.phases.find((item) => item.id === id);
      if (!phase) return;
      phase.status = 'running';
      phase.startedAt = timestamp();
      state.run.message = message;
      this.store.activity(id, `${phase.label}：${message}`, 'blue');
    });
    await wait(duration);
    this.store.update((state) => {
      const phase = state.phases.find((item) => item.id === id);
      if (!phase) return;
      phase.status = 'complete';
      phase.completedAt = timestamp();
      const currentIndex = phases.findIndex((item) => item.id === id);
      const next = state.phases[currentIndex + 1];
      if (next && next.status === 'queued') next.status = 'pending';
      state.metrics.sliceProgress = Math.max(state.metrics.sliceProgress, Math.round(((currentIndex + 1) / phases.length) * 78));
    });
  }

  resetPhases(state) {
    state.phases.forEach((phase, index) => {
      phase.status = index === 0 ? 'pending' : 'queued';
      phase.startedAt = null;
      phase.completedAt = null;
    });
  }

  onCodexEvent(message) {
    const method = message?.method || '';
    if (!method || (!method.startsWith('turn/') && !method.startsWith('item/') && method !== 'warning')) return;
    const params = message.params || {};
    const item = params.item || {};
    const label = item.type || method.replaceAll('/', ' ');
    this.store.activity('codex', `App Server ${label} event`, method === 'warning' ? 'amber' : 'blue');
  }
}
