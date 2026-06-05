const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
  process.exit(1);
}

const configFilePath = path.join(__dirname, '..', 'public', 'config.js');
const fileContent = `window.SUPABASE_CONFIG = {
  url: ${JSON.stringify(SUPABASE_URL)},
  key: ${JSON.stringify(SUPABASE_KEY)}
};\n`;

fs.writeFileSync(configFilePath, fileContent, 'utf8');
console.log(`Generated ${configFilePath}`);
