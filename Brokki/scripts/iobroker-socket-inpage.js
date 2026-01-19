#!/usr/bin/env node
import puppeteer from 'puppeteer';

const base = (process.env.IOBROKER_URL || 'http://192.168.1.235:8081').replace(/\/$/, '');
const user = process.env.IOBROKER_USER || '';
const pass = process.env.IOBROKER_PASS || '';

function log(...args) { console.error(...args); }

async function main() {
  log('Launching headless browser...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => {
    // forward page logs for debugging
    try { log('page:', msg.text()); } catch {};
  });

  log('Navigating to', base);
  await page.goto(base, { waitUntil: 'networkidle2', timeout: 20000 }).catch(e => log('goto error', e.message));

  log('Waiting for socket.io script to be present (timeout 8s)');
  await page.waitForTimeout(500);

  const name = process.env.SOCKET_NAME || 'iobroker-client';
  const uuid = process.env.SOCKET_UUID || String(Math.random()).slice(2, 12);
  const timeoutMs = parseInt(process.env.SOCKET_TIMEOUT || '15000', 10);

  const res = await page.evaluate(async (user, pass, name, uuid, timeoutMs) => {
    const candidates = { io: window.io, socket: window.socket, socketio: window.socketio };
    const present = Object.keys(candidates).filter(k => typeof candidates[k] !== 'undefined');
    if (present.length === 0) return { error: 'socket.io symbols not found', present: [] };

    const info = { present };

    function findCallable(obj) {
      if (!obj) return null;
      if (typeof obj === 'function') return obj;
      if (obj && typeof obj.default === 'function') return obj.default;
      if (obj && typeof obj.connect === 'function') return obj.connect;
      if (obj && obj.Manager && typeof obj.Manager === 'function') return obj.Manager;
      return null;
    }

    const callableInfo = {};
    for (const k of present) {
      callableInfo[k] = { type: typeof candidates[k] };
      try { callableInfo[k].keys = Object.keys(candidates[k]).slice(0, 20); } catch (e) { callableInfo[k].keys = [] }
      callableInfo[k].callable = !!findCallable(candidates[k]);
    }
    info.callableInfo = callableInfo;

    const ctor = findCallable(window.io) || findCallable(window.socket) || findCallable(window.socketio);
    if (!ctor) return { error: 'no-callable-found', info };

    return await new Promise((resolve) => {
      let finished = false;
      const timeout = setTimeout(() => { if (!finished) { finished = true; resolve({ error: 'timeout', info }); } }, 15000);

      // compute app-relative socket path like admin UI does
      let appPath = window.location.pathname || '/';
      try {
        const parts = appPath.split('/');
        if (parts.length > 2) {
          parts.pop();
          if (parts.length && /\d+\.\d+\.\d+/.test(parts[parts.length-1])) parts.pop();
          parts.pop();
          appPath = parts.join('/');
          if (!appPath.endsWith('/')) appPath = appPath + '/';
        }
      } catch (e) {}

      const opts = { transports: ['websocket'], query: 'ws=true', name, uuid, timeout: timeoutMs };
      if (user && pass) opts.auth = { username: user, password: pass };

      let socket = null;
      // try multiple option combinations and namespaces
      const optionCandidates = [
        { transports: ['websocket'], path: appPath.endsWith('/') ? `${appPath}socket.io` : `${appPath}/socket.io` },
        { transports: ['polling'], path: appPath.endsWith('/') ? `${appPath}socket.io` : `${appPath}/socket.io` },
        { transports: ['polling', 'websocket'], path: appPath.endsWith('/') ? `${appPath}socket.io` : `${appPath}/socket.io` },
        { transports: ['websocket'], path: '/socket.io' },
        { transports: ['polling'], path: '/socket.io' },
        { transports: ['polling', 'websocket'], path: '/socket.io' }
      ];
      const nsCandidates = ['', '/admin', '/socket.io', '/io'];

      for (const ns of nsCandidates) {
        for (const oc of optionCandidates) {
          if (socket) break;
          const tryOpts = Object.assign({}, oc);
          // ensure query/name/uuid/timeout are present
          tryOpts.query = tryOpts.query || 'ws=true';
          tryOpts.name = tryOpts.name || name;
          tryOpts.uuid = tryOpts.uuid || uuid;
          tryOpts.timeout = tryOpts.timeout || timeoutMs;
          if (user && pass) tryOpts.auth = { username: user, password: pass };
          try {
            // try ctor in different ways
            try { socket = ctor(window.location.origin + ns, tryOpts); } catch (e) { socket = socket || null; }
            if (!socket && typeof ctor.connect === 'function') {
              try { socket = ctor.connect(window.location.origin + ns, tryOpts); } catch (e) { socket = socket || null; }
            }
            if (!socket && typeof ctor === 'function' && ctor.prototype && ctor.prototype.connect) {
              try { socket = new ctor(window.location.origin + ns, tryOpts); } catch (e) { socket = socket || null; }
            }
          } catch (e) { socket = socket || null; }
        }
        if (socket) break;
      }

      if (!socket) { clearTimeout(timeout); return resolve({ error: 'failed-to-create-socket', info }); }

      socket.on('connect_error', (err) => {
        // log but continue
      });

      socket.on('connect', async () => {
        // try authenticate first
        let authed = false;
        try {
          const authRes = await new Promise(r => {
            let called = false;
            try {
              // try object payload
              if (socket.timeout) socket.timeout(8000).emit('authenticate', { user, pass }, (err, data) => {
                if (called) return; called = true; if (err) return r(null); r(data);
              });
              else socket.emit('authenticate', { user, pass }, (data) => { if (called) return; called = true; r(data); });
            } catch (e) { r(null); }
            // fallback: try separate args
            setTimeout(() => {
              if (called) return;
              try {
                if (socket.timeout) socket.timeout(8000).emit('authenticate', user, pass, (err, data) => { if (called) return; called = true; if (err) return r(null); r(data); });
                else socket.emit('authenticate', user, pass, (data) => { if (called) return; called = true; r(data); });
              } catch (e) { if (!called) { called = true; r(null); } }
            }, 300);
          });
          if (authRes) authed = true;
        } catch (e) {}

        if (!authed) {
          // try token-based authenticate event name variations
          try {
            const authRes2 = await new Promise(r => {
              let called = false;
              try {
                if (socket.timeout) socket.timeout(8000).emit('authenticateUser', { user, pass }, (err, data) => { if (called) return; called = true; if (err) return r(null); r(data); });
                else socket.emit('authenticateUser', { user, pass }, (data) => { if (called) return; called = true; r(data); });
              } catch (e) { r(null); }
            });
            if (authRes2) authed = true;
          } catch (e) {}
        }

        const events = ['getUserPermissions','getObjects','admin.getObjects','getAllObjects','objects.get','getStates'];
        for (const ev of events) {
          try {
            const ack = await new Promise(r => {
              let called = false;
              try {
                if (socket.timeout) socket.timeout(10000).emit(ev, (err, data) => {
                  if (called) return; called = true; if (err) return r(null); r(data);
                });
                else socket.emit(ev, (data) => { if (called) return; called = true; r(data); });
              } catch (e) { r(null); }
            });
            if (ack !== null && typeof ack !== 'undefined') {
              clearTimeout(timeout);
              finished = true;
              try { socket.close(); } catch {}
              return resolve({ event: ev, data: ack, info, authed });
            }
          } catch (e) {}
        }

        if (!finished) { clearTimeout(timeout); finished = true; try{ socket.close(); }catch{}; resolve({ error: 'no-event-response', info, authed }); }
      });

      // fallback connect timeout
      setTimeout(() => { if (!finished) { finished = true; try{ socket.close(); }catch{}; resolve({ error: 'connect timeout', info }); } }, 12000);
    });
  }, user, pass);

  if (res) console.log(JSON.stringify(res, null, 2));
  else console.log(JSON.stringify({ error: 'no-result' }));

  await browser.close();
}

main().catch(e => { console.error('Fatal:', e); process.exit(2); });
