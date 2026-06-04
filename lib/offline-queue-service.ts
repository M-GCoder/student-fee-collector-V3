import AsyncStorage from "@react-native-async-storage/async-storage";

export type QueueAction = "create" | "update" | "delete";
export type DataType = "student" | "payment" | "class" | "timetable" | "testSchedule" | "result" | "announcement";

export interface QueueItem {
  id: string;
  dataType: DataType;
  action: QueueAction;
  data: any;
  timestamp: number;
  synced: boolean;
}

const QUEUE_STORAGE_KEY = "offline_queue";
const SYNC_LOG_STORAGE_KEY = "sync_log";

export class OfflineQueueService {
  /**
   * Add an item to the offline queue
   */
  static async addToQueue(
    dataType: DataType,
    action: QueueAction,
    data: any
  ): Promise<void> {
    try {
      const queue = await this.getQueue();
      const item: QueueItem = {
        id: `${dataType}_${action}_${Date.now()}_${Math.random()}`,
        dataType,
        action,
        data,
        timestamp: Date.now(),
        synced: false,
      };

      queue.push(item);
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error("Error adding to queue:", error);
      throw error;
    }
  }

  /**
   * Get all pending items from the queue
   */
  static async getQueue(): Promise<QueueItem[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting queue:", error);
      return [];
    }
  }

  /**
   * Get pending items by data type
   */
  static async getQueueByType(dataType: DataType): Promise<QueueItem[]> {
    try {
      const queue = await this.getQueue();
      return queue.filter((item) => item.dataType === dataType && !item.synced);
    } catch (error) {
      console.error("Error getting queue by type:", error);
      return [];
    }
  }

  /**
   * Mark items as synced
   */
  static async markAsSynced(itemIds: string[]): Promise<void> {
    try {
      const queue = await this.getQueue();
      const updated = queue.map((item) =>
        itemIds.includes(item.id) ? { ...item, synced: true } : item
      );
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
      await this.clearSyncedItems(); // Auto-prune synced items
    } catch (error) {
      console.error("Error marking as synced:", error);
      throw error;
    }
  }

  /**
   * Remove synced items from the queue
   */
  static async clearSyncedItems(): Promise<void> {
    try {
      const queue = await this.getQueue();
      const pending = queue.filter((item) => !item.synced);
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(pending));
    } catch (error) {
      console.error("Error clearing synced items:", error);
      throw error;
    }
  }

  /**
   * Clear entire queue (use with caution)
   */
  static async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing queue:", error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  static async getQueueStats(): Promise<{
    total: number;
    pending: number;
    synced: number;
    byType: Record<DataType, number>;
  }> {
    try {
      const queue = await this.getQueue();
      const byType: Record<DataType, number> = {
        student: 0,
        payment: 0,
        class: 0,
        timetable: 0,
        testSchedule: 0,
        result: 0,
        announcement: 0,
      };

      queue.forEach((item) => {
        byType[item.dataType]++;
      });

      return {
        total: queue.length,
        pending: queue.filter((item) => !item.synced).length,
        synced: queue.filter((item) => item.synced).length,
        byType,
      };
    } catch (error) {
      console.error("Error getting queue stats:", error);
      return {
        total: 0,
        pending: 0,
        synced: 0,
        byType: {
          student: 0,
          payment: 0,
          class: 0,
          timetable: 0,
          testSchedule: 0,
          result: 0,
          announcement: 0,
        },
      };
    }
  }

  /**
   * Log sync operation
   */
  static async logSyncOperation(
    success: boolean,
    itemCount: number,
    error?: string
  ): Promise<void> {
    try {
      const logs = await this.getSyncLogs();
      logs.push({
        timestamp: Date.now(),
        success,
        itemCount,
        error,
      });

      // Keep only last 100 sync logs
      const recentLogs = logs.slice(-100);
      await AsyncStorage.setItem(SYNC_LOG_STORAGE_KEY, JSON.stringify(recentLogs));
    } catch (error) {
      console.error("Error logging sync operation:", error);
    }
  }

  /**
   * Get sync logs
   */
  static async getSyncLogs(): Promise<
    Array<{ timestamp: number; success: boolean; itemCount: number; error?: string }>
  > {
    try {
      const data = await AsyncStorage.getItem(SYNC_LOG_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting sync logs:", error);
      return [];
    }
  }

  /**
   * Get last sync timestamp
   */
  static async getLastSyncTime(): Promise<number | null> {
    try {
      const logs = await this.getSyncLogs();
      if (logs.length === 0) return null;
      return logs[logs.length - 1].timestamp;
    } catch (error) {
      console.error("Error getting last sync time:", error);
      return null;
    }
  }
}
