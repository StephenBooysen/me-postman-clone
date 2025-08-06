import { useState, useEffect } from 'react';
import { appStore } from '../store/AppStore.js';

export function useAppStore() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = appStore.subscribe(() => {
      forceUpdate({});
    });

    return unsubscribe;
  }, []);

  return {
    // Workspaces
    workspaces: Array.from(appStore.workspaces.values()),
    activeWorkspace: appStore.activeWorkspace,
    currentWorkspace: appStore.getCurrentWorkspace(),
    createWorkspace: appStore.createWorkspace.bind(appStore),
    setActiveWorkspace: appStore.setActiveWorkspace.bind(appStore),

    // Collections
    collections: appStore.getCollectionTree(),
    activeRequest: appStore.activeRequest,
    currentRequest: appStore.getActiveRequest(),
    createFolder: appStore.createFolder.bind(appStore),
    createRequest: appStore.createRequest.bind(appStore),
    updateRequest: appStore.updateRequest.bind(appStore),
    deleteItem: appStore.deleteItem.bind(appStore),
    setActiveRequest: appStore.setActiveRequest.bind(appStore),

    // Variables
    setVariable: appStore.setVariable.bind(appStore),
    getVariable: appStore.getVariable.bind(appStore),
    substituteVariables: appStore.substituteVariables.bind(appStore),

    // Utility
    exportData: appStore.exportData.bind(appStore),
    importData: appStore.importData.bind(appStore),
  };
}