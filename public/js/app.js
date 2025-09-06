// Application State for Postman Clone
let appState = {
    workspaces: [],
    currentWorkspace: null,
    collections: [],
    currentRequest: null,
    response: null,
    isLoading: false
};

// API Base URL
const API_BASE = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
async function initializeApp() {
    try {
        // Load real workspace data
        await loadWorkspaces();
        
        // Set default workspace if exists
        if (appState.workspaces.length > 0) {
            await setActiveWorkspace(appState.workspaces[0].id);
        }
        
        // Add event listeners
        setupEventListeners();
        
        console.log('Postman Clone initialized successfully with real data');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        // Fallback to sample data if API fails
        loadSampleData();
        setupEventListeners();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Send button
    const sendBtn = document.querySelector('.send-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendRequest);
    }
    
    // Method selector
    const methodSelector = document.querySelector('.method-selector');
    if (methodSelector) {
        methodSelector.addEventListener('change', function() {
            appState.currentRequest.method = this.value;
        });
    }
    
    // URL input
    const urlInput = document.querySelector('.url-input');
    if (urlInput) {
        urlInput.addEventListener('input', function() {
            appState.currentRequest.url = this.value;
            parseURLParams();
        });
    }
    
    // Parameter inputs
    document.querySelectorAll('.param-value').forEach(input => {
        input.addEventListener('input', function() {
            const paramName = this.closest('.param-row').querySelector('.param-key').value;
            appState.currentRequest.params[paramName] = this.value;
            updateURL();
        });
    });
    
    // Tab switching
    setupTabSwitching();
}

// Setup tab switching functionality
function setupTabSwitching() {
    // Request option tabs
    document.querySelectorAll('.option-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            document.querySelectorAll('.option-tab').forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Show/hide corresponding sections
            showTabContent(this.textContent.trim());
        });
    });
    
    // Response tabs
    document.querySelectorAll('.response-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.response-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Show tab content based on selected tab
function showTabContent(tabName) {
    const paramsSection = document.querySelector('.params-section');
    
    if (tabName === 'Params') {
        if (paramsSection) paramsSection.style.display = 'flex';
    } else {
        if (paramsSection) paramsSection.style.display = 'none';
    }
}

// Parse URL parameters from the URL input
function parseURLParams() {
    const url = appState.currentRequest.url;
    try {
        const urlObj = new URL(url.replace(/\{\{.*?\}\}/g, 'placeholder'));
        const params = {};
        
        for (const [key, value] of urlObj.searchParams) {
            params[key] = value;
        }
        
        appState.currentRequest.params = params;
        updateParamsUI();
    } catch (error) {
        // Invalid URL, skip parsing
        console.warn('Invalid URL for parsing:', url);
    }
}

// Update URL based on parameters
function updateURL() {
    const baseURL = appState.currentRequest.url.split('?')[0];
    const params = new URLSearchParams();
    
    Object.entries(appState.currentRequest.params).forEach(([key, value]) => {
        if (value) {
            params.append(key, value);
        }
    });
    
    const newURL = baseURL + (params.toString() ? '?' + params.toString() : '');
    appState.currentRequest.url = newURL;
    
    const urlInput = document.querySelector('.url-input');
    if (urlInput) {
        urlInput.value = newURL;
    }
}

// Update parameters UI
function updateParamsUI() {
    const paramsSection = document.querySelector('.params-section');
    if (!paramsSection) return;
    
    const paramsHTML = Object.entries(appState.currentRequest.params).map(([key, value]) => `
        <div class="param-row">
            <input type="checkbox" checked>
            <input type="text" value="${key}" class="param-key" readonly>
            <input type="text" value="${value}" class="param-value">
            <span class="param-description"></span>
        </div>
    `).join('');
    
    paramsSection.innerHTML = paramsHTML;
    
    // Re-attach event listeners to new param inputs
    document.querySelectorAll('.param-value').forEach(input => {
        input.addEventListener('input', function() {
            const paramName = this.closest('.param-row').querySelector('.param-key').value;
            appState.currentRequest.params[paramName] = this.value;
            updateURL();
        });
    });
}

// Load workspaces from API
async function loadWorkspaces() {
    try {
        const response = await axios.get(`${API_BASE}/workspaces`);
        appState.workspaces = response.data;
        updateWorkspaceDisplay();
        console.log('Loaded workspaces:', appState.workspaces);
    } catch (error) {
        console.error('Failed to load workspaces:', error);
        throw error;
    }
}

// Set active workspace and load its collections
async function setActiveWorkspace(workspaceId) {
    try {
        // Find the workspace
        appState.currentWorkspace = appState.workspaces.find(ws => ws.id === workspaceId);
        
        if (!appState.currentWorkspace) {
            throw new Error(`Workspace ${workspaceId} not found`);
        }
        
        // Load collections for this workspace
        await loadCollections(workspaceId);
        
        // Update UI
        updateWorkspaceDisplay();
        updateCollectionTree();
        
        console.log('Active workspace set to:', appState.currentWorkspace.name);
    } catch (error) {
        console.error('Failed to set active workspace:', error);
        throw error;
    }
}

// Load collections for a workspace
async function loadCollections(workspaceId) {
    try {
        const response = await axios.get(`${API_BASE}/workspaces/${workspaceId}/collections`);
        appState.collections = response.data;
        console.log('Loaded collections:', appState.collections);
    } catch (error) {
        console.error('Failed to load collections:', error);
        throw error;
    }
}

// Update workspace display
function updateWorkspaceDisplay() {
    const workspaceName = document.querySelector('.workspace-name');
    if (workspaceName && appState.currentWorkspace) {
        workspaceName.textContent = appState.currentWorkspace.name;
    }
}

// Update the collections tree with real data
function updateCollectionTree() {
    const collectionTree = document.querySelector('.collection-tree');
    if (!collectionTree) return;
    
    if (appState.collections.length === 0) {
        collectionTree.innerHTML = `
            <div class="collection-item">
                <i class="fas fa-folder collection-folder"></i>
                <span>No collections found</span>
            </div>
        `;
        return;
    }
    
    collectionTree.innerHTML = renderCollectionsHTML(appState.collections);
    initializeCollectionTree();
}

// Render collections as HTML
function renderCollectionsHTML(collections, level = 0) {
    return collections.map(item => {
        const marginLeft = level * 16;
        
        if (item.type === 'folder') {
            const childrenHTML = item.children && item.children.length > 0 
                ? renderCollectionsHTML(item.children, level + 1) 
                : '';
                
            return `
                <div class="collection-item nested-${level}" style="margin-left: ${marginLeft}px">
                    <i class="fas fa-chevron-down"></i>
                    <i class="fas fa-folder collection-folder"></i>
                    <span>${item.name}</span>
                </div>
                ${childrenHTML}
            `;
        } else if (item.type === 'request') {
            return `
                <div class="request-item" style="margin-left: ${marginLeft + 16}px" data-request-id="${item.id}" data-request-path="${item.path}">
                    <span class="request-method ${item.method.toLowerCase()}">${item.method}</span>
                    <span class="request-name">${item.name}</span>
                </div>
            `;
        }
        return '';
    }).join('');
}

// Load sample response data (fallback)
function loadSampleData() {
    // Set sample workspace data if API fails
    appState.workspaces = [{
        id: 'sample',
        name: 'SRX - Strategic Partnerships',
        description: 'Sample workspace'
    }];
    appState.currentWorkspace = appState.workspaces[0];
    
    // Sample collections matching the screenshot
    appState.collections = [
        {
            id: 'trolley-bff',
            name: 'Smart Trolley BFF [PROD]',
            type: 'folder',
            children: []
        },
        {
            id: 'trolley-prep',
            name: 'SRX Smart Trolley [PREP]',
            type: 'folder',
            children: [
                { id: 'customer', name: 'Customer', type: 'folder', children: [] },
                { id: 'spin-win', name: 'Spin and Win', type: 'folder', children: [] },
                {
                    id: 'products',
                    name: 'Products',
                    type: 'folder',
                    children: [
                        { id: 'scenarios', name: 'Product Scenarios', type: 'folder', children: [] },
                        {
                            id: 'get-barcode',
                            name: 'Retrieve Product by Barcode',
                            type: 'request',
                            method: 'GET',
                            url: '{{baseUrl}}/dsi/brands/checkers/countries/ZA/products/search/full?posName={{storeCode}}&barcode=6009612470014&currentPage=0'
                        },
                        {
                            id: 'get-barcode-copy',
                            name: 'Retrieve Product by Barcode Copy',
                            type: 'request',
                            method: 'GET'
                        }
                    ]
                }
            ]
        }
    ];
    
    const sampleResponse = {
        type: "Ok",
        status: 200,
        title: "Your request was successfully processed.",
        requestId: "e051c27d-3abd-429a-8c5e-d6951ed306b0",
        serverTime: "06/Sep/2025:22:43:59 +0000",
        response: {
            products: [{
                code: "10144356EA",
                articleId: "",
                uom: "EA",
                name: "aQuellé Natural Still Spring Water 1.5L",
                description: "<p>Enjoy the exceptional taste of our natural spring water, drawn from an underground spring.</p>"
            }]
        }
    };
    
    appState.response = {
        status: 200,
        statusText: 'OK',
        data: sampleResponse,
        responseTime: 5670,
        size: 9630
    };
    
    updateWorkspaceDisplay();
    updateCollectionTree();
}

// Send real API request
async function sendRequest() {
    const sendBtn = document.querySelector('.send-btn');
    const jsonViewer = document.querySelector('.json-viewer');
    const statusCode = document.querySelector('.status-code');
    const responseTime = document.querySelector('.response-time');
    const responseSize = document.querySelector('.response-size');
    
    if (!sendBtn || !jsonViewer) return;
    
    // Get current request data from UI
    const method = document.querySelector('.method-selector')?.value || 'GET';
    const url = document.querySelector('.url-input')?.value || '';
    
    if (!url.trim()) {
        alert('Please enter a request URL');
        return;
    }
    
    // Show loading state
    appState.isLoading = true;
    sendBtn.textContent = 'Sending...';
    sendBtn.disabled = true;
    
    // Show loading in response area
    jsonViewer.innerHTML = `
        <div class="json-line">
            <span class="line-number">1</span>
            <span class="json-string">Sending request...</span>
        </div>
    `;
    
    try {
        const startTime = Date.now();
        
        // Make real HTTP request
        const config = {
            method: method.toLowerCase(),
            url: url,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 second timeout
        };
        
        const response = await axios(config);
        const endTime = Date.now();
        
        // Store response in app state
        appState.response = {
            status: response.status,
            statusText: response.statusText,
            data: response.data,
            responseTime: endTime - startTime,
            size: JSON.stringify(response.data).length
        };
        
        // Update the response display
        updateResponseDisplay();
        
        // Save the request if we have a current request
        if (appState.currentRequest && appState.currentRequest.path) {
            await saveCurrentRequest();
        }
        
    } catch (error) {
        console.error('Request failed:', error);
        
        const endTime = Date.now();
        const startTime = endTime - 1000; // Approximate
        
        // Show error response
        appState.response = {
            status: error.response?.status || 0,
            statusText: error.response?.statusText || 'Network Error',
            data: error.response?.data || { error: error.message },
            responseTime: endTime - startTime,
            size: 0
        };
        
        updateResponseDisplay();
    } finally {
        // Reset button state
        sendBtn.textContent = 'Send';
        sendBtn.disabled = false;
        appState.isLoading = false;
    }
}

// Update response display
function updateResponseDisplay() {
    const jsonViewer = document.querySelector('.json-viewer');
    const statusCode = document.querySelector('.status-code');
    const responseTime = document.querySelector('.response-time');
    const responseSize = document.querySelector('.response-size');
    
    if (statusCode) {
        statusCode.textContent = `${appState.response.status} ${appState.response.statusText}`;
        statusCode.className = 'status-code ' + (appState.response.status < 400 ? 'success' : 'error');
    }
    
    if (responseTime) {
        responseTime.textContent = `${(appState.response.responseTime / 1000).toFixed(2)} s`;
    }
    
    if (responseSize) {
        responseSize.textContent = `${(appState.response.size / 1024).toFixed(2)} kB`;
    }
    
    if (jsonViewer) {
        const jsonString = JSON.stringify(appState.response.data, null, 2);
        const lines = jsonString.split('\n');
        
        let html = '';
        lines.forEach((line, index) => {
            const lineNumber = index + 1;
            let formattedLine = line;
            
            // Apply JSON syntax highlighting
            formattedLine = formattedLine
                .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
                .replace(/: "([^"]+)"/g, ': <span class="json-string">"$1"</span>')
                .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
                .replace(/([{}])/g, '<span class="json-bracket">$1</span>')
                .replace(/([[\]])/g, '<span class="json-bracket">$1</span>');
            
            html += `<div class="json-line"><span class="line-number">${lineNumber}</span>${formattedLine}</div>`;
        });
        
        jsonViewer.innerHTML = html;
    }
}

