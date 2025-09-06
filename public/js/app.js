// Application State
let appState = {
    workspaces: [],
    activeWorkspace: null,
    currentWorkspace: null,
    collections: [],
    currentRequest: null
};

// API Base URL
const API_BASE = 'http://localhost:3102/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
async function initializeApp() {
    try {
        await loadWorkspaces();
        if (appState.workspaces.length > 0) {
            await setActiveWorkspace(appState.workspaces[0].id);
        }
        
        // Initialize UI components
        initializeUIComponents();
        
        showToast({
            title: 'Welcome!',
            description: 'Postman Clone loaded successfully',
            variant: 'success',
            duration: 3000
        });
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showToast({
            title: 'Error',
            description: 'Failed to initialize application',
            variant: 'destructive'
        });
    }
}

// Initialize UI Components
function initializeUIComponents() {
    // Initialize tooltips
    if (window.UI) {
        window.UI.initializeTooltips();
    }
}

// Load workspaces from API
async function loadWorkspaces() {
    try {
        const response = await axios.get(`${API_BASE}/workspaces`);
        appState.workspaces = response.data;
        updateWorkspaceSelector();
    } catch (error) {
        console.error('Failed to load workspaces:', error);
        throw error;
    }
}

// Set active workspace
async function setActiveWorkspace(workspaceId) {
    try {
        appState.activeWorkspace = workspaceId;
        
        // Load workspace details
        const response = await axios.get(`${API_BASE}/workspaces/${workspaceId}`);
        appState.currentWorkspace = response.data;
        
        // Load collections for this workspace
        await loadCollections(workspaceId);
        
        // Update UI
        updateWorkspaceSelector();
        updateVariablesInfo();
        
    } catch (error) {
        console.error('Failed to set active workspace:', error);
        throw error;
    }
}

// Load collections for workspace
async function loadCollections(workspaceId) {
    try {
        const response = await axios.get(`${API_BASE}/workspaces/${workspaceId}/collections`);
        appState.collections = response.data;
        updateCollectionTree();
    } catch (error) {
        console.error('Failed to load collections:', error);
        throw error;
    }
}

// Update workspace selector UI
function updateWorkspaceSelector() {
    const nameEl = document.getElementById('current-workspace-name');
    const list = document.getElementById('workspace-list');
    
    if (appState.currentWorkspace && nameEl) {
        nameEl.textContent = appState.currentWorkspace.name;
    }
    
    if (list) {
        list.innerHTML = appState.workspaces.map(workspace => `
            <button
                onclick="selectWorkspace('${workspace.id}')"
                class="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded flex items-center space-x-2 ${
                    appState.activeWorkspace === workspace.id ? 'bg-accent text-accent-foreground' : 'text-foreground'
                }"
            >
                <i class="fi fi-rr-briefcase flex-shrink-0"></i>
                <div class="flex-1 truncate">
                    <div class="font-medium">${workspace.name}</div>
                    ${workspace.description ? `<div class="text-xs text-muted-foreground truncate">${workspace.description}</div>` : ''}
                </div>
            </button>
        `).join('');
    }
}

// Update collection tree UI
function updateCollectionTree() {
    const tree = document.getElementById('collection-tree');
    if (tree) {
        if (appState.collections.length === 0) {
            tree.innerHTML = `
                <div class="text-center py-8">
                    <i class="fi fi-rr-folder-open text-4xl text-muted-foreground mb-4"></i>
                    <p class="text-sm text-muted-foreground mb-4">No collections yet</p>
                    <button onclick="createRequest()" class="btn btn-default btn-sm">
                        <i class="fi fi-rr-plus mr-2"></i>
                        Create Request
                    </button>
                </div>
            `;
        } else {
            tree.innerHTML = renderCollectionTree(appState.collections);
        }
    }
}

// Render collection tree HTML
function renderCollectionTree(items, level = 0) {
    if (!items || items.length === 0) {
        return '';
    }
    
    return items.map(item => {
        const indent = level > 0 ? `ml-${level * 4}` : '';
        
        if (item.type === 'folder') {
            return `
                <div class="${indent}">
                    <div class="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer text-sm group">
                        <i class="fi fi-rr-folder text-muted-foreground group-hover:text-foreground"></i>
                        <span class="text-foreground font-medium">${item.name}</span>
                    </div>
                    ${item.children ? renderCollectionTree(item.children, level + 1) : ''}
                </div>
            `;
        } else if (item.type === 'request') {
            return `
                <div class="${indent}">
                    <div class="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer text-sm group" onclick="selectRequest('${item.id}')">
                        <div class="badge badge-sm method-${item.method.toLowerCase()}">
                            ${item.method}
                        </div>
                        <span class="text-foreground truncate group-hover:text-accent-foreground">${item.name}</span>
                    </div>
                </div>
            `;
        }
        return '';
    }).join('');
}

