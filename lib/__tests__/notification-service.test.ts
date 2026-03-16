import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getUnpaidStudents,
  getNotificationPreferences,
  saveNotificationPreferences,
  addNotificationRecord,
  getNotificationHistory,
  clearNotificationHistory,
  getNotificationCount,
} from "../notification-service";
import { Student, Payment } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Mock global __DEV__
(global as any).__DEV__ = false;

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

// Mock expo-notifications
vi.mock("expo-notifications", () => ({
  setNotificationHandler: vi.fn(),
  requestPermissionsAsync: vi.fn(() => Promise.resolve({ status: "granted" })),
  scheduleNotificationAsync: vi.fn(() => Promise.resolve("notif_id")),
  cancelAllScheduledNotificationsAsync: vi.fn(),
}));

describe("Notification Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUnpaidStudents", () => {
    it("should return students with unpaid fees for current month", () => {
      const students: Student[] = [
        { id: "1", name: "John", class: "10-A", monthlyFee: 5000, createdAt: new Date().toISOString() },
        { id: "2", name: "Jane", class: "10-B", monthlyFee: 5000, createdAt: new Date().toISOString() },
        { id: "3", name: "Bob", class: "10-A", monthlyFee: 5000, createdAt: new Date().toISOString() },
      ];

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const payments: Payment[] = [
        {
          id: "p1",
          studentId: "1",
          month: currentMonth,
          year: currentYear,
          amount: 5000,
          paidDate: new Date().toISOString(),
        },
      ];

      const unpaid = getUnpaidStudents(students, payments);

      expect(unpaid).toHaveLength(2);
      expect(unpaid[0].student.id).toBe("2");
      expect(unpaid[1].student.id).toBe("3");
    });

    it("should return empty array when all students have paid", () => {
      const students: Student[] = [
        { id: "1", name: "John", class: "10-A", monthlyFee: 5000, createdAt: new Date().toISOString() },
      ];

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const payments: Payment[] = [
        {
          id: "p1",
          studentId: "1",
          month: currentMonth,
          year: currentYear,
          amount: 5000,
          paidDate: new Date().toISOString(),
        },
      ];

      const unpaid = getUnpaidStudents(students, payments);

      expect(unpaid).toHaveLength(0);
    });
  });

  describe("getNotificationPreferences", () => {
    it("should return default preferences when none are saved", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);

      const prefs = await getNotificationPreferences();

      expect(prefs.enabled).toBe(true);
      expect(prefs.reminderDay).toBe(25);
      expect(prefs.reminderHour).toBe(9);
      expect(prefs.reminderMinute).toBe(0);
    });

    it("should return saved preferences", async () => {
      const saved = {
        enabled: false,
        reminderDay: 15,
        reminderHour: 14,
        reminderMinute: 30,
        lastReminderSent: null,
      };

      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(saved));

      const prefs = await getNotificationPreferences();

      expect(prefs.enabled).toBe(false);
      expect(prefs.reminderDay).toBe(15);
      expect(prefs.reminderHour).toBe(14);
    });
  });

  describe("saveNotificationPreferences", () => {
    it("should save preferences to storage", async () => {
      const prefs = {
        enabled: true,
        reminderDay: 20,
        reminderHour: 10,
        reminderMinute: 0,
        lastReminderSent: null,
      };

      await saveNotificationPreferences(prefs);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "notification_preferences",
        JSON.stringify(prefs)
      );
    });
  });

  describe("addNotificationRecord", () => {
    it("should add notification record to history", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);

      await addNotificationRecord({
        studentId: "1",
        studentName: "John",
        type: "unpaid_reminder",
        message: "Fee reminder",
      });

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const call = vi.mocked(AsyncStorage.setItem).mock.calls[0];
      expect(call[0]).toBe("notification_history");

      const saved = JSON.parse(call[1] as string);
      expect(saved).toHaveLength(1);
      expect(saved[0].studentId).toBe("1");
      expect(saved[0].type).toBe("unpaid_reminder");
    });
  });

  describe("getNotificationHistory", () => {
    it("should return notification history", async () => {
      const history = [
        {
          id: "notif_1",
          studentId: "1",
          studentName: "John",
          sentAt: new Date().toISOString(),
          type: "unpaid_reminder" as const,
          message: "Fee reminder",
        },
      ];

      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(history));

      const result = await getNotificationHistory();

      expect(result).toHaveLength(1);
      expect(result[0].studentId).toBe("1");
    });

    it("should return empty array when no history exists", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);

      const result = await getNotificationHistory();

      expect(result).toEqual([]);
    });
  });

  describe("clearNotificationHistory", () => {
    it("should clear notification history", async () => {
      await clearNotificationHistory();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith("notification_history");
    });
  });

  describe("getNotificationCount", () => {
    it("should count notifications from last 30 days", async () => {
      const now = new Date();
      const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const history = [
        {
          id: "notif_1",
          studentId: "1",
          studentName: "John",
          sentAt: now.toISOString(),
          type: "unpaid_reminder" as const,
          message: "Fee reminder",
        },
        {
          id: "notif_2",
          studentId: "2",
          studentName: "Jane",
          sentAt: fifteenDaysAgo.toISOString(),
          type: "unpaid_reminder" as const,
          message: "Fee reminder",
        },
        {
          id: "notif_3",
          studentId: "3",
          studentName: "Bob",
          sentAt: sixtyDaysAgo.toISOString(),
          type: "unpaid_reminder" as const,
          message: "Fee reminder",
        },
      ];

      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(history));

      const count = await getNotificationCount();

      expect(count).toBe(2);
    });
  });
});
