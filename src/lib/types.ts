export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "instructor";
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  price: number; // in cents (e.g., 4999 = $49.99)
  instructorId: string;
  instructorName: string;
  lessons: Lesson[];
  createdAt: string;
  imageUrl?: string;
}

export interface CartItem {
  courseId: string;
  addedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalCents: number;
  status: "completed";
  createdAt: string;
}

export interface OrderItem {
  courseId: string;
  courseTitle: string;
  priceCents: number;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content: string;
  order: number;
  type: "video" | "text" | "quiz";
  duration: string;
  createdAt: string;
}