// Update variables info
function updateVariablesInfo() {
    const info = document.getElementById('variables-info');
    if (info && appState.currentWorkspace) {
        const varCount = Object.keys(appState.currentWorkspace.variables || {}).length;
        info.innerHTML = varCount > 0 
            ? `<i class="fi fi-rr-settings mr-1"></i>${varCount} variables defined`
            : '<i class="fi fi-rr-settings mr-1"></i>No variables defined';
    }
}

// UI Event Handlers
function toggleWorkspaceSelector() {
    const dropdown = document.getElementById('workspace-dropdown');
    const chevron = document.getElementById('workspace-chevron');
    
    if (dropdown && chevron) {
        const isHidden = dropdown.classList.contains('hidden');
        
        if (isHidden) {
            dropdown.classList.remove('hidden');
            chevron.style.transform = 'rotate(180deg)';
        } else {
            dropdown.classList.add('hidden');
            chevron.style.transform = 'rotate(0deg)';
        }
    }
}

async function selectWorkspace(workspaceId) {
    try {
        await setActiveWorkspace(workspaceId);
        toggleWorkspaceSelector();
        
        showToast({
            title: 'Workspace Changed',
            description: `Switched to ${appState.currentWorkspace.name}`,
            duration: 2000
        });
    } catch (error) {
        console.error('Failed to switch workspace:', error);
        showToast({
            title: 'Error',
            description: 'Failed to switch workspace',
            variant: 'destructive'
        });
    }
}

async function createWorkspace() {
    const name = prompt('Enter workspace name:');
    if (name && name.trim()) {
        const description = prompt('Enter workspace description (optional):') || '';
        try {
            const response = await axios.post(`${API_BASE}/workspaces`, {
                id: Date.now().toString(),
                name: name.trim(),
                description: description
            });
            
            await loadWorkspaces();
            await setActiveWorkspace(response.data.id);
            toggleWorkspaceSelector();
            
            showToast({
                title: 'Workspace Created',
                description: `"${name.trim()}" workspace created successfully`,
                variant: 'success'
            });
        } catch (error) {
            console.error('Failed to create workspace:', error);
            showToast({
                title: 'Error',
                description: 'Failed to create workspace',
                variant: 'destructive'
            });
        }
    }
}

async function createFolder() {
    const name = prompt('Enter folder name:');
    if (name && name.trim()) {
        try {
            await axios.post(`${API_BASE}/workspaces/${appState.activeWorkspace}/folders`, {
                name: name.trim()
            });
            await loadCollections(appState.activeWorkspace);
            
            showToast({
                title: 'Folder Created',
                description: `"${name.trim()}" folder created successfully`,
                variant: 'success'
            });
        } catch (error) {
            console.error('Failed to create folder:', error);
            showToast({
                title: 'Error',
                description: 'Failed to create folder',
                variant: 'destructive'
            });
        }
    }
}

async function createRequest() {
    const name = prompt('Enter request name:');
    if (name && name.trim()) {
        try {
            const response = await axios.post(`${API_BASE}/workspaces/${appState.activeWorkspace}/requests`, {
                name: name.trim(),
                method: 'GET',
                url: ''
            });
            
            await loadCollections(appState.activeWorkspace);
            selectRequest(response.data.id);
            
            showToast({
                title: 'Request Created',
                description: `"${name.trim()}" request created successfully`,
                variant: 'success'
            });
        } catch (error) {
            console.error('Failed to create request:', error);
            showToast({
                title: 'Error',
                description: 'Failed to create request',
                variant: 'destructive'
            });
        }
    }
}

function selectRequest(requestId) {
    // Find the request in collections
    const request = findRequestById(appState.collections, requestId);
    if (request) {
        appState.currentRequest = request;
        showRequestEditor();
        
        showToast({
            title: 'Request Selected',
            description: `Opened "${request.name}"`,
            duration: 2000
        });
    }
}

function findRequestById(collections, id) {
    for (const item of collections) {
        if (item.type === 'request' && item.id === id) {
            return item;
        }
        if (item.type === 'folder' && item.children) {
            const found = findRequestById(item.children, id);
            if (found) return found;
        }
    }
    return null;
}

