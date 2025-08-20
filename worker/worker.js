export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({status: 'ok'}), { headers: { 'Content-Type': 'application/json' }});
    }

    if (url.pathname === '/api/nodes' && request.method === 'GET') {
      // 后端强制鉴权（若设置了 UI_PASSWORD secret）
      const uiPw = env.UI_PASSWORD;
      if (uiPw) {
        const auth = request.headers.get('Authorization') || '';
        if (!auth.startsWith('Basic ')) return new Response('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="ZeroTier Dashboard"' }});
        const b = auth.slice(6);
        try {
          const creds = atob(b);
          const password = creds.includes(':') ? creds.split(':').slice(1).join(':') : '';
          if (password !== uiPw) return new Response('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="ZeroTier Dashboard"' }});
        } catch (e) { return new Response('Unauthorized', { status: 401 }); }
      }

      const token = env.ZT_API_TOKEN || '';
      const networkId = env.ZT_NETWORK_ID || '';
      if (!token || !networkId) return new Response(JSON.stringify({ nodes: [] }), { headers: { 'Content-Type': 'application/json' }});

      try {
        const r = await fetch(`https://my.zerotier.com/api/v1/network/${networkId}/member`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!r.ok) return new Response(JSON.stringify({ nodes: [] }), { headers: { 'Content-Type': 'application/json' }, status: 502 });

        const data = await r.json();
        const nodes = (data || []).map(m => {
          const nodeId = m.nodeId || m.id || '';
          const description = m.description || m.name || '';
          const authorized = !!(m.config && m.config.authorized);
          const display = authorized ? (description || '-') : nodeId;
          const ip = Array.isArray(m.config && m.config.ipAssignments) ? (m.config.ipAssignments[0] || '') : '';
          return {
            nodeId,
            description,
            display,
            authorized,
            ip,
            remoteIp: m.physicalAddress || '',
            lastOnline: m.lastOnline || m.lastSeen || null,
            version: m.clientVersion || m.version || null
          };
        });
        return new Response(JSON.stringify({ nodes }), { headers: { 'Content-Type': 'application/json' }});
      } catch (e) {
        return new Response(JSON.stringify({ nodes: [] }), { headers: { 'Content-Type': 'application/json' }, status: 500 });
      }
    }

    return new Response('Not found', { status: 404 });
  }
}