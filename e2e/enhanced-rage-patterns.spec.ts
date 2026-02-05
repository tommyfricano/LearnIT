import { test, expect, Page } from "@playwright/test";

/**
 * Enhanced Rage Click Patterns Test Suite
 *
 * Created to generate realistic escalating frustration signals in FullStory
 * These tests demonstrate modal and checkout friction with improved rage click patterns
 *
 * Tests run against: https://learn-it-demo.vercel.app
 */

/**
 * Helper: Simulate rage clicks with realistic escalating frustration patterns
 * FullStory detects 3+ clicks within 400ms as rage clicks
 *
 * Enhanced with:
 * - Variable timing that escalates from normal to frantic
 * - Realistic pause patterns (user realizes it's not working)
 * - Escalating intensity (gets faster with each burst)
 * - Multiple click bursts with brief pauses between
 */
async function rageClick(page: Page, selector: string, clicks = 6) {
  const element = page.locator(selector).first();

  // Wait for element to be visible before rage clicking
  try {
    await element.waitFor({ state: "visible", timeout: 5000 });
  } catch {
    // Element may not be visible, that's OK for some rage clicks
  }

  // Pattern: Start with normal clicks, escalate to rage
  const clicksPerBurst = Math.ceil(clicks / 3);

  try {
    // Burst 1: Normal frustrated clicking (slower)
    for (let i = 0; i < clicksPerBurst; i++) {
      await element.click({ force: true, timeout: 1000 });
      await page.waitForTimeout(120); // 120ms between clicks
    }

    // Brief pause (user realizes it's not working)
    await page.waitForTimeout(200);

    // Burst 2: Faster, more frustrated
    for (let i = 0; i < clicksPerBurst; i++) {
      await element.click({ force: true, timeout: 1000 });
      await page.waitForTimeout(60); // 60ms between clicks - triggers rage click
    }

    // Shorter pause (increasing frustration)
    await page.waitForTimeout(150);

    // Burst 3: Rapid fire rage clicks (peak frustration)
    for (let i = 0; i < clicksPerBurst; i++) {
      await element.click({ force: true, timeout: 1000 });
      await page.waitForTimeout(40); // 40ms between clicks - definite rage
    }
  } catch {
    // Ignore click failures during rage clicking
  }
}

/**
 * Helper: Multi-target rage clicking (frantically clicking between elements)
 * Simulates user desperately trying different UI elements to escape
 */
async function multiTargetRageClick(page: Page, selectors: string[], clicksPerTarget = 3) {
  for (const selector of selectors) {
    const element = page.locator(selector).first();
    try {
      await element.waitFor({ state: "visible", timeout: 2000 });
      // Rapid clicks on this target
      for (let i = 0; i < clicksPerTarget; i++) {
        await element.click({ force: true, timeout: 1000 });
        await page.waitForTimeout(50); // Fast clicking between targets
      }
      // Brief pause before moving to next target
      await page.waitForTimeout(100);
    } catch {
      // If element not found, skip to next target
      continue;
    }
  }
}

/**
 * Helper: Simulate dead clicks (clicking non-interactive areas)
 */
async function deadClick(page: Page, x: number, y: number, clicks = 3) {
  for (let i = 0; i < clicks; i++) {
    await page.mouse.click(x, y);
    await page.waitForTimeout(80);
  }
}

/**
 * Helper: Complete the signup form with all required fields
 */
async function fillSignupForm(page: Page, name: string, email: string) {
  await page.fill("#fullName", name);
  await page.fill("#email", email);
  await page.fill("#emailConfirm", email);
  // Role defaults to "student" which is fine
  // Check the terms checkbox
  await page.locator('input[type="checkbox"]').first().check();
}

