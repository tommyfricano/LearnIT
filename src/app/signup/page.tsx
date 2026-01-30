"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { saveUser, seedDemoCourses, generateId } from "@/lib/storage";
import { trackEvent, identifyUser } from "@/lib/fullstory";

/* Journey 1: Signup funnel tracking — see FullStory Funnels for conversion analysis */

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "Alex Morgan",
    email: "alex.morgan@learnit.demo",
    emailConfirm: "alex.morgan@learnit.demo",
    role: "student",
    acceptTerms: true,
    acceptMarketing: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const validate = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid format";
    }

    /*
     * UX FRICTION: Requiring email confirmation adds friction.
     * Users often copy-paste and this field provides little value.
     * TODO [FullStory]: Track how often users paste into this field
     * vs. manually retyping, and how often the mismatch error fires.
     */
    if (formData.email !== formData.emailConfirm) {
      newErrors.emailConfirm = "Emails do not match";
    }

    if (!formData.role) {
      newErrors.role = "Please select a role";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "You must accept to continue";
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    trackEvent("Signup_Attempt", { role: formData.role });

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      const errorFields = Object.keys(validationErrors);
      trackEvent("Signup_Validation_Failed", {
        errorFields,
        errorCount: errorFields.length,
      });
      return;
    }

    const userId = generateId();
    const user = {
      id: userId,
      name: formData.fullName.trim(),
      email: formData.email.trim(),
      role: formData.role as "student" | "instructor",
      createdAt: new Date().toISOString(),
    };

    saveUser(user);
    seedDemoCourses(userId);

    identifyUser(user);
    trackEvent("Signup_Success", { role: user.role });

    setShowSuccess(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  if (showSuccess) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Account created!
            </h2>
            <p className="text-gray-500">Redirecting to your dashboard...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50 py-12">
        <div className="max-w-md mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Create your account
            </h1>
            <p className="text-gray-500 mt-2">
              Get started with LearnIT in seconds
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl border border-gray-200 p-6 space-y-5"
          >
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.fullName ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Jane Doe"
              />
              {errors.fullName && (
                <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.email ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="jane@example.com"
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="emailConfirm"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Verify Email
              </label>
              <input
                id="emailConfirm"
                type="email"
                value={formData.emailConfirm}
                onChange={(e) => updateField("emailConfirm", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.emailConfirm ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Re-enter your email"
              />
              {errors.emailConfirm && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.emailConfirm}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {/*
                  UX FRICTION: Role selection labels are confusing — "Account Type"
                  with "Content Provider"/"Content Consumer" options don't clearly
                  map to instructor/student. Users hesitate or pick wrong role.
                  TODO [FullStory]: Track hover/pause time on this dropdown
                  and whether users change their selection (segment comparison).
                */}
                Account Type
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => updateField("role", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${
                  errors.role ? "border-red-300" : "border-gray-300"
                } ${!formData.role ? "text-gray-400" : "text-gray-900"}`}
              >
                <option value="" disabled>
                  Select type...
                </option>
                <option value="instructor">Content Provider</option>
                <option value="student">Content Consumer</option>
              </select>
              {errors.role && (
                <p className="text-xs text-red-500 mt-1">{errors.role}</p>
              )}
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) => updateField("acceptTerms", e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-600">
                  I agree to the{" "}
                  <span className="text-indigo-600 underline cursor-default">
                    terms and conditions
                  </span>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-xs text-red-500 ml-6">
                  {errors.acceptTerms}
                </p>
              )}

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.acceptMarketing}
                  onChange={(e) =>
                    updateField("acceptMarketing", e.target.checked)
                  }
                  className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  defaultChecked
                />
                <span className="text-xs text-gray-400">
                  Send me occasional product updates and tips
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              Continue
            </button>

            <p className="text-center text-xs text-gray-400 pt-2">
              Already registered?{" "}
              <span className="text-gray-400 cursor-default">
                Sign in here
              </span>
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
