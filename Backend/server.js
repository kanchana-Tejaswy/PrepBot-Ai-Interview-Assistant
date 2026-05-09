const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

// Load environment variables via our custom config
const config = require('./config/env.config');
const express = require('express');
const cors = require('cors');

// Import routes
const interviewRoutes = require('./routes/interview.routes');

// Initialize express app
const app = express();

// Enable CORS
app.use(cors());

// Enable JSON middleware to parse incoming request bodies
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: "server running" });
});

// Configure base path for interview routes
app.use('/api/interview', interviewRoutes);

// Redirect any other request to the frontend index page
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
    console.error('[GlobalErrorHandler]', err.stack || err.message || err);
    res.status(err.status || 500).json({
        error: "Internal Server Error",
        message: err.message || 'Something went wrong'
    });
});

// Start the server (Local development only)
if (process.env.NODE_ENV !== 'production') {
    const PORT = config.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export for Vercel
module.exports = app;
