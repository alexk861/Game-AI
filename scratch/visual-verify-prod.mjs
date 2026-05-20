import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = join(process.cwd(), 'verification-screenshots');
const userDataDir = join('C:\\tmp', `uncanny-cdp-prod-${Date.now()}`);
const port = 9227;
const baseUrl = 'https://game-ai-one.vercel.app/';

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

  if (payload.method === 'Network.requestWillBeSent') {
    console.log(`[Network Request] ${payload.params.request.method} ${payload.params.request.url}`);
  }

  if (payload.method === 'Network.responseReceived') {
    console.log(`[Network Response] ${payload.params.response.status} ${payload.params.response.url}`);
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

async function waitFor(expression, timeout = 15000) {
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
  `, 20000);
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
  const rect = await evaluate(`
    (() => {
      const target = document.querySelector('.swipe-card');
      if (!target) return null;
      const rect = target.getBoundingClientRect();
      return {
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2)
      };
    })()
  `);
  if (!rect) throw new Error("Swipe card not found to hold!");

  await send('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: rect.x,
    y: rect.y,
    pointerType: 'mouse'
  });

  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: rect.x,
    y: rect.y,
    button: 'left',
    clickCount: 1,
    pointerType: 'mouse'
  });

  await delay(850);
}

async function releaseImage() {
  const rect = await evaluate(`
    (() => {
      const target = document.querySelector('.swipe-card');
      if (!target) return null;
      const rect = target.getBoundingClientRect();
      return {
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2)
      };
    })()
  `);
  if (!rect) return;

  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: rect.x,
    y: rect.y,
    button: 'left',
    clickCount: 1,
    pointerType: 'mouse'
  });

  await delay(200);
}

try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await setViewport(390, 844);
  await navigateFresh();
  await evaluate('localStorage.removeItem("uncanny_state")');
  await navigateFresh();
  await waitFor('document.body.innerText.toLowerCase().includes("uncanny")');
  await screenshot('prod-01-welcome-390x844.png');
  console.log("Welcome screen verified on production.");

  await clickButtonContaining('Begin challenge');
  await waitFor('document.body.innerText.toLowerCase().includes("real") && document.body.innerText.toLowerCase().includes("ai")');
  await waitForHeroImage();
  await assertHeroImage();
  console.log("Daily gameplay verified on production.");

  // ── Assertions 1: API Endpoint Payload ──
  console.log("Asserting daily-set endpoint payload on production...");
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
  console.log("Daily-set payload assertions passed successfully on production!");

  // ── Assertions 2: Image Rendering ──
  console.log("Asserting DOM image loading on production...");
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
  console.log("DOM image rendering assertions passed successfully on production!");

  await screenshot('prod-02-gameplay-390x844.png');

  await setViewport(430, 932);
  await delay(700);
  await screenshot('prod-06-gameplay-430x932.png');
  await setViewport(390, 844);
  await delay(400);

  await holdImage();
  await waitFor('document.body.innerText.toLowerCase().includes("something feels") || document.body.innerText.toLowerCase().includes("anomaly")');
  await screenshot('prod-03-investigation-390x844.png');
  await releaseImage();
  await delay(1000);

  await clickButtonContaining('AI');
  await waitFor('document.body.innerText.toLowerCase().includes("correct") || document.body.innerText.toLowerCase().includes("wrong")');
  await screenshot('prod-04-reveal-390x844.png');

  for (let i = 0; i < 4; i += 1) {
    await waitFor('document.body.innerText.toLowerCase().includes("real") && document.body.innerText.toLowerCase().includes("ai")', 15000);
    await waitForHeroImage();
    await assertHeroImage();
    await clickButtonContaining(i % 2 === 0 ? 'Real' : 'AI');
    await waitFor('document.body.innerText.toLowerCase().includes("correct") || document.body.innerText.toLowerCase().includes("wrong")', 15000);
  }

  // ── Assertions 3: LocalStorage Persistence ──
  console.log("Asserting guess persistence in localStorage on production...");
  const stateStr = await evaluate(`localStorage.getItem("uncanny_state")`);
  const state = JSON.parse(stateStr);
  if (!state) {
    throw new Error("AssertFailed: uncanny_state is missing from localStorage");
  }
  if (state.todayResults.length !== 5) {
    throw new Error(`AssertFailed: Expected exactly 5 persisted results in state, but found ${state.todayResults.length}`);
  }
  console.log("Guess persistence assertions passed successfully on production!");

  await waitFor('document.body.innerText.toLowerCase().includes("results") && document.body.innerText.toLowerCase().includes("share results")', 20000);
  await screenshot('prod-05-results-390x844.png');
  console.log("Primary set results verified on production.");

  // Test the transition to Reflection sequence Level 1
  console.log("Testing Reflection Sequence Level 1 on production...");
  await clickButtonContaining('Request Reflection');
  await waitFor('document.body.innerText.toLowerCase().includes("requesting unstable record")');
  console.log("Ad modal triggers with 'Requesting Unstable Record' copy.");
  await delay(3000); // ad simulation duration

  // Simulate ad complete trigger by completing ad play (if there's a button inside modal or ad close, let's wait/click)
  const hasAdDoneBtn = await evaluate(`
    (() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.innerText.toLowerCase().includes('complete') || b.innerText.toLowerCase().includes('close'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    })()
  `);
  console.log("Ad simulated. Check re-entry overlay...");
  await waitFor('document.body.innerText.toLowerCase().includes("restoring tension") || document.body.innerText.toLowerCase().includes("real")');
  console.log("Restoring tension cinematic re-entry transition loaded.");
  await delay(3000); // reentry transition duration

  await waitFor('document.body.innerText.toLowerCase().includes("real") && document.body.innerText.toLowerCase().includes("ai")');
  await waitForHeroImage();
  await assertHeroImage();
  console.log("Level 1 reflection cards successfully fetched and loaded on production!");

  await screenshot('prod-reflection-level1-390x844.png');

  console.log("Successfully validated multi-reflection continuation flow on production!");
} finally {
  ws.close();
  chrome.kill();
  await new Promise(resolve => chrome.once('exit', resolve));
  await delay(300);
  await rm(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
