import { createWorkspace, createFolder } from '../types/index.js';

// Browser-based file system using localStorage/indexedDB
// This simulates a file system structure but works in the browser

export class FileSystemError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'FileSystemError';
    this.code = code;
  }
}

const STORAGE_KEY = 'postman_clone_workspaces';

// Get storage interface (localStorage as fallback, could be extended to IndexedDB)
function getStorage() {
  return localStorage;
}

// Load all workspace data from storage
function loadStorageData() {
  try {
    const data = getStorage().getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { workspaces: {}, structure: {} };
  } catch (error) {
    console.warn('Failed to load storage data:', error);
    return { workspaces: {}, structure: {} };
  }
}

// Save workspace data to storage
function saveStorageData(data) {
  try {
    getStorage().setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save storage data:', error);
    throw new FileSystemError('Failed to save data to storage', 'STORAGE_ERROR');
  }
}

// Ensure default workspace exists in storage
function ensureDefaultWorkspace(data) {
  if (!data.workspaces.default) {
    const defaultWorkspace = createWorkspace('default', 'My Workspace', 'Default workspace');
    data.workspaces.default = defaultWorkspace;
    data.structure.default = { folders: {}, requests: {} };
  }
  return data;
}

// Read all workspaces from storage
export async function loadWorkspaces() {
  try {
    const data = loadStorageData();
    ensureDefaultWorkspace(data);
    
    const workspaces = new Map();
    
    Object.values(data.workspaces).forEach(workspace => {
      workspaces.set(workspace.id, workspace);
    });

    // Save back to ensure default workspace is persisted
    saveStorageData(data);
    
    return workspaces;
  } catch (error) {
    throw new FileSystemError(`Failed to load workspaces: ${error.message}`, 'LOAD_WORKSPACES_ERROR');
  }
}

// Load a single workspace
export async function loadWorkspace(workspaceId) {
  try {
    const data = loadStorageData();
    return data.workspaces[workspaceId] || null;
  } catch (error) {
    throw new FileSystemError(`Failed to load workspace ${workspaceId}: ${error.message}`, 'LOAD_WORKSPACE_ERROR');
  }
}

// Create a new workspace
export async function createWorkspaceOnDisk(id, name, description = '', variables = {}) {
  try {
    const data = loadStorageData();
    
    const workspace = createWorkspace(id, name, description, variables);
    
    data.workspaces[id] = workspace;
    data.structure[id] = { folders: {}, requests: {} };
    
    saveStorageData(data);
    
    return workspace;
  } catch (error) {
    throw new FileSystemError(`Failed to create workspace ${id}: ${error.message}`, 'CREATE_WORKSPACE_ERROR');
  }
}

// Update workspace configuration
export async function updateWorkspaceOnDisk(workspace) {
  try {
    const data = loadStorageData();
    
    if (!data.workspaces[workspace.id]) {
      throw new FileSystemError(`Workspace ${workspace.id} not found`, 'WORKSPACE_NOT_FOUND');
    }
    
    data.workspaces[workspace.id] = { ...workspace };
    
    saveStorageData(data);
  } catch (error) {
    throw new FileSystemError(`Failed to update workspace ${workspace.id}: ${error.message}`, 'UPDATE_WORKSPACE_ERROR');
  }
}

// Delete workspace
export async function deleteWorkspaceFromDisk(workspaceId) {
  try {
    if (workspaceId === 'default') {
      throw new FileSystemError('Cannot delete default workspace', 'DELETE_DEFAULT_WORKSPACE');
    }
    
    const data = loadStorageData();
    
    delete data.workspaces[workspaceId];
    delete data.structure[workspaceId];
    
    saveStorageData(data);
  } catch (error) {
    throw new FileSystemError(`Failed to delete workspace ${workspaceId}: ${error.message}`, 'DELETE_WORKSPACE_ERROR');
  }
}

