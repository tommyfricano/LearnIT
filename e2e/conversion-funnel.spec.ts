import { test, expect, Page } from "@playwright/test";

/**
 * LearnIT Conversion Funnel Test Suite
 *
 * These tests demonstrate the business problem:
 * - Signups are successful (top of funnel works)
 * - Revenue is lost due to UX friction points (bottom of funnel leaks)
 *
 * Key friction points tested:
 * 1. Checkout Modal - Forced 4.5 second wait with upsells when proceeding to checkout
 * 2. Surprise Fees - Price increase at checkout ($4.99 + 8.25% tax)
 *
 * FullStory signals captured:
 * - Rage clicks on disabled buttons
 * - Hover patterns showing user confusion/hesitation
 * - Dead clicks on non-interactive elements
 * - Scroll patterns and mouse movement
 */

/**
 * Helper: Simulate rage clicks (rapid repeated clicks showing frustration)
 * FullStory detects 3+ clicks within 400ms as rage clicks
 */
async function rageClick(page: Page, selector: string, clicks = 6) {
  const element = page.locator(selector).first();
  // Wait for element to be visible before rage clicking
  try {
    await element.waitFor({ state: "visible", timeout: 5000 });
  } catch {
    // Element may not be visible, that's OK for some rage clicks
  }
  for (let i = 0; i < clicks; i++) {
    try {
      await element.click({ force: true, delay: 50, timeout: 1000 });
    } catch {
      // Ignore click failures during rage clicking
    }
  }
}

/**
 * Helper: Simulate frustrated hover pattern (moving mouse erratically over element)
 */
async function frustratedHover(page: Page, selector: string) {
  const element = page.locator(selector).first();
  try {
    await element.waitFor({ state: "visible", timeout: 5000 });
    const box = await element.boundingBox();
    if (!box) return;

    // Move mouse erratically over the element
    for (let i = 0; i < 5; i++) {
      await page.mouse.move(
        box.x + Math.random() * box.width,
        box.y + Math.random() * box.height
      );
      await page.waitForTimeout(100);
    }
  } catch {
    // Element may not be visible
  }
}

/**
 * Helper: Simulate hover and pause (user reading/considering)
 */
