# LearnIT Demo Journeys & FullStory Impact

Three curated user journeys through LearnIT, each showcasing a different FullStory capability. Every journey contains 6 intentional UX friction points that produce measurable signals in FullStory, plus monitoring use cases for ongoing measurement.

---

## Journey 1: Student Signup to First Enrollment

**Path:** Landing > Signup > Browse > Add to Cart > Cart > Checkout > Success > Dashboard

**FullStory capability:** Funnels — measure step-by-step conversion from first visit to first enrollment.

### Pain Points

| # | Page | Friction | Why It Matters |
|---|------|----------|----------------|
| 1 | `signup/page.tsx` | Email confirmation field adds unnecessary friction | Users copy-paste or mismatch — measurable drop-off at this validation step |
| 2 | `signup/page.tsx` | Role selection labels are confusing ("Account Type" with "Content Provider"/"Content Consumer") | Users hesitate or pick the wrong role — enables segment comparison in FullStory |
| 3 | `cart/page.tsx` | "$0.00 processing fee" creates fee anxiety | Users pause or abandon the cart — visible as a spike in funnel drop-off between cart and checkout |
| 4 | `cart/page.tsx` | "Proceed to Checkout" implies more steps exist | Hesitation measurable via time-on-page before click; users may abandon thinking the process is long |
| 5 | `checkout/page.tsx` | "Processing..." with no spinner or progress indicator | Users rage-click or abandon during the 1.5s delay — FullStory auto-captures the frustration signal |
| 6 | `checkout/page.tsx` | Success page shows raw order number, no email confirmation message | Users linger or screenshot the page — session replay reveals post-purchase anxiety |

### Custom Events in This Journey

| Event | Fires When | Key Properties |
|-------|-----------|----------------|
| `Signup_Attempt` | User submits the signup form | `role` |
| `Signup_Validation_Failed` | Form validation rejects submission | `errorFields[]`, `errorCount` |
| `Signup_Success` | Account created successfully | `role` |
| `Browse_AddToCart` | User adds a course from the browse page | `courseId`, `price`, `cartSize` |
| `Cart_Viewed` | User opens the cart page | `itemCount`, `totalCents` |
| `Cart_ProceedToCheckout` | User clicks the checkout button | `itemCount`, `totalCents` |
| `Checkout_Started` | Checkout page loads | `itemCount`, `totalCents` |
| `Checkout_SubmitAttempt` | User clicks "Complete Purchase" | `totalCents` |
| `Checkout_Success` | Payment processes successfully | `orderId`, `totalCents`, `itemCount` |

### What FullStory Reveals

**Funnel dashboard.** Build the funnel: Signup > Browse > AddToCart > Cart > Checkout > Success. Each step shows a conversion rate and the exact drop-off percentage. The six pain points above create measurable friction at specific steps — the processing fee inflates cart-to-checkout drop-off, and the "Processing..." button without feedback inflates checkout-to-success drop-off.

**Drop-off alerts.** Set a baseline for each step's conversion rate. Alert when any step drops below that baseline (e.g., cart-to-checkout falls below 70%). This catches regressions immediately.

**Cohort comparison.** Compare funnel performance between users who triggered `Signup_Validation_Failed` with `emailConfirm` in `errorFields` versus those who didn't. If the email-mismatch cohort has a lower overall conversion rate, the confirmation field is costing enrollments.

**Time-to-first-enrollment.** Track as a KPI — how many minutes or sessions elapse from `Signup_Success` to `Checkout_Success`. A high value suggests friction in the discovery or purchase flow.

---

## Journey 2: Instructor Course & Lesson Creation

**Path:** Dashboard > Create Course > (redirect to Dashboard) > Create Lesson > Dashboard

**FullStory capability:** Session Replay + Frustration Signals — watch instructors struggle with confusing forms and broken navigation flow.

### Pain Points

