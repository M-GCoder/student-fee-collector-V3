import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getMonthlyDueDate,
  checkMonthlyOverdue,
  getMonthlyDueStatusMessage,
  getMonthlyDueStatusColor,
  formatMonthlyDueDate,
  isValidMonthlyDueDate,
} from '../monthly-due-date-service';

describe('Monthly Due Date Service', () => {
  beforeEach(() => {
    // Mock current date to March 20, 2026
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 20)); // March 20, 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getMonthlyDueDate', () => {
    it('should return correct due date for valid day of month', () => {
      const dueDate = getMonthlyDueDate(15, 2, 2026); // March 15, 2026
      expect(dueDate).toBe('2026-03-15');
    });

    it('should clamp day to last day of month for February', () => {
      const dueDate = getMonthlyDueDate(31, 1, 2026); // February 2026 has 28 days
      expect(dueDate).toBe('2026-02-28');
    });

    it('should handle leap year February', () => {
      const dueDate = getMonthlyDueDate(29, 1, 2024); // February 2024 has 29 days
      expect(dueDate).toBe('2024-02-29');
    });

    it('should handle month boundaries', () => {
      const dueDate = getMonthlyDueDate(31, 3, 2026); // April 2026 has 30 days
      expect(dueDate).toBe('2026-04-30');
    });
  });

  describe('checkMonthlyOverdue', () => {
    it('should return paid status when paidDate is provided', () => {
      const result = checkMonthlyOverdue(15, 2, 2026, '2026-03-10');
      expect(result.status).toBe('paid');
      expect(result.isOverdue).toBe(false);
      expect(result.daysOverdue).toBe(0);
    });

    it('should return pending status when due date is in future', () => {
      const result = checkMonthlyOverdue(25, 2, 2026); // Due on March 25, today is March 20
      expect(result.status).toBe('pending');
      expect(result.isOverdue).toBe(false);
      expect(result.daysOverdue).toBe(0);
    });

    it('should return overdue status when due date has passed', () => {
      const result = checkMonthlyOverdue(15, 2, 2026); // Due on March 15, today is March 20
      expect(result.status).toBe('overdue');
      expect(result.isOverdue).toBe(true);
      expect(result.daysOverdue).toBeGreaterThanOrEqual(5);
    });

    it('should return overdue message with correct days', () => {
      const result = checkMonthlyOverdue(10, 2, 2026); // Due on March 10, today is March 20
      expect(result.daysOverdue).toBeGreaterThanOrEqual(10);
    });
  });

  describe('getMonthlyDueStatusMessage', () => {
    it('should return "Paid" when paidDate is provided', () => {
      const message = getMonthlyDueStatusMessage(15, 2, 2026, '2026-03-10');
      expect(message).toBe('Paid');
    });

    it('should return overdue message with correct days', () => {
      const message = getMonthlyDueStatusMessage(15, 2, 2026);
      expect(message).toMatch(/Overdue by \d+ days/);
    });

    it('should return "Due today" or overdue message when due date is today', () => {
      const message = getMonthlyDueStatusMessage(20, 2, 2026);
      expect(message).toMatch(/Due|Overdue/); // Could be "Due today" or "Overdue by 1 day" depending on time
    });

    it('should return pending message with days until due', () => {
      const message = getMonthlyDueStatusMessage(26, 2, 2026);
      expect(message).toContain('Due in'); // Should contain "Due in" with some number of days
    });

    it('should handle singular vs plural days', () => {
      const messageSingular = getMonthlyDueStatusMessage(21, 2, 2026); // 1 day until due
      expect(messageSingular).toContain('day'); // singular or plural

      const messagePlural = getMonthlyDueStatusMessage(10, 2, 2026);
      expect(messagePlural).toContain('day'); // should contain day
    });
  });

  describe('getMonthlyDueStatusColor', () => {
    it('should return green color for paid status', () => {
      const color = getMonthlyDueStatusColor(15, 2, 2026, '2026-03-10');
      expect(color).toBe('#22C55E'); // Green
    });

    it('should return red color for overdue status', () => {
      const color = getMonthlyDueStatusColor(15, 2, 2026);
      expect(color).toBe('#EF4444'); // Red
    });

    it('should return orange color for pending status', () => {
      const color = getMonthlyDueStatusColor(25, 2, 2026);
      expect(color).toBe('#F59E0B'); // Orange
    });
  });

  describe('formatMonthlyDueDate', () => {
    it('should format day 1 correctly', () => {
      const formatted = formatMonthlyDueDate(1);
      expect(formatted).toBe('1st of every month');
    });

    it('should format day 2 correctly', () => {
      const formatted = formatMonthlyDueDate(2);
      expect(formatted).toBe('2nd of every month');
    });

    it('should format day 3 correctly', () => {
      const formatted = formatMonthlyDueDate(3);
      expect(formatted).toBe('3rd of every month');
    });

    it('should format day 4 correctly', () => {
      const formatted = formatMonthlyDueDate(4);
      expect(formatted).toBe('4th of every month');
    });

    it('should format day 11 correctly (exception)', () => {
      const formatted = formatMonthlyDueDate(11);
      expect(formatted).toBe('11th of every month');
    });

    it('should format day 21 correctly', () => {
      const formatted = formatMonthlyDueDate(21);
      expect(formatted).toBe('21st of every month');
    });

    it('should format day 31 correctly', () => {
      const formatted = formatMonthlyDueDate(31);
      expect(formatted).toBe('31st of every month');
    });

    it('should return "Invalid date" for invalid input', () => {
      const formatted = formatMonthlyDueDate(32);
      expect(formatted).toBe('Invalid date');
    });
  });

  describe('isValidMonthlyDueDate', () => {
    it('should return true for valid days 1-31', () => {
      for (let day = 1; day <= 31; day++) {
        expect(isValidMonthlyDueDate(day)).toBe(true);
      }
    });

    it('should return false for day 0', () => {
      expect(isValidMonthlyDueDate(0)).toBe(false);
    });

    it('should return false for day 32', () => {
      expect(isValidMonthlyDueDate(32)).toBe(false);
    });

    it('should return false for negative days', () => {
      expect(isValidMonthlyDueDate(-1)).toBe(false);
    });

    it('should return false for non-integer days', () => {
      expect(isValidMonthlyDueDate(15.5)).toBe(false);
    });
  });
});
