#!/usr/bin/env node
import puppeteer from 'puppeteer';

const base = (process.env.IOBROKER_URL || 'http://192.168.1.235:8081').replace(/\/$/, '');
const user = process.env.IOBROKER_USER || '';
const pass = process.env.IOBROKER_PASS || '';

function log(...args) { console.error(...args); }

async function tryInPageFetch(page, path) {
  try {
    const url = base + path;
    return await page.evaluate(async (u) => {
      try {
        const r = await fetch(u, { credentials: 'include' });
        const t = await r.text();
        try { return { status: r.status, body: JSON.parse(t) }; } catch { return { status: r.status, body: t }; }
      } catch (e) { return { error: String(e) }; }
    }, url);
  } catch (err) {
    return { error: err.message };
  }
}

async function main() {
  log('Launching headless browser...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  const networkHits = [];
  page.on('request', req => {
    const url = req.url();
    if (/objects|api|getObjects|socket.io|admin/i.test(url)) networkHits.push({ method: req.method(), url });
  });

  page.on('response', async res => {
    const url = res.url();
    if (/objects|api|getObjects|admin/i.test(url)) {
      let text = '';
      try { text = await res.text(); } catch {}
      networkHits.push({ status: res.status(), url, bodySnippet: text.slice(0, 200) });
    }
  });

  log('Navigating to', base);
  try {
    await page.goto(base, { waitUntil: 'networkidle2', timeout: 15000 });
  } catch (e) {
    log('Initial navigation failed:', e.message);
  }

  // Try to login if there is a form
  if (user && pass) {
    try {
      const usernameSel = await page.$('input[name=username], input[name=user], input#username, input#user');
      const passwordSel = await page.$('input[name=password], input#passwd, input#password');
      if (usernameSel && passwordSel) {
        log('Login form detected — filling credentials');
        await page.type('input[name=username], input[name=user], input#username, input#user', user, { delay: 20 }).catch(()=>{});
        await page.type('input[name=password], input[name=passwd], input#password', pass, { delay: 20 }).catch(()=>{});
        // try to submit
        await Promise.all([
          page.keyboard.press('Enter'),
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(()=>{})
        ]);
        log('Login attempt done — waiting briefly');
        await page.waitForTimeout(1500);
      } else {
        log('No obvious login form found on page');
      }
    } catch (e) { log('Login step error:', e.message); }
  }

  // Wait and capture network
  await page.waitForTimeout(2000);

  log('Network hits captured:', networkHits.length);
  if (networkHits.length) console.log(JSON.stringify(networkHits, null, 2));

  // Try fetching known endpoints from page context (will use cookies if set)
  const tryPaths = [
    '/objects', '/objects.json', '/getObjects', '/getObjects.json', '/api/objects', '/objects/get',
    '/admin/objects', '/admin/objects/list', '/admin/objects.json', '/admin/getObjects'
  ];

  for (const p of tryPaths) {
    log('Trying fetch from page:', p);
    const res = await tryInPageFetch(page, p);
    if (res && !res.error && res.status >= 200 && res.status < 400) {
      log('Success for', p, 'status', res.status);
      console.log(JSON.stringify({ path: p, result: res }, null, 2));
      await browser.close();
      return;
    } else {
      log('No usable response for', p, '-', res && (res.error || res.status));
    }
  }

  log('No REST endpoints returned objects. You can inspect captured network requests above for clues.');
  await browser.close();
}

main().catch(e => { console.error('Fatal:', e); process.exit(2); });