test.describe("Funnel Volume - Successful Purchases", () => {
  test("generate 6 users who complete purchase despite all friction", async ({ page }) => {
    // These users endure the modal friction AND checkout fees to complete purchase
    // Shows that conversion IS possible, just rare due to friction

    test.setTimeout(300000); // 5 minutes for 6 full user journeys

    const totalUsers = 6;

    for (let i = 0; i < totalUsers; i++) {
      console.log(`\n--- Successful User ${i + 1}/${totalUsers}: Starting journey ---`);

      // Step 1: Signup
      await page.goto("/signup");
      const email = `successful-buyer-${Date.now()}-${i}@example.com`;
      await fillSignupForm(page, `Successful Buyer ${i + 1}`, email);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL("/dashboard", { timeout: 5000 });
      console.log(`User ${i + 1}: ✅ Signup successful`);

      // Step 2: Browse and Add to Cart
      await page.goto("/browse");
      await page.locator("text=Add to cart").first().click();
      await expect(page.locator("text=added to cart")).toBeVisible({ timeout: 2000 });
      console.log(`User ${i + 1}: ✅ Added to cart`);

      // Step 3: Go to cart and click Proceed to Checkout
      await page.goto("/cart");
      await page.locator("text=Proceed to Checkout").click();
      console.log(`User ${i + 1}: ✅ Clicked 'Proceed to Checkout'`);

      // Step 4: Endure the modal (wait for it to become dismissable)
      await expect(page.locator("text=Preparing Your Checkout...")).toBeVisible();
      console.log(`User ${i + 1}: ⏳ Waiting through forced modal delay...`);

      // Wait for upsell and buttons to be enabled (total modal delay is 4.5s, add buffer)
      await expect(page.locator("text=Wait! Don't Miss Out")).toBeVisible({ timeout: 8000 });
      await expect(page.locator("button:has-text('Continue to Checkout')")).toBeEnabled({ timeout: 12000 });
      console.log(`User ${i + 1}: ✅ Modal delay completed, proceeding to checkout`);

      // Click Continue to Checkout
      await page.locator("button:has-text('Continue to Checkout')").click();
      await expect(page).toHaveURL("/checkout-it", { timeout: 5000 });
      console.log(`User ${i + 1}: ✅ Reached checkout page`);

      // Step 5: See surprise fees but proceed anyway
      await expect(page.locator("text=Platform Fee")).toBeVisible();
      console.log(`User ${i + 1}: 💰 Sees surprise fees but deciding to proceed...`);

      // Fill out checkout form
      await page.fill("#cardNumber", "4242424242424242");
      await page.fill("#expiry", "12/28");
      await page.fill("#cvv", "123");
      await page.fill("#cardName", `Buyer ${i + 1}`);
      console.log(`User ${i + 1}: ✅ Filled payment form`);

      // Submit purchase
      await page.click("button[type='submit']");
      console.log(`User ${i + 1}: ⏳ Processing payment...`);

      // Wait for success
      await expect(page.locator("text=Purchase Complete!")).toBeVisible({ timeout: 8000 });
      console.log(`User ${i + 1}: 🎉 PURCHASE COMPLETE!\n`);

      // Clear storage for next user
      try {
        await page.evaluate(() => localStorage.clear());
      } catch {
        await page.goto("/");
        await page.evaluate(() => localStorage.clear());
      }
    }

    console.log(`\n=== SUCCESSFUL PURCHASES ===`);
    console.log(`✅ ${totalUsers} users completed full purchase flow`);
    console.log(`✅ Endured modal friction AND surprise fees`);
    console.log(`📊 These users prove conversion is possible (but rare)\n`);
  });
});

