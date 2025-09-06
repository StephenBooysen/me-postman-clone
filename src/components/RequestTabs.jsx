import React, { useState } from 'react';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { createHeader, createParam } from '../types/index';

function KeyValueEditor({ items, onChange, placeholder = { key: 'Key', value: 'Value' } }) {
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleToggleEnabled = (index) => {
    const updated = [...items];
    updated[index] = { ...updated[index], enabled: !updated[index].enabled };
    onChange(updated);
  };

  const handleAddItem = () => {
    const newItem = placeholder.key === 'Key' ? createHeader() : createParam();
    onChange([...items, newItem]);
  };

  const handleRemoveItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <button
            onClick={() => handleToggleEnabled(index)}
            className={`p-1 rounded ${item.enabled ? 'text-green-600' : 'text-gray-400'}`}
            title={item.enabled ? 'Enabled' : 'Disabled'}
          >
            {item.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          
          <input
            type="text"
            value={item.key}
            onChange={(e) => handleItemChange(index, 'key', e.target.value)}
            placeholder={placeholder.key}
            className={`flex-1 px-3 py-2 border rounded-md text-sm ${
              item.enabled ? 'border-gray-300' : 'border-gray-200 text-gray-400'
            }`}
            disabled={!item.enabled}
          />
          
          <input
            type="text"
            value={item.value}
            onChange={(e) => handleItemChange(index, 'value', e.target.value)}
            placeholder={placeholder.value}
            className={`flex-1 px-3 py-2 border rounded-md text-sm ${
              item.enabled ? 'border-gray-300' : 'border-gray-200 text-gray-400'
            }`}
            disabled={!item.enabled}
          />
          
          <button
            onClick={() => handleRemoveItem(index)}
            className="p-1 text-gray-400 hover:text-red-500 rounded"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      
      <button
        onClick={handleAddItem}
        className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add {placeholder.key}
      </button>
    </div>
  );
}

function RequestTabs({ request, onUpdate }) {
  const [activeTab, setActiveTab] = useState('params');

  // Convert object to array format for KeyValueEditor
  const objectToArray = (obj) => {
    if (Array.isArray(obj)) return obj;
    return Object.entries(obj || {}).map(([key, value]) => ({
      key,
      value,
      enabled: true
    }));
  };

  // Convert array format back to object
  const arrayToObject = (arr) => {
    if (!Array.isArray(arr)) return arr;
    const obj = {};
    arr.filter(item => item.enabled && item.key).forEach(item => {
      obj[item.key] = item.value || '';
    });
    return obj;
  };

  const paramsArray = objectToArray(request.params);
  const headersArray = objectToArray(request.headers);
  
  // Ensure body is in the expected format
  const requestBody = typeof request.body === 'string' 
    ? { type: request.body ? 'raw' : 'none', content: request.body || '' }
    : request.body || { type: 'none', content: '' };

  const tabs = [
    { id: 'params', label: 'Params', count: paramsArray.length },
    { id: 'headers', label: 'Headers', count: headersArray.length },
    { id: 'body', label: 'Body', show: ['POST', 'PUT', 'PATCH'].includes(request.method) },
    { id: 'variables', label: 'Variables' }
  ];

  const handleUpdateParams = (paramsArray) => {
    const params = arrayToObject(paramsArray);
    onUpdate({ params });
  };

  const handleUpdateHeaders = (headersArray) => {
    const headers = arrayToObject(headersArray);
    onUpdate({ headers });
  };

  const handleUpdateBody = (updates) => {
    onUpdate({ body: { ...requestBody, ...updates } });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab Headers */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-0">
          {tabs
            .filter(tab => tab.show !== false)
            .map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 bg-primary-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4 overflow-auto">
        {activeTab === 'params' && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Query Parameters</h3>
            <KeyValueEditor
              items={paramsArray}
              onChange={handleUpdateParams}
              placeholder={{ key: 'Parameter', value: 'Value' }}
            />
          </div>
        )}

        {activeTab === 'headers' && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Headers</h3>
            <KeyValueEditor
              items={headersArray}
              onChange={handleUpdateHeaders}
              placeholder={{ key: 'Header', value: 'Value' }}
            />
          </div>
        )}

        {activeTab === 'body' && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Request Body</h3>
            
            {/* Body Type Selector */}
            <div className="mb-4">
              <div className="flex gap-2">
                {['none', 'json', 'raw'].map(type => (
                  <button
                    key={type}
                    onClick={() => handleUpdateBody({ type })}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      requestBody.type === type
                        ? 'bg-primary-100 text-primary-700 border border-primary-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {type === 'none' ? 'None' : type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Body Content */}
            {requestBody.type !== 'none' && (
              <textarea
                value={requestBody.content || ''}
                onChange={(e) => handleUpdateBody({ content: e.target.value })}
                placeholder={
                  requestBody.type === 'json'
                    ? '{\n  "key": "value"\n}'
                    : 'Enter request body...'
                }
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            )}
          </div>
        )}

        {activeTab === 'variables' && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Variables</h3>
            <div className="text-sm text-gray-500">
              <p className="mb-2">Use variables in your requests with the syntax: <code className="bg-gray-100 px-1 rounded">{'{{variable_name}}'}</code></p>
              <p className="mb-4">Variables are managed at the workspace level. Go to workspace settings to add or edit variables.</p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <h4 className="font-medium text-yellow-800 mb-2">Available Variables:</h4>
                <div className="text-yellow-700">
                  <p>No variables defined in current workspace</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RequestTabs;