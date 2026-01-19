#!/usr/bin/env node
import axios from 'axios';

const base = (process.env.IOBROKER_URL || 'http://192.168.1.235:8082').replace(/\/$/, '');
const user = process.env.IOBROKER_USER || '';
const pass = process.env.IOBROKER_PASS || '';

const endpoints = [
  '/objects',
  '/objects.json',
  '/getObjects',
  '/getObjects.json',
  '/api/objects',
  '/objects/get',
  '/admin/objects',
  '/admin/objects/list',
  '/admin/objects.json',
  '/admin/getObjects',
  '/admin/objects/get'
];

function buildCookieHeader(setCookieHeaders) {
  if (!setCookieHeaders) return undefined;
  // setCookieHeaders may be array; join cookies using first token before ';'
  const cookies = setCookieHeaders.map(c => c.split(';')[0]).join('; ');
  return cookies;
}

async function tryLogin() {
  if (!user || !pass) return null;
  const loginPaths = ['/login', '/admin/login'];
  for (const p of loginPaths) {
    const url = base + p;
    try {
      console.error('Trying login at', url);
      // try JSON POST
      let res = await axios.post(url, { username: user, password: pass }, { timeout: 10000, validateStatus: s => s < 500 });
      if (res.status >= 200 && res.status < 400) {
        const cookie = buildCookieHeader(res.headers['set-cookie'] || res.headers['Set-Cookie']);
        if (cookie) {
          console.error('Login successful (cookies received)');
          return cookie;
        }
        // some ioBroker setups return success without cookies
        if (res.data && (res.data.ok || res.data.success || res.data.loggedIn)) {
          console.error('Login looks successful (no cookies returned)');
          return null;
        }
      }
    } catch (err) {
      // try next variant
      console.error('Login attempt failed at', url, '-', err.message);
    }
    // try form-encoded variant
    try {
      const params = new URLSearchParams();
      params.append('username', user);
      params.append('password', pass);
      const res2 = await axios.post(url, params.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000, validateStatus: s => s < 500 });
      const cookie = buildCookieHeader(res2.headers['set-cookie'] || res2.headers['Set-Cookie']);
      if (cookie) {
        console.error('Login successful (cookies received)');
        return cookie;
      }
      if (res2.data && (res2.data.ok || res2.data.success || res2.data.loggedIn)) {
        console.error('Login looks successful (no cookies returned)');
        return null;
      }
    } catch (err) {
      console.error('Form login failed at', url, '-', err.message);
    }
  }
  console.error('All login attempts failed');
  return null;
}

async function tryFetch(cookieHeader) {
  const headers = cookieHeader ? { Cookie: cookieHeader } : {};
  for (const ep of endpoints) {
    const url = base + ep;
    try {
      console.error('Trying', url);
      const cfg = { timeout: 10000, headers, validateStatus: s => s < 500 };
      const res = await axios.get(url, cfg);
      if (res.status >= 200 && res.status < 400) {
        console.error('Success from', url);
        if (typeof res.data === 'object') {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(res.data);
        }
        return true;
      }
      console.error('Failed', url, '- status', res.status);
    } catch (err) {
      console.error('Failed', url, '-', err.message);
    }
  }
  return false;
}

async function main() {
  let cookie = null;
  if (user && pass) {
    cookie = await tryLogin();
  }

  const ok = await tryFetch(cookie);
  if (!ok && cookie) {
    console.error('Retrying without cookie...');
    await tryFetch(null);
  }
  if (!ok) {
    console.error('All endpoints failed. If you know the exact Admin REST path, provide it via IOBROKER_URL or tell me which endpoint to try.');
  }
}

main();
