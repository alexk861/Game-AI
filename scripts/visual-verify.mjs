import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = join(process.cwd(), 'verification-screenshots');
const userDataDir = join('C:\\tmp', `uncanny-cdp-${Date.now()}`);
const port = 9223;
const baseUrl = 'http://localhost:3000/';

await mkdir(outputDir, { recursive: true });
await rm(userDataDir, { recursive: true, force: true });

const chrome = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  '--window-size=390,844',
  'about:blank',
], { stdio: 'ignore' });

let messageId = 0;
const pending = new Map();

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJson(url, retries = 60) {
  for (let i = 0; i < retries; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      await delay(250);
    }
  }
  throw new Error(`Unable to fetch ${url}`);
}

const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
const pageTarget = targets.find(target => target.type === 'page');
if (!pageTarget?.webSocketDebuggerUrl) {
  throw new Error('Unable to find a Chrome page target');
}

const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});

ws.addEventListener('message', event => {
  const payload = JSON.parse(event.data);
  if (payload.id && pending.has(payload.id)) {
    const { resolve, reject } = pending.get(payload.id);
    pending.delete(payload.id);
    if (payload.error) reject(new Error(payload.error.message));
    else resolve(payload.result);
  }

  if (payload.method === 'Runtime.consoleAPICalled') {
    const args = payload.params.args.map(a => a.value || a.description).join(' ');
    console.log(`[browser console] [${payload.params.type}] ${args}`);
  }

  if (payload.method === 'Runtime.exceptionThrown') {
    const details = payload.params.exceptionDetails;
    console.log(`[browser exception] ${details.text} ${details.exception?.description || ''}`);
  }
});

function send(method, params = {}) {
  const id = ++messageId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
  });
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  return result.result?.value;
}

