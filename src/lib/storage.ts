import { User, Course, Lesson, CartItem, Order } from "./types";

const STORAGE_KEYS = {
  USER: "learnit_user",
  COURSES: "learnit_courses",
  CART: "learnit_cart",
  ORDERS: "learnit_orders",
  ENROLLMENTS: "learnit_enrollments",
} as const;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

// ---- User functions ----

export function getUser(): User | null {
  if (!isBrowser()) return null;
  const data = localStorage.getItem(STORAGE_KEYS.USER);
  return data ? JSON.parse(data) : null;
}

export function saveUser(user: User): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export function clearUser(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEYS.USER);
}

// ---- Course functions ----

export function getCourses(): Course[] {
  if (!isBrowser()) return [];
  const data = localStorage.getItem(STORAGE_KEYS.COURSES);
  return data ? JSON.parse(data) : [];
}

export function saveCourse(course: Course): void {
  if (!isBrowser()) return;
  const courses = getCourses();
  const existingIndex = courses.findIndex((c) => c.id === course.id);
  if (existingIndex >= 0) {
    courses[existingIndex] = course;
  } else {
    courses.push(course);
  }
  localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
}

export function getCourseById(id: string): Course | null {
  const courses = getCourses();
  return courses.find((c) => c.id === id) || null;
}

export function addLessonToCourse(courseId: string, lesson: Lesson): void {
  if (!isBrowser()) return;
  const courses = getCourses();
  const course = courses.find((c) => c.id === courseId);
  if (course) {
    course.lessons.push(lesson);
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
  }
}

// ---- Cart functions ----

export function getCart(): CartItem[] {
  if (!isBrowser()) return [];
  const data = localStorage.getItem(STORAGE_KEYS.CART);
  return data ? JSON.parse(data) : [];
}

export function addToCart(courseId: string): void {
  if (!isBrowser()) return;
  const cart = getCart();
  if (cart.some((item) => item.courseId === courseId)) return;
  cart.push({ courseId, addedAt: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
}

export function removeFromCart(courseId: string): void {
  if (!isBrowser()) return;
  const cart = getCart().filter((item) => item.courseId !== courseId);
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
}

export function clearCart(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEYS.CART);
}

export function getCartCount(): number {
  return getCart().length;
}

export function isInCart(courseId: string): boolean {
  return getCart().some((item) => item.courseId === courseId);
}

// ---- Order functions ----

export function getOrders(): Order[] {
  if (!isBrowser()) return [];
  const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
  return data ? JSON.parse(data) : [];
}

export function saveOrder(order: Order): void {
  if (!isBrowser()) return;
  const orders = getOrders();
  orders.push(order);
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
}

// ---- Enrollment functions ----

export function getEnrollments(): string[] {
  if (!isBrowser()) return [];
  const data = localStorage.getItem(STORAGE_KEYS.ENROLLMENTS);
  return data ? JSON.parse(data) : [];
}

export function addEnrollments(courseIds: string[]): void {
  if (!isBrowser()) return;
  const current = getEnrollments();
  const set = new Set([...current, ...courseIds]);
  const updated = Array.from(set);
  localStorage.setItem(STORAGE_KEYS.ENROLLMENTS, JSON.stringify(updated));
}

export function isEnrolled(courseId: string): boolean {
  return getEnrollments().includes(courseId);
}

// ---- Helpers ----

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function seedDemoCourses(instructorId: string): void {
  if (!isBrowser()) return;
  const existing = getCourses();
  if (existing.length > 0) return;

  const demoCourses: Course[] = [
    {
      id: generateId(),
      title: "Introduction to TypeScript",
      description:
        "Learn TypeScript fundamentals from type annotations to generics. Build type-safe applications with confidence.",
      category: "Programming",
      difficulty: "beginner",
      price: 4999,
      instructorId,
      instructorName: "Demo Instructor",
      lessons: [
        {
          id: generateId(),
          courseId: "",
          title: "What is TypeScript?",
          content: "TypeScript is a typed superset of JavaScript...",
          order: 1,
          type: "text",
          duration: "10 min",
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      title: "React Patterns & Best Practices",
      description:
        "Master advanced React patterns including compound components, render props, and custom hooks.",
      category: "Frontend",
      difficulty: "intermediate",
      price: 7999,
      instructorId,
      instructorName: "Demo Instructor",
      lessons: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      title: "System Design Fundamentals",
      description:
        "Learn how to design scalable distributed systems. Covers load balancing, caching, databases, and more.",
      category: "Architecture",
      difficulty: "advanced",
      price: 9999,
      instructorId,
      instructorName: "Demo Instructor",
      lessons: [],
      createdAt: new Date().toISOString(),
    },
  ];

  demoCourses.forEach((c) => {
    c.lessons.forEach((l) => (l.courseId = c.id));
    saveCourse(c);
  });
}
