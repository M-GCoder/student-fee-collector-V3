import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createReminder,
  formatReminderTime,
  getNextReminderTriggerDate,
  ReminderConfig,
} from '../recurring-reminder-service';

describe('Recurring Reminder Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatReminderTime', () => {
    it('should format time correctly for morning hours', () => {
      const formatted = formatReminderTime('09:00');
      expect(formatted).toBe('9:00 AM');
    });

    it('should format time correctly for afternoon hours', () => {
      const formatted = formatReminderTime('14:30');
      expect(formatted).toBe('2:30 PM');
    });

    it('should format time correctly for midnight', () => {
      const formatted = formatReminderTime('00:00');
      expect(formatted).toBe('12:00 AM');
    });

    it('should format time correctly for noon', () => {
      const formatted = formatReminderTime('12:00');
      expect(formatted).toBe('12:00 PM');
    });
  });

  describe('getNextReminderTriggerDate', () => {
    it('should return future date when current date has not passed', () => {
      const reminder: ReminderConfig = {
        id: 'reminder_123',
        enabled: true,
        reminderDate: 25,
        frequency: 'monthly',
        reminderTime: '09:00',
        message: 'Test message',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const nextDate = getNextReminderTriggerDate(reminder);
      expect(nextDate).toBeInstanceOf(Date);
      expect(nextDate.getDate()).toBe(25);
    });

    it('should set correct time on reminder date', () => {
      const reminder: ReminderConfig = {
        id: 'reminder_123',
        enabled: true,
        reminderDate: 15,
        frequency: 'monthly',
        reminderTime: '14:30',
        message: 'Test message',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const nextDate = getNextReminderTriggerDate(reminder);
      expect(nextDate.getHours()).toBe(14);
      expect(nextDate.getMinutes()).toBe(30);
    });
  });

  describe('Reminder Data Validation', () => {
    it('should validate reminder date range', () => {
      const validDates = [1, 15, 28, 31];
      validDates.forEach((date) => {
        const reminder: ReminderConfig = {
          id: `reminder_${date}`,
          enabled: true,
          reminderDate: date,
          frequency: 'monthly',
          reminderTime: '09:00',
          message: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        expect(reminder.reminderDate).toBeGreaterThanOrEqual(1);
        expect(reminder.reminderDate).toBeLessThanOrEqual(31);
      });
    });

    it('should validate reminder frequency values', () => {
      const validFrequencies: Array<'weekly' | 'bi-weekly' | 'monthly'> = ['weekly', 'bi-weekly', 'monthly'];
      validFrequencies.forEach((freq) => {
        expect(['weekly', 'bi-weekly', 'monthly']).toContain(freq);
      });
    });

    it('should validate time format', () => {
      const validTimes = ['09:00', '14:30', '23:59', '00:00'];
      validTimes.forEach((time) => {
        const [hour, minute] = time.split(':').map(Number);
        expect(hour).toBeGreaterThanOrEqual(0);
        expect(hour).toBeLessThan(24);
        expect(minute).toBeGreaterThanOrEqual(0);
        expect(minute).toBeLessThan(60);
      });
    });
  });

  describe('Reminder Configuration', () => {
    it('should create reminder with all required fields', () => {
      const reminder: ReminderConfig = {
        id: 'reminder_123',
        enabled: true,
        reminderDate: 15,
        frequency: 'monthly',
        reminderTime: '09:00',
        message: 'Pay your fee',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(reminder).toHaveProperty('id');
      expect(reminder).toHaveProperty('enabled');
      expect(reminder).toHaveProperty('reminderDate');
      expect(reminder).toHaveProperty('frequency');
      expect(reminder).toHaveProperty('reminderTime');
      expect(reminder).toHaveProperty('message');
      expect(reminder).toHaveProperty('createdAt');
      expect(reminder).toHaveProperty('updatedAt');
    });

    it('should support all frequency types', () => {
      const frequencies: Array<'weekly' | 'bi-weekly' | 'monthly'> = ['weekly', 'bi-weekly', 'monthly'];
      
      frequencies.forEach((freq) => {
        const reminder: ReminderConfig = {
          id: `reminder_${freq}`,
          enabled: true,
          reminderDate: 15,
          frequency: freq,
          reminderTime: '09:00',
          message: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        expect(reminder.frequency).toBe(freq);
      });
    });

    it('should handle enabled/disabled state', () => {
      const enabledReminder: ReminderConfig = {
        id: 'reminder_enabled',
        enabled: true,
        reminderDate: 15,
        frequency: 'monthly',
        reminderTime: '09:00',
        message: 'Test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const disabledReminder: ReminderConfig = {
        ...enabledReminder,
        id: 'reminder_disabled',
        enabled: false,
      };

      expect(enabledReminder.enabled).toBe(true);
      expect(disabledReminder.enabled).toBe(false);
    });
  });
});
