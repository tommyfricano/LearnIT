"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CourseCard from "@/components/CourseCard";
import {
  getCourses,
  getUser,
  addToCart,
  isInCart as checkIsInCart,
  isEnrolled as checkIsEnrolled,
  seedDemoCourses,
  formatPrice,
} from "@/lib/storage";
import { Course, User } from "@/lib/types";
import { trackEvent } from "@/lib/fullstory";

/* Journey 3: Course discovery — see FullStory Heatmaps + Journeys */

export default function BrowsePage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [cartIds, setCartIds] = useState<Set<string>>(new Set());
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [toast] = useState("");
  const [mounted, setMounted] = useState(false);

  // Cart modal state for dramatic UX friction
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartModalStep, setCartModalStep] = useState<"processing" | "confirm" | "upsell">("processing");
  const [addedCourse, setAddedCourse] = useState<Course | null>(null);
  const [canDismiss, setCanDismiss] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
    // Seed demo courses if none exist (allows anonymous browsing)
    seedDemoCourses("demo-instructor");
    const allCourses = getCourses();
    setCourses(allCourses);

    const inCart = new Set<string>();
    const enrolled = new Set<string>();
    allCourses.forEach((c) => {
      if (checkIsInCart(c.id)) inCart.add(c.id);
      if (checkIsEnrolled(c.id)) enrolled.add(c.id);
    });
    setCartIds(inCart);
    setEnrolledIds(enrolled);
  }, []);

  const handleAddToCart = (courseId: string) => {
    if (!user) {
      trackEvent("Browse_AuthRedirect", { courseId });
      router.push("/signup");
      return;
    }

    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    /*
      UX FRICTION: "Dramatic cart modal" pattern — instead of a simple toast,
      we show a full-screen blocking modal with multiple steps:
      1. "Processing" spinner (fake delay)
      2. Confirmation with confusing button labels
      3. Upsell/cross-sell attempt before allowing dismissal
      This creates frustration and may cause users to abandon browsing.
      TODO [FullStory]: Track modal interaction patterns:
      - Time spent on each modal step
      - Rage clicks on disabled "Continue" button
      - Clicks outside modal (attempting to dismiss)
      - Which exit path users take (Continue Shopping vs View Cart)
    */
    setAddedCourse(course);
    setShowCartModal(true);
    setCartModalStep("processing");
    setCanDismiss(false);

    trackEvent("Browse_AddToCartModalOpened", {
      courseId,
      price: course.price ?? 0,
    });

    // Step 1: Fake processing delay (2 seconds)
    setTimeout(() => {
      addToCart(courseId);
      setCartIds((prev) => new Set(prev).add(courseId));
      setCartModalStep("confirm");

      trackEvent("Browse_AddToCart", {
        courseId,
        price: course.price ?? 0,
        cartSize: cartIds.size + 1,
      });

      // Step 2: Show confirmation, then move to upsell after 1.5 seconds
      setTimeout(() => {
        setCartModalStep("upsell");

        // Step 3: Only allow dismissal after another 2 seconds on upsell
        setTimeout(() => {
          setCanDismiss(true);
          trackEvent("Browse_CartModalDismissable", { courseId });
        }, 2000);
      }, 1500);
    }, 2000);
  };

  const handleCloseCartModal = () => {
    if (!canDismiss) {
      trackEvent("Browse_CartModalEarlyDismissAttempt", {
        courseId: addedCourse?.id,
        step: cartModalStep,
      });
      return;
    }
    setShowCartModal(false);
    setAddedCourse(null);
    trackEvent("Browse_CartModalClosed", {
      courseId: addedCourse?.id,
      exitPath: "continue_shopping",
    });
  };

  const handleGoToCart = () => {
    trackEvent("Browse_CartModalClosed", {
      courseId: addedCourse?.id,
      exitPath: "view_cart",
    });
    router.push("/cart");
  };

  let filteredCourses =
    filter === "all"
      ? courses
      : courses.filter((c) => c.difficulty === filter);

  /*
    UX FRICTION: The sort dropdown uses labels "Low to High" and "High to Low"
    without specifying what is being sorted (price). The default sort is
    "Recently Added" which shows newest first, but the seed courses all have
    the same creation timestamp so they appear in an arbitrary order.
    TODO [FullStory]: Track sort usage and whether users change sort
    multiple times (indicating confusion).
  */
  if (sort === "price-asc") {
    filteredCourses = [...filteredCourses].sort(
      (a, b) => (a.price ?? 0) - (b.price ?? 0)
    );
  } else if (sort === "price-desc") {
    filteredCourses = [...filteredCourses].sort(
      (a, b) => (b.price ?? 0) - (a.price ?? 0)
    );
  }

  if (!mounted) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Toast (legacy - keeping for non-modal events) */}
          {toast && (
            <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm text-indigo-700 transition-all">
              {toast}
            </div>
          )}

          {/* Cart Modal - Dramatic UX Friction */}
          {showCartModal && addedCourse && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              {/* Backdrop - clicking does nothing or shows frustration */}
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleCloseCartModal}
              />

              {/* Modal */}
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Step 1: Processing */}
                {cartModalStep === "processing" && (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Securing Your Spot...
                    </h3>
                    <p className="text-sm text-gray-500">
                      Please wait while we reserve this course for you.
                    </p>
                    <p className="text-xs text-gray-400 mt-4">
                      Do not close this window
                    </p>
                  </div>
                )}

                {/* Step 2: Confirmation */}
                {cartModalStep === "confirm" && (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg
                        className="w-8 h-8 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Added to Cart!
                    </h3>
                    <p className="text-sm text-gray-500">
                      &ldquo;{addedCourse.title}&rdquo; has been added.
                    </p>
                    <p className="text-xs text-gray-400 mt-4 animate-pulse">
                      Loading recommendations...
                    </p>
                  </div>
                )}

                {/* Step 3: Upsell/Cross-sell */}
                {cartModalStep === "upsell" && (
                  <div className="p-6">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Great Choice!
                      </h3>
                      <p className="text-sm text-gray-500">
                        Students who bought this also enjoyed:
                      </p>
                    </div>

                    {/* Fake upsell courses */}
                    <div className="space-y-3 mb-6">
                      {courses
                        .filter((c) => c.id !== addedCourse.id && !cartIds.has(c.id))
                        .slice(0, 2)
                        .map((course) => (
                          <div
                            key={course.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {course.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                ${formatPrice(course.price ?? 0)}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                trackEvent("Browse_UpsellClicked", {
                                  originalCourseId: addedCourse.id,
                                  upsellCourseId: course.id,
                                });
                                addToCart(course.id);
                                setCartIds((prev) => new Set(prev).add(course.id));
                              }}
                              disabled={cartIds.has(course.id)}
                              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:text-gray-400"
                            >
                              {cartIds.has(course.id) ? "Added" : "+ Add"}
                            </button>
                          </div>
                        ))}
                    </div>

                    {/*
                      UX FRICTION: The exit button ("No thanks") is intentionally
                      tiny and hard to click, while "View Cart" is large and prominent.
                      This creates frustration and rage clicks on the small target.
                      TODO [FullStory]: Track click accuracy on the tiny exit button
                      and rage clicks in the surrounding area.
                    */}
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs text-gray-400 text-center mb-4">
                        {canDismiss
                          ? "You may now continue"
                          : "Please review the recommendations above..."}
                      </p>

                      {/* Primary CTA - Large and prominent */}
                      <button
                        onClick={handleGoToCart}
                        disabled={!canDismiss}
                        className={`w-full py-3 text-sm font-medium rounded-lg transition-colors ${
                          canDismiss
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : "bg-indigo-300 text-indigo-100 cursor-not-allowed"
                        }`}
                      >
                        View Cart ({cartIds.size})
                      </button>

                      {/* Exit button - Tiny and hard to click */}
                      <div className="flex justify-center mt-3">
                        <button
                          onClick={handleCloseCartModal}
                          disabled={!canDismiss}
                          className={`text-[10px] px-2 py-0.5 transition-colors ${
                            canDismiss
                              ? "text-gray-400 hover:text-gray-500"
                              : "text-gray-300 cursor-not-allowed"
                          }`}
                        >
                          No thanks, continue browsing
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Browse Courses
            </h1>
            <p className="text-gray-500 mt-1">
              Find the perfect course to advance your skills.
            </p>
          </div>

          {/* Filters and sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-1 text-sm">
              {["all", "beginner", "intermediate", "advanced"].map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFilter(f);
                    trackEvent("Browse_FilterApplied", { filter: f, sort });
                  }}
                  className={`px-3 py-1 rounded-md transition-colors capitalize ${
                    filter === f
                      ? "bg-indigo-100 text-indigo-700 font-medium"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                trackEvent("Browse_FilterApplied", { filter, sort: e.target.value });
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-600"
            >
              <option value="recent">Recently Added</option>
              <option value="price-asc">Low to High</option>
              <option value="price-desc">High to Low</option>
            </select>
          </div>

          {/* Course grid */}
          {filteredCourses.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">
                No courses found
              </h3>
              <p className="text-sm text-gray-500">
                {filter !== "all"
                  ? "Try a different difficulty level."
                  : "No courses are available yet."}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  variant="browse"
                  onAddToCart={handleAddToCart}
                  isInCart={cartIds.has(course.id)}
                  isEnrolled={enrolledIds.has(course.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
