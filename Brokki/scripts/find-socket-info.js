#!/usr/bin/env node
import puppeteer from 'puppeteer';

const portsToCheck = (process.env.IOBROKER_PORTS || '8081,8082').split(',').map(s => s.trim());
const host = process.env.IOBROKER_HOST || '192.168.1.235';

function patterns() {
  return [
    /socket\.io/gi,
    /\bio\(/gi,
    /io\.connect/gi,
    /getObjects/gi,
    /admin\.getObjects/gi,
    /getStates/gi,
    /objects\.get/gi,
    /wsAuth/gi,
    /socketPath/gi,
    /path:\s*['\"]\/socket.io/gi,
    /namespace/gi,
    /emit\(['\"][a-zA-Z0-9_.-]+['\"]/gi
  ];
}

async function analyzeUrl(url) {
  console.error('Analyze', url);
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const scripts = [];

  page.on('requestfinished', req => {
    try {
      const u = req.url();
      if (/\.js($|\?|#)/i.test(u) || /assets\//i.test(u)) scripts.push(u);
    } catch (e) {}
  });

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 }).catch(()=>{});
  await page.waitForTimeout(1000);

  // Collect <script> tags
  const inlineAndSrc = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('script').forEach(s => {
      if (s.src) out.push({ src: s.src }); else out.push({ inline: s.textContent.slice(0, 2000) });
    });
    return out;
  });

  for (const s of inlineAndSrc) {
    if (s.src) scripts.push(s.src);
  }

  // Deduplicate and keep same-origin only
  const unique = Array.from(new Set(scripts)).filter(u => u && (u.startsWith(url) || u.startsWith('/') || u.indexOf(host) !== -1));

  const results = [];
  for (const s of unique) {
    try {
      let text = '';
      try {
        // attempt fetch in page context to preserve cookies
        text = await page.evaluate(async (u) => {
          try { const r = await fetch(u); return await r.text(); } catch (e) { return ''; }
        }, s);
      } catch (e) {
        try {
          const resp = await page.goto(s, { waitUntil: 'networkidle2', timeout: 8000 });
          text = resp ? await resp.text() : '';
        } catch (e2) { text = ''; }
      }
      if (!text) continue;
      const matches = [];
      for (const p of patterns()) {
        const m = text.match(p);
        if (m && m.length) matches.push({ pattern: p.source, count: m.length, sample: m.slice(0,5) });
      }
      if (matches.length) results.push({ file: s, matches });
    } catch (e) {}
  }

  // also search inline scripts captured earlier
  for (const s of inlineAndSrc) {
    if (s.inline) {
      const text = s.inline;
      const matches = [];
      for (const p of patterns()) {
        const m = text.match(p);
        if (m && m.length) matches.push({ pattern: p.source, count: m.length, sample: m.slice(0,5) });
      }
      if (matches.length) results.push({ file: 'inline-script', matches });
    }
  }

  await browser.close();
  return results;
}

async function main() {
  for (const port of portsToCheck) {
    const url = `http://${host}:${port}`;
    const res = await analyzeUrl(url);
    console.log('--- Results for', url, '---');
    if (!res.length) console.log('No relevant patterns found.');
    else console.log(JSON.stringify(res, null, 2));
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(2); });
