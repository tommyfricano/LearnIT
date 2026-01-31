# FullStory Setup Tutorial for LearnIT

Step-by-step guide to configuring the FullStory dashboard so every custom event, frustration signal, and user journey in LearnIT produces actionable data.

**Prerequisites:** You have a FullStory account and your `NEXT_PUBLIC_FULLSTORY_ORG_ID` is set in Vercel. The LearnIT app is deployed and receiving traffic at `learn-it-demo.vercel.app`.

---

## 1. Verify Data Is Flowing

Before building anything, confirm FullStory is receiving events.

1. Go to **fullstory.com** and log in.
2. Open the LearnIT site (`learn-it-demo.vercel.app`) in another tab.
3. Click through the signup flow — fill out the form, submit it.
4. Back in FullStory, go to **Sessions** (left sidebar).
5. You should see your session appear within a few seconds. Click it to open the replay.
6. In the replay, look for the **Events** tab in the right panel. You should see:
   - `Signup_Attempt` (with `role` property)
   - `Signup_Success` or `Signup_Validation_Failed`
   - Page view events (automatic)

If you see events, data is flowing. If not, check:
- Browser ad blockers / privacy extensions (they can block FullStory)
- The org ID in Vercel env vars matches your FullStory account
- The deploy is the latest version with instrumentation code

---

## 2. Set Up Segments

Segments let you group users for comparison. Create these four segments to slice all future analysis.

### 2a. Students vs. Instructors

1. Go to **Segments** in the left sidebar, click **Create Segment**.
2. Name it **Students**.
3. Set the condition: `User Properties` > `role_str` > `is` > `Content Consumer`.
4. Save.
5. Repeat for **Instructors** with `role_str` `is` `Content Provider`.

These segments correspond to the `role_str` property set by `identifyUser()` in the code. Every dashboard, funnel, and search you build can be filtered by these segments.

### 2b. Mobile vs. Desktop

1. Create a new segment named **Mobile Users**.
2. Set condition: `Browser` > `Screen Width` > `is less than` > `768`.
3. Save.
4. Create **Desktop Users** with `Screen Width` `is greater than or equal to` `768`.

These are critical for Journey 3 (Course Discovery) — the course detail price card scrolls off screen on mobile, so you need to compare conversion rates across viewports.

---

## 3. Build Funnels

Funnels are the core analysis tool for LearnIT. Each one maps directly to a journey from your documentation.

### 3a. Journey 1 Funnel: Signup to First Enrollment

This is the primary conversion funnel — the whole student purchase flow.

1. Go to **Funnels** in the left sidebar, click **Create Funnel**.
2. Name it **Signup to Enrollment**.
3. Add these steps in order (each step is a custom event):

| Step | Event Name | Notes |
|------|-----------|-------|
| 1 | `Signup_Attempt` | User submits the signup form |
| 2 | `Signup_Success` | Account created |
| 3 | `Browse_AddToCart` | First item added to cart |
| 4 | `Cart_ProceedToCheckout` | User moves to checkout |
| 5 | `Checkout_SubmitAttempt` | User tries to pay |
| 6 | `Checkout_Success` | Purchase completed |

4. Set the **conversion window** to `within 1 session` (or `within 30 minutes` for a tighter view).
5. Save the funnel.

**What to look for:** The percentage drop between each step. The biggest drops tell you where the friction is worst. Compare this funnel filtered by the **Students** segment vs. unfiltered.

### 3b. Journey 2 Funnel: Course Creation Flow

1. Create a new funnel named **Course Creation**.
2. Steps:

| Step | Event Name |
|------|-----------|
| 1 | `CourseCreation_SubmitAttempt` |
| 2 | `CourseCreation_Success` |
| 3 | `LessonCreation_SubmitAttempt` |
| 4 | `LessonCreation_Success` |

3. Set conversion window to `within 1 session`.
4. Save.

**What to look for:** The gap between steps 2 and 3. After course creation, the app redirects to the dashboard (not lesson creation), so there will be a delay or drop-off between `CourseCreation_Success` and `LessonCreation_SubmitAttempt`. This funnel quantifies how much that broken redirect costs.

