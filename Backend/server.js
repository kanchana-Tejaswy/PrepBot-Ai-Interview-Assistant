/*
#
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const interviewRoutes = require('./routes/interview');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/interview', interviewRoutes);

// Serve frontend static files
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

// Health check endpoint
app.get('/api', (req, res) => {
  res.json({ status: 'PrepBot API is running strictly and professionally.' });
});

// Fallback: SPA support; serve index.html for any non-API route
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found.' });
  }
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// For Vercel serverless, export app. For local run, listen normally.
if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
  */

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const interviewRoutes = require("./routes/interview");

const app = express();

/* ===============================
   MIDDLEWARE
================================ */

app.use(cors());
app.use(express.json());

/* ===============================
   HEALTH CHECK ROUTES
================================ */

// Root route (helps Vercel health checks)
app.get("/", (req, res) => {
  res.send("✅ PrepBot AI Backend Running Successfully");
});

// API health check
app.get("/api", (req, res) => {
  res.json({
    status: "PrepBot API is running strictly and professionally."
  });
});

/* ===============================
   API ROUTES
================================ */

app.use("/api/interview", interviewRoutes);

/* ===============================
   404 HANDLER FOR API
================================ */

app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: "API route not found"
  });
});

/* ===============================
   LOCAL DEVELOPMENT SERVER
================================ */

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running locally at http://localhost:${PORT}`);
  });
}

/* ===============================
   EXPORT FOR VERCEL SERVERLESS
================================ */

module.exports = app;