// Collection tree item click handlers
function toggleFolder(element) {
    const chevron = element.querySelector('.fas.fa-chevron-down');
    const folder = element.closest('.collection-item');
    
    if (chevron) {
        if (chevron.style.transform === 'rotate(-90deg)') {
            chevron.style.transform = 'rotate(0deg)';
            folder.classList.add('expanded');
        } else {
            chevron.style.transform = 'rotate(-90deg)';
            folder.classList.remove('expanded');
        }
    }
}

// Load a specific request from file
async function loadRequest(requestPath, requestData) {
    try {
        // If we have a path, try to load from the file system
        if (requestPath) {
            const response = await fetch(requestPath);
            if (response.ok) {
                const data = await response.text();
                requestData = JSON.parse(data);
            }
        }
        
        appState.currentRequest = requestData;
        
        // Update UI with request data
        updateRequestUI();
        
        console.log('Loaded request:', requestData.name);
    } catch (error) {
        console.error('Failed to load request:', error);
        // Use the provided request data as fallback
        appState.currentRequest = requestData;
        updateRequestUI();
    }
}

// Update the request UI with current request data
function updateRequestUI() {
    if (!appState.currentRequest) return;
    
    const request = appState.currentRequest;
    
    // Update method selector
    const methodSelector = document.querySelector('.method-selector');
    if (methodSelector) {
        methodSelector.value = request.method || 'GET';
    }
    
    // Update URL input
    const urlInput = document.querySelector('.url-input');
    if (urlInput) {
        urlInput.value = request.url || '';
    }
    
    // Update parameters section
    updateParamsFromRequest();
    
    // Update breadcrumb
    const breadcrumbText = document.querySelector('.breadcrumb');
    if (breadcrumbText) {
        const lastSpan = breadcrumbText.querySelector('span:last-child');
        if (lastSpan) {
            lastSpan.textContent = request.name;
        }
    }
    
    // Update tab title
    const tabName = document.querySelector('.tab-name');
    if (tabName) {
        tabName.textContent = request.name;
    }
}

