import React, { useState } from 'react';
import { Copy, Download, Eye, Code, Clock, Database } from 'lucide-react';

function ResponseViewer({ response, isLoading }) {
  const [activeTab, setActiveTab] = useState('body');

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-800">Response</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Sending request...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!response) {
    return null;
  }

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'text-green-600 bg-green-100';
    if (status >= 300 && status < 400) return 'text-blue-600 bg-blue-100';
    if (status >= 400 && status < 500) return 'text-orange-600 bg-orange-100';
    if (status >= 500) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  const formatJson = (obj) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return obj;
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const tabs = [
    { id: 'body', label: 'Body', icon: Code },
    { id: 'headers', label: 'Headers', icon: Eye, count: Object.keys(response.headers || {}).length }
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Response Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-800">Response</h3>
          
          <div className="flex items-center gap-4 text-sm">
            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Status:</span>
              <span className={`px-2 py-1 rounded-md text-sm font-medium ${getStatusColor(response.status)}`}>
                {response.status} {response.statusText}
              </span>
            </div>
            
            {/* Time */}
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{response.time}ms</span>
            </div>
            
            {/* Size */}
            <div className="flex items-center gap-1 text-gray-500">
              <Database className="w-4 h-4" />
              <span>{response.size || 0}B</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {response.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center gap-2 text-red-700">
              <span className="font-medium">Error:</span>
              <span>{response.error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 bg-primary-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-gray-200 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'body' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Response Body</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(
                    typeof response.body === 'string' 
                      ? response.body 
                      : formatJson(response.body)
                  )}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
            </div>

            {response.body ? (
              <div className="bg-gray-50 rounded-md p-4 overflow-auto">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                  {typeof response.body === 'string' 
                    ? response.body 
                    : formatJson(response.body)
                  }
                </pre>
              </div>
            ) : (
              <div className="text-gray-500 text-sm italic">No response body</div>
            )}
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Response Headers</h4>
            
            {Object.keys(response.headers || {}).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(response.headers || {}).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-4 py-2 border-b border-gray-100 last:border-0">
                    <div className="font-medium text-gray-700 text-sm min-w-0 flex-shrink-0 capitalize">
                      {key}:
                    </div>
                    <div className="text-gray-600 text-sm break-all flex-1">
                      {value}
                    </div>
                    <button
                      onClick={() => copyToClipboard(`${key}: ${value}`)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                      title="Copy header"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm italic">No response headers</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ResponseViewer;