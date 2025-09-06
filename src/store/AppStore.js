import { createWorkspace, createFolder, createRequest } from '../types/index.js';
import { 
  loadWorkspaces, 
  loadCollections, 
  createWorkspaceOnDisk, 
  updateWorkspaceOnDisk,
  createFolderOnDisk,
  createRequestOnDisk,
  updateRequestOnDisk,
  deleteItemFromDisk,
  getItemParentPath
} from '../utils/fileSystemAPI.js';

class AppStore {
  constructor() {
    this.workspaces = new Map();
    this.collections = new Map(); // folder and request items
    this.activeWorkspace = null;
    this.activeRequest = null;
    this.variables = new Map(); // global variables
    this.listeners = new Set();
    this.initialized = false;
    
    // Initialize from file system
    this.initializeFromFileSystem();
  }

  async initializeFromFileSystem() {
    try {
      // Load workspaces from file system
      const workspaces = await loadWorkspaces();
      this.workspaces = workspaces;
      
      // Set default workspace as active
      this.activeWorkspace = 'default';
      
      // Load collections for the active workspace
      if (this.activeWorkspace) {
        const collections = await loadCollections(this.activeWorkspace);
        this.collections = collections;
      }
      
      this.initialized = true;
      this.notify();
    } catch (error) {
      console.error('Failed to initialize from file system:', error);
      // Fallback to memory-only mode
      this.initializeDefaultWorkspace();
    }
  }

  initializeDefaultWorkspace() {
    const defaultWorkspace = createWorkspace('default', 'My Workspace', 'Default workspace');
    this.workspaces.set('default', defaultWorkspace);
    this.activeWorkspace = 'default';
    this.initialized = true;
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
  async createWorkspace(name, description = '') {
    const id = `ws_${Date.now()}`;
    try {
      const workspace = await createWorkspaceOnDisk(id, name, description);
      this.workspaces.set(id, workspace);
      this.notify();
      return workspace;
    } catch (error) {
      console.error('Failed to create workspace on disk:', error);
      // Fallback to memory only
      const workspace = createWorkspace(id, name, description);
      this.workspaces.set(id, workspace);
      this.notify();
      return workspace;
    }
  }

  async setActiveWorkspace(workspaceId) {
    if (this.workspaces.has(workspaceId)) {
      this.activeWorkspace = workspaceId;
      
      // Load collections for the new workspace
      try {
        const collections = await loadCollections(workspaceId);
        this.collections = collections;
        this.activeRequest = null; // Clear active request when switching workspaces
      } catch (error) {
        console.error('Failed to load collections for workspace:', error);
        this.collections = new Map();
      }
      
      this.notify();
    }
  }

  getCurrentWorkspace() {
    return this.workspaces.get(this.activeWorkspace);
  }

  // Collection methods (folders and requests)
  async createFolder(name, parentId = null) {
    const id = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
      const parentPath = getItemParentPath(this.activeWorkspace, parentId);
      const folderPath = await createFolderOnDisk(this.activeWorkspace, name, parentPath);
      
      const folder = createFolder(id, name, parentId);
      folder.path = folderPath;
      this.collections.set(id, folder);
      this.notify();
      return folder;
    } catch (error) {
      console.error('Failed to create folder on disk:', error);
      // Fallback to memory only
      const folder = createFolder(id, name, parentId);
      this.collections.set(id, folder);
      this.notify();
      return folder;
    }
  }

  async createRequest(name, method = 'GET', url = '', parentId = null) {
    const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const request = createRequest(id, name, method, url, parentId);
    
    try {
      const parentPath = getItemParentPath(this.activeWorkspace, parentId);
      const requestPath = await createRequestOnDisk(this.activeWorkspace, request, parentPath);
      
      request.path = requestPath;
      this.collections.set(id, request);
      this.notify();
      return request;
    } catch (error) {
      console.error('Failed to create request on disk:', error);
      // Fallback to memory only
      this.collections.set(id, request);
      this.notify();
      return request;
    }
  }

  async updateRequest(id, updates) {
    const request = this.collections.get(id);
    if (request) {
      const updated = { ...request, ...updates, updatedAt: new Date().toISOString() };
      
      try {
        await updateRequestOnDisk(updated);
      } catch (error) {
        console.error('Failed to update request on disk:', error);
      }
      
      this.collections.set(id, updated);
      this.notify();
      return updated;
    }
    return null;
  }

  async deleteItem(id) {
    // Delete item and all its children
    const item = this.collections.get(id);
    if (!item) return false;

    // Delete from disk if path exists
    if (item.path) {
      try {
        await deleteItemFromDisk(item.path);
      } catch (error) {
        console.error('Failed to delete item from disk:', error);
      }
    }

    // Find all children
    const childIds = Array.from(this.collections.values())
      .filter(child => child.parentId === id)
      .map(child => child.id);

    // Recursively delete children
    for (const childId of childIds) {
      await this.deleteItem(childId);
    }

    // Delete the item itself from memory
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
  async setVariable(workspaceId, key, value) {
    const workspace = this.workspaces.get(workspaceId);
    if (workspace) {
      workspace.variables[key] = value;
      workspace.updatedAt = new Date().toISOString();
      
      try {
        await updateWorkspaceOnDisk(workspace);
      } catch (error) {
        console.error('Failed to update workspace variables on disk:', error);
      }
      
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