test.describe("Funnel Volume - Cart to Checkout Drop-off", () => {
  test("generate 10 users who abandon at modal after clicking Proceed to Checkout", async ({ page }) => {
    // This test creates volume at the critical drop-off point:
    // Cart_ProceedToCheckout → (Modal Abandonment) → Never reach Checkout_SubmitAttempt

    const totalUsers = 10;

    for (let i = 0; i < totalUsers; i++) {
      console.log(`\n--- User ${i + 1}/${totalUsers}: Starting journey ---`);

      // Step 1: Signup (SUCCESS - fires Signup_Success)
      await page.goto("/signup");
      const email = `modal-abandon-${Date.now()}-${i}@example.com`;
      await fillSignupForm(page, `Modal Abandoner ${i + 1}`, email);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL("/dashboard", { timeout: 5000 });
      console.log(`User ${i + 1}: ✅ Signup successful`);

      // Step 2: Browse and Add to Cart (SUCCESS - fires Browse_AddToCart)
      await page.goto("/browse");
      await page.locator("text=Add to cart").first().click();
      await expect(page.locator("text=added to cart")).toBeVisible({ timeout: 2000 });
      console.log(`User ${i + 1}: ✅ Added to cart`);

      // Step 3: Go to cart and click Proceed to Checkout (fires Cart_ProceedToCheckout)
      await page.goto("/cart");
      await page.locator("text=Proceed to Checkout").click();
      console.log(`User ${i + 1}: ✅ Clicked 'Proceed to Checkout' (Cart_ProceedToCheckout fired)`);

      // Step 4: ABANDON at modal (variety of abandonment behaviors)
      await expect(page.locator("text=Preparing Your Checkout...")).toBeVisible();

      // Vary the abandonment behavior for realistic data
      const abandonmentType = i % 4;

      switch (abandonmentType) {
        case 0:
          // Rage click backdrop and abandon
          console.log(`User ${i + 1}: 🔥 Rage clicking backdrop, giving up...`);
          const viewport = page.viewportSize();
          if (viewport) {
            await deadClick(page, 50, 50, 6);
            await deadClick(page, viewport.width - 50, 50, 6);
          }
          await page.goto("/"); // Navigate away
          break;

        case 1:
          // Wait for upsell, rage click buttons, then abandon
          console.log(`User ${i + 1}: 🔥 Rage clicking disabled buttons, giving up...`);
          await expect(page.locator("text=Wait! Don't Miss Out")).toBeVisible({ timeout: 6000 });
          await rageClick(page, "button:has-text('Continue to Checkout')", 12);
          await page.goto("/"); // Navigate away
          break;

        case 2:
          // Multi-target rage then abandon
          console.log(`User ${i + 1}: 🔥 Frantically clicking everything, giving up...`);
          await expect(page.locator("text=Wait! Don't Miss Out")).toBeVisible({ timeout: 6000 });
          await multiTargetRageClick(
            page,
            [
              "button:has-text('Continue to Checkout')",
              "text=No thanks, just checkout",
              "button:has-text('Continue to Checkout')",
            ],
            4
          );
          await page.goBack(); // Go back to cart, then leave
          await page.goto("/");
          break;

        case 3:
          // Quick rage click during "Preparing" then tab close
          console.log(`User ${i + 1}: 🔥 Rage clicking during loading, closing tab...`);
          const vp = page.viewportSize();
          if (vp) {
            await deadClick(page, vp.width / 2, vp.height / 2, 8);
          }
          await page.goto("about:blank"); // Simulate tab close
          break;
      }

      console.log(`User ${i + 1}: ❌ ABANDONED at modal (never reached checkout page)`);
      console.log(`User ${i + 1}: ❌ Checkout_SubmitAttempt NEVER fired\n`);

      // Clear storage for next user (navigate to site first if on about:blank)
      try {
        await page.evaluate(() => localStorage.clear());
      } catch {
        // If on about:blank or other restricted page, navigate to home first
        await page.goto("/");
        await page.evaluate(() => localStorage.clear());
      }
    }

    console.log(`\n=== FUNNEL IMPACT ===`);
    console.log(`✅ ${totalUsers} users fired Cart_ProceedToCheckout`);
    console.log(`❌ 0 users fired Checkout_SubmitAttempt`);
    console.log(`📊 100% drop-off rate at modal\n`);
  });
});

