const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOTS_DIR = '/Users/paulvillanueva/.openclaw/shared/pipeline/build-screenshots';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  console.log('Navigating to hub-research...');
  await page.goto('http://localhost:3001/hub-research', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Wait for briefs to load (SWR fetch)
  await page.waitForTimeout(3000);

  // Take initial screenshot
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/qa-hub-research-loaded.png`, fullPage: true });
  console.log('Saved: qa-hub-research-loaded.png');

  // Click Performance tab
  const perfTab = page.locator('button:has-text("Performance"), [role="tab"]:has-text("Performance")');
  if (await perfTab.count() > 0) {
    await perfTab.first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/qa-performance-tab.png`, fullPage: true });
    console.log('Saved: qa-performance-tab.png');

    // Check if there are Pending Feedback items
    const pendingItems = page.locator('text=Pending Feedback');
    console.log('Pending Feedback heading found:', await pendingItems.count() > 0);

    // Check for needs-work button
    const needsWorkBtn = page.locator('button:has-text("Needs work")').first();
    if (await needsWorkBtn.count() > 0) {
      console.log('Found "Needs work" button, clicking...');
      await needsWorkBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/qa-needs-work-selected.png`, fullPage: true });
      console.log('Saved: qa-needs-work-selected.png');

      // Check for file input
      const fileInput = page.locator('input[type="file"]');
      console.log('File input visible:', await fileInput.count() > 0);

      // Check for "Attach screenshot" label
      const attachLabel = page.locator('text=Attach screenshot');
      console.log('Attach screenshot label found:', await attachLabel.count() > 0);

      // Now click a tag (e.g., incomplete) and then submit
      const incompleteTag = page.locator('button:has-text("incomplete")').first();
      if (await incompleteTag.count() > 0) {
        await incompleteTag.click();
        await page.waitForTimeout(300);

        // Submit
        const submitBtn = page.locator('button:has-text("Submit Rating")').first();
        if (await submitBtn.count() > 0 && !(await submitBtn.isDisabled())) {
          console.log('Submitting rating...');
          await submitBtn.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: `${SCREENSHOTS_DIR}/qa-after-submit.png`, fullPage: true });
          console.log('Saved: qa-after-submit.png');

          // Check for success banner
          const successBanner = page.locator('text=Fix brief created');
          console.log('Success banner found:', await successBanner.count() > 0);
        } else {
          console.log('Submit button disabled or not found');
        }
      } else {
        console.log('Could not find incomplete tag');
      }
    } else {
      console.log('No "Needs work" button found - checking what is visible...');
      const bodyText = await page.locator('body').innerText();
      const snippet = bodyText.substring(0, 500);
      console.log('Page content snippet:', snippet);
    }
  } else {
    console.log('Performance tab not found');
  }

  await browser.close();
  console.log('Done.');
})();
