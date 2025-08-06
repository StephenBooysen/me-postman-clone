import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, File, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { useAppStore } from '../hooks/useAppStore';
import { HTTP_METHODS } from '../types/index';

function CollectionItem({ item, depth = 0 }) {
  const { 
    collections,
    activeRequest,
    setActiveRequest,
    deleteItem,
    createFolder,
    createRequest
  } = useAppStore();
  
  const [isExpanded, setIsExpanded] = useState(!item.collapsed);
  const [showContextMenu, setShowContextMenu] = useState(false);

  const isFolder = item.type === 'folder';
  const isActive = activeRequest === item.id;
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (isFolder) {
      setIsExpanded(!isExpanded);
    } else {
      setActiveRequest(item.id);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setShowContextMenu(true);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      deleteItem(item.id);
    }
    setShowContextMenu(false);
  };

  const handleAddFolder = () => {
    const name = prompt('Enter folder name:');
    if (name?.trim()) {
      createFolder(name.trim(), item.id);
    }
    setShowContextMenu(false);
  };

  const handleAddRequest = () => {
    const name = prompt('Enter request name:');
    if (name?.trim()) {
      createRequest(name.trim(), 'GET', '', item.id);
    }
    setShowContextMenu(false);
  };

  const getMethodColor = (method) => {
    const colors = {
      GET: 'text-green-600 bg-green-100',
      POST: 'text-orange-600 bg-orange-100', 
      PUT: 'text-blue-600 bg-blue-100',
      DELETE: 'text-red-600 bg-red-100',
      PATCH: 'text-purple-600 bg-purple-100'
    };
    return colors[method] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 group ${
          isActive ? 'bg-primary-50 border-r-2 border-primary-500' : ''
        }`}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Expand/Collapse Icon */}
        {isFolder && (
          <div className="w-4 h-4 flex items-center justify-center">
            {hasChildren && (
              isExpanded ? 
                <ChevronDown className="w-3 h-3 text-gray-500" /> :
                <ChevronRight className="w-3 h-3 text-gray-500" />
            )}
          </div>
        )}
        
        {/* Icon */}
        <div className="w-4 h-4 flex items-center justify-center">
          {isFolder ? (
            <Folder className="w-4 h-4 text-gray-600" />
          ) : (
            <File className="w-4 h-4 text-gray-600" />
          )}
        </div>

        {/* Method Badge (for requests) */}
        {!isFolder && (
          <span className={`px-1.5 py-0.5 text-xs font-mono rounded ${getMethodColor(item.method)}`}>
            {item.method}
          </span>
        )}

        {/* Name */}
        <span className={`flex-1 text-sm truncate ${
          isActive ? 'text-primary-700 font-medium' : 'text-gray-800'
        }`}>
          {item.name}
        </span>

        {/* Context Menu Trigger */}
        <button
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-all"
          onClick={(e) => {
            e.stopPropagation();
            setShowContextMenu(!showContextMenu);
          }}
        >
          <MoreHorizontal className="w-3 h-3 text-gray-500" />
        </button>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div className="fixed inset-0 z-50" onClick={() => setShowContextMenu(false)}>
          <div 
            className="absolute bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 min-w-[150px]"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {isFolder && (
              <>
                <button
                  onClick={handleAddFolder}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                >
                  <Folder className="w-4 h-4" />
                  Add Folder
                </button>
                <button
                  onClick={handleAddRequest}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                >
                  <File className="w-4 h-4" />
                  Add Request
                </button>
                <hr className="my-1 border-gray-100" />
              </>
            )}
            <button
              onClick={handleDelete}
              className="w-full text-left px-3 py-2 hover:bg-red-50 flex items-center gap-2 text-sm text-red-600"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Children */}
      {isFolder && isExpanded && hasChildren && (
        <div>
          {item.children.map(child => (
            <CollectionItem key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionTree() {
  const { collections } = useAppStore();

  if (collections.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <div className="mb-2">📁</div>
        <div>No collections yet</div>
        <div className="text-xs text-gray-400 mt-1">Create a folder or request to get started</div>
      </div>
    );
  }

  return (
    <div className="py-2">
      {collections.map(item => (
        <CollectionItem key={item.id} item={item} />
      ))}
    </div>
  );
}

export default CollectionTree;