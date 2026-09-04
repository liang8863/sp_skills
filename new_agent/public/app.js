const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

let state;
let integrations = { codex: {}, cocos: {} };
let polling;

const phaseStatus = {
  queued: ['queued', '排队中'],
  pending: ['pending', '待开始'],
  running: ['running', '执行中'],
  complete: ['complete', '已完成']
};

function notify(message, tone = 'default') {
  const toast = $('#toast');
  toast.textContent = message;
  toast.dataset.tone = tone;
  toast.classList.add('show');
  window.clearTimeout(notify.timer);
  notify.timer = window.setTimeout(() => toast.classList.remove('show'), 2600);
}

function render() {
  if (!state) return;
  renderHarness();
  $('#project-name').textContent = state.project.name;
  $('#workspace').textContent = state.project.workspace;
  $('#branch').textContent = state.project.branch;
  $('#engine').textContent = state.project.engine;
  $('#project-status').textContent = state.project.status;
  $('#project-status').className = `status-pill status-${state.project.status === '已完成' ? 'done' : state.project.status === '等待审批' ? 'approval' : state.project.status === '分析中' || state.project.status === '实现中' ? 'running' : 'idle'}`;
  $('#run-id').textContent = state.run.id ? state.run.id.toUpperCase() : 'NO ACTIVE RUN';
  $('#run-message').textContent = state.run.message;
  $('#confidence').textContent = `${Math.round(state.spec.confidence * 100)}% confidence`;
  $('#open-questions').textContent = state.spec.openQuestions;
  $('#spec-updated').textContent = `更新于 ${state.spec.lastUpdated}`;
  $('#artifact-count').textContent = `${state.metrics.artifacts} artifacts`;

  $('#metrics').innerHTML = [
    ['切片完成度', `${state.metrics.sliceProgress}%`, '目标：一个可运行垂直切片', 'progress'],
    ['证据置信度', `${state.metrics.evidenceConfidence}%`, '基于带引用观察的加权值', 'confidence'],
    ['待审批动作', state.metrics.pendingApprovals, state.metrics.pendingApprovals ? 'R2 写入操作已暂停' : '当前没有阻塞动作', 'approvals'],
    ['运行时检查', state.metrics.runtimeChecks, `最近运行：${state.metrics.lastRun}`, 'checks']
  ].map(([label, value, detail, kind]) => `<div class="metric"><span class="metric-label">${label}</span><strong class="metric-value metric-${kind}">${value}</strong><span class="metric-detail">${detail}</span></div>`).join('');

  $('#workflow-list').innerHTML = state.phases.map((phase, index) => {
    const [className, label] = phaseStatus[phase.status] || phaseStatus.queued;
    return `<div class="phase-row ${className}"><div class="phase-marker">${phase.status === 'complete' ? '✓' : phase.status === 'running' ? '•••' : phase.short}</div><div class="phase-content"><div class="phase-title"><strong>${phase.label}</strong><span>${label}</span></div><p>${phase.description}</p></div>${index < state.phases.length - 1 ? '<div class="phase-connector"></div>' : ''}</div>`;
  }).join('');

  const approval = state.approvals.find((item) => item.status === 'pending');
  $('#approval-list').innerHTML = approval ? `<div class="approval-card"><div class="approval-top"><span class="risk-badge">${approval.risk}</span><span class="approval-time">${approval.createdAt}</span></div><h3>${escapeHtml(approval.title)}</h3><p>${escapeHtml(approval.detail)}</p><div class="approval-actions"><button class="button button-primary" data-approval="approve" data-id="${approval.id}">✓ 批准并继续</button><button class="button button-danger" data-approval="reject" data-id="${approval.id}">× 拒绝</button></div></div>` : `<div class="empty-state"><div class="empty-icon">✓</div><strong>审批队列已清空</strong><span>所有写操作都有对应审计记录。</span></div>`;

  $('#evidence-list').innerHTML = state.evidences.map((item) => `<div class="evidence-row"><div class="evidence-icon tone-${item.tone}">${item.kind.slice(0, 2).toUpperCase()}</div><div class="evidence-copy"><div><strong>${escapeHtml(item.label)}</strong><span class="confidence-mini">${Math.round(item.confidence * 100)}%</span></div><p>${escapeHtml(item.detail)}</p></div><time>${escapeHtml(item.time)}</time></div>`).join('');

  $('#state-map').innerHTML = state.spec.states.map((item) => `<div class="state-node state-${item.color}"><span>${escapeHtml(item.label)}</span><b>${item.count}</b></div>`).join('<span class="state-arrow">→</span>');

  $('#asset-table').innerHTML = state.assets.map((item) => `<tr><td><span class="resource-dot"></span>${escapeHtml(item.name)}</td><td>${escapeHtml(item.type)}</td><td>${escapeHtml(item.refs)}</td><td><span class="asset-status ${item.status}">${item.status === 'mapped' ? '已映射' : item.status === 'review' ? '待复核' : '待处理'}</span></td><td>${escapeHtml(item.size)}</td></tr>`).join('');

  $('#artifact-list').innerHTML = state.artifacts.slice(0, 4).map((item) => `<div class="artifact-row"><div class="artifact-type">${escapeHtml(item.type.slice(0, 3).toUpperCase())}</div><div class="artifact-copy"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.meta)}</span></div><span class="artifact-status">${escapeHtml(item.status)}</span></div>`).join('');

  $('#activity-list').innerHTML = state.activity.slice(0, 6).map((item) => `<div class="activity-row"><time>${escapeHtml(item.time)}</time><span class="activity-dot tone-${item.tone}"></span><span class="activity-actor">${escapeHtml(item.actor)}</span><span class="activity-text">${escapeHtml(item.text)}</span></div>`).join('');
  $('#run-button').disabled = state.run.status === 'running';
  const runLabel = integrations.codex?.connected ? '运行 Harness 分析' : '运行模拟分析';
  $('#run-button').innerHTML = state.run.status === 'running' ? '<span class="button-spinner"></span> 执行中' : `<span>▶</span> ${runLabel}`;
}

