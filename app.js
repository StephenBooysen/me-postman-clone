const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');
const ejs = require('ejs');


const app = express();
const PORT = 3102;
const WORKSPACES_DIR = path.join(__dirname, 'workspaces');

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

// Load workspace configuration
async function loadWorkspaceConfig(workspaceId) {
  try {
    const configPath = path.join(WORKSPACES_DIR, workspaceId, 'workspace.json');
    const configData = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(configData);
  } catch (error) {
    return null;
  }
}

// Save workspace configuration
async function saveWorkspaceConfig(workspaceId, config) {
  const workspacePath = await ensureWorkspaceDir(workspaceId);
  const configPath = path.join(workspacePath, 'workspace.json');
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

// Recursively load collections from directory structure
async function loadCollectionsRecursive(dirPath, parentId = null) {
  const collections = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name === 'workspace.json') continue;
      
      const itemPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // This is a folder
        const folderId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const folder = {
          id: folderId,
          name: entry.name,
          type: 'folder',
          parentId,
          path: itemPath,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Load children
        const children = await loadCollectionsRecursive(itemPath, folderId);
        folder.children = children;
        
        collections.push(folder);
      } else if (entry.name.endsWith('.json')) {
        // This is a request file
        try {
          const requestData = await fs.readFile(itemPath, 'utf-8');
          const requestConfig = JSON.parse(requestData);
          
          const request = {
            id: requestConfig.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: requestConfig.name || path.basename(entry.name, '.json'),
            type: 'request',
            method: requestConfig.method || 'GET',
            url: requestConfig.url || '',
            headers: requestConfig.headers || {},
            body: requestConfig.body || '',
            params: requestConfig.params || {},
            parentId,
            path: itemPath,
            createdAt: requestConfig.createdAt || new Date().toISOString(),
            updatedAt: requestConfig.updatedAt || new Date().toISOString()
          };
          
          collections.push(request);
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
  
  return collections;
}

// API Routes

// Get all workspaces
app.get('/api/workspaces', async (req, res) => {
  try {
    await ensureWorkspacesDir();
    const entries = await fs.readdir(WORKSPACES_DIR, { withFileTypes: true });
    const workspaces = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const config = await loadWorkspaceConfig(entry.name);
        if (config) {
          workspaces.push(config);
        }
      }
    }

    // Ensure default workspace exists
    if (!workspaces.find(ws => ws.id === 'default')) {
      const defaultWorkspace = {
        id: 'default',
        name: 'My Workspace',
        description: 'Default workspace',
        variables: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveWorkspaceConfig('default', defaultWorkspace);
      workspaces.push(defaultWorkspace);
    }

    res.json(workspaces);
  } catch (error) {
    console.error('Error loading workspaces:', error);
    res.status(500).json({ error: 'Failed to load workspaces' });
  }
});

// Get workspace by ID
app.get('/api/workspaces/:id', async (req, res) => {
  try {
    const config = await loadWorkspaceConfig(req.params.id);
    if (config) {
      res.json(config);
    } else {
      res.status(404).json({ error: 'Workspace not found' });
    }
  } catch (error) {
    console.error('Error loading workspace:', error);
    res.status(500).json({ error: 'Failed to load workspace' });
  }
});

// Create workspace
app.post('/api/workspaces', async (req, res) => {
  try {
    const { id, name, description = '', variables = {} } = req.body;
    
    const workspace = {
      id,
      name,
      description,
      variables,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await saveWorkspaceConfig(id, workspace);
    res.json(workspace);
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

// Update workspace
app.put('/api/workspaces/:id', async (req, res) => {
  try {
    const workspace = { ...req.body, updatedAt: new Date().toISOString() };
    await saveWorkspaceConfig(req.params.id, workspace);
    res.json(workspace);
  } catch (error) {
    console.error('Error updating workspace:', error);
    res.status(500).json({ error: 'Failed to update workspace' });
  }
});

// Get collections for workspace
app.get('/api/workspaces/:id/collections', async (req, res) => {
  try {
    const workspacePath = path.join(WORKSPACES_DIR, req.params.id);
    const collections = await loadCollectionsRecursive(workspacePath);
    res.json(collections);
  } catch (error) {
    console.error('Error loading collections:', error);
    res.status(500).json({ error: 'Failed to load collections' });
  }
});

// Create folder
app.post('/api/workspaces/:workspaceId/folders', async (req, res) => {
  try {
    const { name, parentPath } = req.body;
    const workspacePath = path.join(WORKSPACES_DIR, req.params.workspaceId);
    
    let folderPath;
    if (parentPath) {
      folderPath = path.join(parentPath, name);
    } else {
      folderPath = path.join(workspacePath, name);
    }
    
    await fs.mkdir(folderPath, { recursive: true });
    
    const folder = {
      id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type: 'folder',
      path: folderPath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Create request
app.post('/api/workspaces/:workspaceId/requests', async (req, res) => {
  try {
    const { name, method = 'GET', url = '', headers = {}, body = '', params = {}, parentPath } = req.body;
    const workspacePath = path.join(WORKSPACES_DIR, req.params.workspaceId);
    
    let requestPath;
    if (parentPath) {
      requestPath = path.join(parentPath, `${name}.json`);
    } else {
      requestPath = path.join(workspacePath, `${name}.json`);
    }
    
    const request = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      method,
      url,
      headers,
      body,
      params,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await fs.writeFile(requestPath, JSON.stringify(request, null, 2));
    request.path = requestPath;
    
    res.json(request);
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// Update request
app.put('/api/requests/:path', async (req, res) => {
  try {
    const requestPath = decodeURIComponent(req.params.path);
    const updatedRequest = { ...req.body, updatedAt: new Date().toISOString() };
    
    await fs.writeFile(requestPath, JSON.stringify(updatedRequest, null, 2));
    res.json(updatedRequest);
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// Delete item
app.delete('/api/items/:path', async (req, res) => {
  try {
    const itemPath = decodeURIComponent(req.params.path);
    await fs.rm(itemPath, { recursive: true, force: true });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Serve the main application
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Postman Clone'
  });
});

// Initialize and start server
async function startServer() {
  await ensureWorkspacesDir();
  
  app.listen(PORT, () => {
    console.log(`🚀 Postman Clone Server running on http://localhost:${PORT}`);
    console.log(`📁 Workspaces directory: ${WORKSPACES_DIR}`);
  });
}

startServer().catch(console.error);