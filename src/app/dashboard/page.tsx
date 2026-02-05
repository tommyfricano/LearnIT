"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CourseCard from "@/components/CourseCard";
import { getUser, getCourses, getEnrollments } from "@/lib/storage";
import { User, Course } from "@/lib/types";
import { trackEvent } from "@/lib/fullstory";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filter, setFilter] = useState("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const currentUser = getUser();
    if (!currentUser) {
      router.push("/signup");
      return;
    }
    setUser(currentUser);

    const allCourses = getCourses();
    if (currentUser.role === "instructor") {
      setCourses(allCourses.filter((c) => c.instructorId === currentUser.id));
    } else {
      const enrolledIds = getEnrollments();
      setCourses(allCourses.filter((c) => enrolledIds.includes(c.id)));
    }
  }, [router]);

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

  const isInstructor = user.role === "instructor";

  const filteredCourses =
    filter === "all"
      ? courses
      : courses.filter((c) => c.difficulty === filter);

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome banner */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {user.name}
                </h1>
                <p className="text-gray-500 mt-1">
                  You have {courses.length}{" "}
                  {isInstructor
                    ? courses.length === 1 ? "course" : "courses"
                    : courses.length === 1 ? "enrolled course" : "enrolled courses"}.
                </p>
              </div>
              {isInstructor && (
                <Link
                  href="/courses/create"
                  onClick={() => trackEvent("Dashboard_CreateCourseClick", { location: "header" })}
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
                >
                  + New Course
                </Link>
              )}
            </div>
          </div>

          {/* Filters and content */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {isInstructor ? "Your Courses" : "My Courses"}
            </h2>

            <div className="flex items-center gap-1 text-sm">
              {["all", "beginner", "intermediate", "advanced"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
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
          </div>

          {filteredCourses.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">
                {filter !== "all"
                  ? `No courses at ${filter} level`
                  : isInstructor
                    ? "No courses yet"
                    : "You haven\u2019t enrolled in any courses yet"}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {filter !== "all"
                  ? isInstructor
                    ? "Try a different filter or create a new course."
                    : "Try a different filter or browse for more courses."
                  : isInstructor
                    ? "Create your first course to get started."
                    : "Browse courses to find something you\u2019d like to learn."}
              </p>
              <Link
                href={isInstructor ? "/courses/create" : "/browse"}
                onClick={() => isInstructor && trackEvent("Dashboard_CreateCourseClick", { location: "empty_state" })}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {isInstructor ? "Create a course" : "Browse courses"} &rarr;
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  variant={isInstructor ? "manage" : "browse"}
                  isEnrolled={!isInstructor}
                />
              ))}
            </div>
          )}

          {isInstructor && courses.length > 0 && (
            <div className="mt-12 bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Quick Stats
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.length}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Total Items</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.reduce((sum, c) => sum + c.lessons.length, 0)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Sub-items</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-400 mt-1">Active Users</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">&mdash;</p>
                  <p className="text-xs text-gray-400 mt-1">Avg. Rating</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
