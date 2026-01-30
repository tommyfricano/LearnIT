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
  const [toast, setToast] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
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

    addToCart(courseId);
    setCartIds((prev) => new Set(prev).add(courseId));

    /*
      UX FRICTION: The "Added to cart" confirmation appears as a brief
      toast at the top of the page that auto-dismisses after 2 seconds.
      Users may not see it if they're looking at the card they just clicked.
      There's no direct "Go to Cart" link in the toast.
      TODO [FullStory]: Track whether users look for a cart-link in the
      toast area (dead clicks near the toast).
    */
    const course = courses.find((c) => c.id === courseId);
    trackEvent("Browse_AddToCart", {
      courseId,
      price: course?.price ?? 0,
      cartSize: cartIds.size + 1,
    });
    setToast(`"${course?.title}" added to cart`);
    setTimeout(() => setToast(""), 2000);
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
          {/* Toast */}
          {toast && (
            <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm text-indigo-700 transition-all">
              {toast}
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
