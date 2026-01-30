# LearnIT Pain Points & FullStory Instrumentation Guide

## Table of Contents

1. [Introduction](#introduction)
2. [How FullStory Detects UX Problems](#how-fullstory-detects-ux-problems)
3. [Pain Points by Page](#pain-points-by-page)
   - [Signup](#1-signup-page)
   - [Landing](#2-landing-page)
   - [Browse Catalog](#3-browse-catalog)
   - [Course Detail](#4-course-detail)
   - [Cart](#5-cart)
   - [Checkout](#6-checkout)
   - [Course Creation](#7-course-creation)
   - [Lesson Creation](#8-lesson-creation)
   - [Header & Navigation](#9-header--navigation)
4. [Full Custom Event Reference](#full-custom-event-reference)
5. [Automatic Detection Summary](#automatic-detection-summary)
6. [Actionable Items](#actionable-items)

---

## Introduction

LearnIT contains intentional UX friction points throughout the user journey. This document catalogs every known pain point, explains which FullStory capabilities surface each one, and lists the concrete actions teams can take once the data is in hand.

FullStory provides two complementary layers of insight:

- **Automatic detection** — rage clicks, dead clicks, error clicks, and thrashed cursors are captured with zero code.
- **Custom events** — named, searchable events fired from application code that add structured context to session replays and enable funnel/segment analysis in the FullStory dashboard.

Both layers are now wired into the LearnIT codebase.

---

## How FullStory Detects UX Problems

### Rage Clicks (Automatic)
FullStory flags a rage click when a user clicks the same small area rapidly (typically 3+ clicks within a short window). Rage clicks reliably indicate frustration — the user expects something to happen and it does not.

**What the dashboard shows:** Rage click heatmaps, session replays filtered by rage click count, page-level rage click frequency.

### Dead Clicks (Automatic)
A dead click is a click on an element that produces no visible DOM change — no navigation, no state update, no animation. Dead clicks reveal elements that *look* interactive but are not.

**What the dashboard shows:** Dead click heatmaps, top dead click elements, session replays filtered by dead click count.

### Error Clicks (Automatic)
Clicks that coincide with a JavaScript error. FullStory ties the error stack trace to the exact click and DOM element.

### Custom Events (Code-Instrumented)
Named events fired with `trackEvent()`. Each event carries structured properties (course ID, price, error fields, etc.) that enable:
- Funnel analysis (e.g., Signup_Attempt -> Signup_Success conversion rate)
- Segmentation (e.g., compare behavior by user role)
- Searchable session replay (find all sessions where Checkout_ValidationFailed fired)

### User Identification
`identifyUser()` ties a session to a known user with properties (name, email, role). This enables:
- Cross-session user timelines
- Cohort analysis by role (student vs. instructor)
- Support workflows that link a user complaint to their session replay

---

## Pain Points by Page

### 1. Signup Page

| # | Pain Point | Detection Method | Custom Event | Expected Signal |
|---|-----------|-----------------|--------------|-----------------|
| 1.1 | **"Continue" button text is ambiguous** — implies more steps rather than completing signup. Users may hesitate or rage-click. | Rage click (auto) | `Signup_Attempt` | Elevated rage click count on the submit button; multiple `Signup_Attempt` events per session. |
| 1.2 | **Redundant "Verify Email" field** — label suggests a verification link rather than re-typing. Adds unnecessary friction. | Dead click (auto) on label | `Signup_Validation_Failed` with `emailConfirm` in errorFields | High mismatch error rate on `emailConfirm`; sessions showing paste behavior into this field. |
| 1.3 | **"Account Type" label with jargon options** — "Content Provider" and "Content Consumer" instead of "Instructor" and "Student". Users pause or switch selections. | Session replay (hesitation) | `Signup_Attempt` carries `role` | Long dwell time on the dropdown; sessions where users change selection multiple times. |
| 1.4 | **Non-clickable "terms and conditions" link** — styled like a link (underline, indigo) but has no href. Users click expecting to read terms. | Dead click + rage click (auto) | — | Dead click heatmap will highlight this span. Rage clicks if users click repeatedly. |
| 1.5 | **Pre-checked marketing opt-in** — users may not notice the default state. | Session replay | — | Session replays showing users scrolling past without unchecking. |
| 1.6 | **"Sign in here" text is not a link** — low-contrast, non-interactive text. Existing users cannot navigate to login. | Dead click (auto) | — | Dead click cluster below the submit button. |

**Identification:** After successful signup, `identifyUser()` is called so all subsequent session activity is tied to the user's name, email, and role.

---

### 2. Landing Page

| # | Pain Point | Detection Method | Custom Event | Expected Signal |
|---|-----------|-----------------|--------------|-----------------|
| 2.1 | **Two hero CTAs with unclear priority** — "Start Teaching Free" and "Browse Courses" compete for attention. | Custom event comparison | `Landing_CTA_Click` with `location: "hero_primary"` or `"hero_secondary"` | Compare click counts between primary and secondary. Low secondary clicks may mean it is invisible; equal clicks may mean the primary is not compelling enough. |
| 2.2 | **Bottom CTA below the fold** — users must scroll past features and stats to reach it. | Custom event | `Landing_CTA_Click` with `location: "bottom"` | Low bottom CTA clicks relative to hero clicks indicates users don't scroll that far. |

---

### 3. Browse Catalog

| # | Pain Point | Detection Method | Custom Event | Expected Signal |
|---|-----------|-----------------|--------------|-----------------|
| 3.1 | **Filter state lost on refresh** — filters are not reflected in the URL. | Session replay | `Browse_FilterApplied` | Sessions where the same filter is re-applied immediately after page load indicate the user expected persistence. |
| 3.2 | **Ambiguous sort labels** — "Low to High" and "High to Low" don't specify that they sort by price. | Session replay (sort toggling) | `Browse_FilterApplied` carries `sort` | Users who change sort multiple times in rapid succession are confused about what is being sorted. |
| 3.3 | **Toast notification is easy to miss** — brief, no cart link, positioned at page top while user is looking at the card they just clicked. | Dead click (auto) near toast area | `Browse_AddToCart` | Sessions where users add to cart but then don't navigate to cart or continue browsing — they may not have seen the confirmation. |
| 3.4 | **Unauthenticated add-to-cart redirect** — user is silently sent to signup with no explanation. | Custom event | `Browse_AuthRedirect` | High `Browse_AuthRedirect` counts relative to total add-to-cart attempts indicate unauthenticated users are hitting a wall. |

---

### 4. Course Detail

| # | Pain Point | Detection Method | Custom Event | Expected Signal |
|---|-----------|-----------------|--------------|-----------------|
| 4.1 | **Lesson rows look clickable but do nothing** — hover state (`hover:bg-gray-50`) and cursor suggest interactivity, but clicking does not expand or preview the lesson. | Dead click (auto) + custom event | `CourseDetail_LessonClick` | High `CourseDetail_LessonClick` count proves users expect lesson previews. Dead click heatmap will concentrate on lesson rows. |
| 4.2 | **Price card scrolls off on mobile** — the purchase CTA is in a sidebar that disappears below the fold on small screens. | Custom event segmented by viewport | `CourseDetail_View` + `CourseDetail_AddToCart` | Compare add-to-cart rate between mobile and desktop sessions. A significant gap confirms the sidebar is hurting mobile conversion. |
| 4.3 | **No lesson preview before purchase** — users must buy to see content. | `CourseDetail_LessonClick` frequency | `CourseDetail_LessonClick` | Frequent lesson clicks followed by page exit (no add-to-cart) indicate users leave because they cannot evaluate the product. |

---

### 5. Cart

| # | Pain Point | Detection Method | Custom Event | Expected Signal |
|---|-----------|-----------------|--------------|-----------------|
| 5.1 | **Tiny remove button with no confirmation** — small gray "x", no tooltip, no undo. Accidental removals are likely. | Custom event + session replay | `Cart_ItemRemoved` | Sessions where `Cart_ItemRemoved` is immediately followed by navigating to browse and re-adding the same course indicate accidental removal. |
| 5.2 | **"$0.00 processing fee" line** — draws attention to fees that don't exist, creating anxiety about hidden costs. | Dead click (auto) on fee line | `Cart_Viewed` | Dead click heatmap will show clicks/hovers on the processing fee line. Session replays may show hesitation before checkout. |
| 5.3 | **"Proceed to Checkout" implies more steps** — users hesitate wondering how long the checkout will be. No progress indicator. | Session replay (hesitation time) | `Cart_ProceedToCheckout` | Long time-on-page before `Cart_ProceedToCheckout` fires. Compare with sessions that abandon the cart entirely. |

---

### 6. Checkout

| # | Pain Point | Detection Method | Custom Event | Expected Signal |
|---|-----------|-----------------|--------------|-----------------|
| 6.1 | **No card number auto-formatting** — users must manually type or paste with spaces. High backspace frequency. | Session replay (keystroke patterns) | `Checkout_ValidationFailed` with `cardNumber` in errorFields | Elevated validation failure rate on `cardNumber`. Session replays showing repeated backspace usage in the card field. |
| 6.2 | **CVV masked with no reveal toggle** — type="password" prevents verification. | Session replay | `Checkout_ValidationFailed` with `cvv` in errorFields | Higher-than-expected CVV validation errors compared to other fields. |
| 6.3 | **"Processing..." button with no spinner** — after submit, the button text changes but there is no visual progress indicator. Users don't know if the payment is working. | Rage click (auto) | `Checkout_SubmitAttempt` | Multiple `Checkout_SubmitAttempt` events per session, or rage clicks on the disabled button during the 1.5s processing delay. |
| 6.4 | **No "Back to Cart" link** — users who want to edit their cart must use the browser back button or header navigation. | Session replay (back navigation) | `Checkout_Started` | Sessions where users navigate away from checkout and return to cart via browser back button. |
| 6.5 | **Unprofessional order confirmation ID** — the order number is a raw timestamp-hash (`1706123456789-abc1234`), not a human-friendly format. No email confirmation message. | Session replay | `Checkout_Success` carries `orderId` | Sessions where users linger on the success page, attempt to copy the order ID, or take screenshots. |

---

### 7. Course Creation

| # | Pain Point | Detection Method | Custom Event | Expected Signal |
|---|-----------|-----------------|--------------|-----------------|
| 7.1 | **"Target Proficiency" instead of "Difficulty"** — jargon label forces mental mapping. | Session replay (hesitation) | `CourseCreation_ValidationFailed` | Long dwell time on the difficulty selector; sessions where users click one level then switch. |
| 7.2 | **L1/L2/L3 labels are not self-explanatory** — sub-labels ("Fundamentals", "Applied", "Expert") are small and don't clearly map to beginner/intermediate/advanced. | Rage click (auto) if users click multiple levels | `CourseCreation_Success` carries `difficulty` | Distribution of difficulty selections may be skewed if users default to the first option out of confusion. |
| 7.3 | **"Unit Cost (USD)" instead of "Price"** — unnecessary jargon. Placeholder doesn't clarify dollars vs. cents. | Session replay | `CourseCreation_ValidationFailed` with `price` in errorFields | Users entering values like `4999` instead of `49.99` causing validation errors or incorrect prices. |
| 7.4 | **Conditional custom category field** — selecting "Other" reveals a second field that is easy to miss, creating a two-step process. | Custom event | `CourseCreation_ValidationFailed` with `customCategory` in errorFields | Validation failures specifically on `customCategory` indicate users selected "Other" but missed the follow-up field. |
| 7.5 | **"Discard" button with no confirmation** — one click destroys all form data. | Session replay | — | Sessions where users click Discard then immediately navigate back to course creation indicate accidental data loss. |
| 7.6 | **Redirect to dashboard after creation** — breaks the natural flow of create course then add lessons. | Session replay | `CourseCreation_Success` | Sessions where `CourseCreation_Success` is quickly followed by navigation to lesson creation indicate the redirect destination is wrong. |

---

### 8. Lesson Creation

| # | Pain Point | Detection Method | Custom Event | Expected Signal |
|---|-----------|-----------------|--------------|-----------------|
| 8.1 | **"Parent Container" instead of "Course"** — jargon label makes it unclear what to select. | Session replay (hesitation) | `LessonCreation_ValidationFailed` with `course` in errorFields | Validation errors on course selection; long dwell time on the dropdown. |
| 8.2 | **"Content Format" is vague** — could mean delivery format or file format. | Session replay | `LessonCreation_Success` carries `type` | Distribution of type selections may reveal confusion (e.g., users selecting "Document" when they mean "Video"). |
| 8.3 | **Non-standard type labels** — "Document" (Text), "Recording" (Video), "Assessment" (Quiz). | Session replay (type toggling) | `LessonCreation_Success` carries `type` | Sessions where users click one type then switch indicate label confusion. |
| 8.4 | **Duration split into two fields** — number input + unit dropdown adds complexity. "seconds" option is impractical. "hrs" inconsistent with "minutes"/"seconds". | Session replay | `LessonCreation_ValidationFailed` with `duration` in errorFields | Duration validation errors; sessions where users change the unit dropdown multiple times. |
| 8.5 | **"Save Draft" and "Add Lesson" are both submit buttons** — "Save Draft" doesn't actually save as draft. Users don't know the difference. | Session replay | `LessonCreation_SubmitAttempt` | If distinguishable in replay, compare click rates on each button. Users who click "Save Draft" expecting draft behavior will be confused when it submits normally. |

---

### 9. Header & Navigation

| # | Pain Point | Detection Method | Custom Event | Expected Signal |
|---|-----------|-----------------|--------------|-----------------|
| 9.1 | **Non-standard cart icon** — bag shape instead of a cart. Small badge count in same color as logo. | Dead click (auto) on nearby elements | — | Dead clicks around the header area where users look for a cart icon but miss it. |
| 9.2 | **Tiny "exit" logout button** — low contrast, small text, ambiguous label. | Rage click (auto) | — | Rage clicks on the logout button area. Dead clicks on the avatar or username (expecting a dropdown menu). |

---

## Full Custom Event Reference

| Event Name | Page | Properties | Purpose |
|-----------|------|-----------|---------|
| `Landing_CTA_Click` | Landing | `location` ("hero_primary", "hero_secondary", "bottom") | Measure which CTA drives signups |
| `Signup_Attempt` | Signup | `role` | Track form submission attempts |
| `Signup_Validation_Failed` | Signup | `errorFields[]`, `errorCount` | Identify which fields cause errors |
| `Signup_Success` | Signup | `role` | Measure signup conversion rate |
| `Browse_AuthRedirect` | Browse | `courseId` | Quantify unauthenticated add-to-cart attempts |
| `Browse_AddToCart` | Browse | `courseId`, `price`, `cartSize` | Track add-to-cart from catalog |
| `Browse_FilterApplied` | Browse | `filter`, `sort` | Understand discovery behavior |
| `CourseDetail_View` | Course Detail | `courseId`, `price`, `difficulty` | Track course page engagement |
| `CourseDetail_AddToCart` | Course Detail | `courseId`, `price` | Track add-to-cart from detail page |
| `CourseDetail_CheckoutClick` | Course Detail | `courseId` | Track direct-to-checkout conversion |
| `CourseDetail_LessonClick` | Course Detail | `lessonId`, `courseId` | Prove users expect lesson previews |
| `Cart_Viewed` | Cart | `itemCount`, `totalCents` | Track cart engagement |
| `Cart_ItemRemoved` | Cart | `courseId`, `remainingCount` | Track item removal rate |
| `Cart_ProceedToCheckout` | Cart | `itemCount`, `totalCents` | Measure cart-to-checkout conversion |
| `Checkout_Started` | Checkout | `itemCount`, `totalCents` | Track checkout funnel entry |
| `Checkout_SubmitAttempt` | Checkout | `totalCents` | Track payment submission attempts |
| `Checkout_ValidationFailed` | Checkout | `errorFields[]` | Identify problematic payment fields |
| `Checkout_Success` | Checkout | `orderId`, `totalCents`, `itemCount` | Track completed purchases |
| `CourseCreation_SubmitAttempt` | Course Create | — | Track form submissions |
| `CourseCreation_ValidationFailed` | Course Create | `errorFields[]` | Identify problematic form fields |
| `CourseCreation_Success` | Course Create | `courseId`, `category`, `difficulty` | Track successful course creation |
| `LessonCreation_SubmitAttempt` | Lesson Create | — | Track form submissions |
| `LessonCreation_ValidationFailed` | Lesson Create | `errorFields[]` | Identify problematic form fields |
| `LessonCreation_Success` | Lesson Create | `lessonId`, `courseId`, `type` | Track successful lesson creation |

---

## Automatic Detection Summary

These require no custom code. FullStory captures them out of the box.

| Detection Type | Target Elements | Pages |
|---------------|----------------|-------|
| **Rage Clicks** | "Continue" submit button, "Processing..." checkout button, "exit" logout button, non-clickable "terms and conditions" span | Signup, Checkout, Header |
| **Dead Clicks** | Lesson rows on course detail, stat labels on dashboard, "Sign in here" text on signup, "$0.00 processing fee" on cart, non-standard cart icon misses in header | Course Detail, Dashboard, Signup, Cart, Header |
| **Error Clicks** | Any click that coincides with a JS console error | All pages |
| **Thrashed Cursor** | User moving mouse erratically near confusing UI elements (jargon dropdowns, hidden fields) | Signup, Course Create, Lesson Create |

---

## Actionable Items

The data FullStory collects enables the following concrete actions, organized by priority.

### High Priority — Purchase Funnel Fixes

| # | Action | Data Source | Expected Outcome |
|---|--------|------------|-----------------|
| 1 | **Replace "Processing..." with a spinner and disabled state feedback.** Rage clicks on the checkout button confirm users think it is broken. | Rage click count on checkout submit + `Checkout_SubmitAttempt` duplicates per session | Reduced rage clicks; fewer duplicate submit attempts. |
| 2 | **Add lesson preview/expand on course detail.** `CourseDetail_LessonClick` volume proves users expect it. Dead click heatmap confirms. | `CourseDetail_LessonClick` count + dead click heatmap | Higher add-to-cart rate from course detail pages. |
| 3 | **Auto-format the card number field.** Session replays showing high backspace frequency and `Checkout_ValidationFailed` on `cardNumber` confirm friction. | `Checkout_ValidationFailed` error field breakdown + session replay | Reduced checkout validation failures. |
| 4 | **Add a CVV show/hide toggle.** Compare CVV error rate against other fields. If disproportionately high, masking is the cause. | `Checkout_ValidationFailed` field-level analysis | Lower CVV error rate, fewer form re-submissions. |
| 5 | **Remove the "$0.00 processing fee" line from cart.** Dead click heatmap will confirm users interact with it, and session replays show hesitation. | Dead click data on fee line + time-on-page before `Cart_ProceedToCheckout` | Reduced cart abandonment. |

### Medium Priority — Signup & Onboarding Fixes

| # | Action | Data Source | Expected Outcome |
|---|--------|------------|-----------------|
| 6 | **Rename "Continue" to "Create Account".** Rage click data on the button + sessions with multiple `Signup_Attempt` events confirm confusion. | Rage click count + `Signup_Attempt` per session | Clearer user expectations; fewer hesitation-related rage clicks. |
| 7 | **Remove the email confirmation field.** `Signup_Validation_Failed` with `emailConfirm` in errorFields quantifies how often this field causes errors. | `Signup_Validation_Failed` errorField analysis | Shorter signup form, reduced error rate. |
| 8 | **Replace "Content Provider/Consumer" with "Instructor/Student".** Session replays showing dropdown hesitation and selection changes confirm label confusion. | Session replay dwell time on role dropdown | Faster form completion, fewer role selection changes. |
| 9 | **Make "terms and conditions" a real link or remove the styling.** Dead click heatmap will show concentrated clicks on this span. | Dead click heatmap | Reduced dead clicks; improved trust. |
| 10 | **Make "Sign in here" a functional link.** Dead click data below the submit button confirms users try to click it. | Dead click heatmap | Existing users can find login. |

### Medium Priority — Creator Flow Fixes

| # | Action | Data Source | Expected Outcome |
|---|--------|------------|-----------------|
| 11 | **Rename "Target Proficiency" to "Difficulty" and "L1/L2/L3" to "Beginner/Intermediate/Advanced".** Session replays showing repeated selection changes confirm label confusion. | Session replay + `CourseCreation_Success` difficulty distribution | More even difficulty distribution; faster field completion. |
| 12 | **Rename "Unit Cost" to "Price".** `CourseCreation_ValidationFailed` on `price` field quantifies errors. | `CourseCreation_ValidationFailed` field analysis | Fewer pricing errors. |
| 13 | **Rename "Parent Container" to "Course" in lesson creation.** Session replay hesitation on the dropdown confirms confusion. | Session replay + `LessonCreation_ValidationFailed` on `course` | Faster course selection. |
| 14 | **Replace "Document/Recording/Assessment" with "Text/Video/Quiz".** Session replays showing type toggling confirm label confusion. | Session replay | Fewer type selection changes per session. |
| 15 | **Merge duration into a single field** (e.g., "15 min" as free text or a single input with built-in unit). | `LessonCreation_ValidationFailed` on `duration` + session replay | Fewer duration validation errors. |
| 16 | **Redirect to lesson creation after course creation**, not dashboard. | Time between `CourseCreation_Success` and next lesson creation navigation | Shorter time to first lesson; improved creator flow. |
| 17 | **Add confirmation dialog to "Discard" button.** Session replays showing Discard followed by immediate return to course creation confirm accidental data loss. | Session replay | Reduced accidental form data loss. |

### Lower Priority — Navigation & Discovery Fixes

| # | Action | Data Source | Expected Outcome |
|---|--------|------------|-----------------|
| 18 | **Persist filter state in URL query params on browse page.** `Browse_FilterApplied` events immediately after page load confirm users re-apply lost filters. | `Browse_FilterApplied` timing analysis | Filters survive page refresh; reduced re-application. |
| 19 | **Add "Go to Cart" link in the add-to-cart toast.** Session replays where users add to cart but don't proceed confirm the toast is insufficient. | `Browse_AddToCart` vs. subsequent cart/checkout navigation rate | Higher cart visit rate after add-to-cart. |
| 20 | **Rename the logout button from "exit" to "Log out" and increase its size.** Rage click data around the logout area confirms discoverability issues. | Rage click heatmap on header | Fewer rage clicks; faster logout. |
| 21 | **Use a standard cart icon instead of a bag shape.** Dead click heatmap in the header will show misclicks near where users expect a cart. | Dead click heatmap | Improved cart discoverability. |
| 22 | **Add "Back to Cart" link on checkout page.** Session replays showing browser-back usage from checkout confirm the need. | Session replay back-navigation patterns | Fewer browser-back exits from checkout. |
| 23 | **Generate human-friendly order IDs and add email confirmation copy.** Session replays showing users lingering on the success page or attempting to copy the ID confirm the issue. | Session replay on success page + time-on-page | Increased user confidence post-purchase. |
| 24 | **Remove or consolidate the "Save Draft" button on lesson creation.** If both buttons submit identically, the distinction confuses users. | Session replay comparing button clicks | Clearer form submission flow. |

---

### Using FullStory Dashboards to Prioritize

1. **Rage Click Dashboard** — Sort pages by rage click frequency. The top offenders are the highest-priority fixes.
2. **Dead Click Dashboard** — Identify elements users expect to be interactive. Each dead click cluster is a potential feature or fix.
3. **Funnel Analysis** — Build funnels from custom events (e.g., `Checkout_Started` -> `Checkout_SubmitAttempt` -> `Checkout_Success`) to find the biggest drop-off points.
4. **Segment Comparison** — Compare student vs. instructor behavior using the `role` property from `identifyUser()`. Different roles may hit different friction points.
5. **Session Replay Search** — Search for sessions containing specific events (e.g., `Checkout_ValidationFailed`) to watch real users struggle and build empathy for fixes.
6. **Metrics Over Time** — Track rage click rate and funnel conversion rate week-over-week to measure the impact of each fix after it ships.
