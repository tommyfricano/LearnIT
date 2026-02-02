/**
 * LearnIT — FullStory Session Generator
 *
 * Generates a realistic mix of successful AND failed user sessions so the
 * FullStory dashboard shows believable (poor) metrics for demo purposes.
 *
 * Usage:
 *   node scripts/generate-sessions.mjs                  <-- default 16 sessions
 *   node scripts/generate-sessions.mjs --runs=20        <-- more data
 *   node scripts/generate-sessions.mjs --headless       <-- no browser window
 *
 * Flags:
 *   --runs=N        Number of sessions to generate (default 16)
 *   --headed        Show the browser window (default: true)
 *   --headless      Hide the browser window
 *   --slow=N        Slow-mo milliseconds between actions (default 60)
 *   --base=URL      Override the base URL
 */

import { chromium } from "@playwright/test";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  })
);

const RUNS = parseInt(args.runs ?? "16", 10);
const HEADLESS = args.headless === "true" ? true : false;
const SLOW_MO = parseInt(args.slow ?? "60", 10);
const BASE = args.base ?? "https://learn-it-demo.vercel.app";

// ---------------------------------------------------------------------------
// Session types — defines the behavior mix
// ---------------------------------------------------------------------------
// Each session has a type that determines how far the user gets.
// The distribution is designed to produce ugly dashboard numbers.
const SESSION_TYPES = [
  // --- Students who complete the full funnel (minority) ---
  { type: "full_success", role: "student" },
  { type: "full_success", role: "student" },
  { type: "full_success_rage", role: "student" },  // completes but rage clicks

  // --- Signup failures / abandonment ---
  { type: "signup_fail_abandon", role: "student" },    // email mismatch, gives up
  { type: "signup_fail_abandon", role: "student" },
  { type: "signup_confused_role", role: "student" },   // confused by role, leaves

  // --- Browse but never add to cart ---
  { type: "browse_bounce", role: "student" },          // filters around, leaves
  { type: "browse_bounce", role: "student" },

  // --- Cart abandonment ---
  { type: "cart_abandon", role: "student" },           // sees fee, leaves
  { type: "cart_abandon", role: "student" },

  // --- Checkout abandonment ---
  { type: "checkout_abandon_rage", role: "student" },  // rage clicks, closes tab
  { type: "checkout_abandon_rage", role: "student" },

  // --- Instructors ---
  { type: "instructor_success", role: "instructor" },
  { type: "instructor_form_abandon", role: "instructor" },  // jargon confusion, gives up
  { type: "instructor_success", role: "instructor" },

  // --- Mobile student who can't find CTA ---
  { type: "mobile_browse_fail", role: "student" },
];

