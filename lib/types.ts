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
  paidDate: string; // ISO date string
  amount: number;
}

/**
 * Student with their payment records
 */
export interface StudentWithPayments extends Student {
  payments: Payment[];
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