// Load collections (folders and requests) for a workspace
export async function loadCollections(workspaceId) {
  try {
    const data = loadStorageData();
    ensureDefaultWorkspace(data);
    
    const workspaceStructure = data.structure[workspaceId] || { folders: {}, requests: {} };
    const collections = new Map();
    
    // Load folders
    Object.values(workspaceStructure.folders).forEach(folder => {
      collections.set(folder.id, folder);
    });
    
    // Load requests
    Object.values(workspaceStructure.requests).forEach(request => {
      collections.set(request.id, request);
    });
    
    return collections;
  } catch (error) {
    throw new FileSystemError(`Failed to load collections for workspace ${workspaceId}: ${error.message}`, 'LOAD_COLLECTIONS_ERROR');
  }
}

// Create folder
export async function createFolderOnDisk(workspaceId, name, parentPath = null) {
  try {
    const data = loadStorageData();
    ensureDefaultWorkspace(data);
    
    if (!data.structure[workspaceId]) {
      data.structure[workspaceId] = { folders: {}, requests: {} };
    }
    
    const folderId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const parentId = parentPath; // In this context, parentPath is actually parentId
    console.log('Creating folder with parent:', parentId); // Debug log
    
    const folder = createFolder(folderId, name, parentId);
    folder.path = `/${workspaceId}/${name}`; // Virtual path
    
    data.structure[workspaceId].folders[folderId] = folder;
    
    saveStorageData(data);
    
    return folder.path;
  } catch (error) {
    throw new FileSystemError(`Failed to create folder ${name}: ${error.message}`, 'CREATE_FOLDER_ERROR');
  }
}

// Create request file
export async function createRequestOnDisk(workspaceId, request, parentPath = null) {
  try {
    const data = loadStorageData();
    ensureDefaultWorkspace(data);
    
    if (!data.structure[workspaceId]) {
      data.structure[workspaceId] = { folders: {}, requests: {} };
    }
    
    const requestPath = `/${workspaceId}/${request.name}.json`; // Virtual path
    const requestWithPath = { ...request, path: requestPath };
    
    data.structure[workspaceId].requests[request.id] = requestWithPath;
    
    saveStorageData(data);
    
    return requestPath;
  } catch (error) {
    throw new FileSystemError(`Failed to create request ${request.name}: ${error.message}`, 'CREATE_REQUEST_ERROR');
  }
}

// Update request file
export async function updateRequestOnDisk(request) {
  try {
    const data = loadStorageData();
    
    // Find the workspace that contains this request
    let foundWorkspaceId = null;
    for (const [wsId, structure] of Object.entries(data.structure)) {
      if (structure.requests && structure.requests[request.id]) {
        foundWorkspaceId = wsId;
        break;
      }
    }
    
    if (!foundWorkspaceId) {
      throw new FileSystemError('Request not found in any workspace', 'REQUEST_NOT_FOUND');
    }
    
    data.structure[foundWorkspaceId].requests[request.id] = { ...request };
    
    saveStorageData(data);
  } catch (error) {
    throw new FileSystemError(`Failed to update request ${request.name}: ${error.message}`, 'UPDATE_REQUEST_ERROR');
  }
}

// Delete item
export async function deleteItemFromDisk(itemPath) {
  try {
    const data = loadStorageData();
    
    // Find and delete the item
    let found = false;
    for (const [workspaceId, structure] of Object.entries(data.structure)) {
      // Check folders
      for (const [folderId, folder] of Object.entries(structure.folders)) {
        if (folder.path === itemPath) {
          delete structure.folders[folderId];
          found = true;
          break;
        }
      }
      
      // Check requests
      for (const [requestId, request] of Object.entries(structure.requests)) {
        if (request.path === itemPath) {
          delete structure.requests[requestId];
          found = true;
          break;
        }
      }
      
      if (found) break;
    }
    
    if (found) {
      saveStorageData(data);
    }
  } catch (error) {
    throw new FileSystemError(`Failed to delete item at ${itemPath}: ${error.message}`, 'DELETE_ITEM_ERROR');
  }
}

// Get folder path for an item (simplified for browser storage)
export function getItemParentPath(workspaceId, parentId) {
  // In browser storage, we use parentId directly since we don't have real file paths
  console.log(`Getting parent path for workspace: ${workspaceId}, parent: ${parentId}`);
  return parentId;
}