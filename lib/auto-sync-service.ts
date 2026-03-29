import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Auto-sync preference service for managing automatic sync settings
 */
export class AutoSyncService {
  private static readonly AUTO_SYNC_KEY = "auto_sync_enabled";
  private static readonly LAST_AUTO_SYNC_KEY = "last_auto_sync_time";

  /**
   * Check if auto-sync is enabled
   */
  static async isAutoSyncEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(this.AUTO_SYNC_KEY);
      // Default to true (enabled) if not set
      return value === null ? true : value === "true";
    } catch (error) {
      console.error("Error checking auto-sync setting:", error);
      return true; // Default to enabled on error
    }
  }

  /**
   * Enable auto-sync
   */
  static async enableAutoSync(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.AUTO_SYNC_KEY, "true");
      console.log("Auto-sync enabled");
    } catch (error) {
      console.error("Error enabling auto-sync:", error);
      throw error;
    }
  }

  /**
   * Disable auto-sync
   */
  static async disableAutoSync(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.AUTO_SYNC_KEY, "false");
      console.log("Auto-sync disabled");
    } catch (error) {
      console.error("Error disabling auto-sync:", error);
      throw error;
    }
  }

  /**
   * Toggle auto-sync setting
   */
  static async toggleAutoSync(): Promise<boolean> {
    try {
      const isEnabled = await this.isAutoSyncEnabled();
      if (isEnabled) {
        await this.disableAutoSync();
        return false;
      } else {
        await this.enableAutoSync();
        return true;
      }
    } catch (error) {
      console.error("Error toggling auto-sync:", error);
      throw error;
    }
  }

  /**
   * Get last auto-sync time
   */
  static async getLastAutoSyncTime(): Promise<Date | null> {
    try {
      const value = await AsyncStorage.getItem(this.LAST_AUTO_SYNC_KEY);
      if (!value) {
        return null;
      }
      return new Date(value);
    } catch (error) {
      console.error("Error getting last auto-sync time:", error);
      return null;
    }
  }

  /**
   * Update last auto-sync time
   */
  static async updateLastAutoSyncTime(): Promise<void> {
    try {
      const now = new Date().toISOString();
      await AsyncStorage.setItem(this.LAST_AUTO_SYNC_KEY, now);
      console.log("Updated last auto-sync time:", now);
    } catch (error) {
      console.error("Error updating last auto-sync time:", error);
      throw error;
    }
  }

  /**
   * Reset auto-sync settings to defaults
   */
  static async resetAutoSyncSettings(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.AUTO_SYNC_KEY, this.LAST_AUTO_SYNC_KEY]);
      console.log("Auto-sync settings reset to defaults");
    } catch (error) {
      console.error("Error resetting auto-sync settings:", error);
      throw error;
    }
  }
}