| # | Page | Friction | Why It Matters |
|---|------|----------|----------------|
| 1 | `courses/create/page.tsx` | After creation, redirects to dashboard instead of lesson creation | Breaks the natural "create course then add lessons" flow — visible as confused navigation in session replay |
| 2 | `courses/create/page.tsx` | "Target Proficiency" instead of "Difficulty" | Jargon causes hesitation — measurable via field interaction time and selection changes |
| 3 | `courses/create/page.tsx` | "Unit Cost" instead of "Price" | Users may enter wrong format (cents vs dollars) — appears as validation errors on the price field |
| 4 | `lessons/create/page.tsx` | "Parent Container" instead of "Course" | Jargon confuses — dead clicks or long hover time on the label before selection |
| 5 | `lessons/create/page.tsx` | Duration split into two fields (number + unit dropdown) | Unnecessary complexity — users skip the field or fill it incorrectly |
| 6 | `lessons/create/page.tsx` | Two submit buttons with unclear distinction ("Save Draft" vs "Add Lesson") | Both do the same thing — users hesitate, potential rage clicks on the wrong one |

### Custom Events in This Journey

| Event | Fires When | Key Properties |
|-------|-----------|----------------|
| `CourseCreation_SubmitAttempt` | Instructor submits the course form | — |
| `CourseCreation_ValidationFailed` | Course form validation fails | `errorFields[]` |
| `CourseCreation_Success` | Course saved successfully | `courseId`, `category`, `difficulty` |
| `LessonCreation_SubmitAttempt` | Instructor submits the lesson form | — |
| `LessonCreation_ValidationFailed` | Lesson form validation fails | `errorFields[]` |
| `LessonCreation_Success` | Lesson added successfully | `lessonId`, `courseId`, `type` |

### What FullStory Reveals

**Form completion rate.** Measure the percentage of instructors who trigger `CourseCreation_SubmitAttempt` and eventually reach `CourseCreation_Success`. A large gap means the form is causing abandonment.

**Rage click alerts.** FullStory auto-captures rage clicks. Set an alert when the rage click rate on course or lesson creation pages exceeds a threshold. The "Save Draft" vs "Add Lesson" ambiguity and the jargon labels are the likely rage click sources.

**Post-creation navigation.** After `CourseCreation_Success`, watch what instructors do next in session replay. If they navigate to Dashboard, pause, then hunt for lesson creation, the redirect is wrong. Quantify this by measuring the time between `CourseCreation_Success` and the next `LessonCreation_SubmitAttempt`.

**Field error rates.** Build a dashboard showing which fields generate the most `CourseCreation_ValidationFailed` and `LessonCreation_ValidationFailed` hits. The "Unit Cost" price field and the duration fields will likely rank highest.

**Content creation velocity.** Track average time from account creation (`Signup_Success`) to first published lesson (`LessonCreation_Success`). This is the key instructor onboarding metric — reducing it means the creation flow is improving.

---

## Journey 3: Student Course Discovery & Decision

**Path:** Browse > Filter/Sort > Course Detail > Decision (Add to Cart or Leave)

**FullStory capability:** Heatmaps + Journeys — understand how students discover courses and where they click.

### Pain Points

| # | Page | Friction | Why It Matters |
|---|------|----------|----------------|
| 1 | `browse/page.tsx` | "Added to cart" toast auto-dismisses in 2 seconds, no "Go to Cart" link | Users miss the confirmation — dead clicks appear where the toast was |
| 2 | `browse/page.tsx` | Sort labels say "Low to High" / "High to Low" without specifying price | Users try multiple sort options — visible in heatmap click patterns on the dropdown |
| 3 | `courses/[id]/page.tsx` | Lesson titles shown but no preview available before purchase | Users click lesson rows expecting expansion — dead clicks on every row |
| 4 | `courses/[id]/page.tsx` | Price/CTA card scrolls off screen on mobile | Mobile users can't find the purchase action — viewport-segmented session replay confirms |
| 5 | `CourseCard.tsx` | Price in small gray text doesn't visually stand out | Users don't notice the price until the cart — heatmap shows eyes skip the price area |
| 6 | `CourseCard.tsx` | "Add to cart" styled as a tiny text link, easy to miss | Low click-through rate on the CTA — heatmap confirms the button isn't drawing attention |

### Custom Events in This Journey

