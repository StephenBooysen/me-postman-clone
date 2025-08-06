import React, { useState } from 'react';
import { Play, Save, Copy, Code, Eye } from 'lucide-react';
import { useAppStore } from '../hooks/useAppStore';
import { HTTP_METHODS } from '../types/index';
import RequestTabs from './RequestTabs';
import ResponseViewer from './ResponseViewer';

function RequestEditor() {
  const { 
    currentRequest, 
    updateRequest, 
    substituteVariables 
  } = useAppStore();
  
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!currentRequest) return null;

  const handleSendRequest = async () => {
    setIsLoading(true);
    setResponse(null);

    try {
      // Substitute variables in URL
      const processedUrl = substituteVariables(currentRequest.url);
      
      // Prepare headers
      const headers = {};
      currentRequest.headers
        .filter(header => header.enabled && header.key.trim())
        .forEach(header => {
          headers[header.key] = substituteVariables(header.value);
        });

      // Prepare request config
      const config = {
        method: currentRequest.method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
      };

      // Add body for methods that support it
      if (['POST', 'PUT', 'PATCH'].includes(currentRequest.method)) {
        if (currentRequest.body.type === 'json' && currentRequest.body.content) {
          try {
            const processedBody = substituteVariables(currentRequest.body.content);
            config.body = JSON.stringify(JSON.parse(processedBody));
          } catch (e) {
            config.body = substituteVariables(currentRequest.body.content);
          }
        } else if (currentRequest.body.content) {
          config.body = substituteVariables(currentRequest.body.content);
        }
      }

      // Add query parameters to URL
      const url = new URL(processedUrl);
      currentRequest.params
        .filter(param => param.enabled && param.key.trim())
        .forEach(param => {
          url.searchParams.append(param.key, substituteVariables(param.value));
        });

      const startTime = Date.now();
      const fetchResponse = await fetch(url.toString(), config);
      const endTime = Date.now();

      const responseData = {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        time: endTime - startTime,
        size: 0,
        headers: Object.fromEntries(fetchResponse.headers.entries()),
        body: null
      };

      // Try to parse response body
      const contentType = fetchResponse.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        responseData.body = await fetchResponse.json();
      } else {
        responseData.body = await fetchResponse.text();
      }

      setResponse(responseData);
    } catch (error) {
      setResponse({
        error: error.message,
        status: 0,
        statusText: 'Network Error',
        time: 0,
        size: 0,
        headers: {},
        body: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRequest = (updates) => {
    updateRequest(currentRequest.id, updates);
  };

  const handleMethodChange = (method) => {
    handleUpdateRequest({ method });
  };

  const handleUrlChange = (url) => {
    handleUpdateRequest({ url });
  };

  const getMethodColor = (method) => {
    const colors = {
      GET: 'text-green-600 bg-green-100 border-green-200',
      POST: 'text-orange-600 bg-orange-100 border-orange-200',
      PUT: 'text-blue-600 bg-blue-100 border-blue-200',
      DELETE: 'text-red-600 bg-red-100 border-red-200',
      PATCH: 'text-purple-600 bg-purple-100 border-purple-200'
    };
    return colors[method] || 'text-gray-600 bg-gray-100 border-gray-200';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Request Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-800">{currentRequest.name}</h2>
          <button
            onClick={() => {
              const newName = prompt('Enter new name:', currentRequest.name);
              if (newName?.trim()) {
                handleUpdateRequest({ name: newName.trim() });
              }
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* URL Bar */}
        <div className="flex items-center gap-3">
          {/* Method Selector */}
          <select
            value={currentRequest.method}
            onChange={(e) => handleMethodChange(e.target.value)}
            className={`px-3 py-2 border rounded-md font-mono text-sm font-medium ${getMethodColor(currentRequest.method)}`}
          >
            {Object.values(HTTP_METHODS).map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>

          {/* URL Input */}
          <input
            type="text"
            value={currentRequest.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Enter request URL"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />

          {/* Send Button */}
          <button
            onClick={handleSendRequest}
            disabled={isLoading || !currentRequest.url.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Sending...' : 'Send'}
          </button>

          {/* Save Button */}
          <button
            onClick={() => {
              // In a real app, this would save to localStorage or server
              console.log('Request saved');
            }}
            className="btn-secondary"
            title="Save request"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Request/Response Split */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Request Configuration */}
        <div className="flex-1 min-h-0">
          <RequestTabs 
            request={currentRequest} 
            onUpdate={handleUpdateRequest} 
          />
        </div>

        {/* Response Section */}
        {(response || isLoading) && (
          <div className="flex-1 border-t border-gray-200">
            <ResponseViewer 
              response={response} 
              isLoading={isLoading} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default RequestEditor;