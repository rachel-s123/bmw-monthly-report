# BMW Marketing Dashboard: Vite Migration Quick Start

This guide provides the immediate steps to start migrating the BMW Marketing Dashboard to a Vite-based architecture.

## Initial Setup (Day 1)

### 1. Create Project Structure

```bash
# Create the basic directory structure
mkdir -p client/src/{components,pages,services,styles,assets}
mkdir -p server/{routes,services}
```

### 2. Initialize Vite Frontend

```bash
# Initialize a new Vite project with React
npm create vite@latest client -- --template react

# Install dependencies
cd client
npm install
npm install axios chart.js react-chartjs-2 @mantine/core @mantine/hooks

# Return to project root
cd ..
```

### 3. Set Up Express Backend

```bash
# Initialize backend
cd server
npm init -y

# Install dependencies
npm install express cors dotenv helmet csv-parser openai
npm install --save-dev nodemon

# Return to project root
cd ..
```

### 4. Configure Backend Server

Create `server/server.js`:

```javascript
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes will be added here
// app.use('/api/data', require('./routes/data'));
// app.use('/api/insights', require('./routes/insights'));

// Serve static files from the React app in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  });
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### 5. Configure Vite for Development

Update `client/vite.config.js`:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
```

### 6. Move Existing OpenAI Service

Copy your refactored OpenAI service to the new structure:

```bash
cp services/openai.js server/services/
```

### 7. Update Package Scripts

Update `package.json` in the root folder:

```json
{
  "name": "bmw-marketing-dashboard",
  "version": "1.0.0",
  "description": "BMW Marketing Dashboard",
  "scripts": {
    "start": "node server/server.js",
    "server": "nodemon server/server.js",
    "client": "cd client && npm run dev",
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "build": "cd client && npm run build",
    "install-deps": "npm install && cd client && npm install && cd ../server && npm install"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "nodemon": "^3.0.3"
  }
}
```

## First Component Migration (Day 2)

### 1. Create Dashboard Layout

Create `client/src/components/DashboardLayout.jsx`:

```jsx
import { useState } from "react";
import "../styles/dashboard.css";

export default function DashboardLayout({ children }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="dashboard">
      <header className="header">
        <h1>BMW Marketing Dashboard</h1>
      </header>

      <nav className="tab-container">
        <button
          className={`tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === "markets" ? "active" : ""}`}
          onClick={() => setActiveTab("markets")}
        >
          Markets
        </button>
        <button
          className={`tab ${activeTab === "models" ? "active" : ""}`}
          onClick={() => setActiveTab("models")}
        >
          Models
        </button>
        <button
          className={`tab ${activeTab === "campaigns" ? "active" : ""}`}
          onClick={() => setActiveTab("campaigns")}
        >
          Campaigns
        </button>
        <button
          className={`tab ${activeTab === "insights" ? "active" : ""}`}
          onClick={() => setActiveTab("insights")}
        >
          Insights
        </button>
      </nav>

      <main className="content">{children}</main>
    </div>
  );
}
```

### 2. Create API Service

Create `client/src/services/api.js`:

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const fetchDashboardData = async () => {
  try {
    const response = await api.get("/data");
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
};

export const refreshInsights = async () => {
  try {
    const response = await api.get("/refresh-insights");
    return response.data;
  } catch (error) {
    console.error("Error refreshing insights:", error);
    throw error;
  }
};
```

### 3. Create Main App Component

Update `client/src/App.jsx`:

```jsx
import { useState, useEffect } from "react";
import DashboardLayout from "./components/DashboardLayout";
import { fetchDashboardData } from "./services/api";
import "./App.css";

function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchDashboardData();
        setDashboardData(data.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load dashboard data. Please try again later.");
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div className="loading">Loading dashboard data...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <DashboardLayout>
      {dashboardData ? (
        <div className="dashboard-content">
          <h2>Dashboard Data Loaded Successfully!</h2>
          <p>Ready to display dashboard components.</p>
        </div>
      ) : (
        <div className="no-data">No data available</div>
      )}
    </DashboardLayout>
  );
}

export default App;
```

## Next Steps

After completing the initial setup:

1. **Migrate API Endpoints**: Move your Express routes to the new structure
2. **Implement Individual Components**: Create React components for each section of the dashboard
3. **Add State Management**: Consider using React Context or Redux for more complex state
4. **Style the Dashboard**: Create CSS modules or styled components for your UI

Refer to the main migration plan document for the complete roadmap.
