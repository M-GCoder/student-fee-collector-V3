import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';

export interface ReminderConfig {
  id: string;
  enabled: boolean;
  reminderDate: number; // Day of month (1-31)
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  reminderTime: string; // HH:mm format
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderHistory {
  id: string;
  reminderId: string;
  sentAt: string;
  recipientCount: number;
  status: 'sent' | 'failed' | 'pending';
}

const REMINDERS_STORAGE_KEY = 'fee_reminders';
const REMINDER_HISTORY_STORAGE_KEY = 'reminder_history';
const BACKGROUND_TASK_NAME = 'fee-reminder-task';

// Initialize background task
export const initializeBackgroundTask = async () => {
  try {
    // Define the background task
    TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
      try {
        const reminders = await getReminders();
        const enabledReminders = reminders.filter((r) => r.enabled);

        if (enabledReminders.length === 0) {
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        const now = new Date();
        const currentDate = now.getDate();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        for (const reminder of enabledReminders) {
          const [reminderHour, reminderMinute] = reminder.reminderTime.split(':').map(Number);

          // Check if it's time to send the reminder
          if (
            currentDate === reminder.reminderDate &&
            currentHour === reminderHour &&
            currentMinute === reminderMinute
          ) {
            await sendReminderNotification(reminder);
          }
        }

        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('Background task error:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    // Register the background task
    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: 60, // Check every minute
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log('Background task registered successfully');
  } catch (error) {
    console.error('Failed to initialize background task:', error);
  }
};

// Create or update reminder
export const createReminder = async (reminder: Omit<ReminderConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const reminders = await getReminders();
    const newReminder: ReminderConfig = {
      ...reminder,
      id: `reminder_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    reminders.push(newReminder);
    await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));

    return newReminder;
  } catch (error) {
    console.error('Error creating reminder:', error);
    throw error;
  }
};

// Get reminder by ID
export const getReminderById = async (id: string): Promise<ReminderConfig | null> => {
  try {
    const reminders = await getReminders();
    return reminders.find((r) => r.id === id) || null;
  } catch (error) {
    console.error('Error getting reminder by ID:', error);
    return null;
  }
};

// Get all reminders
export const getReminders = async (): Promise<ReminderConfig[]> => {
  try {
    const data = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting reminders:', error);
    return [];
  }
};

// Update reminder
export const updateReminder = async (id: string, updates: Partial<ReminderConfig>) => {
  try {
    const reminders = await getReminders();
    const index = reminders.findIndex((r) => r.id === id);

    if (index === -1) {
      throw new Error('Reminder not found');
    }

    reminders[index] = {
      ...reminders[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
    return reminders[index];
  } catch (error) {
    console.error('Error updating reminder:', error);
    throw error;
  }
};

// Delete reminder
export const deleteReminder = async (id: string) => {
  try {
    const reminders = await getReminders();
    const filtered = reminders.filter((r) => r.id !== id);
    await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting reminder:', error);
    throw error;
  }
};

// Toggle reminder enabled status
export const toggleReminder = async (id: string) => {
  try {
    const reminders = await getReminders();
    const reminder = reminders.find((r) => r.id === id);

    if (!reminder) {
      throw new Error('Reminder not found');
    }

    reminder.enabled = !reminder.enabled;
    reminder.updatedAt = new Date().toISOString();

    await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
    return reminder;
  } catch (error) {
    console.error('Error toggling reminder:', error);
    throw error;
  }
};

// Send reminder notification
export const sendReminderNotification = async (reminder: ReminderConfig, recipientCount: number = 0) => {
  try {
    const notification = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Fee Payment Reminder',
        body: reminder.message,
        data: { reminderId: reminder.id },
      },
      trigger: null, // Send immediately
    });

    // Log to history
    await addReminderHistory({
      id: `history_${Date.now()}`,
      reminderId: reminder.id,
      sentAt: new Date().toISOString(),
      recipientCount,
      status: 'sent',
    });

    return notification;
  } catch (error) {
    console.error('Error sending reminder notification:', error);
    throw error;
  }
};

// Add to reminder history
export const addReminderHistory = async (history: ReminderHistory) => {
  try {
    const allHistory = await getReminderHistory();
    allHistory.push(history);
    await AsyncStorage.setItem(REMINDER_HISTORY_STORAGE_KEY, JSON.stringify(allHistory));
  } catch (error) {
    console.error('Error adding to reminder history:', error);
    throw error;
  }
};

// Get reminder history
export const getReminderHistory = async (): Promise<ReminderHistory[]> => {
  try {
    const data = await AsyncStorage.getItem(REMINDER_HISTORY_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting reminder history:', error);
    return [];
  }
};

// Get reminder history for specific reminder
export const getReminderHistoryForReminder = async (reminderId: string): Promise<ReminderHistory[]> => {
  try {
    const allHistory = await getReminderHistory();
    return allHistory.filter((h) => h.reminderId === reminderId);
  } catch (error) {
    console.error('Error getting reminder history:', error);
    return [];
  }
};

// Clear old reminder history (older than 90 days)
export const clearOldReminderHistory = async () => {
  try {
    const allHistory = await getReminderHistory();
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const filtered = allHistory.filter((h) => new Date(h.sentAt) > ninetyDaysAgo);
    await AsyncStorage.setItem(REMINDER_HISTORY_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error clearing old reminder history:', error);
    throw error;
  }
};

// Format reminder time for display
export const formatReminderTime = (timeString: string): string => {
  const [hour, minute] = timeString.split(':');
  const hourNum = parseInt(hour, 10);
  const period = hourNum >= 12 ? 'PM' : 'AM';
  const displayHour = hourNum % 12 || 12;
  return `${displayHour}:${minute} ${period}`;
};

// Get next reminder trigger date
export const getNextReminderTriggerDate = (reminder: ReminderConfig): Date => {
  const now = new Date();
  const [hour, minute] = reminder.reminderTime.split(':').map(Number);

  let nextDate = new Date(now.getFullYear(), now.getMonth(), reminder.reminderDate);
  nextDate.setHours(hour, minute, 0, 0);

  // If the date has already passed this month, move to next month
  if (nextDate < now) {
    nextDate = new Date(now.getFullYear(), now.getMonth() + 1, reminder.reminderDate);
    nextDate.setHours(hour, minute, 0, 0);
  }

  return nextDate;
};
