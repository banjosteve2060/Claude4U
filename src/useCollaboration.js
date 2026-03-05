import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

// Dynamically determine the backend URL
// If VITE_BACKEND_URL is set, use it. Otherwise, use the same host as the frontend but on port 3001
const getBackendUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  // Use the same hostname as the frontend, but port 3001 for the backend
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:3001`;
};

const BACKEND_URL = getBackendUrl();

export function useCollaboration(user) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineStatus, setOnlineStatus] = useState({});
  const typingTimeoutRef = useRef({});

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Connected to collaboration server');
      setIsConnected(true);

      // Identify user upon connection
      if (user) {
        newSocket.emit('user:identify', {
          email: user.email,
          name: user.name,
        });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from collaboration server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    // Handle collaborator updates
    newSocket.on('collaborator:added', ({ taskId, collaborator }) => {
      setCollaborators(prev => ({
        ...prev,
        [taskId]: [...(prev[taskId] || []), collaborator]
      }));
    });

    newSocket.on('collaborator:removed', ({ taskId, email }) => {
      setCollaborators(prev => ({
        ...prev,
        [taskId]: (prev[taskId] || []).filter(c => c.email !== email)
      }));
    });

    newSocket.on('collaborator:online', ({ taskId, email }) => {
      setOnlineStatus(prev => ({
        ...prev,
        [`${taskId}:${email}`]: true
      }));
    });

    newSocket.on('collaborator:offline', ({ taskId, email }) => {
      setOnlineStatus(prev => ({
        ...prev,
        [`${taskId}:${email}`]: false
      }));
    });

    // Handle typing indicators
    newSocket.on('typing:user', ({ taskId, user: typingUser, isTyping }) => {
      setTypingUsers(prev => {
        const taskTyping = prev[taskId] || {};
        if (isTyping) {
          return {
            ...prev,
            [taskId]: { ...taskTyping, [typingUser.email]: typingUser }
          };
        } else {
          const { [typingUser.email]: _, ...rest } = taskTyping;
          return {
            ...prev,
            [taskId]: rest
          };
        }
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  // Join a task room
  const joinTask = useCallback((taskId) => {
    if (socket && isConnected) {
      socket.emit('task:join', { taskId });
    }
  }, [socket, isConnected]);

  // Leave a task room
  const leaveTask = useCallback((taskId) => {
    if (socket && isConnected) {
      socket.emit('task:leave', { taskId });
    }
  }, [socket, isConnected]);

  // Send a message
  const sendMessage = useCallback((taskId, content, isUser = true) => {
    if (socket && isConnected) {
      socket.emit('message:send', { taskId, content, isUser });
    }
  }, [socket, isConnected]);

  // Start typing indicator
  const startTyping = useCallback((taskId) => {
    if (socket && isConnected) {
      socket.emit('typing:start', { taskId });

      // Clear existing timeout
      if (typingTimeoutRef.current[taskId]) {
        clearTimeout(typingTimeoutRef.current[taskId]);
      }

      // Auto-stop typing after 3 seconds of inactivity
      typingTimeoutRef.current[taskId] = setTimeout(() => {
        socket.emit('typing:stop', { taskId });
      }, 3000);
    }
  }, [socket, isConnected]);

  // Stop typing indicator
  const stopTyping = useCallback((taskId) => {
    if (socket && isConnected) {
      socket.emit('typing:stop', { taskId });

      if (typingTimeoutRef.current[taskId]) {
        clearTimeout(typingTimeoutRef.current[taskId]);
      }
    }
  }, [socket, isConnected]);

  // Subscribe to messages for a task
  const onMessage = useCallback((callback) => {
    if (socket) {
      socket.on('message:new', callback);
      return () => socket.off('message:new', callback);
    }
    return () => {};
  }, [socket]);

  // Subscribe to task collaborators
  const onCollaborators = useCallback((callback) => {
    if (socket) {
      socket.on('task:collaborators', callback);
      return () => socket.off('task:collaborators', callback);
    }
    return () => {};
  }, [socket]);

  // Subscribe to task messages (initial load)
  const onTaskMessages = useCallback((callback) => {
    if (socket) {
      socket.on('task:messages', callback);
      return () => socket.off('task:messages', callback);
    }
    return () => {};
  }, [socket]);

  // Subscribe to task shared notifications
  const onTaskShared = useCallback((callback) => {
    if (socket) {
      socket.on('task:shared', callback);
      return () => socket.off('task:shared', callback);
    }
    return () => {};
  }, [socket]);

  // Subscribe to task unshared notifications
  const onTaskUnshared = useCallback((callback) => {
    if (socket) {
      socket.on('task:unshared', callback);
      return () => socket.off('task:unshared', callback);
    }
    return () => {};
  }, [socket]);

  // Subscribe to new notification events
  const onNotification = useCallback((callback) => {
    if (socket) {
      socket.on('notification:new', callback);
      return () => socket.off('notification:new', callback);
    }
    return () => {};
  }, [socket]);

  // Subscribe to initial unread notification count
  const onNotificationCount = useCallback((callback) => {
    if (socket) {
      socket.on('notification:count', callback);
      return () => socket.off('notification:count', callback);
    }
    return () => {};
  }, [socket]);

  // Get typing users for a task
  const getTypingUsers = useCallback((taskId) => {
    return Object.values(typingUsers[taskId] || {});
  }, [typingUsers]);

  // Check if a collaborator is online
  const isCollaboratorOnline = useCallback((taskId, email) => {
    return onlineStatus[`${taskId}:${email}`] || false;
  }, [onlineStatus]);

  return {
    isConnected,
    collaborators,
    joinTask,
    leaveTask,
    sendMessage,
    startTyping,
    stopTyping,
    onMessage,
    onCollaborators,
    onTaskMessages,
    onTaskShared,
    onTaskUnshared,
    onNotification,
    onNotificationCount,
    getTypingUsers,
    isCollaboratorOnline,
  };
}

// API functions for REST endpoints
export const collaborationAPI = {
  // Health check / ping endpoint for sync status
  async ping() {
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error('Backend not reachable');
    }
    return response.json();
  },

  // Add collaborator to a task
  async addCollaborator(taskId, email, invitedBy, invitedByName, taskTitle) {
    const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}/collaborators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, invitedBy, invitedByName, taskTitle }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add collaborator');
    }
    return response.json();
  },

  // Remove collaborator from a task
  async removeCollaborator(taskId, email) {
    const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}/collaborators/${encodeURIComponent(email)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to remove collaborator');
    }
    return response.json();
  },

  // Get collaborators for a task
  async getCollaborators(taskId) {
    const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}/collaborators`);
    if (!response.ok) {
      throw new Error('Failed to get collaborators');
    }
    return response.json();
  },

  // Get messages for a task
  async getMessages(taskId) {
    const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}/messages`);
    if (!response.ok) {
      throw new Error('Failed to get messages');
    }
    return response.json();
  },

  // Create a new task with unique ID
  async createTask(title, folderId, status = 'pending', customId = null) {
    const response = await fetch(`${BACKEND_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, folderId, status, customId }),
    });
    if (!response.ok) {
      throw new Error('Failed to create task');
    }
    return response.json();
  },

  // Delete a task and all associated data
  async deleteTask(taskId) {
    const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete task');
    }
    return response.json();
  },

  // Get share link for a task
  async getShareLink(taskId) {
    const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}/share-link`);
    if (!response.ok) {
      throw new Error('Failed to get share link');
    }
    return response.json();
  },

  // Get tasks shared with a specific user
  async getSharedTasks(email) {
    const response = await fetch(`${BACKEND_URL}/api/users/${encodeURIComponent(email)}/shared-tasks`);
    if (!response.ok) {
      throw new Error('Failed to get shared tasks');
    }
    return response.json();
  },

  // ============ NOTIFICATION API ============

  // Get notifications for a user
  async getNotifications(email, limit = 50) {
    const response = await fetch(`${BACKEND_URL}/api/users/${encodeURIComponent(email)}/notifications?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to get notifications');
    }
    return response.json();
  },

  // Mark a single notification as read
  async markNotificationRead(email, notificationId) {
    const response = await fetch(`${BACKEND_URL}/api/users/${encodeURIComponent(email)}/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
    if (!response.ok) {
      throw new Error('Failed to mark notification read');
    }
    return response.json();
  },

  // Mark all notifications as read
  async markAllNotificationsRead(email) {
    const response = await fetch(`${BACKEND_URL}/api/users/${encodeURIComponent(email)}/notifications/mark-all-read`, {
      method: 'PUT',
    });
    if (!response.ok) {
      throw new Error('Failed to mark all notifications read');
    }
    return response.json();
  },

  // ============ USER MEMORY API ============

  async getUserMemories(email) {
    const response = await fetch(`${BACKEND_URL}/api/users/${encodeURIComponent(email)}/memories`);
    if (!response.ok) {
      throw new Error('Failed to fetch memories');
    }
    return response.json();
  },

  async deleteUserMemory(email, memoryId) {
    const response = await fetch(`${BACKEND_URL}/api/users/${encodeURIComponent(email)}/memories/${encodeURIComponent(memoryId)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete memory');
    }
    return response.json();
  },

  async clearUserMemories(email) {
    const response = await fetch(`${BACKEND_URL}/api/users/${encodeURIComponent(email)}/memories`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to clear memories');
    }
    return response.json();
  },

  // ============ USER MANAGEMENT API ============

  // Check if user exists
  async userExists(email) {
    const response = await fetch(`${BACKEND_URL}/api/users/${encodeURIComponent(email)}/exists`);
    if (!response.ok) {
      throw new Error('Failed to check user');
    }
    const data = await response.json();
    return data.exists;
  },

  // Get all users (admin only)
  async getAllUsers() {
    const response = await fetch(`${BACKEND_URL}/api/users`);
    if (!response.ok) {
      throw new Error('Failed to get users');
    }
    return response.json();
  },

  // Create a new user (admin only)
  async createUser(email, name, role, createdBy) {
    const response = await fetch(`${BACKEND_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, role, createdBy }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }
    return response.json();
  },

  // Delete a user (admin only)
  async deleteUser(email) {
    const response = await fetch(`${BACKEND_URL}/api/users/${encodeURIComponent(email)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete user');
    }
    return response.json();
  },

  // Get user data (folders, tasks, settings)
  async getUserData(email) {
    const response = await fetch(`${BACKEND_URL}/api/users/${encodeURIComponent(email)}/data`);
    if (!response.ok) {
      if (response.status === 404) {
        return null; // User not found
      }
      throw new Error('Failed to get user data');
    }
    return response.json();
  },

  // Save user data
  async saveUserData(email, data) {
    const response = await fetch(`${BACKEND_URL}/api/users/${encodeURIComponent(email)}/data`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to save user data');
    }
    return response.json();
  },

  // ============ MCP PLUGIN API ============

  // Connect to an MCP plugin
  async connectMCPPlugin(plugin) {
    const response = await fetch(`${BACKEND_URL}/api/mcp/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plugin }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to connect to plugin');
    }
    return response.json();
  },

  // Disconnect from an MCP plugin
  async disconnectMCPPlugin(pluginId) {
    const response = await fetch(`${BACKEND_URL}/api/mcp/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pluginId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to disconnect from plugin');
    }
    return response.json();
  },

  // Get status of an MCP plugin
  async getMCPPluginStatus(pluginId) {
    const response = await fetch(`${BACKEND_URL}/api/mcp/status/${encodeURIComponent(pluginId)}`);
    if (!response.ok) {
      throw new Error('Failed to get plugin status');
    }
    return response.json();
  },

  // Get all connected MCP plugins
  async getConnectedMCPPlugins() {
    const response = await fetch(`${BACKEND_URL}/api/mcp/plugins`);
    if (!response.ok) {
      throw new Error('Failed to get connected plugins');
    }
    return response.json();
  },

  // Get all discovered tools from MCP plugins
  async getMCPTools() {
    const response = await fetch(`${BACKEND_URL}/api/mcp/tools`);
    if (!response.ok) {
      throw new Error('Failed to get MCP tools');
    }
    return response.json();
  },

  // Execute an MCP tool
  async executeMCPTool(pluginId, toolName, args = {}) {
    const response = await fetch(`${BACKEND_URL}/api/mcp/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pluginId, toolName, args }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to execute tool');
    }
    return response.json();
  },

  // Refresh tools from a connected plugin
  async refreshMCPTools(pluginId) {
    const response = await fetch(`${BACKEND_URL}/api/mcp/refresh/${encodeURIComponent(pluginId)}`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to refresh tools');
    }
    return response.json();
  },

  // ============ CLAUDE AI API ============

  // Configure Claude API key
  async configureClaudeAPI(apiKey) {
    const response = await fetch(`${BACKEND_URL}/api/claude/configure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to configure Claude API');
    }
    return response.json();
  },

  // Get Claude configuration status
  async getClaudeStatus() {
    const response = await fetch(`${BACKEND_URL}/api/claude/status`);
    if (!response.ok) {
      throw new Error('Failed to get Claude status');
    }
    return response.json();
  },

  // Send a chat message to Claude
  async chatWithClaude(messages, taskContext = null, userName = null) {
    const response = await fetch(`${BACKEND_URL}/api/claude/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, taskContext, userName }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to chat with Claude');
    }
    return response.json();
  },
};

export default useCollaboration;
