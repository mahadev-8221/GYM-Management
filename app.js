require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Debug logs
console.log("URL VALUE:", SUPABASE_URL);
console.log("KEY VALUE:", SUPABASE_KEY);

// Check if variables exist
if (!SUPABASE_URL) {
  console.log("SUPABASE_URL is missing");
  process.exit(1);
}

if (!SUPABASE_KEY) {
  console.log("SUPABASE_KEY is missing");
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Home route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health API route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend running successfully'
  });
});

// Example Supabase test route
app.get('/api/test-supabase', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('test')
      .select('*');

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});