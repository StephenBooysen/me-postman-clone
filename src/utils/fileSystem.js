import fs from 'fs/promises';
import path from 'path';
import { createWorkspace, createFolder, createRequest } from '../types/index.js';

// Base path for workspaces
const WORKSPACES_DIR = path.resolve('workspaces');

export class FileSystemError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'FileSystemError';
    this.code = code;
  }
}

// Ensure workspaces directory exists
async function ensureWorkspacesDir() {
  try {
    await fs.access(WORKSPACES_DIR);
  } catch {
    await fs.mkdir(WORKSPACES_DIR, { recursive: true });
  }
}

// Ensure workspace directory exists
async function ensureWorkspaceDir(workspaceId) {
  const workspacePath = path.join(WORKSPACES_DIR, workspaceId);
  try {
    await fs.access(workspacePath);
  } catch {
    await fs.mkdir(workspacePath, { recursive: true });
  }
  return workspacePath;
}

// Read all workspaces from file system
export async function loadWorkspaces() {
  try {
    await ensureWorkspacesDir();
    const entries = await fs.readdir(WORKSPACES_DIR, { withFileTypes: true });
    const workspaces = new Map();

    for (const entry of entries) {
      if (entry.isDirectory()) {
        try {
          const workspace = await loadWorkspace(entry.name);
          if (workspace) {
            workspaces.set(workspace.id, workspace);
          }
        } catch (error) {
          console.warn(`Failed to load workspace ${entry.name}:`, error);
        }
      }
    }

    // Ensure default workspace exists
    if (!workspaces.has('default')) {
      const defaultWorkspace = await createWorkspaceOnDisk('default', 'My Workspace', 'Default workspace');
      workspaces.set('default', defaultWorkspace);
    }

    return workspaces;
  } catch (error) {
    throw new FileSystemError(`Failed to load workspaces: ${error.message}`, 'LOAD_WORKSPACES_ERROR');
  }
}

// Load a single workspace
export async function loadWorkspace(workspaceId) {
  try {
    const workspacePath = path.join(WORKSPACES_DIR, workspaceId);
    const configPath = path.join(workspacePath, 'workspace.json');
    
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);
    
    return createWorkspace(config.id, config.name, config.description, config.variables);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // Workspace doesn't exist
    }
    throw new FileSystemError(`Failed to load workspace ${workspaceId}: ${error.message}`, 'LOAD_WORKSPACE_ERROR');
  }
}

// Create a new workspace on disk
export async function createWorkspaceOnDisk(id, name, description = '', variables = {}) {
  try {
    const workspacePath = await ensureWorkspaceDir(id);
    const configPath = path.join(workspacePath, 'workspace.json');
    
    const workspace = createWorkspace(id, name, description, variables);
    
    await fs.writeFile(configPath, JSON.stringify(workspace, null, 2));
    
    return workspace;
  } catch (error) {
    throw new FileSystemError(`Failed to create workspace ${id}: ${error.message}`, 'CREATE_WORKSPACE_ERROR');
  }
}

// Update workspace configuration
export async function updateWorkspaceOnDisk(workspace) {
  try {
    const workspacePath = path.join(WORKSPACES_DIR, workspace.id);
    const configPath = path.join(workspacePath, 'workspace.json');
    
    await fs.writeFile(configPath, JSON.stringify(workspace, null, 2));
  } catch (error) {
    throw new FileSystemError(`Failed to update workspace ${workspace.id}: ${error.message}`, 'UPDATE_WORKSPACE_ERROR');
  }
}

// Delete workspace from disk
export async function deleteWorkspaceFromDisk(workspaceId) {
  try {
    if (workspaceId === 'default') {
      throw new FileSystemError('Cannot delete default workspace', 'DELETE_DEFAULT_WORKSPACE');
    }
    
    const workspacePath = path.join(WORKSPACES_DIR, workspaceId);
    await fs.rm(workspacePath, { recursive: true, force: true });
  } catch (error) {
    throw new FileSystemError(`Failed to delete workspace ${workspaceId}: ${error.message}`, 'DELETE_WORKSPACE_ERROR');
  }
}

