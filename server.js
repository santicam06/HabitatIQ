import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

const PORT = 3000;
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript',
    '.css': 'text/css'
};

http.createServer(async (req, res) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (req.method === 'OPTIONS') {
        res.writeHead(204, corsHeaders);
        return res.end();
    }

    // Proxy chat endpoint (keeps API key strictly on the server)
    if (req.method === 'POST' && req.url === '/api/chat') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                dotenv.config({ path: path.resolve(__dirname, ".env"), override: true });
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

                // Call LLM with user content
                const apiRes = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body
                });

                // Collect LLM response and send back to chat
                const data = await apiRes.text();
                res.writeHead(apiRes.status, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(data);

            } catch (err) {
                res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Server proxy error' }));
            }
        });
        return;
    }

    // Redirect to main page or strip off queries in URL
    const reqPath = req.url === '/' ? '/habitatIQ.html' : req.url.split('?')[0];

    // (Hidden/Dotfile Protection): Checks if the file name starts with a dot (such as .env, .git, etc...)
    if (reqPath.includes('..') || path.basename(reqPath).startsWith('.')) {
        res.writeHead(403);
        return res.end('Forbidden');
    }

    // Load website's HTML content
    const filePath = path.join(__dirname, reqPath);
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            return res.end('Not found');
        }
        const ext = path.extname(filePath).toLowerCase();


        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(content);
    });
}).listen(PORT, () => {
    console.log(`HabitatIQ running at http://localhost:${PORT}`);
});
