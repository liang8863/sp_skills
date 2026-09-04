const now = () => new Date().toISOString();

export const phases = [
  { id: 'intake', label: '项目盘点', short: '01', description: '扫描代码、Prefab、场景与既有证据' },
  { id: 'evidence', label: '证据归一化', short: '02', description: '把截图、响应和日志整理成可追溯观察' },
  { id: 'spec', label: '规格草案', short: '03', description: '生成状态机、规则表和待验证项' },
  { id: 'plan', label: '变更计划', short: '04', description: '生成文件级和 Prefab 字段级 Patch Plan' },
  { id: 'implement', label: '隔离执行', short: '05', description: '在 worktree 应用已批准的修改' },
  { id: 'verify', label: '运行时验收', short: '06', description: 'fixture、Cocos MCP、截图和日志回归' }
];

export function createInitialState() {
  return {
    run: {
      id: null,
      status: 'idle',
      executor: 'simulation',
      startedAt: null,
      completedAt: null,
      awaitingApproval: false,
      message: '等待开始一次可审计的试点运行'
    },
    project: {
      id: 'slot-fe-hgcs',
      name: 'HGCS · 试点项目',
      branch: 'agent/preview-vertical-slice',
      workspace: 'D:\\WorkSpace\\slot-fe-client\\games\\slot-fe-hgcs',
      engine: 'Cocos Creator 3.8.7',
      status: '待分析'
    },
    phases: phases.map((phase, index) => ({
      ...phase,
      status: index === 0 ? 'pending' : 'queued',
      startedAt: null,
      completedAt: null
    })),
    metrics: {
      sliceProgress: 42,
      evidenceConfidence: 84,
      pendingApprovals: 1,
      artifacts: 18,
      runtimeChecks: '0 / 6',
      lastRun: '尚未运行'
    },
    evidences: [
      { id: 'ev-014', kind: 'runtime', label: 'cascade · collapse/drop 时序', detail: '12 个事件 · 3 张截图 · source: s_cli/trace-014', confidence: 0.92, time: '今天 09:18', tone: 'green' },
      { id: 'ev-013', kind: 'response', label: 'spin response / reelLayout', detail: 'fixture hgcs-spin-basic · hash 8c2f…b19a', confidence: 0.98, time: '今天 09:12', tone: 'blue' },
      { id: 'ev-012', kind: 'asset', label: 'symbol atlas inventory', detail: '146 个资源 · 4 个 atlas · 0 个未授权来源', confidence: 0.79, time: '昨天 17:44', tone: 'amber' },
      { id: 'ev-011', kind: 'note', label: 'sticky wild 规则待确认', detail: '当前只有 1 次观察，需要第二个 fixture', confidence: 0.56, time: '昨天 16:02', tone: 'red' }
    ],
    spec: {
      confidence: 0.84,
      lastUpdated: '今天 09:21',
      states: [
        { name: 'idle', label: 'Idle', count: 1, color: 'slate' },
        { name: 'spinning', label: 'Spinning', count: 1, color: 'blue' },
        { name: 'settling', label: 'Settling', count: 3, color: 'amber' },
        { name: 'cascade', label: 'Cascade', count: 2, color: 'green' },
        { name: 'payout', label: 'Payout', count: 1, color: 'rose' }
      ],
      openQuestions: 3
    },
    assets: [
      { name: 'symbol-atlas-main', type: 'Atlas', status: 'mapped', refs: '12 Prefabs', size: '4.8 MB' },
      { name: 'fx-cascade-burst', type: 'Animation', status: 'review', refs: 'GamePanel', size: '384 KB' },
      { name: 'bg-gameplay', type: 'Texture', status: 'mapped', refs: 'Scene/Main', size: '2.1 MB' },
      { name: 'audio-win-major', type: 'Audio', status: 'pending', refs: 'PayoutService', size: '96 KB' }
    ],
    approvals: [
      { id: 'approval-001', risk: 'R2', title: '写入基础转垂直切片 patch', detail: '6 个 TypeScript 文件 · 2 个 Prefab · 1 个 fixture', status: 'pending', createdAt: '今天 09:22', owner: 'Slot Agent' }
    ],
    artifacts: [
      { id: 'art-018', type: 'PatchPlan', label: 'hgcs-vertical-slice.plan.md', status: '待审批', meta: '6 files · R2 · rollback: wt-7f2a', time: '刚刚' },
      { id: 'art-017', type: 'GameSpec', label: 'hgcs-game-spec.v3.json', status: '已生成', meta: '38 fields · confidence 84%', time: '今天 09:21' },
      { id: 'art-016', type: 'RuntimeTrace', label: 'cascade-trace-014.json', status: '已验证', meta: '12 events · 3 screenshots', time: '今天 09:18' }
    ],
    activity: [
      { time: '09:22:14', actor: 'planner', text: 'Patch Plan 已生成，等待 R2 审批', tone: 'amber' },
      { time: '09:21:47', actor: 'spec', text: 'GameSpec v3 写入 artifact store', tone: 'blue' },
      { time: '09:18:33', actor: 'cocos', text: '捕获 cascade runtime trace', tone: 'green' },
      { time: '09:12:08', actor: 'evidence', text: 'fixture hgcs-spin-basic 校验通过', tone: 'green' }
    ],
    audit: []
  };
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

export function timestamp() {
  return now();
}
