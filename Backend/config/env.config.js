const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Define expected keys and their default/fallback values (if any)
const config = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  SUPABASE_URL: process.env.SUPABASE_URL || "",
  SUPABASE_KEY: process.env.SUPABASE_KEY || "",
  PORT: process.env.PORT || 5000,
};

// Only GEMINI_API_KEY is required for core AI interview functionality.
const requiredKeys = ['GEMINI_API_KEY'];

requiredKeys.forEach((key) => {
  if (!config[key]) {
    console.warn(`[WARN] Config value for ${key} is empty or missing!`);
  }
});

module.exports = config;
