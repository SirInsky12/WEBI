#!/usr/bin/env node
import puppeteer from 'puppeteer';
import fetch from 'node-fetch';

const base = (process.env.IOBROKER_URL || 'http://192.168.1.235:8081').replace(/\/$/, '');
const host = new URL(base).host;

const patterns = [
  'authenticate', 'authenticateUser', 'auth', 'login',
  'getObjects', 'admin.getObjects', 'getAllObjects', 'objects.get', 'getStates',
  'subscribe', 'getUserPermissions', 'updateTokenExpiration', 'emit(', 'socket.io', 'path:', 'namespace'
];

function findAllIndices(s, pat) {
  const res = [];
  let idx = s.indexOf(pat);
  while (idx !== -1) { res.push(idx); idx = s.indexOf(pat, idx + 1); }
  return res;
}

function snippetAround(s, idx, len = 200) {
  const start = Math.max(0, idx - len);
  const end = Math.min(s.length, idx + len);
  return s.slice(start, end);
}

async function analyze(url) {
  console.error('Fetching page', url);
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const scripts = [];
  page.on('requestfinished', req => {
    try {
      const u = req.url();
      if (u && (u.includes('/assets/') || u.endsWith('.js') || u.includes('socket.io.js'))) scripts.push(u);
    } catch (e) {}
  });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 }).catch(()=>{});
  await page.waitForTimeout(800);
  // also collect script srcs from DOM
  const srcs = await page.evaluate(() => Array.from(document.scripts).map(s => s.src).filter(Boolean));
  for (const s of srcs) if (!scripts.includes(s)) scripts.push(s);

  const results = [];
  for (const s of scripts) {
    try {
      const full = s.startsWith('http') ? s : (s.startsWith('/') ? (new URL(s, url)).toString() : (url + '/' + s));
      if (!full.includes(host) && !full.startsWith('http://') && !full.startsWith('https://')) continue;
      console.error('Fetching asset', full);
      const r = await fetch(full, { timeout: 10000 });
      if (!r.ok) continue;
      const txt = await r.text();
      const hits = [];
      for (const p of patterns) {
        const idxs = findAllIndices(txt, p);
        if (idxs.length) {
          hits.push({ pattern: p, count: idxs.length, samples: idxs.slice(0,5).map(i => snippetAround(txt, i, 300)) });
        }
      }
      if (hits.length) results.push({ file: full, hits });
    } catch (e) {
      console.error('Asset fetch failed', s, e.message || e);
    }
  }
  await browser.close();
  return results;
}

async function main() {
  const res = await analyze(base);
  if (!res.length) console.log('No matches found in assets.');
  else console.log(JSON.stringify(res, null, 2));
}

main().catch(e => { console.error('Fatal', e); process.exit(2); });
