# BMW Marketing Dashboard Refactor Plan: Migrating to Vite

## Overview

This document outlines the step-by-step plan to migrate the BMW Marketing Dashboard from its current implementation (Express serving a monolithic HTML string) to a modern architecture using Vite as the frontend build tool and development server.

## Benefits of Migration

- **Hot Module Replacement (HMR)**: Changes appear instantly without full-page reloads
- **Faster development**: No server restarts required for UI changes
- **Modern architecture**: Separation of frontend and backend concerns
- **Better maintainability**: Componentized design instead of monolithic HTML strings
- **TypeScript support**: Improved type safety and developer experience
- **Better asset handling**: Built-in optimization for styles, images, and other assets

## Current Architecture

```
dashboardServer.js (Express)
 ├── All HTML markup as string literals
 ├── JavaScript embedded in the HTML markup
 ├── CSS embedded in the HTML markup
 ├── API endpoints for data fetching
 └── Static assets (if any)
```

## Target Architecture

```
project/
 ├── client/                   # Vite frontend application
 │   ├── src/
 │   │   ├── components/       # Reusable UI components
 │   │   │   ├── Dashboard.jsx
 │   │   │   ├── MarketTabs.jsx
 │   │   │   └── ...
 │   │   ├── pages/            # Page components
 │   │   ├── assets/           # Static assets
 │   │   ├── styles/           # CSS/SCSS files
 │   │   ├── services/         # API service modules
 │   │   ├── App.jsx           # Main application component
 │   │   └── main.jsx          # Entry point
 │   ├── index.html            # HTML template
 │   └── vite.config.js        # Vite configuration
 │
 ├── server/                   # Express backend application
 │   ├── routes/               # API route handlers
 │   │   ├── data.js           # Data API endpoints
 │   │   └── insights.js       # OpenAI insights endpoints
 │   ├── services/             # Business logic
 │   │   ├── openai.js         # OpenAI service
 │   │   └── dataAnalysis.js   # Data analysis service
 │   └── server.js             # Express server setup
 │
 ├── scripts/                  # Utility scripts
 │   └── analyzeMarketData.js  # Data analysis scripts
 │
 └── data/                     # Data directory
     └── ...                   # CSV files and other data
```

## Migration Steps

### Phase 1: Project Setup and Scaffolding (2-3 days)

1. **Initialize Vite Frontend Project**

   ```bash
   npm create vite@latest client -- --template react
   cd client
   npm install
   ```

2. **Set Up Express Backend**

   ```bash
   mkdir -p server/routes server/services
   npm init -y
   npm install express cors dotenv helmet
   ```

3. **Configure Backend/Frontend Integration**
   - Set up proxy in Vite config for API requests during development
   - Configure CORS on the Express server

### Phase 2: Component Migration (3-4 days)

1. **Create Base UI Components**

   - Navigation/Tabs component
   - Dashboard layout
   - Card component for metrics and insights
   - Data table component

2. **Implement Dashboard Pages**

   - Overview page
   - Markets page with tabs for different markets
   - Models page
   - Campaigns page
   - Insights page

3. **Convert Existing JavaScript Logic**
   - Extract data processing functions
   - Create API service modules

### Phase 3: API and Backend Refactoring (2-3 days)

1. **Refactor API Endpoints**

   - Move `/api/data` endpoint to dedicated route handler
   - Move `/api/refresh-insights` endpoint to dedicated route handler

2. **Improve OpenAI Integration**

   - Optimize OpenAI service with proper error handling
   - Add caching for OpenAI responses to reduce API costs

3. **Enhance Data Processing**
   - Move data parsing and analysis to server-side
   - Optimize CSV data handling

### Phase 4: Testing and Optimization (2-3 days)

1. **Implement Testing**

   - Add basic component testing
   - Add API endpoint testing

2. **Optimize Performance**

   - Add loading states
   - Implement data caching
   - Add proper error handling

3. **Improve UX**
   - Add animations and transitions
   - Improve mobile responsiveness

### Phase 5: Deployment Setup (1-2 days)

1. **Configure Build Process**

   - Set up production build configuration
   - Configure static asset handling

2. **Prepare Deployment**
   - Configure server to serve the static frontend
   - Set up environment variables

## Implementation Details

### 1. Frontend (Vite + React)

**Dependencies to Install:**

```bash
npm install axios chart.js react-chartjs-2 react-table @mantine/core @mantine/hooks
```

**Key Components:**

- `<Dashboard />`: Main layout component
- `<MetricsCard />`: For displaying KPIs
- `<DataTable />`: For displaying tabular data
- `<MarketTabs />`: For market tab navigation
- `<InsightCard />`: For AI-generated insights

**API Services:**

- `api.js`: Central service for API calls
- `dataService.js`: Functions for processing dashboard data
- `insightsService.js`: Functions for handling OpenAI insights

### 2. Backend (Express)

**Dependencies:**

```bash
npm install express cors dotenv helmet csv-parser openai
```

**Key Modules:**

- `dataRoutes.js`: Endpoints for CSV data processing
- `insightsRoutes.js`: Endpoints for OpenAI integration
- `openaiService.js`: Refactored OpenAI integration

### 3. Data Analysis

- Move the current CSV parsing to server-side
- Implement caching for parsed data
- Create precomputed summaries for dashboard

## Migration Challenges

1. **State Management**: Current code uses direct DOM manipulation; refactor to React state
2. **Styling Migration**: Convert inline styles to component-based CSS
3. **Authentication**: Add proper authentication if needed
4. **OpenAI API Errors**: Fix ongoing issues with OpenAI API parameters

## Timeline

- **Total Estimated Time**: 10-15 days
- **Phase 1**: 2-3 days
- **Phase 2**: 3-4 days
- **Phase 3**: 2-3 days
- **Phase 4**: 2-3 days
- **Phase 5**: 1-2 days

## Getting Started

To begin the migration:

1. Create the project structure as outlined above
2. Install Vite and set up the initial React project
3. Move existing server code to the new structure
4. Begin implementing core components
5. Implement API services

This incremental approach allows for parallel development of frontend and backend, with the ability to test changes as they're implemented.
