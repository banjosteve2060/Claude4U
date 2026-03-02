/**
 * MCP (Model Context Protocol) Client
 * Handles communication with MCP plugin servers
 */

const { spawn } = require('child_process');
const { EventEmitter } = require('events');

class MCPClient extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map(); // pluginId -> connection info
    this.discoveredTools = new Map(); // pluginId -> tools array
  }

  /**
   * Connect to an MCP plugin server
   */
  async connect(plugin) {
    const { id, command, args = [], env = {} } = plugin;

    // Don't reconnect if already connected
    if (this.connections.has(id) && this.connections.get(id).process) {
      return { success: true, message: 'Already connected' };
    }

    try {
      console.log(`[MCP] Connecting to plugin: ${plugin.name} (${id})`);
      console.log(`[MCP] Command: ${command} ${args.join(' ')}`);

      // Spawn the MCP server process
      const childProcess = spawn(command, args, {
        env: { ...process.env, ...env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const connection = {
        id,
        name: plugin.name,
        process: childProcess,
        status: 'connecting',
        tools: [],
        buffer: '',
        requestId: 0,
        pendingRequests: new Map()
      };

      // Handle stdout (JSON-RPC responses)
      childProcess.stdout.on('data', (data) => {
        this.handleData(connection, data.toString());
      });

      // Handle stderr (errors/logs)
      childProcess.stderr.on('data', (data) => {
        console.error(`[MCP ${plugin.name}] stderr:`, data.toString());
      });

      // Handle process exit
      childProcess.on('close', (code) => {
        console.log(`[MCP ${plugin.name}] Process exited with code ${code}`);
        connection.status = 'disconnected';
        this.connections.set(id, connection);
        this.emit('disconnected', { pluginId: id, name: plugin.name });
      });

      // Handle process errors
      childProcess.on('error', (err) => {
        console.error(`[MCP ${plugin.name}] Process error:`, err);
        connection.status = 'error';
        connection.error = err.message;
        this.connections.set(id, connection);
        this.emit('error', { pluginId: id, error: err.message });
      });

      this.connections.set(id, connection);

      // Initialize the connection
      await this.initialize(connection);

      // Discover available tools
      await this.discoverTools(connection);

      connection.status = 'connected';
      this.connections.set(id, connection);

      console.log(`[MCP] Successfully connected to ${plugin.name}`);
      console.log(`[MCP] Discovered ${connection.tools.length} tools`);

      this.emit('connected', {
        pluginId: id,
        name: plugin.name,
        tools: connection.tools
      });

      return {
        success: true,
        tools: connection.tools
      };

    } catch (error) {
      console.error(`[MCP] Failed to connect to ${plugin.name}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle incoming data from MCP server
   */
  handleData(connection, data) {
    connection.buffer += data;

    // Try to parse complete JSON messages
    const lines = connection.buffer.split('\n');
    connection.buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);
          this.handleMessage(connection, message);
        } catch (e) {
          // Not valid JSON, might be partial message
          console.warn(`[MCP ${connection.name}] Invalid JSON:`, line.substring(0, 100));
        }
      }
    }
  }

  /**
   * Handle a parsed JSON-RPC message
   */
  handleMessage(connection, message) {
    // Handle response to a request
    if (message.id !== undefined && connection.pendingRequests.has(message.id)) {
      const { resolve, reject } = connection.pendingRequests.get(message.id);
      connection.pendingRequests.delete(message.id);

      if (message.error) {
        reject(new Error(message.error.message || 'Unknown error'));
      } else {
        resolve(message.result);
      }
      return;
    }

    // Handle notifications
    if (message.method) {
      this.emit('notification', {
        pluginId: connection.id,
        method: message.method,
        params: message.params
      });
    }
  }

  /**
   * Send a JSON-RPC request to the MCP server
   */
  sendRequest(connection, method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++connection.requestId;
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      connection.pendingRequests.set(id, { resolve, reject });

      // Set timeout for request
      setTimeout(() => {
        if (connection.pendingRequests.has(id)) {
          connection.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);

      try {
        connection.process.stdin.write(JSON.stringify(request) + '\n');
      } catch (error) {
        connection.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  /**
   * Initialize the MCP connection
   */
  async initialize(connection) {
    try {
      const result = await this.sendRequest(connection, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: 'Ava ERP Assistant',
          version: '1.0.0'
        }
      });

      connection.serverInfo = result.serverInfo;
      connection.serverCapabilities = result.capabilities;

      // Send initialized notification
      connection.process.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        method: 'notifications/initialized'
      }) + '\n');

      return result;
    } catch (error) {
      console.error(`[MCP ${connection.name}] Initialize failed:`, error);
      throw error;
    }
  }

  /**
   * Discover available tools from the MCP server
   */
  async discoverTools(connection) {
    try {
      const result = await this.sendRequest(connection, 'tools/list', {});
      connection.tools = result.tools || [];
      this.discoveredTools.set(connection.id, connection.tools);
      return connection.tools;
    } catch (error) {
      console.error(`[MCP ${connection.name}] Tool discovery failed:`, error);
      connection.tools = [];
      return [];
    }
  }

  /**
   * Execute a tool on the MCP server
   */
  async executeTool(pluginId, toolName, args = {}) {
    const connection = this.connections.get(pluginId);
    if (!connection || connection.status !== 'connected') {
      throw new Error(`Plugin ${pluginId} is not connected`);
    }

    console.log(`[MCP] Executing tool: ${toolName} on ${connection.name}`);
    console.log(`[MCP] Arguments:`, JSON.stringify(args).substring(0, 200));

    try {
      const result = await this.sendRequest(connection, 'tools/call', {
        name: toolName,
        arguments: args
      });

      console.log(`[MCP] Tool ${toolName} completed successfully`);
      return result;
    } catch (error) {
      console.error(`[MCP] Tool execution failed:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from an MCP plugin
   */
  disconnect(pluginId) {
    const connection = this.connections.get(pluginId);
    if (connection && connection.process) {
      console.log(`[MCP] Disconnecting from ${connection.name}`);
      connection.process.kill();
      connection.status = 'disconnected';
      this.connections.set(pluginId, connection);
    }
  }

  /**
   * Disconnect from all plugins
   */
  disconnectAll() {
    for (const [id] of this.connections) {
      this.disconnect(id);
    }
  }

  /**
   * Get all connected plugins and their tools
   */
  getConnectedPlugins() {
    const plugins = [];
    for (const [id, connection] of this.connections) {
      plugins.push({
        id,
        name: connection.name,
        status: connection.status,
        tools: connection.tools,
        serverInfo: connection.serverInfo
      });
    }
    return plugins;
  }

  /**
   * Get all discovered tools across all connected plugins
   */
  getAllTools() {
    const allTools = [];
    for (const [pluginId, tools] of this.discoveredTools) {
      const connection = this.connections.get(pluginId);
      if (connection && connection.status === 'connected') {
        for (const tool of tools) {
          allTools.push({
            ...tool,
            pluginId,
            pluginName: connection.name
          });
        }
      }
    }
    return allTools;
  }

  /**
   * Get connection status for a plugin
   */
  getStatus(pluginId) {
    const connection = this.connections.get(pluginId);
    if (!connection) {
      return { status: 'not_connected', tools: [] };
    }
    return {
      status: connection.status,
      tools: connection.tools,
      serverInfo: connection.serverInfo,
      error: connection.error
    };
  }
}

// Create singleton instance
const mcpClient = new MCPClient();

module.exports = mcpClient;