function renderHarness() {
  const codex = integrations.codex || {};
  const connected = Boolean(codex.connected);
  const indicator = $('#harness-indicator');
  const button = $('#harness-button');
  indicator.className = `harness-indicator ${connected ? 'connected' : codex.available === false ? 'missing' : ''}`;
  $('#harness-label').textContent = connected ? 'Harness 已连接' : codex.available === false ? 'Harness 不可用' : '连接 Harness';
  button.title = connected ? '断开本机 Codex App Server' : '连接本机 Codex App Server';
}

async function api(path, options = {}) {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || '请求失败');
  return payload;
}

async function load() {
  try {
    const [nextState, nextIntegrations] = await Promise.all([api('/api/state'), api('/api/integrations')]);
    state = nextState;
    integrations = nextIntegrations;
    render();
  } catch (error) {
    notify(`无法连接本地服务：${error.message}`, 'error');
  }
}

$('#run-button').addEventListener('click', async () => {
  try {
    const executor = integrations.codex?.connected ? 'harness' : 'simulation';
    await api('/api/run', { method: 'POST', body: JSON.stringify({ executor }) });
    notify(executor === 'harness' ? 'Harness 只读盘点已启动，完成后会在 R2 审批处暂停。' : '模拟分析已启动，工作流会在 R2 审批处暂停。', 'success');
    await load();
  } catch (error) { notify(error.message, 'error'); }
});

$('#harness-button').addEventListener('click', async () => {
  const connected = integrations.codex?.connected;
  const button = $('#harness-button');
  button.disabled = true;
  try {
    if (connected) {
      await api('/api/harness/disconnect', { method: 'POST' });
      notify('Harness 已断开，运行分析会使用模拟执行器。');
    } else {
      await api('/api/harness/connect', { method: 'POST' });
      notify('Codex App Server 已连接，下一次分析将使用 Harness。', 'success');
    }
    await load();
  } catch (error) {
    notify(`Harness 连接失败：${error.message}`, 'error');
    await load();
  } finally { button.disabled = false; }
});

$('#reset-button').addEventListener('click', async () => {
  try {
    const payload = await api('/api/reset', { method: 'POST' });
    state = payload.state;
    render();
    notify('演示状态已重置。');
  } catch (error) { notify(error.message, 'error'); }
});

$('#refresh-button').addEventListener('click', load);
$('#evidence-button').addEventListener('click', async () => {
  try {
    const payload = await api('/api/evidence', { method: 'POST' });
    state = payload.state;
    render();
    notify('示例证据已加入证据流。', 'success');
  } catch (error) { notify(error.message, 'error'); }
});

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-approval]');
  if (!button) return;
  button.disabled = true;
  try {
    const payload = await api(`/api/approvals/${button.dataset.id}`, { method: 'POST', body: JSON.stringify({ action: button.dataset.approval }) });
    state = payload.state;
    render();
    notify(button.dataset.approval === 'approve' ? '审批通过，开始隔离执行和验收。' : '已拒绝，工作流进入待修改状态。', button.dataset.approval === 'approve' ? 'success' : 'error');
  } catch (error) { button.disabled = false; notify(error.message, 'error'); }
});

load();
polling = window.setInterval(load, 1000);
