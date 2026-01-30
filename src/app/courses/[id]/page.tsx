"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  getCourseById,
  getUser,
  addToCart,
  isInCart as checkIsInCart,
  isEnrolled as checkIsEnrolled,
  formatPrice,
} from "@/lib/storage";
import { Course, User } from "@/lib/types";
import { trackEvent } from "@/lib/fullstory";

/* Journey 3: Course detail decision point — see FullStory Heatmaps + Journeys */

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-yellow-100 text-yellow-700",
  advanced: "bg-red-100 text-red-700",
};

const categoryIcons: Record<string, string> = {
  Programming: "{}",
  Frontend: "</>",
  Architecture: "\u25B3",
  Design: "\u25CB",
  Data: "\u2261",
};

const typeIcons: Record<string, { icon: string; label: string }> = {
  text: { icon: "\u2261", label: "Text" },
  video: { icon: "\u25B6", label: "Video" },
  quiz: { icon: "?", label: "Quiz" },
};

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [inCart, setInCart] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser(getUser());

    const found = getCourseById(courseId);
    if (!found) return;
    setCourse(found);
    setInCart(checkIsInCart(courseId));
    setEnrolled(checkIsEnrolled(courseId));

    trackEvent("CourseDetail_View", {
      courseId,
      price: found.price ?? 0,
      difficulty: found.difficulty,
    });
  }, [courseId]);

  const handleAddToCart = () => {
    if (!user) {
      router.push("/signup");
      return;
    }

    trackEvent("CourseDetail_AddToCart", { courseId, price: course?.price ?? 0 });

    addToCart(courseId);
    setInCart(true);
  };

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

  if (!course) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-gray-50 py-16">
          <div className="max-w-3xl mx-auto text-center px-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Course not found
            </h2>
            <p className="text-gray-500 mb-6">
              This course may have been removed or the link is invalid.
            </p>
            <Link
              href="/browse"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              &larr; Back to catalog
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const price = course.price ?? 0;
  const totalDuration = course.lessons.reduce((sum, l) => {
    const match = l.duration.match(/(\d+)/);
    return sum + (match ? parseInt(match[1], 10) : 0);
  }, 0);

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <Link
              href="/browse"
              className="inline-flex items-center text-sm text-indigo-200 hover:text-white transition-colors mb-6"
            >
              &larr; Back to catalog
            </Link>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-3xl text-white/50 font-mono">
                  {categoryIcons[course.category] || "?"}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${difficultyColors[course.difficulty]}`}
                  >
                    {course.difficulty}
                  </span>
                  <span className="text-sm text-indigo-200">
                    {course.category}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-3">
                  {course.title}
                </h1>
                <p className="text-indigo-200 text-sm">
                  By {course.instructorName}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left column: description + syllabus */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-3">
                  About this course
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {course.description}
                </p>
              </div>

              {/* Syllabus */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">
                    Course Syllabus
                  </h2>
                  <span className="text-xs text-gray-400">
                    {course.lessons.length}{" "}
                    {course.lessons.length === 1 ? "lesson" : "lessons"}
                  </span>
                </div>

                {course.lessons.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400">
                      No lessons have been added yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {course.lessons
                      .sort((a, b) => a.order - b.order)
                      .map((lesson, idx) => {
                        const typeInfo = typeIcons[lesson.type] || {
                          icon: "?",
                          label: lesson.type,
                        };
                        return (
                          <div
                            key={lesson.id}
                            onClick={() => trackEvent("CourseDetail_LessonClick", { lessonId: lesson.id, courseId })}
                            className="flex items-center gap-4 py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <span className="w-6 h-6 bg-gray-100 rounded text-xs flex items-center justify-center text-gray-400 shrink-0">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              {/*
                                UX FRICTION: Lesson titles are shown but there's no
                                way to preview or expand lesson content before buying.
                                Users must purchase to see what's inside each lesson.
                                TODO [FullStory]: Track clicks on lesson rows — users
                                may expect them to expand or show a preview.
                                FS.event('CourseDetail_LessonClick', { lessonId, courseId });
                              */}
                              <p className="text-sm text-gray-900 truncate">
                                {lesson.title}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs text-gray-400">
                                {typeInfo.label}
                              </span>
                              <span className="text-xs text-gray-300">
                                {lesson.duration}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Right column: price card */}
            <div className="lg:col-span-1">
              {/*
                UX FRICTION: The price card is in a sidebar which scrolls off
                screen on mobile. On small screens, users have to scroll all
                the way back up to find the purchase action after reading the
                syllabus.
                TODO [FullStory]: Track add-to-cart clicks by viewport size.
                Compare mobile vs. desktop conversion rates.
                FS.event('CourseDetail_ViewportSize', { width, height });
              */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
                <div className="text-3xl font-bold text-gray-900 mb-6">
                  ${formatPrice(price)}
                </div>

                {enrolled ? (
                  <div className="w-full py-2.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg text-center">
                    Enrolled
                  </div>
                ) : inCart ? (
                  <Link
                    href="/checkout"
                    onClick={() => trackEvent("CourseDetail_CheckoutClick", { courseId })}
                    className="block w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors text-center"
                  >
                    Checkout &rarr;
                  </Link>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Add to Cart
                  </button>
                )}

                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Lessons</span>
                    <span className="text-gray-900 font-medium">
                      {course.lessons.length}
                    </span>
                  </div>
                  {totalDuration > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total duration</span>
                      <span className="text-gray-900 font-medium">
                        {totalDuration} min
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Category</span>
                    <span className="text-gray-900 font-medium">
                      {course.category}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Difficulty</span>
                    <span className="text-gray-900 font-medium capitalize">
                      {course.difficulty}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Instructor</span>
                    <span className="text-gray-900 font-medium">
                      {course.instructorName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
