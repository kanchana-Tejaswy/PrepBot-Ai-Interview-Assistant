require('dotenv').config();
const express = require('express');
const cors = require('cors');
const interviewRoutes = require('./routes/interview');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/interview', interviewRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.send('PrepBot API is running strictly and professionally.');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});