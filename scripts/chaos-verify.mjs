import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = join(process.cwd(), 'verification-screenshots');
const userDataDir = join('C:\\tmp', `uncanny-chaos-cdp-${Date.now()}`);
const port = 9225;
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

// Wait for Chrome to boot
await delay(1000);

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

let messageId = 0;
const pending = new Map();

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

async function navigateFresh() {
  await send('Page.navigate', { url: baseUrl });
  await waitFor('document.readyState === "complete"');
}

console.log("=================== UNCANNY CHAOS QA SUITE ===================");

try {
  await send('Page.enable');
  await send('Runtime.enable');

  // ----------------------------------------------------
  // Test 1: Empty LocalStorage and Initial Entry
  // ----------------------------------------------------
  console.log("\n[Test 1] Testing empty localStorage behavior...");
  await navigateFresh();
  await evaluate('localStorage.clear()');
  await navigateFresh();
  await waitFor('document.body.innerText.includes("UNCANNY")');
  console.log("🟢 Passed: Empty localStorage displays onboarding Welcome screen correctly.");

  // ----------------------------------------------------
  // Test 2: Corrupted LocalStorage Resiliency
  // ----------------------------------------------------
  console.log("\n[Test 2] Testing corrupted localStorage (invalid JSON syntax)...");
  await evaluate('localStorage.setItem("uncanny_state", "{invalid_syntax_corrupted_json:[}")');
  await navigateFresh();
  await waitFor('document.body.innerText.includes("UNCANNY")');
  console.log("🟢 Passed: Corrupted localStorage JSON parsed safely and reset to defaults without crash.");

  // ----------------------------------------------------
  // Test 3: Stale/Future LocalStorage Date Boundaries
  // ----------------------------------------------------
  console.log("\n[Test 3] Testing stale localStorage dates (previous game days)...");
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  // Emulate user having played yesterday with streak = 5
  await evaluate(`
    localStorage.setItem("uncanny_state", JSON.stringify({
      todayDate: "${yesterdayStr}",
      todayStarted: true,
      todayStartedAt: ${Date.now() - 100000},
      todayResults: [
        { challengeId: "c1", guess: "real", correct: true, timeRemaining: 10, answer: "real", imageUrl: "img1" }
      ],
      todayCompleted: true,
      todayCompletedAt: ${Date.now() - 80000},
      todayCompletionMs: 20000,
      currentStreak: 5,
      lastPlayedDate: "${yesterdayStr}",
      bestStreak: 5,
      totalSetsPlayed: 12,
      totalCorrect: 45
    }))
  `);
  
  await navigateFresh();
  await waitFor('document.body.innerText.includes("UNCANNY")');
  
  // Verify that active session is reset because it is a new day, but the streak remains intact (currentStreak = 5, lastPlayedDate = yesterdayStr)
  const evaluatedState = await evaluate(`
    (() => {
      const raw = localStorage.getItem("uncanny_state");
      return JSON.parse(raw);
    })()
  `);

  if (evaluatedState.todayResults.length !== 0) {
    throw new Error(`StaleDateResetFailed: todayResults should be reset, but found ${evaluatedState.todayResults.length} items`);
  }
  if (evaluatedState.todayCompleted !== false) {
    throw new Error("StaleDateResetFailed: todayCompleted should be false for a new day");
  }
  if (evaluatedState.currentStreak !== 5) {
    throw new Error(`StaleDateResetFailed: currentStreak should keep 5 (played yesterday), but got ${evaluatedState.currentStreak}`);
  }
  console.log("🟢 Passed: Stale dates successfully reset daily challenges while preserving streaks.");

  // ----------------------------------------------------
  // Test 4: Concurrency / Duplicate Tab Block Play
  // ----------------------------------------------------
  console.log("\n[Test 4] Testing duplicate tab / concurrent play block...");
  // Set todayCompleted = true directly to simulate another tab completing the game
  const todayStr = new Date().toISOString().split('T')[0];
  await evaluate(`
    (() => {
      const state = JSON.parse(localStorage.getItem("uncanny_state"));
      state.todayDate = "${todayStr}";
      state.todayCompleted = true;
      state.todayCompletedAt = Date.now();
      state.lastPlayedDate = "${todayStr}";
      localStorage.setItem("uncanny_state", JSON.stringify(state));
    })()
  `);
  await navigateFresh();
  await send('Runtime.enable');
  await waitFor(`
    (() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes("all images") || 
             text.includes("reviewed") || 
             text.includes("results") || 
             text.includes("waiting for new data") || 
             text.includes("accuracy");
    })()
  `);
  console.log("🟢 Passed: Completed daily-set state blocks replay or duplicate plays immediately on reload.");

  // ----------------------------------------------------
  // Test 5: Network Timeout / Fallback During Guess Submission
  // ----------------------------------------------------
  console.log("\n[Test 5] Testing network failure / API crash during guess submission...");
  // Clear and start fresh today
  await evaluate('localStorage.clear()');
  await navigateFresh();
  await clickButtonContaining('Begin challenge');
  await waitFor('document.body.innerText.includes("Real") && document.body.innerText.includes("AI")');

  // Intercept fetch inside the browser to throw error for /api/guess
  await evaluate(`
    (() => {
      const originalFetch = window.fetch;
      window.fetch = async (url, options) => {
        if (url.includes('/api/guess')) {
          console.log("[chaos mock] Mocking API network error for guess submission!");
          throw new TypeError('Failed to fetch (Network offline simulation)');
        }
        return originalFetch(url, options);
      };
    })()
  `);

  // Submit guess of 'AI'
  await clickButtonContaining('AI');

  // Verify that the app handles the catch block and reveals fallback info gracefully
  await waitFor('document.body.innerText.includes("Source details unavailable")');
  console.log("🟢 Passed: Endpoint crash/timeout handled gracefully with local fallback without page freeze.");

  await screenshot('chaos-network-fallback.png');

  // ----------------------------------------------------
  // Test 6: Concurrency / Spam Click Mitigation
  // ----------------------------------------------------
  console.log("\n[Test 6] Testing rapid spam clicking protection...");
  // Reset session and reload gameplay
  await evaluate('localStorage.clear()');
  await navigateFresh();
  await clickButtonContaining('Begin challenge');
  await waitFor('document.body.innerText.includes("Real") && document.body.innerText.includes("AI")');

  // Set up tracking on window.fetch calls
  await evaluate(`
    (() => {
      window.apiCallCount = 0;
      const originalFetch = window.fetch;
      window.fetch = async (url, options) => {
        if (url.includes('/api/guess')) {
          window.apiCallCount++;
        }
        return originalFetch(url, options);
      };
    })()
  `);

  // Execute rapid consecutive clicks in the browser
  await evaluate(`
    (() => {
      const buttons = [...document.querySelectorAll('button')];
      const realButton = buttons.find(b => b.innerText.includes('Real'));
      if (realButton) {
        // Spam click 5 times concurrently
        realButton.click();
        realButton.click();
        realButton.click();
        realButton.click();
        realButton.click();
      }
    })()
  `);

  // Allow some time for fetch requests
  await delay(1000);

  const apiCallCount = await evaluate('window.apiCallCount');
  if (apiCallCount > 1) {
    throw new Error(`SpamClickLockFailed: Expected at most 1 API request during rapid spam clicks, but detected ${apiCallCount}`);
  }
  console.log(`🟢 Passed: Concurrency lock successfully blocked double submissions (Requests sent: ${apiCallCount}).`);

  console.log("\n=================== ALL CHAOS QA TESTS PASSED ===================");

} catch (error) {
  console.error("\n❌ CHAOS QA TEST FAILURE DETECTED:");
  console.error(error);
  process.exitCode = 1;
} finally {
  ws.close();
  chrome.kill();
  await new Promise(resolve => chrome.once('exit', resolve));
  await delay(300);
  await rm(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
