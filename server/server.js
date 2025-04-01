const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import routes
const franceRoutes = require("./routes/france");
const insightsRoutes = require("./routes/insights");

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