### 3c. Journey 3 Funnel: Browse to Purchase

1. Create a new funnel named **Browse to Purchase**.
2. Steps:

| Step | Event Name |
|------|-----------|
| 1 | `CourseDetail_View` |
| 2 | `CourseDetail_AddToCart` OR `Browse_AddToCart` |
| 3 | `Cart_ProceedToCheckout` |
| 4 | `Checkout_Success` |

3. Save.

**What to look for:** Compare this funnel between the **Mobile Users** and **Desktop Users** segments. If mobile drops off significantly more at step 2 (add to cart), the price card scrolling off screen is confirmed as a real problem.

---

## 4. Create Dashboards

Dashboards give you a single-screen view of system health. Create one main dashboard with cards for each metric.

1. Go to **Dashboards** in the left sidebar, click **Create Dashboard**.
2. Name it **LearnIT Health**.
3. Add these metric cards:

### Card 1: Signup Conversion Rate
- **Type:** Metric
- **Numerator event:** `Signup_Success` (count)
- **Denominator event:** `Signup_Attempt` (count)
- **Time range:** Last 7 days
- **Display as:** Percentage

### Card 2: Checkout Conversion Rate
- **Type:** Metric
- **Numerator event:** `Checkout_Success` (count)
- **Denominator event:** `Checkout_SubmitAttempt` (count)
- **Time range:** Last 7 days
- **Display as:** Percentage

### Card 3: Cart Abandonment
- **Type:** Metric
- **Numerator event:** `Cart_ProceedToCheckout` (count)
- **Denominator event:** `Cart_Viewed` (count)
- **Time range:** Last 7 days
- **Display as:** Percentage
- A low percentage here means users are viewing the cart but not proceeding — the "$0.00 processing fee" and "Proceed to Checkout" wording are likely causes.

### Card 4: Course Creation Success Rate
- **Type:** Metric
- **Numerator event:** `CourseCreation_Success` (count)
- **Denominator event:** `CourseCreation_SubmitAttempt` (count)
- **Time range:** Last 7 days

### Card 5: Rage Click Sessions (Checkout)
- **Type:** Metric
- **Search:** Sessions where page URL contains `/checkout` AND frustration signal is `Rage Click`
- **Time range:** Last 7 days
- **Display as:** Count
- This tracks the "Processing..." button without spinner — users rage-click it during the 1.5s delay.

### Card 6: Browse-to-Cart Rate
- **Type:** Metric
- **Numerator event:** `Browse_AddToCart` (unique users)
- **Denominator event:** Sessions with page URL containing `/browse` (unique users)
- **Time range:** Last 7 days

### Card 7: Signup Validation Errors
- **Type:** Event count
- **Event:** `Signup_Validation_Failed`
- **Time range:** Last 7 days, grouped by day
- **Display as:** Line chart
- Spikes here indicate form friction. Drill into the `errorFields` property to see which field is causing the most failures.

4. Save the dashboard.

---

## 5. Set Up Alerts

Alerts notify you when metrics cross thresholds so you catch regressions immediately.