// ---------------------------------------------------------------------------
// Users — more names, each used once then wraps
// ---------------------------------------------------------------------------
const USERS = [
  { name: "Jordan Rivera", email: "jordan.rivera" },
  { name: "Sam Chen", email: "sam.chen" },
  { name: "Morgan Bailey", email: "morgan.bailey" },
  { name: "Taylor Kim", email: "taylor.kim" },
  { name: "Casey Ortiz", email: "casey.ortiz" },
  { name: "Riley Patel", email: "riley.patel" },
  { name: "Avery Brooks", email: "avery.brooks" },
  { name: "Quinn Nakamura", email: "quinn.nakamura" },
  { name: "Dana Kowalski", email: "dana.kowalski" },
  { name: "Skyler Tran", email: "skyler.tran" },
  { name: "Jamie Okafor", email: "jamie.okafor" },
  { name: "Reese Andersen", email: "reese.andersen" },
  { name: "Emery Solis", email: "emery.solis" },
  { name: "Parker Johansson", email: "parker.johansson" },
  { name: "Finley Dubois", email: "finley.dubois" },
  { name: "Rowan Matsuda", email: "rowan.matsuda" },
  { name: "Lennox Petrov", email: "lennox.petrov" },
  { name: "Sage Alvarado", email: "sage.alvarado" },
  { name: "Blair Nguyen", email: "blair.nguyen" },
  { name: "Drew Kapoor", email: "drew.kapoor" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (base) => base + Math.random() * base * 0.5;

/** Rage-click using real mouse movements so FullStory detects it */
async function rageClick(page, locator) {
  const box = await locator.boundingBox();
  if (!box) return;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  for (let i = 0; i < 6; i++) {
    // Small random offset so it looks like a real frustrated human
    const ox = cx + (Math.random() - 0.5) * 6;
    const oy = cy + (Math.random() - 0.5) * 6;
    await page.mouse.move(ox, oy);
    await page.mouse.click(ox, oy);
    await wait(60 + Math.random() * 50);
  }
}

/** Dead-click an element */
async function deadClick(page, locator) {
  const box = await locator.boundingBox();
  if (!box) return;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await wait(300);
}

/** Simulate reading / hesitation */
async function hesitate(ms = 2000) {
  await wait(jitter(ms));
}

/** Sign up a user. Returns true if successful. */
async function signup(page, user, role, { mismatchEmail = false, abandonAfterError = false, abandonOnRole = false } = {}) {
  await page.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
  await hesitate(1000);

  await page.locator("#fullName").fill(user.name);
  await hesitate(400);
  await page.locator("#email").fill(user.email);
  await hesitate(400);

  if (mismatchEmail) {
    await page.locator("#emailConfirm").fill(user.email.replace("@", "+typo@"));
  } else {
    await page.locator("#emailConfirm").fill(user.email);
  }
  await hesitate(300);

  await page.locator("#role").selectOption(role === "instructor" ? "instructor" : "student");

  if (abandonOnRole) {
    // User is confused by "Content Provider" / "Content Consumer", clicks around, leaves
    await page.locator("#role").selectOption("instructor");
    await hesitate(1500);
    await page.locator("#role").selectOption("student");
    await hesitate(2000);
    // Try to click "Sign in here" (dead click)
    const signInText = page.getByText("Sign in here");
    if (await signInText.isVisible().catch(() => false)) {
      await deadClick(page, signInText);
      await deadClick(page, signInText);
    }
    await hesitate(1000);
    console.log("    ↩ Abandoned: confused by role labels");
    return false;
  }

  // Try to click terms and conditions text (dead click)
  const termsText = page.getByText("terms and conditions");
  if (await termsText.isVisible().catch(() => false)) {
    await deadClick(page, termsText);
    await hesitate(600);
  }

  // Check terms checkbox
  const termsCheckbox = page.locator('input[type="checkbox"]').first();
  if (await termsCheckbox.isVisible()) await termsCheckbox.check();

  // Submit
  await page.getByRole("button", { name: "Continue" }).click();
  await hesitate(1200);

  if (mismatchEmail && abandonAfterError) {
    // See the error, get frustrated, leave
    const continueBtn = page.getByRole("button", { name: "Continue" });
    await rageClick(page, continueBtn);
    await hesitate(1500);
    console.log("    ↩ Abandoned: email validation error");
    return false;
  }

  if (mismatchEmail) {
    // Fix and retry
    await page.locator("#emailConfirm").fill(user.email);
    await hesitate(300);
    await page.getByRole("button", { name: "Continue" }).click();
  }

  await page.waitForURL("**/dashboard", { timeout: 10000 }).catch(() => {});
  await hesitate(1000);
  return true;
}

// ---------------------------------------------------------------------------
// Session: Full success (signup → browse → cart → checkout → purchase)
// ---------------------------------------------------------------------------
async function sessionFullSuccess(page, user, { withRageClicks = false } = {}) {
  console.log(`  ▸ Full purchase flow${withRageClicks ? " (with rage clicks)" : ""}`);

  const signedUp = await signup(page, user, "student");
  if (!signedUp) return;

  // Browse
  await page.goto(`${BASE}/browse`, { waitUntil: "networkidle" });
  await hesitate(1200);

  // Add to cart
  const addBtn = page.getByText("Add to cart").first();
  if (await addBtn.isVisible()) {
    await addBtn.click();
    await hesitate(2000);
  }

  // Cart
  await page.goto(`${BASE}/cart`, { waitUntil: "networkidle" });
  await hesitate(1000);

  // Dead-click fee line
  const feeText = page.getByText("Processing fee");
  if (await feeText.isVisible().catch(() => false)) {
    await deadClick(page, feeText);
    await hesitate(800);
  }

  const proceedBtn = page.getByText("Proceed to Checkout");
  if (await proceedBtn.isVisible()) {
    await hesitate(2000);
    await proceedBtn.click();
  }

  // Checkout
  await page.waitForURL("**/checkout-it", { timeout: 5000 }).catch(() =>
    page.goto(`${BASE}/checkout-it`, { waitUntil: "networkidle" })
  );
  await hesitate(1000);

  await page.locator("#cardNumber").fill("4242 4242 4242 4242");
  await hesitate(300);
  await page.locator("#expiry").fill("12/28");
  await hesitate(200);
  await page.locator("#cvv").fill("123");
  await hesitate(200);
  await page.locator("#cardName").fill(user.name);
  await hesitate(600);

  const submitBtn = page.getByRole("button", { name: /Complete Purchase/ });
  if (await submitBtn.isVisible()) {
    await submitBtn.click();

    if (withRageClicks) {
      await wait(200);
      const procBtn = page.getByRole("button", { name: "Processing..." });
      if (await procBtn.isVisible().catch(() => false)) {
        await rageClick(page, procBtn);
      }
    }
  }

  await hesitate(3000);
  console.log("    ✓ Purchase complete");
}

// ---------------------------------------------------------------------------
// Session: Signup fail + abandon
// ---------------------------------------------------------------------------
async function sessionSignupFailAbandon(page, user) {
  console.log("  ▸ Signup attempt → email error → abandon");
  await signup(page, user, "student", { mismatchEmail: true, abandonAfterError: true });
}

// ---------------------------------------------------------------------------
// Session: Signup confused by role → abandon
// ---------------------------------------------------------------------------
async function sessionSignupConfusedRole(page, user) {
  console.log("  ▸ Signup attempt → confused by role → abandon");
  await signup(page, user, "student", { abandonOnRole: true });
}

// ---------------------------------------------------------------------------
// Session: Browse but never add to cart
// ---------------------------------------------------------------------------
async function sessionBrowseBounce(page, user) {
  console.log("  ▸ Signup → browse → leave without adding to cart");

  const signedUp = await signup(page, user, "student");
  if (!signedUp) return;

  await page.goto(`${BASE}/browse`, { waitUntil: "networkidle" });
  await hesitate(1500);

  // Toggle filters — confused by sort labels
  const sortSelect = page.locator("select").first();
  if (await sortSelect.isVisible()) {
    await sortSelect.selectOption("price-asc");
    await hesitate(700);
    await sortSelect.selectOption("price-desc");
    await hesitate(500);
    await sortSelect.selectOption("price-asc");
    await hesitate(600);
  }

  // Click difficulty filters
  const advBtn = page.getByRole("button", { name: "advanced" });
  if (await advBtn.isVisible()) {
    await advBtn.click();
    await hesitate(1000);
  }

  // Click into a course detail page
  const courseLink = page.locator('a[href^="/courses/"]').first();
  if (await courseLink.isVisible()) {
    await courseLink.click();
    await page.waitForURL("**/courses/**", { timeout: 5000 }).catch(() => {});
    await hesitate(2000);

    // Dead-click lesson rows
    const lessonRows = page.locator(".cursor-pointer").filter({ hasText: /.+/ });
    const count = await lessonRows.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      await deadClick(page, lessonRows.nth(i));
      await hesitate(500);
    }
  }

  // Leave without adding to cart
  await hesitate(1500);
  console.log("    ↩ Left without adding to cart");
}

// ---------------------------------------------------------------------------
// Session: Cart abandonment (sees fee, leaves)
// ---------------------------------------------------------------------------
async function sessionCartAbandon(page, user) {
  console.log("  ▸ Signup → browse → add to cart → abandon at cart");

  const signedUp = await signup(page, user, "student");
  if (!signedUp) return;

  // Browse and add to cart
  await page.goto(`${BASE}/browse`, { waitUntil: "networkidle" });
  await hesitate(1000);

  const addBtn = page.getByText("Add to cart").first();
  if (await addBtn.isVisible()) {
    await addBtn.click();
    await hesitate(1500);
  }

  // Go to cart
  await page.goto(`${BASE}/cart`, { waitUntil: "networkidle" });
  await hesitate(1500);

  // See the processing fee — click it, worry about it
  const feeText = page.getByText("Processing fee");
  if (await feeText.isVisible().catch(() => false)) {
    await deadClick(page, feeText);
    await hesitate(1000);
    await deadClick(page, page.getByText("$0.00"));
    await hesitate(1500);
  }

  // Stare at "Proceed to Checkout" but don't click — leave
  await hesitate(3000);
  console.log("    ↩ Abandoned cart (fee anxiety)");
}

// ---------------------------------------------------------------------------
// Session: Checkout rage click + abandon
// ---------------------------------------------------------------------------
async function sessionCheckoutAbandonRage(page, user) {
  console.log("  ▸ Signup → cart → checkout → rage click → abandon");

  const signedUp = await signup(page, user, "student");
  if (!signedUp) return;

  // Browse and add to cart
  await page.goto(`${BASE}/browse`, { waitUntil: "networkidle" });
  await hesitate(800);

  const addBtn = page.getByText("Add to cart").first();
  if (await addBtn.isVisible()) {
    await addBtn.click();
    await hesitate(1000);
  }

  // Cart → Checkout
  await page.goto(`${BASE}/cart`, { waitUntil: "networkidle" });
  await hesitate(800);

  const proceedBtn = page.getByText("Proceed to Checkout");
  if (await proceedBtn.isVisible()) {
    await proceedBtn.click();
  }

  await page.waitForURL("**/checkout-it", { timeout: 5000 }).catch(() =>
    page.goto(`${BASE}/checkout-it`, { waitUntil: "networkidle" })
  );
  await hesitate(1000);

  // Try to submit with empty fields first (validation error)
  const submitBtn = page.getByRole("button", { name: /Complete Purchase/ });
  if (await submitBtn.isVisible()) {
    await submitBtn.click();
    await hesitate(800);
    // Rage click the submit button out of frustration with errors
    await rageClick(page, submitBtn);
    await hesitate(1000);
  }

  // Fill card number but wrong format
  await page.locator("#cardNumber").fill("4242");
  await hesitate(400);
  await page.locator("#expiry").fill("13/01"); // invalid month
  await hesitate(300);
  await page.locator("#cvv").fill("1"); // too short
  await hesitate(300);

  // Submit again — more validation errors
  if (await submitBtn.isVisible()) {
    await submitBtn.click();
    await hesitate(600);
    await rageClick(page, submitBtn);
  }

  // Give up and leave
  await hesitate(2000);
  console.log("    ↩ Abandoned checkout (frustrated)");
}

// ---------------------------------------------------------------------------
// Session: Instructor success
// ---------------------------------------------------------------------------
async function sessionInstructorSuccess(page, user) {
  console.log("  ▸ Instructor: signup → create course → create lesson");

  const signedUp = await signup(page, user, "instructor");
  if (!signedUp) return;

  // Create Course
  await page.goto(`${BASE}/courses/create`, { waitUntil: "networkidle" });
  await hesitate(1000);

  await page.locator("#title").fill("Advanced Node.js Patterns");
  await hesitate(500);
  await page.locator("#description").fill("Deep dive into Node.js design patterns and performance tuning for production systems.");
  await hesitate(400);

  // Hesitate on Target Proficiency
  const l1 = page.getByRole("button", { name: "L1" });
  const l2 = page.getByRole("button", { name: "L2" });
  const l3 = page.getByRole("button", { name: "L3" });
  if (await l1.isVisible()) {
    await l1.click();
    await hesitate(1200);
    await l3.click();
    await hesitate(800);
    await l2.click();
    await hesitate(500);
  }

  // Hesitate on Unit Cost
  const priceField = page.locator("#price");
  await priceField.fill("8999");
  await hesitate(1500);
  await priceField.fill("");
  await hesitate(400);
  await priceField.fill("89.99");
  await hesitate(500);

  await page.getByRole("button", { name: "Publish Course" }).click();
  await hesitate(2000);

  // Redirected to dashboard — confused
  await page.waitForURL("**/dashboard", { timeout: 10000 }).catch(() => {});
  await hesitate(3000);

  // Navigate to lesson creation manually
  await page.goto(`${BASE}/lessons/create`, { waitUntil: "networkidle" });
  await hesitate(1500);

  const courseDropdown = page.locator("#course");
  if (await courseDropdown.isVisible()) {
    await hesitate(2000);
    const options = await courseDropdown.locator("option").allTextContents();
    const opt = options.find((o) => !o.includes("Select"));
    if (opt) await courseDropdown.selectOption({ label: opt });
    await hesitate(700);
  }

  await page.locator("#lessonTitle").fill("Understanding the Event Loop");
  await hesitate(400);

  const docBtn = page.getByRole("button", { name: "Document" });
  const recBtn = page.getByRole("button", { name: "Recording" });
  if (await docBtn.isVisible()) {
    await docBtn.click();
    await hesitate(1000);
    await recBtn.click();
    await hesitate(500);
  }

  await page.locator("#content").fill("In this lesson we break down the Node.js event loop and learn how to avoid blocking the main thread.");
  await hesitate(400);
  await page.locator("#duration").fill("15");
  await hesitate(300);

  // Hesitate between two buttons
  const saveDraft = page.getByRole("button", { name: "Save Draft" });
  const addLesson = page.getByRole("button", { name: "Add Lesson" });
  if (await saveDraft.isVisible() && await addLesson.isVisible()) {
    await saveDraft.hover();
    await hesitate(1500);
    await addLesson.click();
  }

  await hesitate(2000);
  console.log("    ✓ Course + lesson created");
}

// ---------------------------------------------------------------------------
// Session: Instructor form abandon
// ---------------------------------------------------------------------------
async function sessionInstructorFormAbandon(page, user) {
  console.log("  ▸ Instructor: signup → course form → confused → abandon");

  const signedUp = await signup(page, user, "instructor");
  if (!signedUp) return;

  await page.goto(`${BASE}/courses/create`, { waitUntil: "networkidle" });
  await hesitate(1000);

  await page.locator("#title").fill("React Performance Workshop");
  await hesitate(500);
  await page.locator("#description").fill("Short desc");
  await hesitate(400);

  // Confused by Target Proficiency — click around
  const l1 = page.getByRole("button", { name: "L1" });
  const l2 = page.getByRole("button", { name: "L2" });
  if (await l1.isVisible()) {
    await l1.click();
    await hesitate(800);
    await l2.click();
    await hesitate(600);
  }

  // Confused by Unit Cost — type cents
  await page.locator("#price").fill("4999");
  await hesitate(1000);

  // Try to submit (will fail — description too short)
  await page.getByRole("button", { name: "Publish Course" }).click();
  await hesitate(1500);

  // See errors, get frustrated, click Discard
  const discardBtn = page.getByText("Discard");
  if (await discardBtn.isVisible().catch(() => false)) {
    await discardBtn.click();
  }

  await hesitate(1500);
  console.log("    ↩ Abandoned course form");
}

// ---------------------------------------------------------------------------
// Session: Mobile user who can't find CTA on course detail
// ---------------------------------------------------------------------------
async function sessionMobileBrowseFail(page, user) {
  console.log("  ▸ Mobile: signup → browse → course detail → can't find CTA → leave");

  const signedUp = await signup(page, user, "student");
  if (!signedUp) return;

  await page.goto(`${BASE}/browse`, { waitUntil: "networkidle" });
  await hesitate(1500);

  // Click into a course
  const courseLink = page.locator('a[href^="/courses/"]').first();
  if (await courseLink.isVisible()) {
    await courseLink.click();
    await page.waitForURL("**/courses/**", { timeout: 5000 }).catch(() => {});
    await hesitate(2000);

    // Dead-click lesson rows
    const lessonRows = page.locator(".cursor-pointer").filter({ hasText: /.+/ });
    const count = await lessonRows.count();
    for (let i = 0; i < Math.min(count, 4); i++) {
      await deadClick(page, lessonRows.nth(i));
      await hesitate(500);
    }

    // Scroll down looking for buy button (it's scrolled off on mobile)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await hesitate(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await hesitate(1000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await hesitate(2000);

    // Give up — can't find it
    console.log("    ↩ Left course detail (couldn't find CTA on mobile)");
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\nLearnIT Session Generator`);
  console.log(`  Site:    ${BASE}`);
  console.log(`  Runs:    ${RUNS}`);
  console.log(`  Headed:  ${!HEADLESS}`);
  console.log(`  SlowMo:  ${SLOW_MO}ms\n`);

  const browser = await chromium.launch({
    headless: HEADLESS,
    slowMo: SLOW_MO,
  });

  for (let i = 0; i < RUNS; i++) {
    const session = SESSION_TYPES[i % SESSION_TYPES.length];
    const user = USERS[i % USERS.length];
    // Give each user a unique email per run
    const emailUser = { ...user, email: `${user.email}+run${i}@demo.test` };

    const isMobile = session.type === "mobile_browse_fail" || i % 5 === 0;

    console.log(`Run ${i + 1}/${RUNS} — ${user.name} [${session.type}]${isMobile ? " (mobile)" : ""}`);

    const context = await browser.newContext({
      viewport: isMobile ? { width: 375, height: 812 } : { width: 1440, height: 900 },
      userAgent: isMobile
        ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        : undefined,
    });
    const page = await context.newPage();

    try {
      switch (session.type) {
        case "full_success":
          await sessionFullSuccess(page, emailUser);
          break;
        case "full_success_rage":
          await sessionFullSuccess(page, emailUser, { withRageClicks: true });
          break;
        case "signup_fail_abandon":
          await sessionSignupFailAbandon(page, emailUser);
          break;
        case "signup_confused_role":
          await sessionSignupConfusedRole(page, emailUser);
          break;
        case "browse_bounce":
          await sessionBrowseBounce(page, emailUser);
          break;
        case "cart_abandon":
          await sessionCartAbandon(page, emailUser);
          break;
        case "checkout_abandon_rage":
          await sessionCheckoutAbandonRage(page, emailUser);
          break;
        case "instructor_success":
          await sessionInstructorSuccess(page, emailUser);
          break;
        case "instructor_form_abandon":
          await sessionInstructorFormAbandon(page, emailUser);
          break;
        case "mobile_browse_fail":
          await sessionMobileBrowseFail(page, emailUser);
          break;
      }
    } catch (err) {
      console.log(`    ✗ Error: ${err.message}`);
    }

    await context.close();
    console.log("");
  }

  await browser.close();
  console.log("Done. Check FullStory for new sessions.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
