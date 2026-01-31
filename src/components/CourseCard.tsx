"use client";

import Link from "next/link";
import { Course } from "@/lib/types";
import { formatPrice } from "@/lib/storage";

interface CourseCardProps {
  course: Course;
  variant?: "manage" | "browse";
  onAddToCart?: (courseId: string) => void;
  isInCart?: boolean;
  isEnrolled?: boolean;
}

const difficultyColors = {
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

export default function CourseCard({
  course,
  variant = "manage",
  onAddToCart,
  isInCart = false,
  isEnrolled = false,
}: CourseCardProps) {
  const price = course.price ?? 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 overflow-hidden group">
      {/* Course visual header — clickable to detail page */}
      <Link href={`/courses/${course.id}`}>
        <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative cursor-pointer">
          <span className="text-4xl text-white/30 font-mono">
            {categoryIcons[course.category] || "?"}
          </span>
          <div className="absolute top-3 right-3">
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                difficultyColors[course.difficulty]
              }`}
            >
              {course.difficulty}
            </span>
          </div>
        </div>
      </Link>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link href={`/courses/${course.id}`}>
            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 cursor-pointer">
              {course.title}
            </h3>
          </Link>
        </div>

        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
          {course.description}
        </p>

        {variant === "manage" ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {course.lessons.length}{" "}
                {course.lessons.length === 1 ? "lesson" : "lessons"}
              </span>
              <span className="text-gray-300">&middot;</span>
              <span className="text-xs text-gray-400">{course.category}</span>
            </div>

            <Link
              href={`/lessons/create?courseId=${course.id}`}
              className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              manage &rarr;
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            {/*
              UX FRICTION: The price is shown in small gray text that doesn't
              visually stand out. Users may not realize courses cost money
              until they reach the cart.
              TODO [FullStory]: Track Add-to-Cart click rate per course and
              compare with course card hover time.
              FS.event('Course_AddToCart', { courseId, price, difficulty });
            */}
            <span className="text-sm text-gray-500">
              ${formatPrice(price)}
            </span>

            {isEnrolled ? (
              <span className="text-xs text-green-600 font-medium px-2 py-1 bg-green-50 rounded-full">
                Enrolled
              </span>
            ) : isInCart ? (
              <Link
                href="/checkout-it"
                className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
              >
                Checkout &rarr;
              </Link>
            ) : (
              /*
                UX FRICTION: The "Add to Cart" button is styled as a small
                text link (matching the existing "manage →" style) rather than
                a prominent button. Users may overlook it.
                TODO [FullStory]: Track click-through rate on this text link
                vs. clicks elsewhere on the card (dead clicks).
              */
              <button
                onClick={() => onAddToCart?.(course.id)}
                className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                Add to cart &rarr;
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
