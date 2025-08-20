;(function(){
  'use strict';
  async function getNodes(fetchFn, token, networkId){
    if (!token || !networkId) return [];
    try {
      const res = await fetchFn(`https://my.zerotier.com/api/v1/network/${networkId}/member`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res || !res.ok) return [];
      const members = await res.json();
      return (members || []).map(m => {
        const nodeId = m.nodeId || m.id || '';
        const description = m.description || m.name || '';
        const authorized = !!(m.config && m.config.authorized);
        const display = authorized ? (description || '-') : nodeId;
        const ip = Array.isArray(m.config && m.config.ipAssignments) ? (m.config.ipAssignments[0] || '') : ((m.ipAssignments && m.ipAssignments[0]) || '');
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
    } catch (e) {
      return [];
    }
  }

  // CommonJS export for Node
  if (typeof module !== 'undefined' && module.exports) module.exports = { getNodes };
  // Attach to globalThis for Worker usage when the file is loaded in Worker runtime
  if (typeof globalThis !== 'undefined') globalThis.sharedGetNodes = getNodes;
})();