function showRequestEditor() {
    const mainContent = document.getElementById('main-content');
    if (appState.currentRequest && mainContent) {
        const methodOptions = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
            .map(method => `<option value="${method}" ${appState.currentRequest.method === method ? 'selected' : ''}>${method}</option>`)
            .join('');

        mainContent.innerHTML = `
            <div class="h-full flex flex-col">
                <!-- Request Header -->
                <div class="border-b p-4 bg-card">
                    <div class="flex items-center gap-4 mb-3">
                        <select id="request-method" class="input w-24">
                            ${methodOptions}
                        </select>
                        <input 
                            id="request-url" 
                            type="text" 
                            placeholder="Enter request URL" 
                            value="${appState.currentRequest.url || ''}"
                            class="input flex-1"
                        >
                        <button onclick="sendRequest()" class="btn btn-default">
                            <i class="fi fi-rr-paper-plane mr-2"></i>
                            Send
                        </button>
                    </div>
                    <h1 class="text-lg font-semibold flex items-center">
                        <i class="fi fi-rr-document mr-2"></i>
                        ${appState.currentRequest.name}
                    </h1>
                </div>

                <!-- Request Body -->
                <div class="flex-1 flex overflow-hidden">
                    <div class="w-1/2 border-r flex flex-col">
                        <div class="p-4 border-b">
                            <h3 class="text-sm font-medium mb-3">Request Body</h3>
                            <textarea 
                                id="request-body" 
                                placeholder="Request body (JSON, XML, etc.)"
                                class="input resize-none h-32 font-mono text-sm"
                            >${appState.currentRequest.body || ''}</textarea>
                        </div>
                        
                        <div class="p-4 flex-1 overflow-auto">
                            <div class="flex items-center justify-between mb-3">
                                <h3 class="text-sm font-medium">Headers</h3>
                                <button onclick="addHeader()" class="btn btn-ghost btn-sm">
                                    <i class="fi fi-rr-plus mr-1"></i>
                                    Add
                                </button>
                            </div>
                            <div id="headers-container">
                                <!-- Headers will be rendered here -->
                            </div>
                        </div>
                    </div>
                    
                    <div class="w-1/2 flex flex-col">
                        <div class="p-4 border-b">
                            <h3 class="text-sm font-medium">Response</h3>
                        </div>
                        <div class="p-4 flex-1 overflow-auto">
                            <div id="response-container" class="bg-muted border rounded-md p-4 h-full">
                                <div class="flex items-center justify-center h-full text-muted-foreground">
                                    <div class="text-center">
                                        <i class="fi fi-rr-clock text-2xl mb-2"></i>
                                        <p class="text-sm">Response will appear here after sending the request</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        renderHeaders();
        
        // Add event listeners for real-time updates
        document.getElementById('request-method').addEventListener('change', updateRequestData);
        document.getElementById('request-url').addEventListener('input', updateRequestData);
        document.getElementById('request-body').addEventListener('input', updateRequestData);
    }
}

function renderHeaders() {
    const container = document.getElementById('headers-container');
    const headers = appState.currentRequest.headers || {};
    
    if (Object.keys(headers).length === 0) {
        container.innerHTML = `
            <div class="text-center py-4 text-muted-foreground">
                <i class="fi fi-rr-list text-2xl mb-2"></i>
                <p class="text-sm">No headers defined</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = Object.entries(headers).map(([key, value]) => `
        <div class="flex gap-2 mb-2 p-2 bg-muted rounded">
            <input 
                type="text" 
                placeholder="Header name" 
                value="${key}"
                onchange="updateHeaderKey('${key}', this.value)"
                class="input flex-1 text-sm"
            >
            <input 
                type="text" 
                placeholder="Header value" 
                value="${value}"
                onchange="updateHeaderValue('${key}', this.value)"
                class="input flex-1 text-sm"
            >
            <button onclick="removeHeader('${key}')" class="btn btn-ghost btn-icon btn-sm text-destructive">
                <i class="fi fi-rr-trash"></i>
            </button>
        </div>
    `).join('');
}

function addHeader() {
    const key = prompt('Header name:');
    if (key && key.trim()) {
        const value = prompt('Header value:') || '';
        if (!appState.currentRequest.headers) {
            appState.currentRequest.headers = {};
        }
        appState.currentRequest.headers[key.trim()] = value;
        renderHeaders();
        saveRequestData();
    }
}

function removeHeader(key) {
    if (appState.currentRequest.headers) {
        delete appState.currentRequest.headers[key];
        renderHeaders();
        saveRequestData();
    }
}

function updateHeaderKey(oldKey, newKey) {
    if (appState.currentRequest.headers && oldKey !== newKey && newKey.trim()) {
        const value = appState.currentRequest.headers[oldKey];
        delete appState.currentRequest.headers[oldKey];
        appState.currentRequest.headers[newKey.trim()] = value;
        renderHeaders();
        saveRequestData();
    }
}

function updateHeaderValue(key, value) {
    if (appState.currentRequest.headers) {
        appState.currentRequest.headers[key] = value;
        saveRequestData();
    }
}

function updateRequestData() {
    if (!appState.currentRequest) return;
    
    appState.currentRequest.method = document.getElementById('request-method').value;
    appState.currentRequest.url = document.getElementById('request-url').value;
    appState.currentRequest.body = document.getElementById('request-body').value;
    
    saveRequestData();
}

async function saveRequestData() {
    if (!appState.currentRequest?.path) return;
    
    try {
        const encodedPath = encodeURIComponent(appState.currentRequest.path);
        await axios.put(`${API_BASE}/requests/${encodedPath}`, appState.currentRequest);
    } catch (error) {
        console.error('Failed to save request:', error);
    }
}

async function sendRequest() {
    if (!appState.currentRequest) return;
    
    const method = document.getElementById('request-method').value;
    const url = document.getElementById('request-url').value;
    const body = document.getElementById('request-body').value;
    
    if (!url.trim()) {
        showToast({
            title: 'Error',
            description: 'Please enter a request URL',
            variant: 'destructive'
        });
        return;
    }
    
    // Update request object
    appState.currentRequest.method = method;
    appState.currentRequest.url = url;
    appState.currentRequest.body = body;
    
    const responseContainer = document.getElementById('response-container');
    responseContainer.innerHTML = `
        <div class="flex items-center justify-center h-full">
            <div class="text-center">
                <div class="animate-spin text-2xl mb-2">
                    <i class="fi fi-rr-spinner"></i>
                </div>
                <p class="text-sm text-muted-foreground">Sending request...</p>
            </div>
        </div>
    `;
    
    try {
        const config = {
            method: method.toLowerCase(),
            url: url,
            headers: appState.currentRequest.headers || {}
        };
        
        if (body && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
            config.data = body;
            if (!config.headers['Content-Type']) {
                config.headers['Content-Type'] = 'application/json';
            }
        }
        
        const startTime = Date.now();
        const response = await axios(config);
        const endTime = Date.now();
        
        const statusClass = response.status >= 200 && response.status < 300 
            ? 'badge-default' 
            : 'badge-destructive';
        
        responseContainer.innerHTML = `
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <span class="badge ${statusClass}">
                            ${response.status} ${response.statusText}
                        </span>
                        <span class="text-sm text-muted-foreground">
                            <i class="fi fi-rr-clock mr-1"></i>
                            ${endTime - startTime}ms
                        </span>
                    </div>
                    <span class="text-sm text-muted-foreground">
                        <i class="fi fi-rr-document mr-1"></i>
                        ${JSON.stringify(response.data).length} bytes
                    </span>
                </div>
                <div class="bg-card border rounded p-3 overflow-auto max-h-96">
                    <pre class="text-sm font-mono"><code>${JSON.stringify(response.data, null, 2)}</code></pre>
                </div>
            </div>
        `;
        
        showToast({
            title: 'Request Sent',
            description: `Response: ${response.status} ${response.statusText}`,
            variant: 'success'
        });
        
    } catch (error) {
        const status = error.response?.status || 'Network Error';
        const statusText = error.response?.statusText || error.message;
        
        responseContainer.innerHTML = `
            <div class="space-y-3">
                <div class="flex items-center space-x-2">
                    <span class="badge badge-destructive">
                        ${status}
                    </span>
                    <span class="text-sm text-muted-foreground">${statusText}</span>
                </div>
                <div class="bg-card border border-destructive rounded p-3 overflow-auto max-h-96">
                    <pre class="text-sm font-mono text-destructive"><code>${error.message}${error.response?.data ? '\n\n' + JSON.stringify(error.response.data, null, 2) : ''}</code></pre>
                </div>
            </div>
        `;
        
        showToast({
            title: 'Request Failed',
            description: `${status}: ${statusText}`,
            variant: 'destructive'
        });
    }
    
    // Save the updated request
    await saveRequestData();
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    const workspaceDropdown = document.getElementById('workspace-dropdown');
    const workspaceButton = document.querySelector('#workspace-selector-container button');
    
    if (workspaceDropdown && !workspaceButton?.contains(event.target) && !workspaceDropdown.contains(event.target)) {
        workspaceDropdown.classList.add('hidden');
        const chevron = document.getElementById('workspace-chevron');
        if (chevron) {
            chevron.style.transform = 'rotate(0deg)';
        }
    }
});