async function waitFor(expression, timeout = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return;
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${expression}`);
}

async function setViewport(width, height) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: true,
  });
}

async function navigateFresh() {
  await send('Page.navigate', { url: baseUrl });
  await waitFor('document.readyState === "complete"');
}

async function screenshot(name) {
  await delay(350);
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(join(outputDir, name), Buffer.from(shot.data, 'base64'));
}

async function clickButtonContaining(text) {
  const clicked = await evaluate(`
    (() => {
      const button = [...document.querySelectorAll('button')]
        .find(item => item.innerText.toLowerCase().includes(${JSON.stringify(text.toLowerCase())}));
      if (!button) return false;
      button.click();
      return true;
    })()
  `);
  if (!clicked) throw new Error(`Button not found: ${text}`);
}

async function waitForHeroImage() {
  await waitFor(`
    (() => {
      const image = document.querySelector('.swipe-card img');
      return Boolean(image && image.complete && image.naturalWidth > 0);
    })()
  `, 15000);
  await delay(500);
}

async function assertHeroImage() {
  const check = await evaluate(`
    (() => {
      const image = document.querySelector('.swipe-card img');
      if (!image) return { error: "No image element" };
      return {
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        src: image.src
      };
    })()
  `);
  if (check.error) throw new Error("AssertFailed: " + check.error);
  if (check.naturalWidth <= 0) throw new Error("AssertFailed: Image naturalWidth <= 0");
  if (check.src.includes('placeholder') || check.src.includes('fallback')) {
    throw new Error("AssertFailed: Rendered image has placeholder/fallback URL: " + check.src);
  }
}

async function holdImage() {
  await evaluate(`
    (() => {
      const target = document.querySelector('.swipe-card');
      if (!target) return false;
      const rect = target.getBoundingClientRect();
      target.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        pointerId: 1,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        pointerType: 'touch'
      }));
      return true;
    })()
  `);
  await delay(780);
}

async function releaseImage() {
  await evaluate(`
    (() => {
      const target = document.querySelector('.swipe-card');
      if (!target) return false;
      const rect = target.getBoundingClientRect();
      target.dispatchEvent(new PointerEvent('pointerup', {
        bubbles: true,
        pointerId: 1,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        pointerType: 'touch'
      }));
      return true;
    })()
  `);
}

try {
  await send('Page.enable');
  await send('Runtime.enable');
  await setViewport(390, 844);
  await navigateFresh();
  await evaluate('localStorage.removeItem("uncanny_state")');
  await navigateFresh();
  await waitFor('document.body.innerText.includes("UNCANNY")');
  await screenshot('01-welcome-390x844.png');

  await clickButtonContaining('Begin challenge');
  await waitFor('document.body.innerText.includes("Real") && document.body.innerText.includes("AI")');
  await waitForHeroImage();
  await assertHeroImage();

  // ── Assertions 1: API Endpoint Payload ──
  console.log("Asserting daily-set endpoint payload...");
  const apiCheck = await evaluate(`
    fetch('/api/daily-set').then(res => res.json())
  `);
  if (!apiCheck || !apiCheck.challenges) {
    throw new Error("AssertFailed: daily-set response is empty or malformed");
  }
  if (apiCheck.challenges.length !== 5) {
    throw new Error(`AssertFailed: Expected exactly 5 challenges, but got ${apiCheck.challenges.length}`);
  }
  const challengeIds = apiCheck.challenges.map(c => c.id);
  const uniqueIds = new Set(challengeIds);
  if (uniqueIds.size !== challengeIds.length) {
    throw new Error("AssertFailed: Duplicate challenge IDs detected!");
  }
  const imagePaths = apiCheck.challenges.map(c => c.image_url);
  imagePaths.forEach(url => {
    if (!url || url.includes('placeholder') || url.includes('fallback')) {
      throw new Error(`AssertFailed: Challenge contains a placeholder/fallback image URL: ${url}`);
    }
  });
  console.log("Daily-set payload assertions passed successfully!");

  // ── Assertions 2: Image Rendering ──
  console.log("Asserting DOM image loading...");
  const domCheck = await evaluate(`
    (() => {
      const activeImg = document.querySelector('.swipe-card img');
      if (!activeImg) return { error: "No active image element found" };
      return {
        complete: activeImg.complete,
        naturalWidth: activeImg.naturalWidth,
        src: activeImg.src
      };
    })()
  `);
  if (domCheck.error) {
    throw new Error(`AssertFailed: ${domCheck.error}`);
  }
  if (domCheck.naturalWidth <= 0) {
    throw new Error("AssertFailed: Active challenge image failed to load or has 0 naturalWidth");
  }
  if (domCheck.src.includes('placeholder') || domCheck.src.includes('fallback')) {
    throw new Error(`AssertFailed: Active image URL is a fallback/placeholder: ${domCheck.src}`);
  }
  console.log("DOM image rendering assertions passed successfully!");

  await screenshot('02-gameplay-390x844.png');

  await setViewport(430, 932);
  await delay(700);
  await screenshot('06-gameplay-430x932.png');
  await setViewport(390, 844);
  await delay(400);

  await holdImage();
  await waitFor(`
    (() => {
      const card = document.querySelector('.swipe-card');
      const img = document.querySelector('.swipe-card img');
      return Boolean(card && card.style.cursor === 'crosshair' && img && img.style.transform === 'scale(1.7)');
    })()
  `);
  await screenshot('03-investigation-390x844.png');
  await releaseImage();

  await clickButtonContaining('AI');
  await waitFor('document.body.innerText.includes("SYNTHETIC REPRESENTATION") || document.body.innerText.includes("ORGANIC CAPTURE")');
  await screenshot('04-reveal-390x844.png');

  for (let i = 0; i < 4; i += 1) {
    await waitFor('document.body.innerText.includes("Real") && document.body.innerText.includes("AI")', 15000);
    await waitForHeroImage();
    await assertHeroImage();
    await clickButtonContaining(i % 2 === 0 ? 'Real' : 'AI');
    await waitFor('document.body.innerText.includes("SYNTHETIC REPRESENTATION") || document.body.innerText.includes("ORGANIC CAPTURE")', 15000);
  }

  // ── Assertions 3: LocalStorage Persistence ──
  console.log("Asserting guess persistence in localStorage...");
  const state = await evaluate(`
    (() => {
      const raw = localStorage.getItem("uncanny_state");
      if (!raw) return null;
      try {
        return JSON.parse(decodeURIComponent(window.atob(raw)));
      } catch {
        return JSON.parse(raw);
      }
    })()
  `);
  if (!state) {
    throw new Error("AssertFailed: uncanny_state is missing from localStorage");
  }
  if (state.todayResults.length !== 5) {
    throw new Error(`AssertFailed: Expected exactly 5 persisted results in state, but found ${state.todayResults.length}`);
  }
  console.log("Guess persistence assertions passed successfully!");

  await waitFor('document.body.innerText.toLowerCase().includes("results") && document.body.innerText.toLowerCase().includes("share results")', 16000);
  await screenshot('05-results-390x844.png');
  await navigateFresh();
  await waitFor('document.body.innerText.toLowerCase().includes("all images reviewed") || document.body.innerText.toLowerCase().includes("today\'s results")', 16000);
  await screenshot('07-reload-completed-390x844.png');

  console.log(`Saved screenshots to ${outputDir}`);
} catch (err) {
  console.error("Test error occurred:", err);
  try {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(join(outputDir, 'error-timeout.png'), Buffer.from(shot.data, 'base64'));
    console.log("Saved error-timeout.png screenshot!");
  } catch (screenshotErr) {
    console.error("Failed to capture error screenshot:", screenshotErr);
  }
  throw err;
} finally {
  ws.close();
  chrome.kill();
  await new Promise(resolve => chrome.once('exit', resolve));
  await delay(300);
  await rm(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
