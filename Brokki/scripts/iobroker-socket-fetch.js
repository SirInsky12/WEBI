#!/usr/bin/env node
import { io } from 'socket.io-client';

const base = (process.env.IOBROKER_URL || 'http://192.168.1.235:8081').replace(/\/$/, '');
const user = process.env.IOBROKER_USER || '';
const pass = process.env.IOBROKER_PASS || '';

function log(...args) { console.error(...args); }

async function tryEmitWithAck(socket, event, timeoutMs = 10000) {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      resolve({ ok: false, reason: 'timeout' });
    }, timeoutMs + 500);

    try {
      socket.emit(event, (response) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve({ ok: true, response });
      });
    } catch (err) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve({ ok: false, reason: err.message || String(err) });
    }
  });
}

async function main() {
  log('Connecting socket to', base);
  const opts = { path: '/socket.io', transports: ['websocket'] };
  if (user && pass) opts.auth = { username: user, password: pass };

  const socket = io(base, opts);

  socket.on('connect_error', (err) => log('connect_error', err.message));
  socket.on('connect_timeout', () => log('connect_timeout'));

  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('connect timeout')), 10000);
    socket.once('connect', () => { clearTimeout(t); resolve(); });
    socket.once('error', (e) => { clearTimeout(t); reject(e); });
  }).catch((err) => {
    log('Socket connect failed:', err.message || err);
    process.exitCode = 2;
  });

  log('Socket connected, id=', socket.id);

  const eventsToTry = [
    'getObjects',
    'admin.getObjects',
    'getAllObjects',
    'objects',
    'objects.get',
    'getObjectsByType'
  ];

  for (const ev of eventsToTry) {
    log('Trying event', ev);
    const res = await tryEmitWithAck(socket, ev, 10000);
    if (res.ok) {
      log('Received response for', ev);
      try {
        console.log(JSON.stringify(res.response, null, 2));
      } catch (e) {
        console.log(res.response);
      }
      socket.close();
      return;
    } else {
      log('No response for', ev, '-', res.reason);
    }
  }

  log('No socket events returned objects. You can try other event names or enable admin socket API on the ioBroker host.');
  socket.close();
}

main();
