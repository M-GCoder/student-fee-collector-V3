import { OfflineQueueService, QueueItem } from "./offline-queue-service";
import { DynamicSupabaseClient } from "./supabase-dynamic-client";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingChanges: number;
  error: string | null;
}

export class AutoSyncService {
  private static syncInProgress = false;
  private static syncInterval: ReturnType<typeof setInterval> | null = null;
  private static networkUnsubscribe: (() => void) | null = null;
  private static statusListeners: Array<(status: SyncStatus) => void> = [];
  private static currentStatus: SyncStatus = {
    isOnline: true,
    isSyncing: false,
    lastSyncTime: null,
    pendingChanges: 0,
    error: null,
  };

  /**
   * Initialize auto-sync service
   */
  static async initialize(): Promise<void> {
    try {
      console.log("[AutoSync] Initializing...");

      // Check initial network state
      const state = await NetInfo.fetch();
      this.currentStatus.isOnline = state.isConnected ?? true;

      // Subscribe to network changes
      this.networkUnsubscribe = NetInfo.addEventListener((state) => {
        const wasOnline = this.currentStatus.isOnline;
        this.currentStatus.isOnline = state.isConnected ?? true;

        console.log(
          `[AutoSync] Network status changed: ${this.currentStatus.isOnline ? "online" : "offline"}`
        );

        // If came back online, trigger sync
        if (!wasOnline && this.currentStatus.isOnline) {
          this.triggerSync();
        }

        this.notifyListeners();
      });

      // Initial sync on app start
      await this.triggerSync();

      // Set up periodic sync every 60 seconds
      this.syncInterval = setInterval(async () => {
        if (this.currentStatus.isOnline && !this.syncInProgress) {
          const queue = await OfflineQueueService.getQueue();
          if (queue.some(item => !item.synced)) {
            this.triggerSync();
          }
        }
      }, 60000);

      console.log("[AutoSync] Initialized successfully");
    } catch (error) {
      console.error("[AutoSync] Initialization error:", error);
      this.currentStatus.error = error instanceof Error ? error.message : "Unknown error";
      this.notifyListeners();
    }
  }

  /**
   * Trigger a sync operation
   */
  static async triggerSync(): Promise<void> {
    if (this.syncInProgress || !this.currentStatus.isOnline) {
      return;
    }

    try {
      this.syncInProgress = true;
      this.currentStatus.isSyncing = true;
      this.currentStatus.error = null;
      this.notifyListeners();

      console.log("[AutoSync] Starting sync...");

      const queue = await OfflineQueueService.getQueue();
      const pendingItems = queue.filter((item) => !item.synced);

      if (pendingItems.length === 0) {
        console.log("[AutoSync] No pending items to sync");
        this.currentStatus.isSyncing = false;
        this.currentStatus.lastSyncTime = Date.now();
        this.notifyListeners();
        return;
      }

      // Sync pending items
      const syncedIds: string[] = [];
      for (const item of pendingItems) {
        try {
          await this.syncItem(item);
          syncedIds.push(item.id);
        } catch (error) {
          console.error(`[AutoSync] Error syncing item ${item.id}:`, error);
        }
      }

      // Mark synced items
      if (syncedIds.length > 0) {
        await OfflineQueueService.markAsSynced(syncedIds);
        await OfflineQueueService.logSyncOperation(true, syncedIds.length);
      }

      this.currentStatus.lastSyncTime = Date.now();
      this.currentStatus.pendingChanges = (await OfflineQueueService.getQueue()).filter(
        (item) => !item.synced
      ).length;

      console.log("[AutoSync] Sync completed successfully");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("[AutoSync] Sync error:", error);
      this.currentStatus.error = errorMsg;
      await OfflineQueueService.logSyncOperation(false, 0, errorMsg);
    } finally {
      this.syncInProgress = false;
      this.currentStatus.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Sync a single queue item to Supabase
   */
  private static async syncItem(item: QueueItem): Promise<void> {
    const client = await DynamicSupabaseClient.getClient();
    if (!client) {
      throw new Error("Supabase not configured");
    }

    const { dataType, action, data } = item;

    switch (dataType) {
      case "student":
      case "payment":
      case "class":
      case "timetable":
      case "testSchedule":
      case "result":
      case "announcement":
        // Use upsert for all operations (create/update)
        const tableName = this.getTableName(dataType);
        const { error } = await client.from(tableName).upsert([data], { onConflict: "id" });
        if (error) throw error;
        break;
      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }
  }

  /**
   * Get table name from data type
   */
  private static getTableName(dataType: string): string {
    const tableMap: Record<string, string> = {
      student: "students",
      payment: "payments",
      class: "classes",
      timetable: "timetables",
      testSchedule: "test_schedules",
      result: "results",
      announcement: "announcements",
    };
    return tableMap[dataType] || dataType;
  }

  /**
   * Subscribe to sync status changes
   */
  static onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.statusListeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Get current sync status
   */
  static getStatus(): SyncStatus {
    return { ...this.currentStatus };
  }

  /**
   * Notify all listeners of status change
   */
  private static notifyListeners(): void {
    this.statusListeners.forEach((listener) => {
      try {
        listener({ ...this.currentStatus });
      } catch (error) {
        console.error("[AutoSync] Error notifying listener:", error);
      }
    });
  }

  /**
   * Cleanup and stop auto-sync
   */
  static cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }

    this.statusListeners = [];
    console.log("[AutoSync] Cleanup completed");
  }