1. Go to **Alerts** (under the Settings/Notifications area, or from a metric card's options menu).
2. Create these alerts:

| Alert Name | Condition | Threshold |
|-----------|-----------|-----------|
| Checkout Rage Clicks Spike | Rage click sessions on `/checkout` | Exceeds 5% of checkout sessions |
| Signup Conversion Drop | `Signup_Success` / `Signup_Attempt` ratio | Falls below 70% (7-day rolling) |
| Cart-to-Checkout Drop | `Cart_ProceedToCheckout` / `Cart_Viewed` ratio | Falls below 60% |
| Course Creation Failures | `CourseCreation_ValidationFailed` count | Exceeds 10% of attempts |
| Mobile Add-to-Cart Gap | Compare `CourseDetail_AddToCart` rate mobile vs desktop | Gap exceeds 20 percentage points |

3. Set notification delivery to email or Slack (if integrated).

---

## 6. Configure Heatmaps

Heatmaps show where users click on each page. They're especially useful for dead click detection.

1. Go to **Heatmaps** in the left sidebar.
2. Enter a URL to generate a heatmap. Create heatmaps for these pages:

| Page URL | What to Look For |
|----------|-----------------|
| `/signup` | Dead clicks on "terms and conditions" text, "Sign in here" text. Rage clicks on the "Continue" button. |
| `/browse` | Click distribution on course cards — are users clicking the tiny "Add to cart" link or the title/image? Low CTA clicks confirm the link needs to be a button. |
| `/courses/[any-id]` | Dead clicks on lesson rows (users expect them to expand). This is `CourseDetail_LessonClick` visualized spatially. |
| `/cart` | Dead clicks or hovers on the "$0.00 processing fee" line. |
| `/checkout` | Rage click concentration on the submit button during processing. |

3. For each heatmap, toggle between **Click Map**, **Scroll Map**, and **Move Map** to get different insights:
   - **Click Map:** Where users click (dead clicks and rage clicks show up here)
   - **Scroll Map:** How far users scroll (confirms if the bottom CTA on landing or the price card on course detail is below the fold)
   - **Move Map:** Where users hover (reveals hesitation on jargon labels)

---

## 7. Search for Key Session Patterns

FullStory's search lets you find sessions matching specific criteria. Save these searches for quick access.

### 7a. Checkout Frustration Sessions
1. Go to **Sessions** > **Search**.
2. Build the search: Sessions where `Checkout_SubmitAttempt` **occurred more than** `1` time.
3. This finds users who clicked the pay button multiple times — likely frustrated by the "Processing..." state with no spinner.
4. Save as **Checkout Multi-Submit**.

### 7b. Signup Validation Failures
1. Search: Sessions where `Signup_Validation_Failed` occurred.
2. Save as **Signup Errors**.
3. When reviewing these sessions, look at the `errorFields` property on the event to see which field failed. The `emailConfirm` field (email re-typing) will likely be the top offender.

### 7c. Auth Redirect Friction
1. Search: Sessions where `Browse_AuthRedirect` occurred.
2. Save as **Unauthenticated Add-to-Cart**.
3. These are users who tried to add a course to their cart but got silently redirected to signup. Watch the replays to see how confused they are.

### 7d. Course Creation Abandonment
1. Search: Sessions where `CourseCreation_SubmitAttempt` occurred but `CourseCreation_Success` did **not** occur.
2. Save as **Course Creation Abandoned**.
3. These are instructors who tried to create a course but gave up.

### 7e. Dead Click Heavy Sessions
1. Search: Sessions where **Dead Click count** > `3` on any page.
2. Save as **Dead Click Investigations**.
3. These sessions reveal UI elements that look interactive but aren't.

---

## 8. Explore Journeys (Path Analysis)

FullStory Journeys show the most common navigation paths users take.

1. Go to **Journeys** in the left sidebar.
2. Create a journey starting from the event `Signup_Success`.
3. This shows what new users do immediately after signing up. Look for:
   - Do they go to `/browse` (expected)?
   - Do they go to `/dashboard` and get stuck?
   - Do they leave the site entirely?

4. Create a second journey starting from `CourseCreation_Success`.
5. This shows what instructors do after creating a course. You should see them navigating to the dashboard first (because of the broken redirect), then hunting for lesson creation. The path length between `CourseCreation_Success` and lesson creation quantifies the redirect problem.

6. Create a third journey starting from `Browse_FilterApplied`.
7. This reveals the discovery flow — how users navigate from filtering/sorting to viewing course details to adding to cart.

---

## 9. Custom Event Properties — How to Use Them in Searches

Your 24 custom events carry properties that enable deep filtering. Here's how to use the key ones.

### Filtering by Error Fields
Events like `Signup_Validation_Failed`, `Checkout_ValidationFailed`, `CourseCreation_ValidationFailed`, and `LessonCreation_ValidationFailed` carry an `errorFields` array property.

1. In any search or funnel, click on the event.
2. Add a property filter: `errorFields` > `contains` > `emailConfirm` (or `cardNumber`, `cvv`, `price`, `duration`, etc.).
3. This isolates sessions where a specific field caused the validation error.

**Example:** Search for sessions where `Checkout_ValidationFailed` has `errorFields` containing `cardNumber`. Watch the replays to see users struggling with the unformatted card input.

### Filtering by Role
The `Signup_Attempt` and `Signup_Success` events carry a `role` property.

1. In a funnel or search, filter `Signup_Attempt` by `role` = `Content Provider` to see only instructor signups.
2. Compare completion rates between `Content Provider` and `Content Consumer` to see if one role has more signup friction.

### Filtering by Cart Value
Events like `Cart_Viewed`, `Cart_ProceedToCheckout`, `Checkout_Started`, and `Checkout_Success` carry `totalCents` and `itemCount`.

1. Filter `Checkout_Success` by `totalCents` > `5000` to find high-value purchases.
2. Compare checkout completion rates between high and low cart values to see if price sensitivity causes abandonment.

### Filtering by Course Properties
`CourseDetail_View` carries `courseId`, `price`, and `difficulty`. `CourseCreation_Success` carries `category` and `difficulty`.

1. Filter `CourseDetail_View` by `difficulty` to see which difficulty levels get the most page views.
2. Cross-reference with `CourseDetail_AddToCart` to see which difficulty level converts best.

---

## 10. Recommended Demo Walkthrough Order

When demoing FullStory with LearnIT, present the data in this order for maximum impact.

### Step 1: Show a Live Session Replay
Open a session from the **Checkout Multi-Submit** saved search. Play the replay and narrate: "Watch this user click the purchase button, see 'Processing...' with no spinner, then rage-click three more times. FullStory captured this automatically."

### Step 2: Show the Funnel
Open the **Signup to Enrollment** funnel. Point to the biggest drop-off step. Say: "X% of users drop off between cart and checkout. We can see why — the '$0.00 processing fee' creates anxiety."

### Step 3: Show the Heatmap
Open the `/courses/[id]` heatmap. Point to the dead click clusters on lesson rows. Say: "Users are clicking these lesson titles expecting a preview. Every one of these is a dead click — the element looks interactive but does nothing."

### Step 4: Show the Segment Comparison
Show the **Browse to Purchase** funnel filtered by **Mobile Users** vs **Desktop Users**. Say: "Mobile users convert at X% lower rate. Session replay shows the price card scrolls off screen on mobile — they literally can't find the buy button."

### Step 5: Show the Dashboard
Open the **LearnIT Health** dashboard. Say: "This is our standing health check. These seven metrics tell us if the product is getting better or worse. When we ship a fix, we watch the number move."

### Step 6: Show the Alert
Show an alert configuration. Say: "If checkout rage clicks spike above 5%, the team gets notified before a support ticket comes in."

---

## Quick Reference: Event-to-Feature Mapping

| FullStory Feature | LearnIT Events Used |
|-------------------|-------------------|
| **Funnels** | `Signup_Attempt` > `Signup_Success` > `Browse_AddToCart` > `Cart_ProceedToCheckout` > `Checkout_SubmitAttempt` > `Checkout_Success` |
| **Segments** | `role_str` from `identifyUser()`, viewport width |
| **Heatmaps** | Page-level (automatic clicks + `CourseDetail_LessonClick` dead clicks) |
| **Session Replay Searches** | `Checkout_SubmitAttempt` count > 1, `Signup_Validation_Failed`, `Browse_AuthRedirect` |
| **Dashboards** | Conversion ratios from event pairs, rage click counts |
| **Alerts** | Threshold breaches on conversion ratios and frustration signals |
| **Journeys** | Path analysis starting from `Signup_Success`, `CourseCreation_Success`, `Browse_FilterApplied` |
| **Automatic Detection** | Rage clicks (checkout button, signup button), dead clicks (lesson rows, terms link, fee line), thrashed cursor (jargon dropdowns) |
