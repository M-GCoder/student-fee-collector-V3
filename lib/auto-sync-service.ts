import { OfflineQueueService, QueueItem } from "./offline-queue-service";
import { DynamicSupabaseClient } from "./supabase-dynamic-client";
import NetInfo from "@react-native-community/netinfo";

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

      // Set up periodic sync every 30 seconds
      this.syncInterval = setInterval(() => {
        if (this.currentStatus.isOnline && !this.syncInProgress) {
          this.triggerSync();
        }
      }, 30000);

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

      // Fetch latest data from cloud
      await this.fetchLatestData();

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
   * Fetch latest data from Supabase
   */
  private static async fetchLatestData(): Promise<void> {
    const client = await DynamicSupabaseClient.getClient();
    if (!client) {
      console.log("[AutoSync] Supabase not configured, skipping fetch");
      return;
    }

    try {
      console.log("[AutoSync] Fetching latest data from cloud...");

      // Fetch all data types
      const [students, payments, classes, timetables, testSchedules, results, announcements] =
        await Promise.all([
          client.from("students").select("*"),
          client.from("payments").select("*"),
          client.from("classes").select("*"),
          client.from("timetables").select("*"),
          client.from("test_schedules").select("*"),
          client.from("results").select("*"),
          client.from("announcements").select("*"),
        ]);

      // Emit events or update contexts here
      // This will be handled by the data contexts
    } catch (error) {
      console.error("[AutoSync] Error fetching latest data:", error);
    }
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
}
