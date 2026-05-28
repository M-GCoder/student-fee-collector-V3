/**
 * Student data type with fee information
 */
export interface Student {
  id: string;
  name: string;
  class: string;
  monthlyFee: number;
  dueDate?: string; // ISO date string (optional, for single payment deadline)
  monthlyDueDate?: number; // Day of month (1-31) for recurring monthly payment due date
  email?: string; // Student email address
  password?: string; // Student password (hashed in database)
  createdAt: string;
}

/**
 * Payment record for a student in a specific month
 */
export interface Payment {
  id: string;
  studentId: string;
  month: number; // 0-11 (Jan-Dec)
  year: number;
  paidDate?: string; // ISO date string (when payment was marked as paid)
  paymentDate?: string; // ISO date string (when payment was recorded)
  amount: number;
  createdAt?: string; // ISO date string
}

/**
 * Student with their payment records
 */
export interface StudentWithPayments extends Student {
  payments: Payment[];
}

/**
 * Timetable entry for a class (subject + time period)
 */
export interface Timetable {
  id: string;
  classId: string;
  day: string; // Monday, Tuesday, etc.
  subject: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  createdAt: string;
}

/**
 * Test schedule for a class
 */
export interface TestSchedule {
  id: string;
  classId: string;
  subject: string;
  testDate: string; // ISO date string
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  createdAt: string;
}

/**
 * Class data type
 */
export interface Class {
  id: string;
  name: string;
  createdAt: string;
}

/**
 * Result data type for class-specific results
 */
export interface Result {
  id: string;
  classId: string;
  examName: string; // Name of the exam
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
}

/**
 * Announcement data type
 */
export interface Announcement {
  id: string;
  title: string;
  description: string;
  classId: string; // "all" for all classes
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  expiryDate: string; // ISO date string
  createdAt: string;
}

/**
 * Month display format
 */
export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Currency symbol for Indian Rupee
 */
export const CURRENCY_SYMBOL = "RS";
