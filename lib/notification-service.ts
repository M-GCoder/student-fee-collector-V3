import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Student, Payment } from "./types";

/**
 * Notification preference settings
 */
export interface NotificationPreferences {
  enabled: boolean;
  reminderDay: number; // 1-28 (day of month to send reminder)
  reminderHour: number; // 0-23
  reminderMinute: number; // 0-59
  lastReminderSent: string | null; // ISO date string
}

/**
 * Notification record for history tracking
 */
export interface NotificationRecord {
  id: string;
  studentId: string;
  studentName: string;
  sentAt: string;
  type: "unpaid_reminder" | "payment_confirmation";
  message: string;
}

const NOTIFICATION_PREFS_KEY = "notification_preferences";
const NOTIFICATION_HISTORY_KEY = "notification_history";

/**
 * Initialize notification handler
 */
export async function initializeNotifications() {
  // Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Request permissions
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const prefs = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (prefs) {
      return JSON.parse(prefs);
    }
  } catch (error) {
    console.error("Error reading notification preferences:", error);
  }

  // Return default preferences
  return {
    enabled: true,
    reminderDay: 25, // 25th of each month
    reminderHour: 9, // 9 AM
    reminderMinute: 0,
    lastReminderSent: null,
  };
}

/**
 * Save notification preferences
 */
export async function saveNotificationPreferences(
  preferences: NotificationPreferences
): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error("Error saving notification preferences:", error);
    throw error;
  }
}

/**
 * Get unpaid students for notification
 */
export function getUnpaidStudents(
  students: Student[],
  payments: Payment[]
): Array<{ student: Student; unpaidMonths: number }> {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  return students
    .map((student) => {
      const isPaid = payments.some(
        (p) =>
          p.studentId === student.id &&
          p.month === currentMonth &&
          p.year === currentYear
      );

      return {
        student,
        unpaidMonths: isPaid ? 0 : 1,
      };
    })
    .filter((item) => item.unpaidMonths > 0);
}

/**
 * Send notification for unpaid fees
 */
export async function sendUnpaidFeeNotification(
  student: Student,
  title: string = "Fee Reminder",
  body: string = `${student.name} has an unpaid fee of RS${student.monthlyFee} for this month.`
): Promise<string | null> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          studentId: student.id,
          studentName: student.name,
          type: "unpaid_reminder",
        },
        badge: 1,
      },
      trigger: null, // Send immediately
    });

    // Save to notification history
    await addNotificationRecord({
      studentId: student.id,
      studentName: student.name,
      type: "unpaid_reminder",
      message: body,
    });

    return notificationId;
  } catch (error) {
    console.error("Error sending notification:", error);
    return null;
  }
}

/**
 * Schedule daily notification check
 */
export async function scheduleNotificationCheck(
  preferences: NotificationPreferences
): Promise<string | null> {
  try {
    // Cancel any existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!preferences.enabled) {
      return null;
    }

    // Schedule notification for specified day and time
    const trigger: Notifications.NotificationTriggerInput = {
      type: "daily" as const,
      hour: preferences.reminderHour,
      minute: preferences.reminderMinute,
    } as any;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Fee Collection Reminder",
        body: "Check for unpaid student fees this month",
        data: {
          type: "fee_check_reminder",
        },
        badge: 1,
      },
      trigger,
    });

    return notificationId;
  } catch (error) {
    console.error("Error scheduling notification check:", error);
    return null;
  }
}

/**
 * Add notification to history
 */
export async function addNotificationRecord(
  record: Omit<NotificationRecord, "id" | "sentAt">
): Promise<void> {
  try {
    const history = await getNotificationHistory();

    const newRecord: NotificationRecord = {
      id: `notif_${Date.now()}`,
      sentAt: new Date().toISOString(),
      ...record,
    };

    history.push(newRecord);

    // Keep only last 100 notifications
    const trimmedHistory = history.slice(-100);

    await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error("Error adding notification record:", error);
    throw error;
  }
}

/**
 * Get notification history
 */
export async function getNotificationHistory(): Promise<NotificationRecord[]> {
  try {
    const history = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error("Error reading notification history:", error);
    return [];
  }
}

/**
 * Clear notification history
 */
export async function clearNotificationHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(NOTIFICATION_HISTORY_KEY);
  } catch (error) {
    console.error("Error clearing notification history:", error);
    throw error;
  }
}

/**
 * Send bulk notifications for unpaid fees
 */
export async function sendBulkUnpaidNotifications(
  students: Student[],
  payments: Payment[]
): Promise<number> {
  const unpaidStudents = getUnpaidStudents(students, payments);
  let sentCount = 0;

  for (const { student } of unpaidStudents) {
    const result = await sendUnpaidFeeNotification(student);
    if (result) {
      sentCount++;
    }
  }

  return sentCount;
}

/**
 * Get notification count (for badge)
 */
export async function getNotificationCount(): Promise<number> {
  try {
    const history = await getNotificationHistory();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return history.filter(
      (record) => new Date(record.sentAt) > thirtyDaysAgo
    ).length;
  } catch (error) {
    console.error("Error getting notification count:", error);
    return 0;
  }
}
