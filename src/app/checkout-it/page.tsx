"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  getUser,
  getCart,
  getCourseById,
  clearCart,
  saveOrder,
  addEnrollments,
  generateId,
  formatPrice,
} from "@/lib/storage";
import { User, Course, Order, OrderItem } from "@/lib/types";
import { trackEvent } from "@/lib/fullstory";

/* Journey 1: Checkout step in signup-to-enrollment funnel — see FullStory Funnels */

export default function CheckoutPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [cartCourses, setCartCourses] = useState<Course[]>([]);
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState("");
  const [completedItemCount, setCompletedItemCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    const currentUser = getUser();
    if (!currentUser) {
      router.push("/signup");
      return;
    }
    setUser(currentUser);

    const cart = getCart();
    if (cart.length === 0) {
      router.push("/cart");
      return;
    }

    const courses = cart
      .map((item) => getCourseById(item.courseId))
      .filter((c): c is Course => c !== null);
    setCartCourses(courses);

    const total = courses.reduce((sum, c) => sum + (c.price ?? 0), 0);
    trackEvent("Checkout_Started", { itemCount: courses.length, totalCents: total });
  }, [router]);

  const totalCents = cartCourses.reduce((sum, c) => sum + (c.price ?? 0), 0);

  const validate = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!formData.cardNumber.trim()) {
      newErrors.cardNumber = "Required";
    } else if (formData.cardNumber.replace(/\s/g, "").length < 13) {
      newErrors.cardNumber = "Invalid card number";
    }

    if (!formData.expiry.trim()) {
      newErrors.expiry = "Required";
    } else if (!/^\d{2}\/\d{2}$/.test(formData.expiry)) {
      newErrors.expiry = "Use MM/YY format";
    }

    if (!formData.cvv.trim()) {
      newErrors.cvv = "Required";
    } else if (formData.cvv.length < 3) {
      newErrors.cvv = "Invalid CVV";
    }

    if (!formData.cardName.trim()) {
      newErrors.cardName = "Required";
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    trackEvent("Checkout_SubmitAttempt", { totalCents });

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      trackEvent("Checkout_ValidationFailed", {
        errorFields: Object.keys(validationErrors),
      });
      return;
    }

    setIsProcessing(true);

    /*
      UX FRICTION: The submit button changes to "Processing..." with no
      spinner or progress indicator, and the user doesn't know if it's
      actually working or frozen. The artificial delay makes it worse.
      TODO [FullStory]: Track double-click attempts on the submit button
      during the processing state (rage clicks).
    */
    setTimeout(() => {
      if (!user) return;

      const orderItems: OrderItem[] = cartCourses.map((c) => ({
        courseId: c.id,
        courseTitle: c.title,
        priceCents: c.price ?? 0,
      }));

      const order: Order = {
        id: generateId(),
        userId: user.id,
        items: orderItems,
        totalCents,
        status: "completed",
        createdAt: new Date().toISOString(),
      };

      saveOrder(order);
      addEnrollments(cartCourses.map((c) => c.id));
      clearCart();

      trackEvent("Checkout_Success", {
        orderId: order.id,
        totalCents,
        itemCount: orderItems.length,
      });

      setCompletedOrderId(order.id);
      setCompletedItemCount(orderItems.length);
      setShowSuccess(true);
      setIsProcessing(false);
    }, 1500);
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

  if (showSuccess) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-gray-50 py-16">
          {/*
            UX FRICTION: The success state shows an order number that looks
            like a timestamp-hash (from generateId()), which doesn't look
            like a professional order confirmation number. There's no email
            confirmation message. Users may screenshot the page worried
            they'll lose the order info.
            TODO [FullStory]: Track time spent on success page and whether
            users attempt to interact with the order number (copy, click).
          */}
          <div className="max-w-md mx-auto text-center px-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Purchase Complete!
            </h2>
            <p className="text-gray-500 mb-1">
              You&apos;ve been enrolled in {completedItemCount}{" "}
              {completedItemCount === 1 ? "course" : "courses"}.
            </p>
            <p className="text-xs text-gray-400 mb-8 font-mono">
              Order #{completedOrderId}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/browse"
                className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
              >
                Browse more courses &rarr;
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left column: payment form */}
            <div className="lg:col-span-3">
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-xl border border-gray-200 p-6 space-y-5"
              >
                {/* Contact info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
                  />
                </div>

                <div className="border-t border-gray-100 pt-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Payment Details
                  </h3>

                  {/* Card number */}
                  <div className="mb-4">
                    <label
                      htmlFor="cardNumber"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Card Number
                    </label>
                    <input
                      id="cardNumber"
                      type="text"
                      value={formData.cardNumber}
                      onChange={(e) =>
                        updateField("cardNumber", e.target.value)
                      }
                      maxLength={19}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.cardNumber ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="1234 5678 9012 3456"
                    />
                    {errors.cardNumber && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.cardNumber}
                      </p>
                    )}
                  </div>

                  {/* Expiry + CVV */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label
                        htmlFor="expiry"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Expiry
                      </label>
                      <input
                        id="expiry"
                        type="text"
                        value={formData.expiry}
                        onChange={(e) => updateField("expiry", e.target.value)}
                        maxLength={5}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors.expiry ? "border-red-300" : "border-gray-300"
                        }`}
                        placeholder="MM/YY"
                      />
                      {errors.expiry && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.expiry}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="cvv"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        CVV
                      </label>
                      <input
                        id="cvv"
                        type="password"
                        value={formData.cvv}
                        onChange={(e) => updateField("cvv", e.target.value)}
                        maxLength={4}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors.cvv ? "border-red-300" : "border-gray-300"
                        }`}
                        placeholder="123"
                      />
                      {errors.cvv && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.cvv}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Cardholder name */}
                  <div>
                    <label
                      htmlFor="cardName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Cardholder Name
                    </label>
                    <input
                      id="cardName"
                      type="text"
                      value={formData.cardName}
                      onChange={(e) => updateField("cardName", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.cardName ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Name on card"
                    />
                    {errors.cardName && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.cardName}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing
                    ? "Processing..."
                    : `Complete Purchase \u2014 $${formatPrice(totalCents)}`}
                </button>
              </form>
            </div>

            {/* Right column: order summary */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Order Summary
                </h3>
                <div className="space-y-3">
                  {cartCourses.map((course) => (
                    <div
                      key={course.id}
                      className="flex justify-between items-start gap-3 py-2 border-b border-gray-50 last:border-0"
                    >
                      <span className="text-sm text-gray-600 line-clamp-2">
                        {course.title}
                      </span>
                      <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                        ${formatPrice(course.price ?? 0)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-semibold pt-4 mt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">
                    ${formatPrice(totalCents)}
                  </span>
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
