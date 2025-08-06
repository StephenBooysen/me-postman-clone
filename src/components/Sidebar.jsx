import React, { useState } from 'react';
import { Plus, Folder, File, ChevronRight, ChevronDown, MoreHorizontal, Settings } from 'lucide-react';
import { useAppStore } from '../hooks/useAppStore';
import WorkspaceSelector from './WorkspaceSelector';
import CollectionTree from './CollectionTree';

function Sidebar() {
  const { 
    createFolder, 
    createRequest, 
    currentWorkspace 
  } = useAppStore();
  
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const handleCreateFolder = () => {
    const name = prompt('Enter folder name:');
    if (name?.trim()) {
      createFolder(name.trim());
    }
    setShowCreateMenu(false);
  };

  const handleCreateRequest = () => {
    const name = prompt('Enter request name:');
    if (name?.trim()) {
      createRequest(name.trim());
    }
    setShowCreateMenu(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-gray-800">Postman Clone</h1>
          <Settings className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700" />
        </div>
        
        <WorkspaceSelector />
      </div>

      {/* Collections Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700">Collections</h2>
          <div className="relative">
            <button
              onClick={() => setShowCreateMenu(!showCreateMenu)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              title="Create new item"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
            
            {showCreateMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 py-1 min-w-[150px]">
                <button
                  onClick={handleCreateFolder}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                >
                  <Folder className="w-4 h-4" />
                  New Folder
                </button>
                <button
                  onClick={handleCreateRequest}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                >
                  <File className="w-4 h-4" />
                  New Request
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collection Tree */}
      <div className="flex-1 overflow-auto">
        <CollectionTree />
      </div>

      {/* Variables Section */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Variables</h3>
        <div className="text-xs text-gray-500">
          {currentWorkspace?.variables && Object.keys(currentWorkspace.variables).length > 0 
            ? `${Object.keys(currentWorkspace.variables).length} variables defined`
            : 'No variables defined'
          }
        </div>
      </div>
    </div>
  );
}

export default Sidebar;