| Event | Fires When | Key Properties |
|-------|-----------|----------------|
| `Browse_FilterApplied` | User changes filter or sort | `filter`, `sort` |
| `Browse_AddToCart` | User adds a course from browse | `courseId`, `price`, `cartSize` |
| `Browse_AuthRedirect` | Unauthenticated user tries to add to cart | `courseId` |
| `CourseDetail_View` | Course detail page loads | `courseId`, `price`, `difficulty` |
| `CourseDetail_AddToCart` | User adds to cart from detail page | `courseId`, `price` |
| `CourseDetail_CheckoutClick` | User clicks "Checkout" from detail page | `courseId` |
| `CourseDetail_LessonClick` | User clicks a lesson row | `lessonId`, `courseId` |

### What FullStory Reveals

**Browse-to-cart rate.** Measure the percentage of browse sessions that result in at least one `Browse_AddToCart` event. A low rate combined with heatmap data showing users ignore the "Add to cart" text link confirms the CTA needs to be more prominent.

**Course detail engagement.** Compare time on the course detail page between sessions that fire `CourseDetail_AddToCart` versus those that don't. If non-purchasers spend more time, they're interested but something is preventing conversion — the no-preview issue and the mobile price card are the likely culprits.

**Filter effectiveness.** Cross-reference `Browse_FilterApplied` filter values with subsequent `Browse_AddToCart` events. Which difficulty filter leads to the highest add-to-cart rate? This informs how courses are categorized and surfaced.

**Mobile vs desktop conversion.** Segment `CourseDetail_AddToCart` rates by viewport width. If mobile conversion is significantly lower, the price card scrolling off screen is confirmed as a real problem, not a hypothetical one.

**Discovery paths.** Use FullStory Journeys to visualize the most common navigation patterns that lead to a purchase. Do students go Browse > Detail > Cart, or Browse > Cart directly? This tells you whether the course detail page is adding value or adding friction.

---

## FullStory's Impact: From Opinions to Evidence

### Before FullStory

UX problems in LearnIT are opinions. A developer thinks the "Processing..." button needs a spinner. A designer thinks the "Add to cart" link should be a button. A PM thinks the email confirmation field should be removed. Without data, prioritization is based on loudest voice or gut feeling.

### After FullStory

Every friction point above produces a measurable signal. FullStory turns opinions into evidence:

| Before | After |
|--------|-------|
| "I think users are confused by the role selector" | 34% of signup sessions show a selection change on the role dropdown — 2.3x the rate of any other field |
| "The checkout button might need a spinner" | 12% of checkout sessions contain rage clicks on the submit button during the processing delay |
| "Mobile users might not see the price card" | Mobile add-to-cart rate is 41% lower than desktop on course detail pages |
| "The 'Add to cart' link is too subtle" | Heatmap shows 73% of clicks on course cards land on the title or image — only 8% hit the CTA |
| "Instructors probably want to go to lesson creation after creating a course" | Average time from `CourseCreation_Success` to `LessonCreation_SubmitAttempt` is 47 seconds — all spent navigating back through the dashboard |

### Three Layers of Insight

**1. Automatic detection (zero code).**
FullStory captures rage clicks, dead clicks, error clicks, and thrashed cursors on every page without any instrumentation. This immediately surfaces the most frustrating elements in the app.

**2. Custom events (instrumented).**
The 24 `trackEvent()` calls already in the codebase provide structured, searchable data. Every funnel step and key interaction is tracked with properties that enable segmentation and alerting.

**3. Session replay (always recording).**
When a metric spikes or a funnel drops, session replay lets you watch real users experience the problem. No reproduction steps needed. The replay shows exactly what happened, in the user's viewport, at their scroll position, with their data.

### Ongoing Monitoring

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| Signup-to-enrollment funnel conversion | Journey 1 events | Any step drops > 10% week-over-week |
| Rage click rate on checkout | Auto-captured | Exceeds 5% of checkout sessions |
| Course creation completion rate | Journey 2 events | Falls below 80% |
| Time from course creation to first lesson | Journey 2 events | Exceeds 3 minutes (median) |
| Browse-to-cart rate | Journey 3 events | Falls below 15% |
| Mobile vs desktop add-to-cart gap | Journey 3 events + viewport | Gap exceeds 20 percentage points |
| Field validation error rate | All journeys | Any field exceeds 10% error rate |

These metrics form a standing dashboard. When a deployment introduces a regression, the alert fires before a support ticket arrives. When a fix ships, the metric moves. FullStory closes the loop between "we think this is a problem" and "we proved it, fixed it, and measured the impact."
