const http = require('http');
const fs = require('fs');
const path = require('path');

let babel;
try {
    babel = require('@babel/core');
} catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
        console.error('\n[ERROR] Core dependencies not found.');
        console.error('It seems you haven\'t installed the required packages yet.');
        console.error('Please run "npm install" in your terminal and then try again with "npm start".\n');
        process.exit(1);
    }
    throw e;
}

// Define Babel options directly in the script to avoid file system issues.
const babelOptions = {
  presets: [
    ["@babel/preset-env", {
      "modules": false // Preserve ES modules for the browser
    }],
    ["@babel/preset-react", { "runtime": "automatic" }],
    "@babel/preset-typescript"
  ]
};


const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
    let requestedUrl = '';
    try {
        requestedUrl = req.url.split('?')[0];
        if (requestedUrl === '/') {
            requestedUrl = '/index.html';
        }

        const filePath = path.join(__dirname, requestedUrl);

        // Basic security: prevent directory traversal
        if (!path.resolve(filePath).startsWith(path.resolve(__dirname))) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            return res.end('Forbidden');
        }

        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
            console.log(`[404] Not Found: ${requestedUrl}`);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('404 Not Found');
        }

        const ext = path.extname(filePath);
        const headers = {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        };

        if (ext === '.ts' || ext === '.tsx') {
            console.log(`[Babel] Transforming: ${requestedUrl}`);
            const sourceCode = fs.readFileSync(filePath, 'utf8');
            const result = await babel.transformAsync(sourceCode, {
                ...babelOptions,
                filename: filePath,
            });

            if (!result || !result.code) {
                throw new Error(`Babel transformation failed for ${filePath} and returned no code.`);
            }
            
            res.writeHead(200, { ...headers, 'Content-Type': 'text/javascript' });
            res.end(result.code);
        } else {
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            const fileContent = fs.readFileSync(filePath);
            res.writeHead(200, { ...headers, 'Content-Type': contentType });
            res.end(fileContent);
        }

    } catch (error) {
        console.error(`\n[SERVER ERROR] Failed to process request for: ${requestedUrl}`);
        console.error('This error occurred on the server, not in the browser.');
        console.error('The most likely cause is a problem during Babel transpilation.');
        console.error('Please check the error details below:\n');
        console.error(error); // Log the full error object
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${error.message}\n\nPlease check the terminal window where you ran "npm start" for more details.`);
    }
});

server.listen(PORT, () => {
     console.log(`
   ┌────────────────────────────────────────┐
   │                                        │
   │   Development server is running!       │
   │                                        │
   │   - Local:    http://localhost:${PORT}     │
   │                                        │
   │   To stop the server, press CTRL+C.    │
   │                                        │
   └────────────────────────────────────────┘
    `);
});