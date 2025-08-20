// Minimal Node.js Express server to run the same API locally or in Docker
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const { getNodes } = require(path.join(__dirname, 'lib', 'shared_nodes'));
const app = express();
app.use(express.json());

// Basic auth for web UI if UI_PASSWORD is set (username ignored, password matched)
app.use((req, res, next) => {
  try {
    const pw = process.env.UI_PASSWORD;
    if (!pw) return next();
    // allow health check without auth
    if (req.path === '/health') return next();
    const auth = req.headers.authorization;
    if (!auth) {
      res.set('WWW-Authenticate', 'Basic realm="ZeroTier Dashboard"');
      return res.status(401).send('Authorization required');
    }
    const parts = auth.split(' ');
    if (parts[0] !== 'Basic' || !parts[1]) {
      res.set('WWW-Authenticate', 'Basic realm="ZeroTier Dashboard"');
      return res.status(401).send('Invalid auth');
    }
    const creds = Buffer.from(parts[1], 'base64').toString();
    const idx = creds.indexOf(':');
    const password = idx >= 0 ? creds.slice(idx+1) : '';
    if (password !== pw) {
      res.set('WWW-Authenticate', 'Basic realm="ZeroTier Dashboard"');
      return res.status(401).send('Invalid credentials');
    }
    return next();
  } catch (e) { return next(); }
});

// minimal server: only /api/nodes and static UI

app.get('/api/nodes', async (req, res) => {
  const token = process.env.ZT_API_TOKEN;
  const networkId = process.env.ZT_NETWORK_ID;
  const nodes = await getNodes(fetch, token, networkId);
  // sort by display then ip for deterministic order
  nodes.sort((a,b)=> (''+(a.display||'')).localeCompare(''+(b.display||'')) || (''+(a.ip||'')).localeCompare(''+(b.ip||'')));
  res.json({nodes});
});
// /api/geo and /api/pull removed per request

// Serve static demo UI from worker/static
app.use('/', express.static(path.join(__dirname, 'static')));

const port = process.env.PORT || 3000;
const bindAddr = process.env.BIND_ADDRESS || '0.0.0.0';
app.listen(port, bindAddr, () => console.log('Server running on', port, 'bind', bindAddr));
