import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

async function readRequestBody(req) {
    if (req.body !== undefined && req.body !== null) {
        if (typeof req.body === 'string') return req.body;
        if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
        return JSON.stringify(req.body);
    }

    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, corsHeaders);
        return res.end();
    }

    if (req.method !== 'POST') {
        res.writeHead(405, { ...corsHeaders, 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Method not allowed' }));
    }

    try {
        const body = await readRequestBody(req);
        const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Server proxy error: missing API key' }));
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const apiRes = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body
        });

        const data = await apiRes.text();
        res.writeHead(apiRes.status, { ...corsHeaders, 'Content-Type': 'application/json' });
        return res.end(data);
    } catch (err) {
        res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Server proxy error' }));
    }
}
