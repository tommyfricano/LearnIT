"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getUser, clearUser, getCartCount } from "@/lib/storage";
import { User } from "@/lib/types";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setUser(getUser());
    setCartCount(getCartCount());
  }, []);

  const handleLogout = () => {
    clearUser();
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Learn<span className="text-indigo-600">IT</span>
            </span>
          </Link>

          <nav className="flex items-center gap-6">
            {user ? (
              <>
                {user.role === "student" && (
                  <Link
                    href="/browse"
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Browse
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </Link>
                {user.role === "instructor" && (
                  <Link
                    href="/courses/create"
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Create Course
                  </Link>
                )}

                {user.role === "student" && (
                  <Link
                    href="/cart"
                    className="relative text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
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
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}

                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-700 text-sm font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-gray-400 hover:text-gray-500 transition-colors"
                    title="End current session"
                  >
                    exit
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/browse"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Browse Courses
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-medium text-white bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