  /**
   * Check if auto-sync is enabled
   */
  static async isAutoSyncEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem("auto_sync_enabled");
      return value === null || value === "true";
    } catch (error) {
      console.error("Error checking auto sync status:", error);
      return true; // Default to enabled on error
    }
  }

  /**
   * Enable auto-sync
   */
  static async enableAutoSync(): Promise<void> {
    try {
      await AsyncStorage.setItem("auto_sync_enabled", "true");
      console.log("Auto sync enabled");
    } catch (error) {
      console.error("Error enabling auto sync:", error);
      throw error;
    }
  }

  /**
   * Disable auto-sync
   */
  static async disableAutoSync(): Promise<void> {
    try {
      await AsyncStorage.setItem("auto_sync_enabled", "false");
      console.log("Auto sync disabled");
    } catch (error) {
      console.error("Error disabling auto sync:", error);
      throw error;
    }
  }

  /**
   * Toggle auto-sync status
   */
  static async toggleAutoSync(): Promise<boolean> {
    try {
      const currentlyEnabled = await this.isAutoSyncEnabled();
      const newStatus = !currentlyEnabled;
      await AsyncStorage.setItem("auto_sync_enabled", newStatus ? "true" : "false");
      return newStatus;
    } catch (error) {
      console.error("Error toggling auto sync:", error);
      throw error;
    }
  }

  /**
   * Get last auto-sync time
   */
  static async getLastAutoSyncTime(): Promise<Date | null> {
    try {
      const value = await AsyncStorage.getItem("last_auto_sync_time");
      return value ? new Date(value) : null;
    } catch (error) {
      console.error("Error getting last auto sync time:", error);
      return null;
    }
  }

  /**
   * Update last auto-sync time to current time
   */
  static async updateLastAutoSyncTime(): Promise<void> {
    try {
      const now = new Date().toISOString();
      await AsyncStorage.setItem("last_auto_sync_time", now);
    } catch (error) {
      console.error("Error updating last auto sync time:", error);
      throw error;
    }
  }

  /**
   * Reset auto-sync settings to default
   */
  static async resetAutoSyncSettings(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(["auto_sync_enabled", "last_auto_sync_time"]);
    } catch (error) {
      console.error("Error resetting auto sync settings:", error);
      throw error;
    }
  }
}
