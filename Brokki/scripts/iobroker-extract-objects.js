#!/usr/bin/env node
import puppeteer from 'puppeteer';

const base = (process.env.IOBROKER_URL || 'http://192.168.1.235:8081').replace(/\/$/, '');
const user = process.env.IOBROKER_USER || '';
const pass = process.env.IOBROKER_PASS || '';

function log(...args) { console.error(...args); }

async function clickByText(page, selector, textRegex) {
  return page.evaluate((sel, tx) => {
    const re = new RegExp(tx, 'i');
    const el = Array.from(document.querySelectorAll(sel)).find(e => (e.innerText || '').match(re));
    if (el) { el.click(); return true; }
    return false;
  }, selector, textRegex);
}

async function extractJSONLike(text) {
  const blocks = [];
  const re = /\{[\s\S]{200,200000}?\}/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    blocks.push(m[0]);
    if (blocks.length > 5) break;
  }
  const parsed = [];
  for (const b of blocks) {
    try { parsed.push(JSON.parse(b)); } catch {}
  }
  return parsed;
}

async function main() {
  log('Launching headless browser...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(20000);

  const responses = [];
  page.on('response', async res => {
    try {
      const url = res.url();
      const ct = (res.headers && res.headers()['content-type']) || '';
      const isJson = /application\/json|text\/json|application\/javascript/.test(ct) || /objects|getObjects|api|admin|states/i.test(url);
      if (isJson || res.request().resourceType() === 'xhr' || res.request().resourceType() === 'fetch') {
        let text = '';
        try { text = await res.text(); } catch (e) { text = ''; }
        responses.push({ url, status: res.status(), headers: res.headers ? res.headers() : {}, text });
      }
    } catch (e) {}
  });

  log('Navigating to', base);
  await page.goto(base, { waitUntil: 'networkidle2' }).catch(e => log('goto failed', e.message));

  // try login via form if present
  try {
    const usernameSel = await page.$('input[name=username], input[name=user], input#username');
    const passwordSel = await page.$('input[name=password], input#passwd, input#password');
    if (usernameSel && passwordSel && user && pass) {
      log('Filling login form');
      await page.type('input[name=username], input[name=user], input#username', user, { delay: 20 }).catch(()=>{});
      await page.type('input[name=password], input#passwd, input#password', pass, { delay: 20 }).catch(()=>{});
      await Promise.all([page.keyboard.press('Enter'), page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(()=>{})]);
    }
  } catch (e) { log('login attempt error', e.message); }

  await page.waitForTimeout(1000);

  // Try to click an Export button in the Objects view (common labels)
  const exportSelectors = ['button', 'a', 'div[role="button"]'];
  let exportClicked = false;
  for (const sel of exportSelectors) {
    exportClicked = await clickByText(page, sel, '(export|exportieren|export objects|exportieren objekt|export objects & instances)');
    if (exportClicked) break;
  }

  if (exportClicked) {
    log('Clicked Export — waiting for export dialog');
    await page.waitForTimeout(1000);
    const exported = await page.evaluate(() => {
      const sel = ['textarea', 'pre', 'code', '.export-textarea', '.MuiDialog-root textarea'];
      for (const s of sel) {
        const el = document.querySelector(s);
        if (el) return el.value || el.innerText || el.textContent || null;
      }
      const divs = Array.from(document.querySelectorAll('div'));
      for (const d of divs) {
        const txt = (d.innerText || '').trim();
        if (txt.length > 200 && txt.indexOf('{') !== -1) return txt;
      }
      return null;
    });

    if (exported) {
      try {
        const j = JSON.parse(exported);
        console.log(JSON.stringify({ source: 'export-dialog', json: j }, null, 2));
        await browser.close();
        return;
      } catch (e) {
        console.log(JSON.stringify({ source: 'export-dialog-snippet', snippet: exported.slice(0, 20000) }, null, 2));
        await browser.close();
        return;
      }
    }
  }

  // Try to find and click the Objects menu/button by common labels
  const menuSelectors = ['a', 'button', 'li', 'div[role="button"]'];
  let clicked = false;
  for (const sel of menuSelectors) {
    clicked = await clickByText(page, sel, '(^|\\s)(objects|objekte|objects & instances|objects and instances|objects view)(\\s|$)');
    if (clicked) break;
  }

  if (!clicked) {
    const navClicked = await page.evaluate(() => {
      const a = Array.from(document.querySelectorAll('a')).find(x => (x.href || '').toLowerCase().includes('objects'));
      if (a) { a.click(); return true; }
      return false;
    });
    clicked = navClicked;
  }

  if (clicked) {
    log('Clicked Objects menu — waiting for load');
    await page.waitForTimeout(2000);
    await page.waitForNetworkIdle({idleTime: 500, timeout: 8000}).catch(()=>{});
  } else {
    log('Objects menu not found — attempting to open known route #/objects');
    try { await page.goto(base + '/#objects', { waitUntil: 'networkidle2', timeout: 8000 }); } catch {}
  }

  await page.waitForTimeout(1000);

  // auto-scroll to load lazy content
  try {
    await page.evaluate(async () => {
      await new Promise(r => {
        let total = 0; const distance = 800; const timer = setInterval(() => {
          window.scrollBy(0, distance); total += distance; if (total > document.body.scrollHeight) { clearInterval(timer); r(); }
        }, 300);
        setTimeout(() => { try{ clearInterval(timer);}catch{}; r(); }, 4000);
      });
    });
  } catch (e) {}

  // try to extract in-page app state (common names)
  const pageStates = await page.evaluate(() => {
    const candidates = {};
    try { candidates.__INITIAL_STATE__ = window.__INITIAL_STATE__ || null; } catch{};
    try { candidates.__PRELOADED_STATE__ = window.__PRELOADED_STATE__ || null; } catch{};
    try { candidates.__REDUX_STATE__ = window.__REDUX_STATE__ || null; } catch{};
    try { candidates.__APP_STATE__ = window.__APP_STATE__ || null; } catch{};
    try { candidates.store = (window.store && window.store.getState) ? window.store.getState() : null; } catch{};
    return candidates;
  });

  // parse captured responses for JSON objects
  const found = [];
  for (const r of responses) {
    try {
      if (!r.text) continue;
      if (/system\.adapter|getObjects|objects|states|result|rows|data/i.test(r.text)) {
        try {
          const j = JSON.parse(r.text);
          found.push({ url: r.url, status: r.status, json: j });
        } catch (e) {
          found.push({ url: r.url, status: r.status, snippet: r.text.slice(0, 2000) });
        }
      }
    } catch (e) {}
  }

  if (Object.values(pageStates).some(s => s)) {
    console.log(JSON.stringify({ source: 'inpage-state', pageStates }, null, 2));
    await browser.close();
    return;
  }

  if (found.length) {
    console.log(JSON.stringify({ source: 'network-responses', results: found.slice(0,5) }, null, 2));
    await browser.close();
    return;
  }

  // fallback: check for visible table or list and extract text lines
  const items = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('table tr, .object-row, .list-item, .MuiTableRow-root').forEach(r => out.push(r.innerText));
    return out.slice(0, 200);
  });
  if (items && items.length) {
    console.log(JSON.stringify({ source: 'dom-rows', count: items.length, items: items.slice(0,50) }, null, 2));
    await browser.close();
    return;
  }

  // last resort: output full body text for manual inspection
  const body = await page.evaluate(() => document.body ? document.body.innerText : '');
  console.log(JSON.stringify({ source: 'body-text', bodySnippet: body.slice(0, 20000) }, null, 2));

  await browser.close();
}

main().catch(e => { console.error('Fatal:', e); process.exit(2); });
