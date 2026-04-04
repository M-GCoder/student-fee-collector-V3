import { describe, it, expect, beforeEach, vi } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AutomaticImportService } from "../automatic-import-service";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

describe("AutomaticImportService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isAutoImportEnabled", () => {
    it("should return true when auto import is enabled", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce("true");
      const result = await AutomaticImportService.isAutoImportEnabled();
      expect(result).toBe(true);
    });

    it("should return false when auto import is disabled", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce("false");
      const result = await AutomaticImportService.isAutoImportEnabled();
      expect(result).toBe(false);
    });

    it("should return false when no value is stored", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);
      const result = await AutomaticImportService.isAutoImportEnabled();
      expect(result).toBe(false);
    });

    it("should handle errors gracefully", async () => {
      vi.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error("Storage error"));
      const result = await AutomaticImportService.isAutoImportEnabled();
      expect(result).toBe(false);
    });
  });

  describe("enableAutoImport", () => {
    it("should enable auto import", async () => {
      await AutomaticImportService.enableAutoImport();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("auto_import_enabled", "true");
    });

    it("should throw error if storage fails", async () => {
      vi.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error("Storage error"));
      await expect(AutomaticImportService.enableAutoImport()).rejects.toThrow();
    });
  });

  describe("disableAutoImport", () => {
    it("should disable auto import", async () => {
      await AutomaticImportService.disableAutoImport();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("auto_import_enabled", "false");
    });

    it("should throw error if storage fails", async () => {
      vi.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error("Storage error"));
      await expect(AutomaticImportService.disableAutoImport()).rejects.toThrow();
    });
  });

  describe("getLastImportCheckTime", () => {
    it("should return last import check time", async () => {
      const timestamp = Date.now();
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(timestamp.toString());
      const result = await AutomaticImportService.getLastImportCheckTime();
      expect(result).toBe(timestamp);
    });

    it("should return 0 when no time is stored", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);
      const result = await AutomaticImportService.getLastImportCheckTime();
      expect(result).toBe(0);
    });

    it("should handle errors gracefully", async () => {
      vi.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error("Storage error"));
      const result = await AutomaticImportService.getLastImportCheckTime();
      expect(result).toBe(0);
    });
  });

  describe("updateLastImportCheckTime", () => {
    it("should update last import check time", async () => {
      await AutomaticImportService.updateLastImportCheckTime();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "last_import_check",
        expect.any(String)
      );
    });

    it("should throw error if storage fails", async () => {
      vi.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error("Storage error"));
      await expect(AutomaticImportService.updateLastImportCheckTime()).rejects.toThrow();
    });
  });

  describe("shouldCheckForImport", () => {
    it("should return true if enough time has passed", async () => {
      const oldTime = Date.now() - 60000; // 60 seconds ago
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(oldTime.toString());
      const result = await AutomaticImportService.shouldCheckForImport();
      expect(result).toBe(true);
    });

    it("should return false if not enough time has passed", async () => {
      const recentTime = Date.now() - 5000; // 5 seconds ago
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(recentTime.toString());
      const result = await AutomaticImportService.shouldCheckForImport();
      expect(result).toBe(false);
    });

    it("should return true if no previous check", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);
      const result = await AutomaticImportService.shouldCheckForImport();
      expect(result).toBe(true);
    });

    it("should handle errors gracefully", async () => {
      vi.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error("Storage error"));
      const result = await AutomaticImportService.shouldCheckForImport();
      expect(result).toBe(true); // Returns true on error to trigger import check
    });
  });
});
