import React, { useState } from 'react';
import { ChevronDown, Plus, Briefcase } from 'lucide-react';
import { useAppStore } from '../hooks/useAppStore';

function WorkspaceSelector() {
  const { 
    workspaces, 
    activeWorkspace, 
    currentWorkspace,
    setActiveWorkspace, 
    createWorkspace 
  } = useAppStore();
  
  const [isOpen, setIsOpen] = useState(false);

  const handleCreateWorkspace = async () => {
    const name = prompt('Enter workspace name:');
    if (name?.trim()) {
      const description = prompt('Enter workspace description (optional):') || '';
      try {
        const newWorkspace = await createWorkspace(name.trim(), description);
        await setActiveWorkspace(newWorkspace.id);
      } catch (error) {
        console.error('Failed to create workspace:', error);
        alert('Failed to create workspace. Please try again.');
      }
    }
    setIsOpen(false);
  };

  const handleSelectWorkspace = async (workspaceId) => {
    try {
      await setActiveWorkspace(workspaceId);
    } catch (error) {
      console.error('Failed to switch workspace:', error);
      alert('Failed to switch workspace. Please try again.');
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-800 truncate">
            {currentWorkspace?.name || 'Select Workspace'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-64 overflow-auto">
          <div className="py-1">
            {workspaces.map(workspace => (
              <button
                key={workspace.id}
                onClick={() => handleSelectWorkspace(workspace.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${
                  activeWorkspace === workspace.id ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                }`}
              >
                <Briefcase className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 truncate">
                  <div className="font-medium">{workspace.name}</div>
                  {workspace.description && (
                    <div className="text-xs text-gray-500 truncate">{workspace.description}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          <div className="border-t border-gray-100">
            <button
              onClick={handleCreateWorkspace}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 text-primary-600"
            >
              <Plus className="w-4 h-4" />
              Create New Workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkspaceSelector;