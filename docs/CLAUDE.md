# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern React-based Postman clone application built with Vite. It provides a complete API testing interface with workspaces, collections, request configuration, and response viewing capabilities.

## Development Commands

- `npm run dev` - Start development server (runs on port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint to check code quality

## Project Structure

```
src/
├── components/          # React components
│   ├── Sidebar.jsx     # Left navigation with collections
│   ├── WorkspaceSelector.jsx
│   ├── CollectionTree.jsx
│   ├── RequestEditor.jsx    # Main request configuration
│   ├── RequestTabs.jsx     # Params, headers, body tabs
│   └── ResponseViewer.jsx  # Response display
├── hooks/              # Custom React hooks
│   └── useAppStore.js  # Main state management hook
├── store/              # Application state
│   └── AppStore.js     # Singleton store with workspaces/collections
├── types/              # Data structures and utilities
│   └── index.js        # Request, folder, workspace types
├── utils/              # Utility functions
└── main.jsx           # React entry point
```

## Architecture Notes

1. **State Management**: Uses a custom singleton store (`AppStore`) with React hooks for state management
2. **Data Structure**: Hierarchical collections with folders and requests, organized by workspaces
3. **Variable Substitution**: Support for `{{variable_name}}` syntax in URLs, headers, and body
4. **Request Types**: Full support for GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
5. **Response Handling**: JSON and text response parsing with headers display

## Key Features

- **Workspaces**: Organize collections and variables by workspace
- **Collections**: Hierarchical folder/request structure with drag-drop support
- **Request Configuration**: Headers, query parameters, request body (JSON/raw)
- **Variable System**: Workspace-level variables with `{{}}` substitution
- **Response Viewer**: Status, timing, headers, and formatted body display
- **Real HTTP Requests**: Uses fetch API for actual HTTP requests

## Development Guidelines

- Components follow React functional component patterns with hooks
- State updates trigger re-renders through the custom store subscription system
- All HTTP methods are supported with appropriate UI considerations
- Variable substitution happens at request time, not storage time
- Collections are stored as a flat map but rendered as trees for performance