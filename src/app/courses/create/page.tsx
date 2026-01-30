"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getUser, saveCourse, generateId } from "@/lib/storage";
import { trackEvent } from "@/lib/fullstory";

/* Journey 2: Course creation flow — see FullStory Session Replay + Frustration Signals */

export default function CreateCoursePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "Advanced Node.js Performance",
    description: "Deep dive into Node.js performance optimization. Covers event loop internals, memory profiling, clustering, and production-grade monitoring strategies.",
    category: "Programming",
    customCategory: "",
    difficulty: "advanced",
    price: "89.99",
    tags: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const validate = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Required";
    } else if (formData.title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Required";
    } else if (formData.description.trim().length < 20) {
      newErrors.description = "Please provide at least 20 characters";
    }

    if (!formData.category) {
      newErrors.category = "Required";
    }

    if (formData.category === "Other" && !formData.customCategory.trim()) {
      newErrors.customCategory = "Please specify a category";
    }

    if (!formData.difficulty) {
      newErrors.difficulty = "Required";
    }

    if (!formData.price.trim()) {
      newErrors.price = "Required";
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = "Must be a positive number";
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    trackEvent("CourseCreation_SubmitAttempt");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      trackEvent("CourseCreation_ValidationFailed", {
        errorFields: Object.keys(validationErrors),
      });
      return;
    }

    setIsSubmitting(true);
    const user = getUser();
    if (!user) {
      router.push("/signup");
      return;
    }

    const courseId = generateId();
    const course = {
      id: courseId,
      title: formData.title.trim(),
      description: formData.description.trim(),
      category:
        formData.category === "Other"
          ? formData.customCategory.trim()
          : formData.category,
      difficulty: formData.difficulty as "beginner" | "intermediate" | "advanced",
      price: Math.round(Number(formData.price) * 100),
      instructorId: user.id,
      instructorName: user.name,
      lessons: [],
      createdAt: new Date().toISOString(),
    };

    saveCourse(course);

    trackEvent("CourseCreation_Success", {
      courseId,
      category: course.category,
      difficulty: course.difficulty,
    });

    /*
     * UX FRICTION: After successful creation, user is redirected to the
     * dashboard instead of the lesson creation page for the new course.
     * This breaks the natural flow: create course → add lessons.
     * TODO [FullStory]: Track how quickly users navigate from dashboard
     * to lesson creation after course creation — indicates the redirect
     * destination is wrong.
     */
    router.push("/dashboard");
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

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Create a New Course
            </h1>
            <p className="text-gray-500 mt-1">
              Fill out the details below to set up your course structure.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl border border-gray-200 p-6 space-y-6"
          >
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Course Title
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.title ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="e.g., Introduction to Machine Learning"
              />
              {errors.title && (
                <p className="text-xs text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
                  errors.description ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Describe what students will learn..."
              />
              <div className="flex justify-between items-center mt-1">
                {errors.description ? (
                  <p className="text-xs text-red-500">{errors.description}</p>
                ) : (
                  <span />
                )}
                <span
                  className={`text-xs ${
                    formData.description.length < 20
                      ? "text-gray-400"
                      : "text-green-500"
                  }`}
                >
                  {formData.description.length}/20 min
                </span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => updateField("category", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${
                  errors.category ? "border-red-300" : "border-gray-300"
                } ${!formData.category ? "text-gray-400" : "text-gray-900"}`}
              >
                <option value="" disabled>
                  Select a category...
                </option>
                <option value="Programming">Programming</option>
                <option value="Frontend">Frontend</option>
                <option value="Architecture">Architecture</option>
                <option value="Design">Design</option>
                <option value="Data">Data Science</option>
                <option value="DevOps">DevOps</option>
                <option value="Other">Other</option>
              </select>
              {errors.category && (
                <p className="text-xs text-red-500 mt-1">{errors.category}</p>
              )}

              {formData.category === "Other" && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={formData.customCategory}
                    onChange={(e) =>
                      updateField("customCategory", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.customCategory
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter custom category"
                  />
                  {errors.customCategory && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.customCategory}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {/*
                  UX FRICTION: Using "Target Proficiency" instead of "Difficulty"
                  is confusing. Users have to mentally map this to difficulty levels.
                  TODO [FullStory]: Track time spent on this field and whether
                  users change their selection multiple times.
                */}
                Target Proficiency
              </label>
              <div className="flex gap-3">
                {[
                  { value: "beginner", label: "L1", desc: "Fundamentals" },
                  { value: "intermediate", label: "L2", desc: "Applied" },
                  { value: "advanced", label: "L3", desc: "Expert" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateField("difficulty", opt.value)}
                    className={`flex-1 py-3 px-4 rounded-lg border text-center transition-all ${
                      formData.difficulty === opt.value
                        ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span
                      className={`text-sm font-semibold ${
                        formData.difficulty === opt.value
                          ? "text-indigo-700"
                          : "text-gray-700"
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span className="block text-xs text-gray-400 mt-0.5">
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>
              {errors.difficulty && (
                <p className="text-xs text-red-500 mt-1">{errors.difficulty}</p>
              )}
            </div>

            {/* Price */}
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {/*
                  UX FRICTION: The label says "Unit Cost" instead of "Price",
                  adding unnecessary jargon. The placeholder doesn't clarify
                  whether to enter dollars or cents.
                  TODO [FullStory]: Track error rate on this field to see
                  if users enter cents instead of dollars (e.g., 4999 vs 49.99).
                */}
                Unit Cost (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  $
                </span>
                <input
                  id="price"
                  type="text"
                  value={formData.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  className={`w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.price ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="49.99"
                />
              </div>
              {errors.price && (
                <p className="text-xs text-red-500 mt-1">{errors.price}</p>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showAdvanced ? "Hide" : "Show"} additional options
              </button>
              {showAdvanced && (
                <div className="mt-3">
                  <label
                    htmlFor="tags"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Tags (comma-separated)
                  </label>
                  <input
                    id="tags"
                    type="text"
                    value={formData.tags}
                    onChange={(e) => updateField("tags", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., javascript, react, hooks"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Publish Course"}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
