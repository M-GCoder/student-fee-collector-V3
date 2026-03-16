import { Student, Payment } from "./types";

/**
 * Payment status for a student
 */
export type PaymentStatus = "paid" | "pending" | "overdue";

/**
 * Get the payment status for a student in the current month
 */
export function getPaymentStatus(
  student: Student,
  payments: Payment[]
): PaymentStatus {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Check if student has a payment for current month
  const currentMonthPayment = payments.find(
    (p) => p.studentId === student.id && p.month === currentMonth && p.year === currentYear
  );

  if (currentMonthPayment) {
    return "paid";
  }

  // Check if payment is overdue
  if (student.dueDate) {
    const dueDate = new Date(student.dueDate);
    if (currentDate > dueDate) {
      return "overdue";
    }
  }

  return "pending";
}

/**
 * Check if a student's payment is overdue
 */
export function isPaymentOverdue(student: Student, payments: Payment[]): boolean {
  return getPaymentStatus(student, payments) === "overdue";
}

/**
 * Get days until due date (negative if overdue)
 */
export function getDaysUntilDue(student: Student): number | null {
  if (!student.dueDate) {
    return null;
  }

  const dueDate = new Date(student.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Format due date for display
 */
export function formatDueDate(dueDate: string | undefined): string {
  if (!dueDate) {
    return "No due date";
  }

  const date = new Date(dueDate);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Get due date status message
 */
export function getDueDateMessage(student: Student, payments: Payment[]): string {
  const status = getPaymentStatus(student, payments);

  if (status === "paid") {
    return "Paid";
  }

  if (!student.dueDate) {
    return "Pending";
  }

  const daysUntilDue = getDaysUntilDue(student);

  if (daysUntilDue === null) {
    return "Pending";
  }

  if (daysUntilDue < 0) {
    const daysOverdue = Math.abs(daysUntilDue);
    return `Overdue by ${daysOverdue} day${daysOverdue > 1 ? "s" : ""}`;
  }

  if (daysUntilDue === 0) {
    return "Due today";
  }

  return `Due in ${daysUntilDue} day${daysUntilDue > 1 ? "s" : ""}`;
}

/**
 * Get color for payment status
 */
export function getStatusColor(
  status: PaymentStatus,
  colors: any
): string {
  switch (status) {
    case "paid":
      return colors.success;
    case "overdue":
      return colors.error;
    case "pending":
      return colors.warning;
    default:
      return colors.muted;
  }
}
