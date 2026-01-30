"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  getUser,
  getCart,
  getCourseById,
  removeFromCart,
  formatPrice,
} from "@/lib/storage";
import { User, Course } from "@/lib/types";
import { trackEvent } from "@/lib/fullstory";

/* Journey 1: Cart step in signup-to-enrollment funnel — see FullStory Funnels */

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-yellow-100 text-yellow-700",
  advanced: "bg-red-100 text-red-700",
};

export default function CartPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [cartCourses, setCartCourses] = useState<Course[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const currentUser = getUser();
    if (!currentUser) {
      router.push("/signup");
      return;
    }
    setUser(currentUser);
    refreshCart();

    const cart = getCart();
    const courses = cart
      .map((item) => getCourseById(item.courseId))
      .filter((c): c is Course => c !== null);
    const total = courses.reduce((sum, c) => sum + (c.price ?? 0), 0);
    trackEvent("Cart_Viewed", { itemCount: courses.length, totalCents: total });
  }, [router]);

  const refreshCart = () => {
    const cart = getCart();
    const courses = cart
      .map((item) => getCourseById(item.courseId))
      .filter((c): c is Course => c !== null);
    setCartCourses(courses);
  };

  const handleRemove = (courseId: string) => {
    trackEvent("Cart_ItemRemoved", {
      courseId,
      remainingCount: cartCourses.length - 1,
    });
    removeFromCart(courseId);
    refreshCart();
  };

  const totalCents = cartCourses.reduce((sum, c) => sum + (c.price ?? 0), 0);

  if (!mounted || !user) {
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
      <main className="flex-1 bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
            <Link
              href="/browse"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Continue browsing &rarr;
            </Link>
          </div>

          {cartCourses.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
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
                    d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">
                Your cart is empty
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Browse our catalog to find courses that interest you.
              </p>
              <Link
                href="/browse"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cart items */}
              {cartCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4"
                >
                  {/* Color strip */}
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shrink-0" />

                  {/* Course info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm truncate">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {course.category}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          difficultyColors[course.difficulty]
                        }`}
                      >
                        {course.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                    ${formatPrice(course.price ?? 0)}
                  </span>

                  <button
                    onClick={() => handleRemove(course.id)}
                    className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
                    aria-label="Remove"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Order summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    Subtotal ({cartCourses.length}{" "}
                    {cartCourses.length === 1 ? "course" : "courses"})
                  </span>
                  <span className="text-sm text-gray-900">
                    ${formatPrice(totalCents)}
                  </span>
                </div>

                {/*
                  UX FRICTION: A "$0.00 processing fee" line is shown, which
                  draws attention to fees even though there are none. Users may
                  worry about hidden fees appearing later.
                  TODO [FullStory]: Track hover/click on the processing fee
                  line to see if users try to get more information about it.
                */}
                <div className="flex justify-between text-xs text-gray-400 mb-4">
                  <span>Processing fee</span>
                  <span>$0.00</span>
                </div>

                <div className="border-t border-gray-100 pt-4 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-semibold text-gray-900">
                    ${formatPrice(totalCents)}
                  </span>
                </div>

                {/*
                  UX FRICTION: The checkout button says "Proceed to Checkout"
                  which implies another step before purchase. Users may hesitate
                  wondering how many more steps there are. No progress indicator
                  is shown.
                  TODO [FullStory]: Track hesitation time before clicking
                  checkout button.
                  FS.event('Cart_CheckoutHesitation', { timeOnPageMs });
                */}
                <Link
                  href="/checkout"
                  onClick={() => trackEvent("Cart_ProceedToCheckout", { itemCount: cartCourses.length, totalCents })}
                  className="mt-6 w-full inline-flex items-center justify-center py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
