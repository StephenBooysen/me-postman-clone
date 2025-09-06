# Workspaces Directory Structure

This directory contains your Postman Clone workspaces. Each workspace is stored in its own folder with the following structure:

## Workspace Structure

```
workspaces/
├── default/                    # Default workspace
│   ├── workspace.json         # Workspace configuration
│   ├── folder1/               # Collection folder
│   │   ├── request1.json      # HTTP request
│   │   └── request2.json      # HTTP request
│   └── request3.json          # Root-level request
├── my-api/                    # Custom workspace
│   ├── workspace.json         # Workspace configuration
│   ├── users/                 # Users API folder
│   │   ├── get-users.json     # GET all users request
│   │   ├── create-user.json   # POST create user request
│   │   └── update-user.json   # PUT update user request
│   └── posts/                 # Posts API folder
│       ├── get-posts.json     # GET all posts request
│       └── create-post.json   # POST create post request
└── README.md                  # This file
```

## Workspace Configuration (workspace.json)

Each workspace must have a `workspace.json` file in its root directory:

```json
{
  "id": "workspace-id",
  "name": "Workspace Display Name",
  "description": "Workspace description",
  "variables": {
    "base_url": "https://api.example.com",
    "api_key": "your-api-key-here"
  },
  "createdAt": "2025-09-06T12:00:00.000Z",
  "updatedAt": "2025-09-06T12:00:00.000Z"
}
```

## Request File Format (*.json)

HTTP requests are stored as JSON files:

```json
{
  "id": "unique-request-id",
  "name": "Request Display Name",
  "method": "GET",
  "url": "{{base_url}}/users",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{api_key}}"
  },
  "body": "",
  "params": {},
  "createdAt": "2025-09-06T12:00:00.000Z",
  "updatedAt": "2025-09-06T12:00:00.000Z"
}
```

## Creating Workspaces and Collections

### Via UI
1. **Create Workspace**: Click the workspace dropdown and select "Create New Workspace"
2. **Create Folder**: Use the "+" button in the Collections section or right-click on a folder
3. **Create Request**: Use the "+" button or right-click context menu

### Via File System
1. **Create Workspace**: Create a new folder in `workspaces/` with a `workspace.json` file
2. **Create Folder**: Create a subdirectory within the workspace folder
3. **Create Request**: Create a `.json` file with the request configuration

## Variables

Variables can be defined in the workspace configuration and used in requests using the `{{variable_name}}` syntax.

## Notes

- The application automatically detects changes to the file system structure
- All workspaces, folders, and requests created via the UI are automatically persisted to the file system
- The `default` workspace is created automatically if it doesn't exist
- Workspace IDs should be unique and filesystem-safe (no special characters)
- Request files should have the `.json` extension
- Folder names become part of the collection hierarchy

## Example Workspaces

This directory includes example workspaces to demonstrate the structure:

- **default**: Basic default workspace
- **example-api**: Example API workspace with users and posts collections