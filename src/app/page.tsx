"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trackEvent } from "@/lib/fullstory";

// TODO [FullStory]: Track landing page engagement metrics:
// - Scroll depth (how far users scroll before bouncing)
// - Time on page before clicking CTA
// - Which CTA button converts better (hero vs. features section)
// Example: FS.event('Landing_CTA_Click', { location: 'hero' | 'features' });

export default function LandingPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-indigo-100">
                  Now in beta &mdash; free for early adopters
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Build & share
                <br />
                courses with ease
              </h1>
              <p className="text-lg sm:text-xl text-indigo-200 mb-10 max-w-2xl">
                LearnIT is a lightweight platform for creating, organizing, and
                delivering educational content. No complexity, just learning.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  onClick={() => trackEvent("Landing_CTA_Click", { location: "hero_primary" })}
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  Start Teaching Free
                </Link>
                <Link
                  href="/browse"
                  onClick={() => trackEvent("Landing_CTA_Click", { location: "hero_secondary" })}
                  className="inline-flex items-center justify-center px-6 py-3 border border-white/30 text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
                >
                  Browse Courses
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Everything you need to teach online
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Simple tools for creating structured learning experiences. No
                steep learning curve.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  ),
                  title: "Course Builder",
                  description:
                    "Create structured courses with lessons, quizzes, and rich content in minutes.",
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                    </svg>
                  ),
                  title: "Live Dashboard",
                  description:
                    "Monitor your courses and content from a centralized dashboard with real-time updates.",
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  ),
                  title: "Instant Publishing",
                  description:
                    "Go from idea to published course in minutes. No review process, no delays.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="bg-gray-50 rounded-xl p-6 hover:bg-indigo-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social proof / stats */}
        <section className="py-16 bg-gray-50 border-y border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "1,200+", label: "Courses Created" },
                { value: "8,400+", label: "Active Learners" },
                { value: "98%", label: "Completion Rate" },
                { value: "4.9/5", label: "Instructor Rating" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl font-bold text-indigo-600">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto text-center px-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to start building?
            </h2>
            <p className="text-gray-500 mb-8">
              Join thousands of instructors who are already sharing their
              knowledge on LearnIT.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                onClick={() => trackEvent("Landing_CTA_Click", { location: "bottom" })}
                className="inline-flex items-center justify-center px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Your First Course
              </Link>
              <Link
                href="/browse"
                onClick={() => trackEvent("Landing_CTA_Click", { location: "bottom" })}
                className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
              >
                or browse our catalog &rarr;
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
