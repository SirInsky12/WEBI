#!/usr/bin/env node
import { io } from 'socket.io-client';

const base = (process.env.IOBROKER_URL || 'http://192.168.1.235:8081').replace(/\/$/, '');
const user = process.env.IOBROKER_USER || '';
const pass = process.env.IOBROKER_PASS || '';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function emitAck(socket, event, payload, timeout = 5000) {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => { if (!done) { done = true; resolve({ ok: false, reason: 'timeout' }); } }, timeout);
    try {
      socket.emit(event, payload, (resp) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve({ ok: true, resp });
      });
    } catch (e) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve({ ok: false, reason: String(e) });
    }
  });
}

async function tryConnectAndQuery(opts) {
  const origin = base;
  console.error('Trying connect', origin, opts);
  const socket = io(origin, opts);

  let connected = false;
  const onConnect = () => { connected = true; };
  socket.once('connect', onConnect);

  // wait up to 5s
  for (let i = 0; i < 10; i++) {
    if (connected) break;
    await sleep(500);
  }

  if (!connected) {
    socket.close();
    return { ok: false, reason: 'connect-failed' };
  }

  console.error('Connected, id=', socket.id);

  // try authenticate variants
  const authEvents = ['authenticate','authenticateUser','auth','login'];
  let authed = false;
  for (const ev of authEvents) {
    const payload = ({ username: user, password: pass, user, pass } );
    const res = await emitAck(socket, ev, payload, 4000);
    if (res.ok) {
      authed = true;
      console.error('Auth succeeded via', ev);
      break;
    }
  }

  const events = ['getObjects','admin.getObjects','getAllObjects','objects.get','getStates'];
  for (const ev of events) {
    const res = await emitAck(socket, ev, null, 5000);
    if (res.ok) {
      socket.close();
      return { ok: true, event: ev, data: res.resp, authed };
    }
  }

  socket.close();
  return { ok: false, reason: 'no-event-response', authed };
}

async function main() {
  const transportsList = [['websocket'], ['polling'], ['polling','websocket']];
  const paths = ['/socket.io', '/socket.io/', '/'];
  const namespaces = ['', '/admin', '/io'];
  const authStyles = ['auth', 'query', 'none'];

  for (const ns of namespaces) {
    for (const p of paths) {
      for (const t of transportsList) {
        for (const a of authStyles) {
          const opts = { path: p, transports: t, timeout: 5000 };
          if (ns) opts.path = p; // namespace handled in URL
          if (a === 'auth' && user && pass) opts.auth = { username: user, password: pass };
          if (a === 'query' && user && pass) opts.query = { user, pass };

          // build origin possibly with namespace
          const origin = base + (ns || '');

          try {
            const res = await tryConnectAndQuery(Object.assign({}, opts, { autoConnect: true, reconnection: false, transports: opts.transports }));
            if (res.ok) {
              console.log(JSON.stringify({ origin: origin, opts, result: res }, null, 2));
              return;
            } else {
              console.error('Attempt failed:', origin, opts, res);
            }
          } catch (e) {
            console.error('Error during attempt', origin, opts, e.message || e);
          }
        }
      }
    }
  }
  console.error('All attempts finished without success.');
}

main().catch(e => { console.error('Fatal:', e); process.exit(2); });
