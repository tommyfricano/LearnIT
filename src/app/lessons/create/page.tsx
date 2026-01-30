"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  getUser,
  getCourses,
  getCourseById,
  addLessonToCourse,
  generateId,
} from "@/lib/storage";
import { Course, Lesson } from "@/lib/types";
import { trackEvent } from "@/lib/fullstory";

/* Journey 2: Lesson creation flow — see FullStory Session Replay + Frustration Signals */

function LessonCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get("courseId");

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(
    courseIdParam || ""
  );
  const [formData, setFormData] = useState({
    title: "Understanding the Event Loop",
    type: "video",
    content: "In this lesson we break down the Node.js event loop phase by phase. You will learn how timers, I/O callbacks, and microtasks are scheduled and why understanding this matters for writing performant server-side code.",
    duration: "15",
    durationUnit: "min",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const user = getUser();
    if (!user) {
      router.push("/signup");
      return;
    }
    const allCourses = getCourses();
    setCourses(allCourses);

    if (courseIdParam && allCourses.find((c) => c.id === courseIdParam)) {
      setSelectedCourseId(courseIdParam);
    }
  }, [router, courseIdParam]);

  const selectedCourse = selectedCourseId
    ? getCourseById(selectedCourseId)
    : null;

  const validate = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!selectedCourseId) {
      newErrors.course = "Please select a course";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Required";
    }

    if (!formData.type) {
      newErrors.type = "Required";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Required";
    }

    /*
     * UX FRICTION: Duration is split into two fields (number + unit)
     * which creates unnecessary complexity. Users have to fill in both
     * fields correctly, and the unit dropdown defaults to "min" which
     * may not be obvious.
     * TODO [FullStory]: Track error rate on duration fields and
     * whether users submit without filling in duration.
     */
    if (!formData.duration.trim()) {
      newErrors.duration = "Required";
    } else if (isNaN(Number(formData.duration)) || Number(formData.duration) <= 0) {
      newErrors.duration = "Must be a positive number";
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    trackEvent("LessonCreation_SubmitAttempt");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      trackEvent("LessonCreation_ValidationFailed", {
        errorFields: Object.keys(validationErrors),
      });
      return;
    }

    setIsSubmitting(true);

    const lesson: Lesson = {
      id: generateId(),
      courseId: selectedCourseId,
      title: formData.title.trim(),
      content: formData.content.trim(),
      order: selectedCourse ? selectedCourse.lessons.length + 1 : 1,
      type: formData.type as "video" | "text" | "quiz",
      duration: `${formData.duration} ${formData.durationUnit}`,
      createdAt: new Date().toISOString(),
    };

    addLessonToCourse(selectedCourseId, lesson);

    trackEvent("LessonCreation_Success", {
      lessonId: lesson.id,
      courseId: selectedCourseId,
      type: lesson.type,
    });

    setShowSuccess(true);

    // Reset form
    setFormData({
      title: "",
      type: "",
      content: "",
      duration: "",
      durationUnit: "min",
    });

    setTimeout(() => setShowSuccess(false), 3000);
    setIsSubmitting(false);
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
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

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Add a Lesson
              </h1>
              <p className="text-gray-500 mt-1">
                Create lesson content for one of your courses.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              &larr; Back
            </Link>
          </div>

          {/* Success banner */}
          {showSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-green-700">
                Lesson added successfully! You can add another one below.
              </p>
            </div>
          )}

          {courses.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <h3 className="font-medium text-gray-900 mb-2">
                No courses found
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                You need to create a course before adding lessons.
              </p>
              <Link
                href="/courses/create"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create a Course
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl border border-gray-200 p-6 space-y-6"
            >
              {/* Course selector */}
              <div>
                <label
                  htmlFor="course"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {/*
                    UX FRICTION: Label says "Parent Container" instead of
                    "Course". This jargon makes it unclear what to select.
                    TODO [FullStory]: Track hesitation time on this dropdown.
                  */}
                  Parent Container
                </label>
                <select
                  id="course"
                  value={selectedCourseId}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value);
                    if (errors.course) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.course;
                        return next;
                      });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${
                    errors.course ? "border-red-300" : "border-gray-300"
                  } ${!selectedCourseId ? "text-gray-400" : "text-gray-900"}`}
                >
                  <option value="" disabled>
                    Select a container...
                  </option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} ({course.lessons.length} lessons)
                    </option>
                  ))}
                </select>
                {errors.course && (
                  <p className="text-xs text-red-500 mt-1">{errors.course}</p>
                )}
              </div>

              {/* Existing lessons in selected course */}
              {selectedCourse && selectedCourse.lessons.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Existing lessons in this course:
                  </p>
                  <ul className="space-y-1">
                    {selectedCourse.lessons.map((lesson, idx) => (
                      <li
                        key={lesson.id}
                        className="text-sm text-gray-600 flex items-center gap-2"
                      >
                        <span className="w-5 h-5 bg-white border border-gray-200 rounded text-xs flex items-center justify-center text-gray-400">
                          {idx + 1}
                        </span>
                        {lesson.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lesson title */}
              <div>
                <label
                  htmlFor="lessonTitle"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Lesson Title
                </label>
                <input
                  id="lessonTitle"
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.title ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="e.g., Getting Started with Variables"
                />
                {errors.title && (
                  <p className="text-xs text-red-500 mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Format
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "text", icon: "\u2261", label: "Document" },
                    { value: "video", icon: "\u25B6", label: "Recording" },
                    { value: "quiz", icon: "?", label: "Assessment" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateField("type", opt.value)}
                      className={`py-3 px-2 rounded-lg border text-center transition-all ${
                        formData.type === opt.value
                          ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-lg block mb-1">{opt.icon}</span>
                      <span
                        className={`text-xs ${
                          formData.type === opt.value
                            ? "text-indigo-700 font-medium"
                            : "text-gray-500"
                        }`}
                      >
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
                {errors.type && (
                  <p className="text-xs text-red-500 mt-1">{errors.type}</p>
                )}
              </div>

              {/* Content */}
              <div>
                <label
                  htmlFor="content"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Content
                </label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => updateField("content", e.target.value)}
                  rows={6}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
                    errors.content ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder={
                    formData.type === "video"
                      ? "Paste a video URL or describe the recording..."
                      : formData.type === "quiz"
                      ? "Write your assessment questions here..."
                      : "Write the lesson content here..."
                  }
                />
                {errors.content && (
                  <p className="text-xs text-red-500 mt-1">{errors.content}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="duration"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Estimated Duration
                </label>
                <div className="flex gap-2">
                  <input
                    id="duration"
                    type="text"
                    value={formData.duration}
                    onChange={(e) => updateField("duration", e.target.value)}
                    className={`w-24 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.duration ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="0"
                  />
                  <select
                    value={formData.durationUnit}
                    onChange={(e) =>
                      updateField("durationUnit", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="seconds">seconds</option>
                    <option value="min">minutes</option>
                    <option value="hrs">hrs</option>
                  </select>
                </div>
                {errors.duration && (
                  <p className="text-xs text-red-500 mt-1">{errors.duration}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  {/*
                    UX FRICTION: Two submit-like buttons with unclear
                    distinction. "Save Draft" doesn't actually save as draft
                    (it just submits normally). Users may be confused about
                    the difference between "Save Draft" and "Add Lesson".
                    TODO [FullStory]: Track which button users click more
                    and whether "Save Draft" causes confusion.
                    FS.event('Lesson_SaveDraftClick') vs FS.event('Lesson_AddClick');
                  */}
                  <button
                    type="submit"
                    className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Save Draft
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Adding..." : "Add Lesson"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function LessonCreatePage() {
  return (
    <Suspense
      fallback={
        <>
          <Header />
          <main className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="animate-pulse text-gray-400">Loading...</div>
          </main>
          <Footer />
        </>
      }
    >
      <LessonCreateContent />
    </Suspense>
  );
}
