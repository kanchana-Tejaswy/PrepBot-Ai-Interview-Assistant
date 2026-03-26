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
