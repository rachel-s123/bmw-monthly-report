const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const fs = require("fs");

// Load environment variables
dotenv.config();

// Import routes
const franceRoutes = require("./routes/france");
const insightsRoutes = require("./routes/insights");

// Check if Portugal routes exist before importing
let portugalRoutes;
const portugalRoutePath = path.join(__dirname, "./routes/portugal.js");
const hasPortugalRoutes = fs.existsSync(portugalRoutePath);
if (hasPortugalRoutes) {
  try {
    portugalRoutes = require("./routes/portugal");
    console.log("Portugal routes loaded successfully");
  } catch (error) {
    console.warn("Error loading Portugal routes:", error.message);
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
app.use("/api/france", franceRoutes);
app.use("/api/insights", insightsRoutes);

// Only add Portugal routes if they exist
if (hasPortugalRoutes && portugalRoutes) {
  app.use("/api/portugal", portugalRoutes);
}

// Future route imports will go here
// const germanyRoutes = require('./routes/germany');
// app.use('/api/germany', germanyRoutes);

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
