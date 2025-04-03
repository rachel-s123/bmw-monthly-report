const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const fs = require("fs");

// Load environment variables
dotenv.config();

// Import routes
const marketDataRoutes = require("./routes/market-data");
const frRoutes = require("./routes/fr");
const insightsRoutes = require("./routes/insights");

// Check if PT routes exist before importing
let ptRoutes;
const ptRoutePath = path.join(__dirname, "./routes/pt.js");
const hasPTRoutes = fs.existsSync(ptRoutePath);
if (hasPTRoutes) {
  try {
    ptRoutes = require("./routes/pt");
    console.log("PT routes loaded successfully");
  } catch (error) {
    console.warn("Error loading PT routes:", error.message);
  }
}

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy" });
});

// Use route handlers
app.use("/api/market-data", marketDataRoutes);
app.use("/api/fr", frRoutes);
app.use("/api/insights", insightsRoutes);

// Only add PT routes if they exist
if (hasPTRoutes && ptRoutes) {
  app.use("/api/pt", ptRoutes);
}

// Future route imports will go here
// const deRoutes = require('./routes/de');
// app.use('/api/de', deRoutes);

// Serve static assets if in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static(path.join(__dirname, "../client/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/dist", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
