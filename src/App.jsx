import React from 'react';
import Sidebar from './components/Sidebar';
import RequestEditor from './components/RequestEditor';
import { useAppStore } from './hooks/useAppStore';

function App() {
  const { currentRequest } = useAppStore();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentRequest ? (
          <RequestEditor />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">🚀</div>
              <h2 className="text-2xl font-semibold mb-2">Welcome to Postman Clone</h2>
              <p className="text-gray-400">Select or create a request to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;