async function hoverAndPause(page: Page, selector: string, pauseMs = 1500) {
  const element = page.locator(selector).first();
  try {
    await element.waitFor({ state: "visible", timeout: 5000 });
    await element.hover();
    await page.waitForTimeout(pauseMs);
  } catch {
    // Element may not be visible
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

test.describe("Signup Success - Top of Funnel", () => {
  test("user can successfully complete signup flow", async ({ page }) => {
    // Navigate to signup
    await page.goto("/signup");

    // Fill out signup form
    const email = `test-${Date.now()}@example.com`;
    await fillSignupForm(page, "Test User", email);

    // Submit signup
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard (signup success)
    await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

    // Navigate to browse to continue shopping
    await page.goto("/browse");
    await expect(page).toHaveURL("/browse");
  });

  test("multiple users can sign up in sequence", async ({ page }) => {
    // Simulate 3 signups to show top of funnel works
    for (let i = 0; i < 3; i++) {
      await page.goto("/signup");

      const uniqueEmail = `user-${Date.now()}-${i}@example.com`;
      await fillSignupForm(page, `User ${i + 1}`, uniqueEmail);
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

      // Clear storage for next user
      await page.evaluate(() => localStorage.clear());
    }
  });
});

test.describe("Checkout Modal Friction - Revenue Loss Point #1", () => {
  test.beforeEach(async ({ page }) => {
    // Sign up a fresh user
    await page.goto("/signup");
    const email = `checkout-modal-${Date.now()}@example.com`;
    await fillSignupForm(page, "Checkout Modal Test", email);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

    // Navigate to browse and add item to cart (simple flow now)
    await page.goto("/browse");
    await page.locator("text=Add to cart").first().click();

    // Wait for toast confirmation
    await expect(page.locator("text=added to cart")).toBeVisible({ timeout: 2000 });

    // Navigate to cart
    await page.goto("/cart");
    await expect(page).toHaveURL("/cart");
  });

  test("user is blocked by 4.5 second forced modal when proceeding to checkout", async ({ page }) => {
    // Click proceed to checkout
    await page.locator("text=Proceed to Checkout").click();

    // Modal should appear immediately
    const modal = page.locator(".fixed.inset-0");
    await expect(modal).toBeVisible();

    // Step 1: Processing state (should show spinner)
    await expect(page.locator("text=Preparing Your Checkout...")).toBeVisible();
    await expect(page.locator("text=Do not close this window")).toBeVisible();

    // Wait for step 2: Upsell
    await expect(page.locator("text=Wait! Don't Miss Out")).toBeVisible({ timeout: 3000 });
    await expect(page.locator("text=Students who bought your courses also loved these")).toBeVisible();

    // Buttons should be disabled initially (shows "Reviewing recommendations...")
    await expect(page.locator("text=Reviewing recommendations...")).toBeVisible();

    // Continue button should be disabled
    const continueButton = page.locator("button:has-text('Continue to Checkout')");
    await expect(continueButton).toBeDisabled();

    // Must wait for buttons to become enabled
    await expect(continueButton).toBeEnabled({ timeout: 4000 });
    await expect(page.locator("text=Ready to checkout")).toBeVisible();
  });

  test("user rage clicks on disabled Continue to Checkout button", async ({ page }) => {
    // Click proceed to checkout
    await page.locator("text=Proceed to Checkout").click();

    // Wait for upsell step where buttons appear
    await expect(page.locator("text=Wait! Don't Miss Out")).toBeVisible({ timeout: 4000 });

    // Rage click the disabled Continue button
    await rageClick(page, "button:has-text('Continue to Checkout')", 8);

    // Modal should still be visible (user is trapped)
    await expect(page.locator(".fixed.inset-0")).toBeVisible();

    // Eventually button becomes enabled
    await expect(page.locator("button:has-text('Continue to Checkout')")).toBeEnabled({ timeout: 8000 });
  });

  test("user rage clicks on tiny skip button", async ({ page }) => {
    // Click proceed to checkout
    await page.locator("text=Proceed to Checkout").click();

    // Wait for upsell step
    await expect(page.locator("text=Wait! Don't Miss Out")).toBeVisible({ timeout: 4000 });

    // Rage click the tiny "No thanks, just checkout" button
    await rageClick(page, "text=No thanks, just checkout", 8);

    // User is still trapped (button is disabled)
    await expect(page.locator(".fixed.inset-0")).toBeVisible();
  });

  test("user rage clicks backdrop trying to escape modal", async ({ page }) => {
    // Click proceed to checkout
    await page.locator("text=Proceed to Checkout").click();
    await expect(page.locator("text=Preparing Your Checkout...")).toBeVisible();

    // Get viewport dimensions for clicking around the modal
    const viewport = page.viewportSize();
    if (!viewport) return;

    // Rage click on backdrop corners (trying to dismiss)
    await deadClick(page, 50, 50, 4); // Top-left
    await deadClick(page, viewport.width - 50, 50, 4); // Top-right
    await deadClick(page, 50, viewport.height - 50, 4); // Bottom-left

    // Modal still visible
    await expect(page.locator(".fixed.inset-0")).toBeVisible();

    // Wait for upsell and try again
    await expect(page.locator("text=Wait! Don't Miss Out")).toBeVisible({ timeout: 5000 });

    // More rage clicks on backdrop during upsell
    await deadClick(page, 50, 50, 6);
    await deadClick(page, viewport.width - 50, viewport.height - 50, 6);

    // Still trapped
    await expect(page.locator(".fixed.inset-0")).toBeVisible();
  });

  test("user hovers frantically over disabled buttons showing frustration", async ({ page }) => {
    // Click proceed to checkout
    await page.locator("text=Proceed to Checkout").click();

    // Wait for upsell step
    await expect(page.locator("text=Wait! Don't Miss Out")).toBeVisible({ timeout: 4000 });

    // Frustrated hover pattern over Continue button
    await frustratedHover(page, "button:has-text('Continue to Checkout')");

    // Frustrated hover over tiny skip button
    await frustratedHover(page, "text=No thanks, just checkout");

    // Hover over the "Reviewing recommendations" text (user reading it)
    await hoverAndPause(page, "text=Reviewing recommendations", 2000);

    // Rage click after hovering
    await rageClick(page, "button:has-text('Continue to Checkout')", 5);
  });

  test("user hovers over upsell items but rage clicks to escape", async ({ page }) => {
    // Click proceed to checkout
    await page.locator("text=Proceed to Checkout").click();

    // Wait for upsell step and buttons to be enabled
    await expect(page.locator("text=Wait! Don't Miss Out")).toBeVisible({ timeout: 6000 });
    await expect(page.locator("button:has-text('Continue to Checkout')")).toBeEnabled({ timeout: 8000 });

    // Hover over upsell course items (user considering but frustrated)
    const upsellItems = page.locator(".bg-gray-50.rounded-lg.border");
    const count = await upsellItems.count();

    for (let i = 0; i < Math.min(count, 2); i++) {
      await upsellItems.nth(i).hover();
      await page.waitForTimeout(500);
    }

    // Then rage click the tiny skip button (rejecting upsells)
    await rageClick(page, "text=No thanks, just checkout", 6);

    // Verify we can eventually exit to checkout
    await page.locator("button:has-text('Continue to Checkout')").click();
    await expect(page).toHaveURL("/checkout-it");
  });

  test("user abandons cart page after experiencing modal friction", async ({ page }) => {
    // Click proceed to checkout and wait through modal
    await page.locator("text=Proceed to Checkout").click();
    await expect(page.locator("text=Wait! Don't Miss Out")).toBeVisible({ timeout: 5000 });

    // Rage click while waiting
    await rageClick(page, "button:has-text('Continue to Checkout')", 4);

    // Wait for dismiss to be allowed
    await expect(page.locator("button:has-text('Continue to Checkout')")).toBeEnabled({ timeout: 8000 });

    // User clicks backdrop to dismiss modal and abandons
    await page.mouse.click(50, 50);

    // Navigate away without completing purchase (abandonment)
    await page.goto("/");
  });
});

test.describe("Surprise Fees at Checkout - Revenue Loss Point #2", () => {
  test.beforeEach(async ({ page }) => {
    // Sign up and add item to cart
    await page.goto("/signup");
    const email = `fees-test-${Date.now()}@example.com`;
    await fillSignupForm(page, "Fees Test User", email);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

    // Navigate to browse and add to cart (simple flow)
    await page.goto("/browse");
    await page.locator("text=Add to cart").first().click();
    await expect(page.locator("text=added to cart")).toBeVisible({ timeout: 2000 });

    // Go to cart
    await page.goto("/cart");
    await expect(page).toHaveURL("/cart");

    // Click Proceed to Checkout and wait through upsell modal
    await page.locator("text=Proceed to Checkout").click();
    await expect(page.locator("button:has-text('Continue to Checkout')")).toBeEnabled({ timeout: 7000 });
    await page.locator("button:has-text('Continue to Checkout')").click();
  });

  test("checkout reveals surprise fees - user hovers over each fee in shock", async ({ page }) => {
    // We're on checkout page from beforeEach
    await expect(page).toHaveURL("/checkout-it");

    // User sees the fees and hovers over each one (showing confusion/shock)
    await expect(page.locator("text=Platform Fee")).toBeVisible();

    // Hover over Platform Fee line (user shocked by extra charge)
    await hoverAndPause(page, "text=Platform Fee", 2000);

    // Hover over the $4.99 amount
    await hoverAndPause(page, "text=$4.99", 1500);

    // Hover over Tax line
    await hoverAndPause(page, "text=Tax (8.25%)", 2000);

    // Hover over the Total line (user processing the price increase)
    await hoverAndPause(page, "text=Total", 2500);

    // Verify fees are visible (the key assertion for this test)
    await expect(page.locator("text=Platform Fee")).toBeVisible();
    await expect(page.locator("text=$4.99")).toBeVisible();
    await expect(page.locator("text=Tax (8.25%)")).toBeVisible();
  });

  test("user rage clicks back button after seeing surprise fees", async ({ page }) => {
    // We're on checkout page from beforeEach
    await expect(page).toHaveURL("/checkout-it");

    // User sees the fees
    await expect(page.locator("text=Platform Fee")).toBeVisible();

    // User hovers over fees in frustration
    await frustratedHover(page, "text=Platform Fee");
    await frustratedHover(page, "text=$4.99");

    // User rage clicks trying to go back (simulating browser back button clicks)
    for (let i = 0; i < 3; i++) {
      await page.goBack();
      await page.waitForTimeout(100);
    }

    // User ends up back on cart or earlier
  });

  test("user examines fees in order summary", async ({ page }) => {
    // We're on checkout page from beforeEach
    await expect(page).toHaveURL("/checkout-it");

    // Hover over checkout total
    const checkoutTotal = page.locator(".font-semibold:has-text('$')").last();
    await checkoutTotal.hover();
    await page.waitForTimeout(2000);

    // Frustrated mouse movement over the order summary area
    await frustratedHover(page, ".sticky.top-24"); // Order summary box

    // Hover specifically over each fee line showing user examining charges
    await hoverAndPause(page, "text=Subtotal", 1000);
    await hoverAndPause(page, "text=Platform Fee", 1500);
    await hoverAndPause(page, "text=Tax (8.25%)", 1500);
    await hoverAndPause(page, "text=Total", 2000);
  });

  test("user abandons checkout after hovering over fees", async ({ page }) => {
    // We're on checkout page from beforeEach
    await expect(page).toHaveURL("/checkout-it");

    // User examines the fees
    await hoverAndPause(page, "text=Platform Fee", 2000);
    await hoverAndPause(page, "text=$4.99", 1500);
    await hoverAndPause(page, "text=Tax (8.25%)", 1500);

    // Frustrated hover over the total
    await frustratedHover(page, ".font-semibold:has-text('$')");

    // User abandons by navigating back
    await page.goBack();
    await expect(page).toHaveURL("/cart");
  });

  test("user sees fee breakdown and rage clicks submit without filling form", async ({ page }) => {
    // We're on checkout page from beforeEach
    await expect(page).toHaveURL("/checkout-it");

    // Hover over fees
    await hoverAndPause(page, "text=Platform Fee", 1000);
    await hoverAndPause(page, "text=Tax (8.25%)", 1000);

    // Rage click the submit button without filling form (frustration)
    await rageClick(page, "button[type='submit']", 5);

    // Should show validation errors
    await expect(page.locator("text=Required").first()).toBeVisible();
  });

  test("user hovers over submit button hesitating due to high price", async ({ page }) => {
    // We're on checkout page from beforeEach
    await expect(page).toHaveURL("/checkout-it");

    // Fill out form partially
    await page.fill("#cardNumber", "4242424242424242");
    await page.fill("#expiry", "12/28");
    await page.fill("#cvv", "123");
    await page.fill("#cardName", "Test User");

    // Hover over submit button but don't click (hesitation)
    const submitButton = page.locator("button[type='submit']");
    await submitButton.hover();
    await page.waitForTimeout(3000); // Long hesitation

    // Move away, hover over total again
    await hoverAndPause(page, ".font-semibold:has-text('$')", 2000);

    // Return to submit button, hesitate again
    await submitButton.hover();
    await page.waitForTimeout(2000);

    // Finally abandon (don't click)
    await page.goBack();
  });
});

test.describe("Full Funnel - Signup to Abandonment", () => {
  test("user completes signup but rage quits at checkout modal", async ({ page }) => {
    // Step 1: Signup (SUCCESS)
    await page.goto("/signup");
    const email = `abandon1-${Date.now()}@example.com`;
    await fillSignupForm(page, "Abandoner 1", email);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

    // Navigate to browse
    await page.goto("/browse");

    // Step 2: Add to cart (simple toast notification)
    await page.locator("text=Add to cart").first().click();
    await expect(page.locator("text=added to cart")).toBeVisible({ timeout: 2000 });

    // Go to cart
    await page.goto("/cart");

    // Step 3: Try to proceed to checkout (triggers modal friction)
    await page.locator("text=Proceed to Checkout").click();
    await expect(page.locator("text=Preparing Your Checkout...")).toBeVisible();

    // Rage clicks trying to dismiss
    const viewport = page.viewportSize();
    if (viewport) {
      await deadClick(page, 50, 50, 5);
      await deadClick(page, viewport.width - 50, 50, 5);
    }

    // Simulate tab close (navigate away)
    await page.goto("about:blank");

    // Result: Signup succeeded, but no revenue generated
  });

  test("user completes signup but abandons at checkout fees after hovering", async ({ page }) => {
    // Step 1: Signup (SUCCESS)
    await page.goto("/signup");
    const email = `abandon2-${Date.now()}@example.com`;
    await fillSignupForm(page, "Abandoner 2", email);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

    // Navigate to browse and add to cart
    await page.goto("/browse");
    await page.locator("text=Add to cart").first().click();
    await expect(page.locator("text=added to cart")).toBeVisible({ timeout: 2000 });

    // Step 2: View cart - hover over total
    await page.goto("/cart");
    await expect(page).toHaveURL("/cart");
    await hoverAndPause(page, ".font-semibold:has-text('$')", 1500);

    // Step 3: Proceed to checkout (endure modal with frustration)
    await page.click("text=Proceed to Checkout");
    await expect(page.locator("text=Wait! Don't Miss Out")).toBeVisible({ timeout: 5000 });

    // Rage click during upsell
    await rageClick(page, "button:has-text('Continue to Checkout')", 4);

    await expect(page.locator("button:has-text('Continue to Checkout')")).toBeEnabled({ timeout: 8000 });
    await page.locator("button:has-text('Continue to Checkout')").click();

    // Step 4: See surprise fees - hover and examine each
    await expect(page).toHaveURL("/checkout-it");
    await hoverAndPause(page, "text=Platform Fee", 2000);
    await hoverAndPause(page, "text=$4.99", 1500);
    await hoverAndPause(page, "text=Tax (8.25%)", 1500);

    // Frustrated hover over total
    await frustratedHover(page, ".font-semibold:has-text('$')");

    // User abandons
    await page.goto("/");

    // Result: Signup succeeded, but no revenue generated
  });

  test("user rage clicks through entire funnel before abandoning", async ({ page }) => {
    // Step 1: Signup
    await page.goto("/signup");
    const email = `rage-${Date.now()}@example.com`;
    await fillSignupForm(page, "Rage Clicker", email);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

    // Navigate to browse and add to cart
    await page.goto("/browse");
    await page.locator("text=Add to cart").first().click();
    await expect(page.locator("text=added to cart")).toBeVisible({ timeout: 2000 });

    // Go to cart
    await page.goto("/cart");

    // Step 2: Rage through checkout modal
    await page.locator("text=Proceed to Checkout").click();
    await expect(page.locator("text=Wait! Don't Miss Out")).toBeVisible({ timeout: 5000 });

    // Rage click both buttons
    await rageClick(page, "text=No thanks, just checkout", 5);
    await rageClick(page, "button:has-text('Continue to Checkout')", 5);

    // Rage click backdrop
    const viewport = page.viewportSize();
    if (viewport) {
      await deadClick(page, 30, 30, 6);
    }

    await expect(page.locator("button:has-text('Continue to Checkout')")).toBeEnabled({ timeout: 8000 });
    await page.locator("button:has-text('Continue to Checkout')").click();

    // Step 3: Rage click submit without filling form
    await rageClick(page, "button[type='submit']", 6);

    // Rage click on fee elements
    await rageClick(page, "text=Platform Fee", 4);
    await rageClick(page, "text=$4.99", 4);

    // Abandon
    await page.goto("/");
  });

  test("user completes full purchase despite friction (rare success)", async ({ page }) => {
    // Step 1: Signup
    await page.goto("/signup");
    const email = `buyer-${Date.now()}@example.com`;
    await fillSignupForm(page, "Determined Buyer", email);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

    // Navigate to browse and add to cart
    await page.goto("/browse");
    await page.locator("text=Add to cart").first().click();
    await expect(page.locator("text=added to cart")).toBeVisible({ timeout: 2000 });

    // Go to cart
    await page.goto("/cart");

    // Step 2: Proceed to checkout and endure modal
    await page.click("text=Proceed to Checkout");
    await expect(page.locator("button:has-text('Continue to Checkout')")).toBeEnabled({ timeout: 7000 });
    await page.locator("button:has-text('Continue to Checkout')").click();

    // Step 3: Accept the surprise fees and complete purchase
    await expect(page.locator("text=Platform Fee")).toBeVisible();

    // Fill payment form
    await page.fill("#cardNumber", "4242424242424242");
    await page.fill("#expiry", "12/28");
    await page.fill("#cvv", "123");
    await page.fill("#cardName", "Test Buyer");

    // Submit
    await page.click("button[type='submit']");

    // Wait for processing and success
    await expect(page.locator("text=Purchase Complete!")).toBeVisible({ timeout: 6000 });

    // This user made it through all friction points (rare)
  });
});

test.describe("Funnel Metrics - Quantifying Revenue Loss", () => {
  test("measure time spent in checkout modal", async ({ page }) => {
    // Setup
    await page.goto("/signup");
    const email = `timer-${Date.now()}@example.com`;
    await fillSignupForm(page, "Timer Test", email);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

    // Add to cart (simple flow)
    await page.goto("/browse");
    await page.locator("text=Add to cart").first().click();
    await expect(page.locator("text=added to cart")).toBeVisible({ timeout: 2000 });

    // Go to cart
    await page.goto("/cart");

    // Start timer when clicking proceed to checkout
    const startTime = Date.now();
    await page.locator("text=Proceed to Checkout").click();

    // Wait for modal to become dismissable
    await expect(page.locator("button:has-text('Continue to Checkout')")).toBeEnabled({ timeout: 8000 });

    // Calculate time spent
    const timeInModal = Date.now() - startTime;

    // Assert minimum time is ~4.5 seconds (forced wait)
    expect(timeInModal).toBeGreaterThan(4000);

    // Log for reporting
    console.log(`Time forced in checkout modal: ${timeInModal}ms`);
  });

  test("calculate price increase percentage at checkout", async ({ page }) => {
    // Setup user with item in cart
    await page.goto("/signup");
    const email = `price-${Date.now()}@example.com`;
    await fillSignupForm(page, "Price Test", email);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

    // Add to cart (simple flow)
    await page.goto("/browse");
    await page.locator("text=Add to cart").first().click();
    await expect(page.locator("text=added to cart")).toBeVisible({ timeout: 2000 });

    // Go to cart
    await page.goto("/cart");
    await expect(page).toHaveURL("/cart");
    await expect(page.locator("text=Total").first()).toBeVisible();

    // Extract cart total from the Total row
    const cartTotalRow = page.locator(".font-semibold:has-text('$')").last();
    const cartPriceText = await cartTotalRow.textContent();
    const cartPrice = parseFloat(cartPriceText?.replace("$", "").trim() || "0");

    // Go to checkout (with upsell modal)
    await page.click("text=Proceed to Checkout");
    await expect(page.locator("button:has-text('Continue to Checkout')")).toBeEnabled({ timeout: 7000 });
    await page.locator("button:has-text('Continue to Checkout')").click();

    // Wait for checkout to load and show fees
    await expect(page).toHaveURL("/checkout-it");
    await expect(page.locator("text=Platform Fee")).toBeVisible();

    // Get checkout price from the submit button (most reliable)
    const submitButton = page.locator("button[type='submit']");
    const buttonText = await submitButton.textContent();
    const priceMatch = buttonText?.match(/\$(\d+\.\d{2})/);
    const checkoutPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;

    // Calculate increase
    const priceIncrease = checkoutPrice - cartPrice;
    const percentageIncrease = (priceIncrease / cartPrice) * 100;

    // Log for reporting
    console.log(`Cart price: $${cartPrice.toFixed(2)}`);
    console.log(`Checkout price: $${checkoutPrice.toFixed(2)}`);
    console.log(`Price increase: $${priceIncrease.toFixed(2)} (${percentageIncrease.toFixed(1)}%)`);

    // Assert there's a meaningful increase
    expect(priceIncrease).toBeGreaterThan(4.99); // At minimum the platform fee
  });
});

test.describe("FullStory Signal Generation - Rage Clicks & Hovers", () => {
  test("generate rage click signals on checkout modal elements", async ({ page }) => {
    // Setup
    await page.goto("/signup");
    const email = `rage-signal-${Date.now()}@example.com`;
    await fillSignupForm(page, "Rage Signal Test", email);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

    // Add to cart (simple flow)
    await page.goto("/browse");
    await page.locator("text=Add to cart").first().click();
    await expect(page.locator("text=added to cart")).toBeVisible({ timeout: 2000 });

    // Go to cart and trigger modal
    await page.goto("/cart");
    await page.locator("text=Proceed to Checkout").click();

    // Wait for upsell step where buttons appear
    await expect(page.locator("text=Wait! Don't Miss Out")).toBeVisible({ timeout: 6000 });

    // Wait for the buttons to become enabled first
    await expect(page.locator("button:has-text('Continue to Checkout')")).toBeEnabled({ timeout: 8000 });

    // NOW generate rage click signals (on enabled buttons - still captures rage clicks in FullStory)
    console.log("Generating rage clicks on tiny skip button...");
    await rageClick(page, "text=No thanks, just checkout", 6);

    console.log("Generating rage clicks on Continue to Checkout button...");
    await rageClick(page, "button:has-text('Continue to Checkout')", 6);

    // Click Continue to proceed
    await page.locator("button:has-text('Continue to Checkout')").click();
    await expect(page).toHaveURL("/checkout-it");
  });

  test("generate hover signals showing user confusion at checkout fees", async ({ page }) => {
    // Setup
    await page.goto("/signup");
    const email = `hover-signal-${Date.now()}@example.com`;
    await fillSignupForm(page, "Hover Signal Test", email);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

    // Add to cart (simple flow)
    await page.goto("/browse");
    await page.locator("text=Add to cart").first().click();
    await expect(page.locator("text=added to cart")).toBeVisible({ timeout: 2000 });

    // Go to cart and through checkout modal
    await page.goto("/cart");
    await page.click("text=Proceed to Checkout");
    await expect(page.locator("button:has-text('Continue to Checkout')")).toBeEnabled({ timeout: 7000 });
    await page.locator("button:has-text('Continue to Checkout')").click();

    // Now on checkout page
    await expect(page).toHaveURL("/checkout-it");

    // Generate hover signals showing confusion over fees
    console.log("Hovering over Subtotal...");
    await hoverAndPause(page, "text=Subtotal", 2000);

    console.log("Hovering over Platform Fee (surprise!)...");
    await hoverAndPause(page, "text=Platform Fee", 3000);

    console.log("Hovering over $4.99 fee amount...");
    await hoverAndPause(page, "text=$4.99", 2500);

    console.log("Hovering over Tax line...");
    await hoverAndPause(page, "text=Tax (8.25%)", 2000);

    console.log("Hovering over Total (comparing to expected price)...");
    await hoverAndPause(page, ".font-semibold:has-text('$')", 3000);

    // Frustrated back-and-forth hovering
    console.log("Frustrated hover pattern over order summary...");
    for (let i = 0; i < 3; i++) {
      await hoverAndPause(page, "text=Subtotal", 500);
      await hoverAndPause(page, "text=Platform Fee", 500);
      await hoverAndPause(page, "text=Total", 500);
    }
  });

  test("generate combined rage + hover signals before abandonment", async ({ page }) => {
    // Setup
    await page.goto("/signup");
    const email = `combined-${Date.now()}@example.com`;
    await fillSignupForm(page, "Combined Signal Test", email);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard", { timeout: 5000 });

    // Add to cart (simple flow)
    await page.goto("/browse");
    await page.locator("text=Add to cart").first().click();
    await expect(page.locator("text=added to cart")).toBeVisible({ timeout: 2000 });

    // Go to cart
    await page.goto("/cart");

    // Checkout modal friction
    await page.locator("text=Proceed to Checkout").click();

    // Wait for upsell step and buttons to be enabled
    await expect(page.locator("text=Wait! Don't Miss Out")).toBeVisible({ timeout: 6000 });
    await expect(page.locator("button:has-text('Continue to Checkout')")).toBeEnabled({ timeout: 8000 });

    // Hover then rage click pattern (on enabled buttons - still captures signals)
    await frustratedHover(page, "text=No thanks, just checkout");
    await rageClick(page, "text=No thanks, just checkout", 5);

    await frustratedHover(page, "button:has-text('Continue to Checkout')");
    await rageClick(page, "button:has-text('Continue to Checkout')", 5);

    await page.locator("button:has-text('Continue to Checkout')").click();

    // Now on checkout - Hover over fees with increasing frustration
    await expect(page).toHaveURL("/checkout-it");
    await hoverAndPause(page, "text=Platform Fee", 2000);
    await frustratedHover(page, "text=$4.99");
    await rageClick(page, "text=$4.99", 5); // Rage click on the fee itself

    await hoverAndPause(page, "text=Tax (8.25%)", 1500);
    await rageClick(page, "text=Tax (8.25%)", 4);

    // Rage click submit without form filled
    await rageClick(page, "button[type='submit']", 8);

    // Final frustrated hover before abandoning
    await frustratedHover(page, ".font-semibold:has-text('$')");

    // Abandon
    await page.goBack();
  });

  test("simulate complete frustrated user journey for FullStory replay", async ({ page }) => {
    // This test generates a rich session for FullStory replay analysis
    await page.goto("/signup");
    const email = `journey-${Date.now()}@example.com`;
    await fillSignupForm(page, "Frustrated User Journey", email);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard", { timeout: 5000 });
    await page.goto("/browse");

    // Browse and hover over courses (considering)
    const courseCards = page.locator(".bg-white.rounded-xl.border").first();
    await courseCards.hover();
    await page.waitForTimeout(2000);

    // Add to cart (simple toast notification)
    await page.locator("text=Add to cart").first().click();
    await expect(page.locator("text=added to cart")).toBeVisible({ timeout: 2000 });

    // Go to cart
    await page.goto("/cart");

    // Cart page - hover over total
    await hoverAndPause(page, ".font-semibold:has-text('$')", 2000);

    // Click proceed to checkout - triggers modal
    await page.click("text=Proceed to Checkout");

    // Modal Step 1: Processing - user tries to escape
    await expect(page.locator("text=Preparing Your Checkout...")).toBeVisible();
    const viewport = page.viewportSize();
    if (viewport) {
      // Try clicking outside
      await deadClick(page, 30, 30, 3);
      await deadClick(page, viewport.width - 30, 30, 3);
    }

    // Modal Step 2: Upsell - frustrated
    await expect(page.locator("text=Wait! Don't Miss Out")).toBeVisible({ timeout: 3000 });

    // Wait for buttons to be enabled
    await expect(page.locator("button:has-text('Continue to Checkout')")).toBeEnabled({ timeout: 8000 });

    // Hover over upsell items
    const upsellItems = page.locator(".bg-gray-50.rounded-lg.border");
    const itemCount = await upsellItems.count();
    for (let i = 0; i < Math.min(itemCount, 2); i++) {
      await upsellItems.nth(i).hover();
      await page.waitForTimeout(800);
    }

    // Rage click buttons (on enabled buttons - still captures rage click signals)
    await rageClick(page, "text=No thanks, just checkout", 4);
    await rageClick(page, "button:has-text('Continue to Checkout')", 4);

    // Proceed
    await page.locator("button:has-text('Continue to Checkout')").click();

    // Checkout - examine each fee line
    await expect(page).toHaveURL("/checkout-it");
    await hoverAndPause(page, "text=Subtotal", 1500);
    await hoverAndPause(page, "text=Platform Fee", 2500);
    await rageClick(page, "text=Platform Fee", 3);
    await hoverAndPause(page, "text=$4.99", 2000);
    await hoverAndPause(page, "text=Tax (8.25%)", 2000);
    await hoverAndPause(page, ".font-semibold:has-text('$')", 3000);

    // Frustrated hover over submit button (hesitation)
    const submitBtn = page.locator("button[type='submit']");
    await submitBtn.hover();
    await page.waitForTimeout(2500);

    // Move away, look at fees again
    await hoverAndPause(page, "text=Platform Fee", 1500);
    await hoverAndPause(page, "text=Total", 2000);

    // Return to submit, more hesitation
    await submitBtn.hover();
    await page.waitForTimeout(2000);

    // Finally abandon
    await page.goBack();
    await page.waitForTimeout(500);
    await page.goto("/");
  });
});
