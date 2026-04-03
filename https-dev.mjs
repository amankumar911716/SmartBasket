#!/usr/bin/env bun
// HTTPS Development Server for SmartBasket
// Run this in VS Code: bun run https-dev.mjs
// This starts Next.js with HTTPS so microphone/voice search works on network IP

import { createServer } from 'node:https';
import { readFileSync } from 'node:fs';
import { parse } from 'node:url';
import { createServer as createHttpServer } from 'node:http';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// SSL certificate (self-signed, generated for localhost + IP)
const httpsOptions = {
  key: readFileSync(new URL('./localhost-key.pem', import.meta.url)),
  cert: readFileSync(new URL('./localhost-cert.pem', import.meta.url)),
};

app.prepare().then(() => {
  // HTTPS server (for microphone / voice search support)
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, hostname, () => {
    console.log('');
    console.log('  🔒 SmartBasket HTTPS Dev Server');
    console.log('  ─────────────────────────────────');
    console.log(`  Local:   https://localhost:${port}`);
    console.log(`  Network: https://0.0.0.0:${port}`);
    console.log('');
    console.log('  ✅ Microphone / Voice Search: ENABLED');
    console.log('  ⚠️  Browser may show "Not Secure" — click "Advanced" → "Proceed"');
    console.log('     (Self-signed cert, safe for development)');
    console.log('');
  });
});