// Update params section from current request
function updateParamsFromRequest() {
    if (!appState.currentRequest) return;
    
    const paramsSection = document.querySelector('.params-section');
    if (!paramsSection) return;
    
    // Extract params from URL or use stored params
    const params = appState.currentRequest.params || {};
    
    // If no stored params, try to extract from URL
    if (Object.keys(params).length === 0 && appState.currentRequest.url) {
        try {
            const url = new URL(appState.currentRequest.url.replace(/\{\{.*?\}\}/g, 'http://placeholder.com'));
            for (const [key, value] of url.searchParams) {
                params[key] = value;
            }
        } catch (e) {
            // Invalid URL, skip extraction
        }
    }
    
    // Generate params HTML
    const paramsHTML = Object.entries(params).map(([key, value]) => `
        <div class="param-row">
            <input type="checkbox" checked>
            <input type="text" value="${key}" class="param-key" readonly>
            <input type="text" value="${value}" class="param-value">
            <span class="param-description"></span>
        </div>
    `).join('');
    
    paramsSection.innerHTML = paramsHTML;
    
    // Re-attach event listeners
    setupParamListeners();
}

// Save current request to file system
async function saveCurrentRequest() {
    if (!appState.currentRequest || !appState.currentRequest.path) {
        console.log('No request path to save to');
        return;
    }
    
    try {
        // Update request data from UI
        appState.currentRequest.method = document.querySelector('.method-selector')?.value || 'GET';
        appState.currentRequest.url = document.querySelector('.url-input')?.value || '';
        appState.currentRequest.updatedAt = new Date().toISOString();
        
        const encodedPath = encodeURIComponent(appState.currentRequest.path);
        await axios.put(`${API_BASE}/requests/${encodedPath}`, appState.currentRequest);
        
        console.log('Request saved successfully');
    } catch (error) {
        console.error('Failed to save request:', error);
    }
}