test.describe("Enhanced Frustration Signals - Escalating Rage Patterns", () => {
  test("escalating rage clicks on disabled Continue to Checkout button", async ({ page }) => {
    // Setup
    await page.goto("/signup");
    const email = `escalating-rage-${Date.now()}@example.com`;
    await fillSignupForm(page, "Escalating Rage User", email);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

    // Add to cart
    await page.goto("/browse");
    await page.locator("text=Add to cart").first().click();
    await expect(page.locator("text=added to cart")).toBeVisible({ timeout: 2000 });

    // Go to cart and trigger modal
    await page.goto("/cart");
    await page.locator("text=Proceed to Checkout").click();

    // Wait for upsell step
    await expect(page.locator("text=Wait! Don't Miss Out")).toBeVisible({ timeout: 6000 });

    // Enhanced rage click pattern - starts slow, escalates to frantic
    console.log("Generating escalating rage clicks on Continue to Checkout button...");
    await rageClick(page, "button:has-text('Continue to Checkout')", 9);

    // Wait for button to become enabled
    await expect(page.locator("button:has-text('Continue to Checkout')")).toBeEnabled({ timeout: 8000 });
  });

  test("multi-target rage clicking between modal elements in desperation", async ({ page }) => {
    // Setup
    await page.goto("/signup");
    const email = `multi-rage-${Date.now()}@example.com`;
    await fillSignupForm(page, "Multi Rage User", email);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

    // Add to cart
    await page.goto("/browse");
    await page.locator("text=Add to cart").first().click();
    await expect(page.locator("text=added to cart")).toBeVisible({ timeout: 2000 });

    // Go to cart and trigger modal
    await page.goto("/cart");
    await page.locator("text=Proceed to Checkout").click();

    // Wait for upsell step
    await expect(page.locator("text=Wait! Don't Miss Out")).toBeVisible({ timeout: 6000 });

    console.log("User frantically clicking between multiple modal elements...");
    // User desperately tries clicking different elements to escape
    await multiTargetRageClick(
      page,
      [
        "button:has-text('Continue to Checkout')",
        "text=No thanks, just checkout",
        "text=Reviewing recommendations",
        "button:has-text('Continue to Checkout')", // Try main button again
      ],
      4
    );

    // Wait for button to become enabled
    await expect(page.locator("button:has-text('Continue to Checkout')")).toBeEnabled({ timeout: 8000 });
  });

  test("rage clicking during 'Preparing Your Checkout' phase", async ({ page }) => {
    // Setup
    await page.goto("/signup");
    const email = `preparing-rage-${Date.now()}@example.com`;
    await fillSignupForm(page, "Preparing Phase Rage", email);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

    // Add to cart
    await page.goto("/browse");
    await page.locator("text=Add to cart").first().click();
    await expect(page.locator("text=added to cart")).toBeVisible({ timeout: 2000 });

    // Go to cart and trigger modal
    await page.goto("/cart");
    await page.locator("text=Proceed to Checkout").click();

    // Immediately rage click during "Preparing..." phase
    await expect(page.locator("text=Preparing Your Checkout...")).toBeVisible();
    console.log("User rage clicking during forced 'Preparing' delay...");

    // Get viewport for backdrop clicks
    const viewport = page.viewportSize();
    if (viewport) {
      // Frantically click backdrop trying to dismiss
      await deadClick(page, 50, 50, 4);
      await deadClick(page, viewport.width - 50, 50, 4);
      await deadClick(page, viewport.width / 2, viewport.height / 2, 4);
    }

    // Wait for upsell to appear
    await expect(page.locator("text=Wait! Don't Miss Out")).toBeVisible({ timeout: 5000 });
  });

  test("multi-element rage clicking on checkout fees in sequence", async ({ page }) => {
    // Setup
    await page.goto("/signup");
    const email = `fee-rage-${Date.now()}@example.com`;
    await fillSignupForm(page, "Fee Rage User", email);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

    // Add to cart and get through modal
    await page.goto("/browse");
    await page.locator("text=Add to cart").first().click();
    await expect(page.locator("text=added to cart")).toBeVisible({ timeout: 2000 });

    await page.goto("/cart");
    await page.click("text=Proceed to Checkout");
    await expect(page.locator("button:has-text('Continue to Checkout')")).toBeEnabled({ timeout: 7000 });
    await page.locator("button:has-text('Continue to Checkout')").click();

    // Now on checkout - user sees fees and rage clicks in frustration
    await expect(page).toHaveURL("/checkout-it");
    await expect(page.locator("text=Platform Fee")).toBeVisible();

    console.log("User rage clicking on surprise fees in shock and frustration...");
    // Frantically clicking each fee element
    await multiTargetRageClick(
      page,
      [
        "text=Platform Fee",
        "text=$4.99",
        "text=Tax (8.25%)",
        "text=Total",
        "text=Platform Fee", // Click again in disbelief
      ],
      3
    );

    // Final rage click on submit button without filling form
    await rageClick(page, "button[type='submit']", 9);
  });

  test("combined escalating rage: modal then fees", async ({ page }) => {
    // Setup
    await page.goto("/signup");
    const email = `combined-escalating-${Date.now()}@example.com`;
    await fillSignupForm(page, "Combined Escalating Rage", email);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

    // Add to cart
    await page.goto("/browse");
    await page.locator("text=Add to cart").first().click();
    await expect(page.locator("text=added to cart")).toBeVisible({ timeout: 2000 });

    await page.goto("/cart");
    await page.locator("text=Proceed to Checkout").click();

    // Phase 1: Rage at modal
    await expect(page.locator("text=Wait! Don't Miss Out")).toBeVisible({ timeout: 6000 });
    console.log("Phase 1: Escalating rage at modal...");
    await rageClick(page, "button:has-text('Continue to Checkout')", 12);

    await expect(page.locator("button:has-text('Continue to Checkout')")).toBeEnabled({ timeout: 8000 });
    await page.locator("button:has-text('Continue to Checkout')").click();

    // Phase 2: Even more rage at fees (frustration compounds)
    await expect(page).toHaveURL("/checkout-it");
    await expect(page.locator("text=Platform Fee")).toBeVisible();

    console.log("Phase 2: Compounded rage at surprise fees...");
    // User is even more frustrated now (escalating pattern)
    await multiTargetRageClick(
      page,
      [
        "text=Platform Fee",
        "text=$4.99",
        "text=Tax (8.25%)",
      ],
      5 // More clicks per target than before
    );

    // Peak frustration - rapid fire rage on submit
    await rageClick(page, "button[type='submit']", 15);

    // User abandons in frustration
    await page.goBack();
  });
});
