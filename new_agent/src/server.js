import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { StateStore } from './store.js';
import { WorkflowRunner } from './workflow.js';
import { CodexAdapter } from './adapters/codex.js';
import { CocosMcpAdapter } from './adapters/cocos-mcp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const port = Number(process.env.SLOT_AGENT_PORT || 4173);
const store = new StateStore();
const codex = new CodexAdapter();
const cocos = new CocosMcpAdapter();
const workflow = new WorkflowRunner(store, codex);

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

async function body(req) {
  let data = '';
  for await (const chunk of req) data += chunk;
  return data ? JSON.parse(data) : {};
}

function serveFile(req, res) {
  const requested = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const relative = requested === '/' ? '/index.html' : requested;
  const file = path.resolve(publicDir, `.${relative}`);
  if (!file.startsWith(publicDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/api/health') return json(res, 200, { ok: true, service: 'slot-agent-mvp', time: new Date().toISOString() });
    if (url.pathname === '/api/state' && req.method === 'GET') return json(res, 200, store.read());
    if (url.pathname === '/api/integrations' && req.method === 'GET') return json(res, 200, { codex: codex.describe(), cocos: cocos.describe() });
    if (url.pathname === '/api/harness/probe' && req.method === 'POST') {
      const available = await codex.probe();
      return json(res, available ? 200 : 503, { available, codex: codex.describe() });
    }
    if (url.pathname === '/api/harness/connect' && req.method === 'POST') {
      await codex.connect();
      return json(res, 200, { connected: true, codex: codex.describe() });
    }
    if (url.pathname === '/api/harness/disconnect' && req.method === 'POST') {
      codex.disconnect();
      return json(res, 200, { connected: false, codex: codex.describe() });
    }
    if (url.pathname === '/api/run' && req.method === 'POST') {
      const payload = await body(req);
      const started = await workflow.start({ executor: payload.executor || 'auto' });
      const state = store.read();
      const status = started ? 202 : state.run.status === 'error' ? 502 : 409;
      return json(res, status, { started, error: started ? null : state.run.message, state });
    }
    if (url.pathname === '/api/reset' && req.method === 'POST') return json(res, 200, { state: workflow.reset() });
    if (url.pathname === '/api/evidence' && req.method === 'POST') return json(res, 201, { created: workflow.addEvidence(), state: store.read() });
    const approvalMatch = url.pathname.match(/^\/api\/approvals\/([^/]+)$/);
    if (approvalMatch && req.method === 'POST') {
      const payload = await body(req);
      const action = payload.action || 'approve';
      const result = action === 'reject' ? workflow.reject(approvalMatch[1]) : await workflow.approve(approvalMatch[1]);
      return json(res, result ? 200 : 404, { result, state: store.read() });
    }
    return serveFile(req, res);
  } catch (error) {
    json(res, 400, { error: error instanceof Error ? error.message : 'Bad request' });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Slot Agent MVP listening on http://localhost:${port}`);
});

process.on('SIGINT', () => server.close(() => process.exit(0)));
