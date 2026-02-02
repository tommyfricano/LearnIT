# Demo Hit List: Strongest Pain Points by Journey

8 pain points across 3 journeys. Each one chosen because it produces an undeniable FullStory artifact you can show on screen while narrating.

---

## Journey 1: Student Signup to First Enrollment

**FullStory feature to showcase: Funnels + Frustration Signals**

### 1. Email confirmation mismatch (Signup)
- **What to do:** Type a slightly different email in the "Verify Email" field and submit.
- **What fires:** `Signup_Validation_Failed` with `emailConfirm` in `errorFields`.
- **What to show in FullStory:** The event properties panel showing the exact field that failed. Then show the metric: "X% of signup sessions hit this validation error." The audience immediately sees that a single unnecessary field is blocking conversions.

### 2. "$0.00 processing fee" hesitation (Cart)
- **What to do:** Pause on the cart page. Hover over or click the processing fee line. Mention it out loud: "Wait, is there a fee?"
- **What to show in FullStory:** Dead click heatmap on the cart page — clicks clustering on the fee line. Then show the funnel drop-off between `Cart_Viewed` and `Cart_ProceedToCheckout`. The fee line creates doubt right before the conversion step.

### 3. Rage clicks on "Processing..." button (Checkout)
- **What to do:** Click "Complete Purchase." When it changes to "Processing..." with no spinner, click it 3-4 more times.
- **What to show in FullStory:** The session replay with rage click indicators. Then the rage click metric for `/checkout-it` — "X% of checkout sessions contain rage clicks on the submit button." This is the single most visual demo moment. The audience watches the rage click happen in replay and immediately understands.

---

## Journey 2: Instructor Course & Lesson Creation

**FullStory feature to showcase: Session Replay + Form Analytics**

### 4. Jargon on course creation form (Course Create)
- **What to do:** Hesitate visibly on "Target Proficiency" — hover over it, pause, then pick one. Do the same with "Unit Cost (USD)" — type a value, delete it, retype.
- **What to show in FullStory:** The session replay showing your cursor hovering and hesitating. Then show `CourseCreation_ValidationFailed` broken down by `errorFields` — the `price` field will rank high. The narrative: "We can see in replay that the label confused the user, and the data confirms it's causing errors."

### 5. Wrong redirect after course creation (Course Create -> Dashboard)
- **What to do:** Submit the course form successfully. You land on the dashboard instead of lesson creation. Visibly look around: "OK, I created a course... now where do I add lessons?" Navigate manually to lesson creation.
- **What to show in FullStory:** The session replay showing the confused navigation. Then show the time gap between `CourseCreation_Success` and the next `LessonCreation_SubmitAttempt`. The narrative: "Every instructor wastes X seconds navigating back because the redirect sends them to the wrong place."

### 6. Two identical submit buttons (Lesson Create)
- **What to do:** Fill out the lesson form. Pause at the bottom — "Save Draft" and "Add Lesson" are both there. Hover between them. Pick one.
- **What to show in FullStory:** The session replay showing the hesitation between buttons. If possible, show a heatmap of the lesson creation page — click distribution split between two buttons that do the same thing. The narrative: "Users don't know which button to click because both do the same thing."

---

## Journey 3: Student Course Discovery & Decision

**FullStory feature to showcase: Heatmaps + Segment Comparison**

### 7. Dead clicks on lesson rows (Course Detail)
- **What to do:** Open a course detail page. Click on 3-4 lesson titles expecting them to expand or show a preview. Nothing happens.
- **What to show in FullStory:** The dead click heatmap on the course detail page — a cluster of dead clicks on every lesson row. Then show the `CourseDetail_LessonClick` event count. The narrative: "Users click these expecting a preview. Every single click is a dead click. They want to evaluate the content before buying, and they can't."

### 8. Tiny "Add to cart" text link (Browse)
- **What to do:** Browse the catalog. Click on a course card's title or image area (not the small "Add to cart" text link). Then find and click the actual link.
- **What to show in FullStory:** The click heatmap on the browse page — clicks concentrated on titles and images, almost none on the CTA text link. Then show the `Browse_AddToCart` rate. The narrative: "73% of clicks on course cards hit the title or image. Only 8% find the actual add-to-cart link. The CTA is invisible."

---

## Recommended Demo Flow

| Order | Journey | Pain Point | FullStory Feature | Demo Impact |
|-------|---------|-----------|-------------------|-------------|
| 1 | J1 | Email confirmation mismatch | Event properties + metric | Sets up "custom events show you exactly which field failed" |
| 2 | J1 | $0.00 processing fee | Dead click heatmap + funnel | Shows heatmaps and funnel drop-off together |
| 3 | J1 | Rage clicks on Processing... | Session replay + rage click metric | Highest-impact visual moment — save it for the funnel climax |
| 4 | J2 | Jargon labels | Session replay + form error breakdown | Transitions to "now let's look at the creator experience" |
| 5 | J2 | Wrong redirect | Session replay + time-between-events | Shows how replay reveals navigation confusion |
| 6 | J2 | Two submit buttons | Heatmap + replay | Quick hit — reinforces the pattern |
| 7 | J3 | Dead clicks on lesson rows | Dead click heatmap + event count | Transitions to "how do students discover and decide" |
| 8 | J3 | Tiny Add to cart link | Click heatmap + conversion rate | Closes with a clear "the data tells you what to fix" moment |

This order follows the natural user lifecycle (signup -> create content -> discover content) and builds from simple FullStory features (event properties) to compound ones (segment comparisons, multi-metric dashboards).
