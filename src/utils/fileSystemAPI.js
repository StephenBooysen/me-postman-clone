import { createWorkspace, createFolder, createRequest } from '../types/index.js';

// API base URL
const API_BASE = 'http://localhost:3102/api';

export class FileSystemError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'FileSystemError';
    this.code = code;
  }
}

// Helper function to handle API responses
async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new FileSystemError(errorData.error || `HTTP ${response.status}`, 'API_ERROR');
  }
  return response.json();
}

// Read all workspaces from API
export async function loadWorkspaces() {
  try {
    const response = await fetch(`${API_BASE}/workspaces`);
    const workspacesArray = await handleResponse(response);
    
    const workspaces = new Map();
    workspacesArray.forEach(workspace => {
      workspaces.set(workspace.id, workspace);
    });
    
    return workspaces;
  } catch (error) {
    if (error instanceof FileSystemError) throw error;
    throw new FileSystemError(`Failed to load workspaces: ${error.message}`, 'LOAD_WORKSPACES_ERROR');
  }
}

// Load a single workspace
export async function loadWorkspace(workspaceId) {
  try {
    const response = await fetch(`${API_BASE}/workspaces/${workspaceId}`);
    if (response.status === 404) {
      return null;
    }
    return await handleResponse(response);
  } catch (error) {
    if (error instanceof FileSystemError) throw error;
    throw new FileSystemError(`Failed to load workspace ${workspaceId}: ${error.message}`, 'LOAD_WORKSPACE_ERROR');
  }
}

// Create a new workspace
export async function createWorkspaceOnDisk(id, name, description = '', variables = {}) {
  try {
    const response = await fetch(`${API_BASE}/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, description, variables })
    });
    
    return await handleResponse(response);
  } catch (error) {
    if (error instanceof FileSystemError) throw error;
    throw new FileSystemError(`Failed to create workspace ${id}: ${error.message}`, 'CREATE_WORKSPACE_ERROR');
  }
}

// Update workspace configuration
export async function updateWorkspaceOnDisk(workspace) {
  try {
    const response = await fetch(`${API_BASE}/workspaces/${workspace.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workspace)
    });
    
    return await handleResponse(response);
  } catch (error) {
    if (error instanceof FileSystemError) throw error;
    throw new FileSystemError(`Failed to update workspace ${workspace.id}: ${error.message}`, 'UPDATE_WORKSPACE_ERROR');
  }
}

// Delete workspace
export async function deleteWorkspaceFromDisk(workspaceId) {
  try {
    if (workspaceId === 'default') {
      throw new FileSystemError('Cannot delete default workspace', 'DELETE_DEFAULT_WORKSPACE');
    }
    
    const response = await fetch(`${API_BASE}/workspaces/${workspaceId}`, {
      method: 'DELETE'
    });
    
    await handleResponse(response);
  } catch (error) {
    if (error instanceof FileSystemError) throw error;
    throw new FileSystemError(`Failed to delete workspace ${workspaceId}: ${error.message}`, 'DELETE_WORKSPACE_ERROR');
  }
}

// Load collections (folders and requests) for a workspace
export async function loadCollections(workspaceId) {
  try {
    const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/collections`);
    const collectionsArray = await handleResponse(response);
    
    const collections = new Map();
    
    // Flatten the tree structure into a map
    function flattenCollections(items, parentId = null) {
      items.forEach(item => {
        item.parentId = parentId;
        collections.set(item.id, item);
        
        if (item.children) {
          flattenCollections(item.children, item.id);
          delete item.children; // Remove children array as we store hierarchy via parentId
        }
      });
    }
    
    flattenCollections(collectionsArray);
    
    return collections;
  } catch (error) {
    if (error instanceof FileSystemError) throw error;
    throw new FileSystemError(`Failed to load collections for workspace ${workspaceId}: ${error.message}`, 'LOAD_COLLECTIONS_ERROR');
  }
}

// Create folder
export async function createFolderOnDisk(workspaceId, name, parentPath = null) {
  try {
    const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentPath })
    });
    
    const folder = await handleResponse(response);
    return folder.path;
  } catch (error) {
    if (error instanceof FileSystemError) throw error;
    throw new FileSystemError(`Failed to create folder ${name}: ${error.message}`, 'CREATE_FOLDER_ERROR');
  }
}

// Create request file
export async function createRequestOnDisk(workspaceId, request, parentPath = null) {
  try {
    const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: request.name,
        method: request.method,
        url: request.url,
        headers: request.headers,
        body: request.body,
        params: request.params,
        parentPath
      })
    });
    
    const createdRequest = await handleResponse(response);
    return createdRequest.path;
  } catch (error) {
    if (error instanceof FileSystemError) throw error;
    throw new FileSystemError(`Failed to create request ${request.name}: ${error.message}`, 'CREATE_REQUEST_ERROR');
  }
}

// Update request file
export async function updateRequestOnDisk(request) {
  try {
    if (!request.path) {
      throw new FileSystemError('Request path not found', 'REQUEST_PATH_MISSING');
    }
    
    const response = await fetch(`${API_BASE}/requests/${encodeURIComponent(request.path)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: request.id,
        name: request.name,
        method: request.method,
        url: request.url,
        headers: request.headers,
        body: request.body,
        params: request.params,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt
      })
    });
    
    await handleResponse(response);
  } catch (error) {
    if (error instanceof FileSystemError) throw error;
    throw new FileSystemError(`Failed to update request ${request.name}: ${error.message}`, 'UPDATE_REQUEST_ERROR');
  }
}

// Delete item
export async function deleteItemFromDisk(itemPath) {
  try {
    const response = await fetch(`${API_BASE}/items/${encodeURIComponent(itemPath)}`, {
      method: 'DELETE'
    });
    
    await handleResponse(response);
  } catch (error) {
    if (error instanceof FileSystemError) throw error;
    throw new FileSystemError(`Failed to delete item at ${itemPath}: ${error.message}`, 'DELETE_ITEM_ERROR');
  }
}

// Get folder path for an item
export function getItemParentPath(workspaceId, parentId, collections) {
  if (!parentId) {
    return null; // Root level
  }
  
  const parent = collections?.get(parentId);
  if (parent && parent.path) {
    return parent.path;
  }
  
  return null;
}