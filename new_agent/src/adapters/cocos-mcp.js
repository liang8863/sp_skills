export class CocosMcpAdapter {
  constructor() {
    this.command = process.env.COCOS_MCP_COMMAND || 'funplay-cocos-mcp';
    this.configured = Boolean(process.env.COCOS_MCP_COMMAND);
  }

  describe() {
    return {
      server: 'funplay-cocos-mcp',
      transport: 'MCP stdio',
      command: this.command,
      configured: this.configured,
      connected: false,
      capabilities: ['scene.inspect', 'project.resources', 'runtime.log', 'screenshot'],
      note: this.configured ? '已配置 MCP 命令，连接将在 Cocos 工具调用时建立。' : '设置 COCOS_MCP_COMMAND 后启用真实 MCP；当前使用模拟 trace。'
    };
  }
}
