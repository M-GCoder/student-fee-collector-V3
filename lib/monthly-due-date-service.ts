import { Student } from './types';

/**
 * Service for managing monthly recurring payment due dates
 */

/**
 * Get the due date for a specific month and year based on the student's monthly due date
 * @param monthlyDueDate - Day of month (1-31)
 * @param month - Month (0-11)
 * @param year - Year
 * @returns ISO date string
 */
export function getMonthlyDueDate(monthlyDueDate: number, month: number, year: number): string {
  // Clamp the day to the last day of the month if it exceeds the month's days
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const dayOfMonth = Math.min(monthlyDueDate, lastDayOfMonth);
  
  const dueDate = new Date(year, month, dayOfMonth);
  return dueDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
}

/**
 * Check if a payment is overdue based on monthly due date
 * @param monthlyDueDate - Day of month (1-31)
 * @param month - Month (0-11)
 * @param year - Year
 * @param paidDate - ISO date string of when it was paid (optional)
 * @returns Object with isOverdue, daysOverdue, and dueDate
 */
export function checkMonthlyOverdue(
  monthlyDueDate: number,
  month: number,
  year: number,
  paidDate?: string
): {
  isOverdue: boolean;
  daysOverdue: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
} {
  const dueDate = getMonthlyDueDate(monthlyDueDate, month, year);
  
  // If already paid, return paid status
  if (paidDate) {
    return {
      isOverdue: false,
      daysOverdue: 0,
      dueDate,
      status: 'paid',
    };
  }
  
  // Calculate days overdue
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDateObj = new Date(dueDate);
  dueDateObj.setHours(0, 0, 0, 0);
  
  const daysOverdue = Math.floor((today.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    isOverdue: daysOverdue > 0,
    daysOverdue: Math.max(0, daysOverdue),
    dueDate,
    status: daysOverdue > 0 ? 'overdue' : 'pending',
  };
}

/**
 * Get status message for monthly due date
 * @param monthlyDueDate - Day of month (1-31)
 * @param month - Month (0-11)
 * @param year - Year
 * @param paidDate - ISO date string of when it was paid (optional)
 * @returns Status message string
 */
export function getMonthlyDueStatusMessage(
  monthlyDueDate: number,
  month: number,
  year: number,
  paidDate?: string
): string {
  const { status, daysOverdue, dueDate } = checkMonthlyOverdue(monthlyDueDate, month, year, paidDate);
  
  if (status === 'paid') {
    return 'Paid';
  }
  
  if (status === 'overdue') {
    return `Overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}`;
  }
  
  // Calculate days until due
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDateObj = new Date(dueDate);
  dueDateObj.setHours(0, 0, 0, 0);
  
  const daysUntilDue = Math.floor((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDue === 0) {
    return 'Due today';
  }
  
  return `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`;
}

/**
 * Get color for monthly due date status
 * @param monthlyDueDate - Day of month (1-31)
 * @param month - Month (0-11)
 * @param year - Year
 * @param paidDate - ISO date string of when it was paid (optional)
 * @returns Color string (green for paid, red for overdue, orange for pending)
 */
export function getMonthlyDueStatusColor(
  monthlyDueDate: number,
  month: number,
  year: number,
  paidDate?: string
): string {
  const { status } = checkMonthlyOverdue(monthlyDueDate, month, year, paidDate);
  
  switch (status) {
    case 'paid':
      return '#22C55E'; // Green
    case 'overdue':
      return '#EF4444'; // Red
    case 'pending':
      return '#F59E0B'; // Orange
    default:
      return '#687076'; // Gray
  }
}

/**
 * Validate monthly due date (1-31)
 * @param monthlyDueDate - Day of month to validate
 * @returns true if valid, false otherwise
 */
export function isValidMonthlyDueDate(monthlyDueDate: number): boolean {
  return monthlyDueDate >= 1 && monthlyDueDate <= 31 && Number.isInteger(monthlyDueDate);
}

/**
 * Format monthly due date for display
 * @param monthlyDueDate - Day of month (1-31)
 * @returns Formatted string (e.g., "15th of every month")
 */
export function formatMonthlyDueDate(monthlyDueDate: number): string {
  if (!isValidMonthlyDueDate(monthlyDueDate)) {
    return 'Invalid date';
  }
  
  const suffix = getDayOfMonthSuffix(monthlyDueDate);
  return `${monthlyDueDate}${suffix} of every month`;
}

/**
 * Get ordinal suffix for day of month (st, nd, rd, th)
 */
function getDayOfMonthSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return 'th';
  }
  
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}
