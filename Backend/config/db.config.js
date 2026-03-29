const { createClient } = require('@supabase/supabase-js');
const config = require('./env.config');

// Initialize Supabase Client
let supabase = null;

if (config.SUPABASE_URL && config.SUPABASE_KEY) {
    try {
        supabase = createClient(config.SUPABASE_URL, config.SUPABASE_KEY);
        console.log('[DBConfig] Supabase client initialized.');
    } catch (err) {
        console.error('[DBConfig] Failed to initialize Supabase client:', err.message);
    }
} else {
    console.info('[DBConfig] Supabase not configured. Database features will run in mock/local mode.');
}

module.exports = supabase;
