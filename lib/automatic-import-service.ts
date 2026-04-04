import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTO_IMPORT_ENABLED_KEY = "auto_import_enabled";
const LAST_IMPORT_CHECK_KEY = "last_import_check";
const IMPORT_CHECK_INTERVAL = 30000; // Check every 30 seconds

/**
 * Service for managing automatic import preferences and tracking
 */
export const AutomaticImportService = {
  /**
   * Check if automatic import is enabled
   */
  async isAutoImportEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(AUTO_IMPORT_ENABLED_KEY);
      return value === "true";
    } catch (error) {
      console.error("Error checking auto import status:", error);
      return false;
    }
  },

  /**
   * Enable automatic import
   */
  async enableAutoImport(): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTO_IMPORT_ENABLED_KEY, "true");
      console.log("Auto import enabled");
    } catch (error) {
      console.error("Error enabling auto import:", error);
      throw error;
    }
  },

  /**
   * Disable automatic import
   */
  async disableAutoImport(): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTO_IMPORT_ENABLED_KEY, "false");
      console.log("Auto import disabled");
    } catch (error) {
      console.error("Error disabling auto import:", error);
      throw error;
    }
  },

  /**
   * Get last import check time
   */
  async getLastImportCheckTime(): Promise<number> {
    try {
      const value = await AsyncStorage.getItem(LAST_IMPORT_CHECK_KEY);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      console.error("Error getting last import check time:", error);
      return 0;
    }
  },

  /**
   * Update last import check time
   */
  async updateLastImportCheckTime(): Promise<void> {
    try {
      const now = Date.now();
      await AsyncStorage.setItem(LAST_IMPORT_CHECK_KEY, now.toString());
    } catch (error) {
      console.error("Error updating last import check time:", error);
      throw error;
    }
  },

  /**
   * Check if enough time has passed since last import check
   */
  async shouldCheckForImport(): Promise<boolean> {
    try {
      const lastCheck = await this.getLastImportCheckTime();
      const now = Date.now();
      return now - lastCheck > IMPORT_CHECK_INTERVAL;
    } catch (error) {
      console.error("Error checking if should import:", error);
      return false;
    }
  },
};
