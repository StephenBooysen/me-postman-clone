import { createWorkspace, createFolder, createRequest } from '../types/index.js';

class AppStore {
  constructor() {
    this.workspaces = new Map();
    this.collections = new Map(); // folder and request items
    this.activeWorkspace = null;
    this.activeRequest = null;
    this.variables = new Map(); // global variables
    this.listeners = new Set();
    
    // Initialize with default workspace
    this.initializeDefaultWorkspace();
  }

  initializeDefaultWorkspace() {
    const defaultWorkspace = createWorkspace('default', 'My Workspace', 'Default workspace');
    this.workspaces.set('default', defaultWorkspace);
    this.activeWorkspace = 'default';
  }

  // Event system
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(listener => listener());
  }

  // Workspace methods
  createWorkspace(name, description = '') {
    const id = `ws_${Date.now()}`;
    const workspace = createWorkspace(id, name, description);
    this.workspaces.set(id, workspace);
    this.notify();
    return workspace;
  }

  setActiveWorkspace(workspaceId) {
    if (this.workspaces.has(workspaceId)) {
      this.activeWorkspace = workspaceId;
      this.notify();
    }
  }

  getCurrentWorkspace() {
    return this.workspaces.get(this.activeWorkspace);
  }

  // Collection methods (folders and requests)
  createFolder(name, parentId = null) {
    const id = `folder_${Date.now()}`;
    const folder = createFolder(id, name, parentId);
    this.collections.set(id, folder);
    this.notify();
    return folder;
  }

  createRequest(name, method = 'GET', url = '', parentId = null) {
    const id = `req_${Date.now()}`;
    const request = createRequest(id, name, method, url, parentId);
    this.collections.set(id, request);
    this.notify();
    return request;
  }

  updateRequest(id, updates) {
    const request = this.collections.get(id);
    if (request) {
      const updated = { ...request, ...updates, updatedAt: new Date().toISOString() };
      this.collections.set(id, updated);
      this.notify();
      return updated;
    }
    return null;
  }

  deleteItem(id) {
    // Delete item and all its children
    const item = this.collections.get(id);
    if (!item) return false;

    // Find all children
    const childIds = Array.from(this.collections.values())
      .filter(item => item.parentId === id)
      .map(item => item.id);

    // Recursively delete children
    childIds.forEach(childId => this.deleteItem(childId));

    // Delete the item itself
    this.collections.delete(id);
    
    // Clear active request if it was deleted
    if (this.activeRequest === id) {
      this.activeRequest = null;
    }

    this.notify();
    return true;
  }

  setActiveRequest(requestId) {
    if (this.collections.has(requestId)) {
      this.activeRequest = requestId;
      this.notify();
    }
  }

  getActiveRequest() {
    return this.collections.get(this.activeRequest);
  }

  // Get collections organized in tree structure
  getCollectionTree() {
    const items = Array.from(this.collections.values());
    const rootItems = items.filter(item => !item.parentId);
    
    const buildTree = (parentId = null) => {
      return items
        .filter(item => item.parentId === parentId)
        .sort((a, b) => {
          // Folders first, then requests
          if (a.type === 'folder' && b.type === 'request') return -1;
          if (a.type === 'request' && b.type === 'folder') return 1;
          return a.name.localeCompare(b.name);
        })
        .map(item => ({
          ...item,
          children: item.type === 'folder' ? buildTree(item.id) : []
        }));
    };

    return buildTree();
  }

  // Variable methods
  setVariable(workspaceId, key, value) {
    const workspace = this.workspaces.get(workspaceId);
    if (workspace) {
      workspace.variables[key] = value;
      this.notify();
    }
  }

  getVariable(workspaceId, key) {
    const workspace = this.workspaces.get(workspaceId);
    return workspace ? workspace.variables[key] : undefined;
  }

  // Variable substitution
  substituteVariables(text, workspaceId = this.activeWorkspace) {
    if (!text || typeof text !== 'string') return text;
    
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return text;

    return text.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
      const value = workspace.variables[varName.trim()];
      return value !== undefined ? value : match;
    });
  }

  // Persistence methods
  exportData() {
    return {
      workspaces: Object.fromEntries(this.workspaces),
      collections: Object.fromEntries(this.collections),
      activeWorkspace: this.activeWorkspace,
      activeRequest: this.activeRequest
    };
  }

  importData(data) {
    if (data.workspaces) {
      this.workspaces = new Map(Object.entries(data.workspaces));
    }
    if (data.collections) {
      this.collections = new Map(Object.entries(data.collections));
    }
    if (data.activeWorkspace) {
      this.activeWorkspace = data.activeWorkspace;
    }
    if (data.activeRequest) {
      this.activeRequest = data.activeRequest;
    }
    this.notify();
  }
}

// Create singleton instance
export const appStore = new AppStore();
export default AppStore;