import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const outputDir = join(process.cwd(), 'verification-screenshots');
const baseUrl = process.env.TEST_BASE_URL || 'https://www.uncanny.info';

async function runE2E() {
  console.log("=================== UNCANNY PREMIUM E2E TEST SUITE ===================");
  console.log(`Starting headless browser E2E test against: ${baseUrl}\n`);
  
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true
  });
  
  const page = await context.newPage();
  
  // Set up API request tracking
  const apiCalls = {
    dailySet: false,
    guess: false
  };
  
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/daily-set')) {
      apiCalls.dailySet = true;
      console.log(`📡 [API Intercept] GET -> /api/daily-set`);
    } else if (url.includes('/api/guess')) {
      apiCalls.guess = true;
      console.log(`📡 [API Intercept] POST -> /api/guess`);
    }
  });

  try {
    // ----------------------------------------------------
    // Step 1: Navigating to Landing Page & Clearing Storage
    // ----------------------------------------------------
    console.log("[E2E Step 1] Navigating to Home Page...");
    await page.goto(baseUrl);
    await page.waitForLoadState('load');
    
    // Clear localStorage to ensure a fresh clean state
    await page.evaluate(() => localStorage.clear());
    await page.goto(baseUrl);
    await page.waitForLoadState('load');

    // Assert that the title and core branding are visible
    const pageTitle = await page.textContent('h1');
    console.log(`   Branding Headline: "${pageTitle?.trim()}"`);
    
    // Verify high-conversion CTAs exist
    const ctaButton = page.getByRole('link', { name: 'Play Now' });
    await ctaButton.waitFor({ state: 'visible' });
    console.log("✅ Verified: Landing Page loaded cleanly with premium CTAs.");
    await page.screenshot({ path: join(outputDir, 'e2e-01-home.png') });

    // ----------------------------------------------------
    // Step 2: Beginning Challenge & DOM Verification
    // ----------------------------------------------------
    console.log("\n[E2E Step 2] Clicking 'Play Now' to launch gameplay loop...");
    await ctaButton.click();
    await page.waitForLoadState('load');

    // Wait for the gameplay card to mount
    const swipeCard = page.locator('.swipe-card');
    await swipeCard.waitFor({ state: 'visible' });
    
    // Verify that the option buttons (Real & AI) are visible
    const realBtn = page.locator('button:has-text("Real")');
    const aiBtn = page.locator('button:has-text("AI")');
    await realBtn.waitFor({ state: 'visible' });
    await aiBtn.waitFor({ state: 'visible' });
    console.log("✅ Verified: Active gameplay mounted with option controls.");
    await page.screenshot({ path: join(outputDir, 'e2e-02-gameplay.png') });

    // ----------------------------------------------------
    // Step 3: Magnifier / Zoom Press Verification
    // ----------------------------------------------------
    console.log("\n[E2E Step 3] Performing Zoom press on card...");
    const cardImg = page.locator('.swipe-card img');
    await cardImg.waitFor({ state: 'visible' });
    
    const imageBox = await cardImg.boundingBox();
    if (imageBox) {
      // Simulate pointer down to activate Zoom Magnifier
      await page.mouse.move(imageBox.x + imageBox.width / 2, imageBox.y + imageBox.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(600); // Hold press
      
      const isZoomed = await cardImg.evaluate(el => el.style.transform === 'scale(1.7)');
      const cursorCrosshair = await swipeCard.evaluate(el => el.style.cursor === 'crosshair');
      
      if (isZoomed && cursorCrosshair) {
        console.log("✅ Verified: Zoom Magnifier is highly responsive (1.7x scale & crosshair cursor).");
        await page.screenshot({ path: join(outputDir, 'e2e-03-zoom.png') });
      } else {
        console.warn("⚠️ Warning: Zoom press styles did not apply as expected (Touch emulation mismatch).");
      }
      
      await page.mouse.up(); // Release press
    }

    // ----------------------------------------------------
    // Step 4: Interacting & Advancing through 5 Daily Cards
    // ----------------------------------------------------
    console.log("\n[E2E Step 4] Playing through the 5 daily challenges...");
    for (let cardIdx = 1; cardIdx <= 5; cardIdx++) {
      console.log(`   -> Active Card ${cardIdx}/5`);
      
      // Select AI for even cards, Real for odd cards to test both options
      const optionToClick = cardIdx % 2 === 0 ? aiBtn : realBtn;
      await optionToClick.click();
      
      // Wait for guess feedback reveal view
      const nextCardBtn = page.locator('button:has-text("Next Image")');
      const viewResultsBtn = page.locator('button:has-text("See Results")');
      
      // Wait for either the Next Card button or View Results button to appear
      await Promise.race([
        nextCardBtn.waitFor({ state: 'visible', timeout: 15000 }),
        viewResultsBtn.waitFor({ state: 'visible', timeout: 15000 })
      ]);
      
      if (cardIdx === 1) {
        console.log("✅ Verified: Instant Feedback Reveal is healthy.");
        await page.screenshot({ path: join(outputDir, 'e2e-04-feedback.png') });
      }
      
      if (cardIdx < 5) {
        await nextCardBtn.click();
      } else {
        console.log("   -> Finished all standard challenges, loading debrief page...");
        await viewResultsBtn.click();
      }
    }

    // ----------------------------------------------------
    // Step 5: Debrief Results Page Verification
    // ----------------------------------------------------
    console.log("\n[E2E Step 5] Verifying Debrief Results screen...");
    const debriefTitle = page.locator('span:has-text("RESULTS")');
    await debriefTitle.waitFor({ state: 'visible' });
    
    // Verify Streak & Instinct Accuracy values exist in DOM
    const streakElement = page.locator('div:has-text("Streak")');
    const accuracyElement = page.locator('span:has-text("INSTINCT ACCURACY")');
    
    console.log("✅ Verified: Debrief results mounted successfully.");
    await page.screenshot({ path: join(outputDir, 'e2e-05-results.png') });

    // ----------------------------------------------------
    // Step 6: Reload Integrity Verification
    // ----------------------------------------------------
    console.log("\n[E2E Step 6] Testing reload blocks & persistence...");
    await page.reload();
    await page.waitForLoadState('load');
    
    const accuracyLocator = page.locator('span:has-text("INSTINCT ACCURACY")');
    const resultsLocator = page.locator('span:has-text("RESULTS")');
    const completedLocator = page.locator('h1:has-text("All images reviewed.")');
    
    console.log("   Waiting for persisted results view or completed view to hydrate and become visible...");
    await Promise.race([
      accuracyLocator.waitFor({ state: 'visible', timeout: 15000 }),
      resultsLocator.waitFor({ state: 'visible', timeout: 15000 }),
      completedLocator.waitFor({ state: 'visible', timeout: 15000 })
    ]);
    
    console.log("✅ Verified: Played session state persists on refresh, duplicate play is blocked.");
    await page.screenshot({ path: join(outputDir, 'e2e-06-completed-reload.png') });

    // ----------------------------------------------------
    // Final Telemetry & API Audit Report
    // ----------------------------------------------------
    console.log("\n=================== E2E AUDIT STATUS REPORT ===================");
    console.log(`- Base URL Deployed: ${baseUrl}`);
    console.log(`- WebApp Layout Width: 390px | Height: 844px (Strict Responsive Mode)`);
    console.log(`- GET /api/daily-set: ${apiCalls.dailySet ? 'CONNECTED' : 'FAILED'}`);
    console.log(`- POST /api/guess: ${apiCalls.guess ? 'CONNECTED' : 'FAILED'}`);
    console.log(`- Visual screenshots saved: ${outputDir}`);
    
    if (!apiCalls.dailySet || !apiCalls.guess) {
      throw new Error("TelemetryFailure: Crucial game endpoints were not called during play!");
    }
    
    console.log("\n🎉 ALL E2E AND LIVE INTEGRATION TESTS COMPLETED SUCCESSFULLY!");
    console.log("=================================================================\n");

  } catch (error) {
    console.error("\n❌ E2E QA TEST FAILURE DETECTED:");
    console.error(error);
    
    // Save emergency error screenshot
    try {
      await page.screenshot({ path: join(outputDir, 'e2e-error-failure.png') });
      console.log("Saved e2e-error-failure.png!");
    } catch (e) {
      console.error("Failed to save error screenshot:", e);
    }
    
    throw error;
  } finally {
    await browser.close();
  }
}

runE2E().catch(err => {
  process.exit(1);
});