// Load collections (folders and requests) for a workspace
export async function loadCollections(workspaceId) {
  try {
    const workspacePath = path.join(WORKSPACES_DIR, workspaceId);
    const collections = new Map();
    
    await loadCollectionsRecursive(workspacePath, collections);
    
    return collections;
  } catch (error) {
    throw new FileSystemError(`Failed to load collections for workspace ${workspaceId}: ${error.message}`, 'LOAD_COLLECTIONS_ERROR');
  }
}

// Recursively load collections from directory structure
async function loadCollectionsRecursive(dirPath, collections, parentId = null, depth = 0) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name === 'workspace.json') continue;
      
      const itemPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // This is a folder
        const folderId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const folder = createFolder(folderId, entry.name, parentId);
        folder.path = itemPath;
        collections.set(folderId, folder);
        
        // Load children
        await loadCollectionsRecursive(itemPath, collections, folderId, depth + 1);
      } else if (entry.name.endsWith('.json')) {
        // This is a request file
        try {
          const requestData = await fs.readFile(itemPath, 'utf-8');
          const requestConfig = JSON.parse(requestData);
          
          const request = createRequest(
            requestConfig.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            requestConfig.name || path.basename(entry.name, '.json'),
            requestConfig.method || 'GET',
            requestConfig.url || '',
            parentId,
            requestConfig.headers,
            requestConfig.body,
            requestConfig.params
          );
          request.path = itemPath;
          collections.set(request.id, request);
        } catch (error) {
          console.warn(`Failed to load request file ${itemPath}:`, error);
        }
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`Failed to read directory ${dirPath}:`, error);
    }
  }
}

// Create folder on disk
export async function createFolderOnDisk(workspaceId, name, parentPath = null) {
  try {
    const basePath = parentPath || path.join(WORKSPACES_DIR, workspaceId);
    const folderPath = path.join(basePath, name);
    
    await fs.mkdir(folderPath, { recursive: true });
    
    return folderPath;
  } catch (error) {
    throw new FileSystemError(`Failed to create folder ${name}: ${error.message}`, 'CREATE_FOLDER_ERROR');
  }
}

// Create request file on disk
export async function createRequestOnDisk(workspaceId, request, parentPath = null) {
  try {
    const basePath = parentPath || path.join(WORKSPACES_DIR, workspaceId);
    const requestPath = path.join(basePath, `${request.name}.json`);
    
    const requestData = {
      id: request.id,
      name: request.name,
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body,
      params: request.params,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt
    };
    
    await fs.writeFile(requestPath, JSON.stringify(requestData, null, 2));
    
    return requestPath;
  } catch (error) {
    throw new FileSystemError(`Failed to create request ${request.name}: ${error.message}`, 'CREATE_REQUEST_ERROR');
  }
}

// Update request file on disk
export async function updateRequestOnDisk(request) {
  try {
    if (!request.path) {
      throw new FileSystemError('Request path not found', 'REQUEST_PATH_MISSING');
    }
    
    const requestData = {
      id: request.id,
      name: request.name,
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body,
      params: request.params,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt
    };
    
    await fs.writeFile(request.path, JSON.stringify(requestData, null, 2));
  } catch (error) {
    throw new FileSystemError(`Failed to update request ${request.name}: ${error.message}`, 'UPDATE_REQUEST_ERROR');
  }
}

// Delete item from disk
export async function deleteItemFromDisk(itemPath) {
  try {
    await fs.rm(itemPath, { recursive: true, force: true });
  } catch (error) {
    throw new FileSystemError(`Failed to delete item at ${itemPath}: ${error.message}`, 'DELETE_ITEM_ERROR');
  }
}

// Get folder path for an item
export function getItemParentPath(workspaceId, parentId, collections) {
  if (!parentId) {
    return path.join(WORKSPACES_DIR, workspaceId);
  }
  
  const parent = collections.get(parentId);
  if (parent && parent.path) {
    return parent.path;
  }
  
  return path.join(WORKSPACES_DIR, workspaceId);
}