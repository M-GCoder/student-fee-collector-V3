import { describe, it, expect, beforeEach, vi } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AutoSyncService } from "../auto-sync-service";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    multiRemove: vi.fn(),
  },
}));

describe("AutoSyncService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isAutoSyncEnabled", () => {
    it("should return true by default if not set", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
      const result = await AutoSyncService.isAutoSyncEnabled();
      expect(result).toBe(true);
    });

    it("should return true if explicitly enabled", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue("true");
      const result = await AutoSyncService.isAutoSyncEnabled();
      expect(result).toBe(true);
    });

    it("should return false if explicitly disabled", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue("false");
      const result = await AutoSyncService.isAutoSyncEnabled();
      expect(result).toBe(false);
    });

    it("should handle storage errors gracefully", async () => {
      vi.mocked(AsyncStorage.getItem).mockRejectedValue(new Error("Storage error"));
      const result = await AutoSyncService.isAutoSyncEnabled();
      expect(result).toBe(true); // Default to enabled on error
    });
  });

  describe("enableAutoSync", () => {
    it("should set auto-sync to enabled", async () => {
      vi.mocked(AsyncStorage.setItem).mockResolvedValue(undefined);
      await AutoSyncService.enableAutoSync();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("auto_sync_enabled", "true");
    });

    it("should handle storage errors", async () => {
      vi.mocked(AsyncStorage.setItem).mockRejectedValue(new Error("Storage error"));
      await expect(AutoSyncService.enableAutoSync()).rejects.toThrow("Storage error");
    });
  });

  describe("disableAutoSync", () => {
    it("should set auto-sync to disabled", async () => {
      vi.mocked(AsyncStorage.setItem).mockResolvedValue(undefined);
      await AutoSyncService.disableAutoSync();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("auto_sync_enabled", "false");
    });

    it("should handle storage errors", async () => {
      vi.mocked(AsyncStorage.setItem).mockRejectedValue(new Error("Storage error"));
      await expect(AutoSyncService.disableAutoSync()).rejects.toThrow("Storage error");
    });
  });

  describe("toggleAutoSync", () => {
    it("should disable if currently enabled", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue("true");
      vi.mocked(AsyncStorage.setItem).mockResolvedValue(undefined);
      const result = await AutoSyncService.toggleAutoSync();
      expect(result).toBe(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("auto_sync_enabled", "false");
    });

    it("should enable if currently disabled", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue("false");
      vi.mocked(AsyncStorage.setItem).mockResolvedValue(undefined);
      const result = await AutoSyncService.toggleAutoSync();
      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("auto_sync_enabled", "true");
    });

    it("should enable if not set (default)", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
      vi.mocked(AsyncStorage.setItem).mockResolvedValue(undefined);
      const result = await AutoSyncService.toggleAutoSync();
      expect(result).toBe(false); // Was enabled by default, so toggle makes it false
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("auto_sync_enabled", "false");
    });
  });

  describe("getLastAutoSyncTime", () => {
    it("should return null if not set", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
      const result = await AutoSyncService.getLastAutoSyncTime();
      expect(result).toBeNull();
    });

    it("should return parsed date if set", async () => {
      const testDate = new Date("2026-03-29T22:00:00Z").toISOString();
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(testDate);
      const result = await AutoSyncService.getLastAutoSyncTime();
      expect(result).toEqual(new Date(testDate));
    });

    it("should handle storage errors gracefully", async () => {
      vi.mocked(AsyncStorage.getItem).mockRejectedValue(new Error("Storage error"));
      const result = await AutoSyncService.getLastAutoSyncTime();
      expect(result).toBeNull();
    });
  });

  describe("updateLastAutoSyncTime", () => {
    it("should update last sync time to current time", async () => {
      vi.mocked(AsyncStorage.setItem).mockResolvedValue(undefined);
      const beforeCall = new Date();
      await AutoSyncService.updateLastAutoSyncTime();
      const afterCall = new Date();

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const [key, value] = vi.mocked(AsyncStorage.setItem).mock.calls[0];
      expect(key).toBe("last_auto_sync_time");

      const storedDate = new Date(value as string);
      expect(storedDate.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(storedDate.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });

    it("should handle storage errors", async () => {
      vi.mocked(AsyncStorage.setItem).mockRejectedValue(new Error("Storage error"));
      await expect(AutoSyncService.updateLastAutoSyncTime()).rejects.toThrow(
        "Storage error"
      );
    });
  });

  describe("resetAutoSyncSettings", () => {
    it("should remove both auto-sync keys", async () => {
      vi.mocked(AsyncStorage.multiRemove).mockResolvedValue(undefined);
      await AutoSyncService.resetAutoSyncSettings();
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        "auto_sync_enabled",
        "last_auto_sync_time",
      ]);
    });

    it("should handle storage errors", async () => {
      vi.mocked(AsyncStorage.multiRemove).mockRejectedValue(new Error("Storage error"));
      await expect(AutoSyncService.resetAutoSyncSettings()).rejects.toThrow(
        "Storage error"
      );
    });
  });
});