// Request item selection with real data loading
async function selectRequest(requestElement) {
    // Remove active class from all requests
    document.querySelectorAll('.request-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to selected request
    requestElement.classList.add('active');
    
    // Get request data from element attributes
    const requestId = requestElement.getAttribute('data-request-id');
    const requestPath = requestElement.getAttribute('data-request-path');
    const requestName = requestElement.querySelector('.request-name').textContent;
    const requestMethod = requestElement.querySelector('.request-method').textContent;
    
    // Find the request in our collections data
    let requestData = findRequestInCollections(appState.collections, requestId);
    
    // If not found, create basic request data
    if (!requestData) {
        requestData = {
            id: requestId,
            name: requestName,
            method: requestMethod,
            url: '',
            path: requestPath,
            headers: {},
            params: {}
        };
    }
    
    // Load the full request data
    await loadRequest(requestPath, requestData);
}

// Helper function to find request in collections tree
function findRequestInCollections(collections, requestId) {
    for (const item of collections) {
        if (item.type === 'request' && item.id === requestId) {
            return item;
        }
        if (item.type === 'folder' && item.children) {
            const found = findRequestInCollections(item.children, requestId);
            if (found) return found;
        }
    }
    return null;
}

// Setup parameter listeners
function setupParamListeners() {
    document.querySelectorAll('.param-value').forEach(input => {
        input.addEventListener('input', function() {
            const paramName = this.closest('.param-row').querySelector('.param-key').value;
            if (appState.currentRequest) {
                if (!appState.currentRequest.params) {
                    appState.currentRequest.params = {};
                }
                appState.currentRequest.params[paramName] = this.value;
                updateURL();
            }
        });
    });
}

// Initialize collection tree interactions
function initializeCollectionTree() {
    // Add click handlers for collection items (folders)
    document.querySelectorAll('.collection-item').forEach(item => {
        const chevron = item.querySelector('.fas.fa-chevron-down');
        if (chevron) {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleFolder(this);
            });
        }
    });
    
    // Add click handlers for request items
    document.querySelectorAll('.request-item').forEach(item => {
        item.addEventListener('click', async function(e) {
            e.stopPropagation();
            await selectRequest(this);
        });
    });
}

// Create a new request
async function createNewRequest() {
    if (!appState.currentWorkspace) {
        alert('Please select a workspace first');
        return;
    }
    
    const name = prompt('Enter request name:');
    if (!name || !name.trim()) return;
    
    try {
        const response = await axios.post(`${API_BASE}/workspaces/${appState.currentWorkspace.id}/requests`, {
            name: name.trim(),
            method: 'GET',
            url: ''
        });
        
        // Reload collections to show the new request
        await loadCollections(appState.currentWorkspace.id);
        updateCollectionTree();
        
        console.log('Created new request:', name);
    } catch (error) {
        console.error('Failed to create request:', error);
        alert('Failed to create request');
    }
}