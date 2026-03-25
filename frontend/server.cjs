const express = require('express');
const path = require('path');
const compression = require('compression');
const fs = require('fs');

const app = express();

// Load .env if it exists in current folder
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const PORT = process.env.VITE_PORT || process.env.PORT || 4011;
const API_URL = process.env.VITE_API_BASE_URL || '';

app.use(compression());

// Serve static files from the current directory, EXCEPT index.html
app.use(express.static(__dirname, { index: false }));

// Custom handler for index.html to inject config
app.use((req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    let content = fs.readFileSync(indexPath, 'utf8');
    
    // Inject runtime config
    const configScript = `
      <script>
        window._CONFIG_ = {
          VITE_API_BASE_URL: "${API_URL}"
        };
      </script>
    `;
    
    // Insert before </head>
    content = content.replace('</head>', `${configScript}</head>`);
    
    res.send(content);
  } else {
    res.status(404).send('Frontend not built');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server running on port ${PORT}`);
  console.log(`Injecting API URL: ${API_URL}`);
});
