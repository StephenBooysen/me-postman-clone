# Postman Clone

A modern, web-based API testing application built with React and Vite. This project is a feature-rich clone of Postman that allows you to test and interact with APIs through an intuitive interface.

## Features

- **Request Editor**: Create and configure HTTP requests with support for different methods (GET, POST, PUT, DELETE, etc.)
- **Workspace Management**: Organize your API requests into workspaces and collections
- **Response Viewer**: View and analyze API responses with syntax highlighting
- **Request Tabs**: Manage multiple requests simultaneously with a tabbed interface
- **Collection Tree**: Hierarchical organization of API requests for better project management
- **Modern UI**: Clean, responsive interface built with Tailwind CSS and Lucide React icons

## Tech Stack

- **Frontend**: React 18 with functional components and hooks
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS for utility-first styling
- **HTTP Client**: Axios for making API requests
- **Icons**: Lucide React for consistent iconography
- **Routing**: React Router DOM for navigation
- **State Management**: Custom Zustand-based store

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/StephenBooysen/experiment-postman-clone.git
   cd experiment-postman-clone
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3101`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the project for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check for code quality issues

## Project Structure

```
src/
├── components/          # React components
│   ├── Sidebar.jsx     # Main sidebar with workspace selector
│   ├── RequestEditor.jsx # Request configuration interface
│   ├── ResponseViewer.jsx # API response display
│   ├── RequestTabs.jsx # Tab management for requests
│   ├── CollectionTree.jsx # Hierarchical request organization
│   └── WorkspaceSelector.jsx # Workspace switching
├── hooks/              # Custom React hooks
├── store/              # State management
├── types/              # Type definitions
├── App.jsx            # Main application component
└── main.jsx           # Application entry point
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.
