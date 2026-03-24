import { describe, it, expect, beforeEach, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSyncStatus,
  updateSyncStatus,
  updateSyncError,
  clearSyncStatus,
  formatSyncTime,
  getSyncStatusDescription,
  type SyncStatus,
} from '../sync-status-service';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe('SyncStatusService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSyncStatus', () => {
    it('should return default status when no data is stored', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);

      const status = await getSyncStatus();

      expect(status).toEqual({
        lastSyncTime: null,
        isConnected: false,
      });
    });

    it('should return stored sync status', async () => {
      const storedStatus: SyncStatus = {
        lastSyncTime: Date.now(),
        isConnected: true,
        lastSyncType: 'full',
      };

      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(storedStatus));

      const status = await getSyncStatus();

      expect(status).toEqual(storedStatus);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('Storage error'));

      const status = await getSyncStatus();

      expect(status).toEqual({
        lastSyncTime: null,
        isConnected: false,
      });
    });
  });

  describe('updateSyncStatus', () => {
    it('should update sync status with current timestamp', async () => {
      const before = Date.now();
      await updateSyncStatus('full');
      const after = Date.now();

      const setItemCall = vi.mocked(AsyncStorage.setItem).mock.calls[0];
      expect(setItemCall[0]).toBe('@student_fee_collector/sync_status');

      const savedStatus = JSON.parse(setItemCall[1] as string);
      expect(savedStatus.lastSyncTime).toBeGreaterThanOrEqual(before);
      expect(savedStatus.lastSyncTime).toBeLessThanOrEqual(after);
      expect(savedStatus.isConnected).toBe(true);
      expect(savedStatus.lastSyncType).toBe('full');
      expect(savedStatus.lastError).toBeUndefined();
    });

    it('should update sync status with different sync types', async () => {
      await updateSyncStatus('students');

      const setItemCall = vi.mocked(AsyncStorage.setItem).mock.calls[0];
      const savedStatus = JSON.parse(setItemCall[1] as string);
      expect(savedStatus.lastSyncType).toBe('students');
    });

    it('should handle storage errors', async () => {
      vi.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('Storage error'));

      await expect(updateSyncStatus('full')).resolves.not.toThrow();
    });
  });

  describe('updateSyncError', () => {
    it('should update sync status with error', async () => {
      const currentStatus: SyncStatus = {
        lastSyncTime: Date.now(),
        isConnected: true,
      };

      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(currentStatus));

      await updateSyncError('Connection failed');

      const setItemCall = vi.mocked(AsyncStorage.setItem).mock.calls[0];
      const savedStatus = JSON.parse(setItemCall[1] as string);
      expect(savedStatus.isConnected).toBe(false);
      expect(savedStatus.lastError).toBe('Connection failed');
      expect(savedStatus.lastSyncTime).toBe(currentStatus.lastSyncTime);
    });
  });

  describe('clearSyncStatus', () => {
    it('should remove sync status from storage', async () => {
      await clearSyncStatus();

      expect(vi.mocked(AsyncStorage.removeItem)).toHaveBeenCalledWith(
        '@student_fee_collector/sync_status'
      );
    });

    it('should handle removal errors', async () => {
      vi.mocked(AsyncStorage.removeItem).mockRejectedValueOnce(new Error('Removal error'));

      await expect(clearSyncStatus()).resolves.not.toThrow();
    });
  });

  describe('formatSyncTime', () => {
    it('should return "Never synced" for null timestamp', () => {
      expect(formatSyncTime(null)).toBe('Never synced');
    });

    it('should return "Just now" for recent timestamps', () => {
      const recentTime = Date.now() - 30 * 1000; // 30 seconds ago
      expect(formatSyncTime(recentTime)).toBe('Just now');
    });

    it('should return minutes ago format', () => {
      const minutesAgo = Date.now() - 5 * 60 * 1000; // 5 minutes ago
      expect(formatSyncTime(minutesAgo)).toBe('5 minutes ago');
    });

    it('should return singular minute ago format', () => {
      const minuteAgo = Date.now() - 1 * 60 * 1000; // 1 minute ago
      expect(formatSyncTime(minuteAgo)).toBe('1 minute ago');
    });

    it('should return hours ago format', () => {
      const hoursAgo = Date.now() - 3 * 60 * 60 * 1000; // 3 hours ago
      expect(formatSyncTime(hoursAgo)).toBe('3 hours ago');
    });

    it('should return "Yesterday" for yesterday', () => {
      const yesterday = Date.now() - 24 * 60 * 60 * 1000; // 1 day ago
      expect(formatSyncTime(yesterday)).toBe('Yesterday');
    });

    it('should return days ago format', () => {
      const daysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000; // 5 days ago
      expect(formatSyncTime(daysAgo)).toBe('5 days ago');
    });

    it('should return date format for older timestamps', () => {
      const oldDate = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago
      const result = formatSyncTime(oldDate);
      expect(result).toMatch(/^\d+ \w+$/); // Should match format like "22 Feb"
    });
  });

  describe('getSyncStatusDescription', () => {
    it('should return error message if error exists', () => {
      const status: SyncStatus = {
        lastSyncTime: Date.now(),
        isConnected: false,
        lastError: 'Network timeout',
      };

      expect(getSyncStatusDescription(status)).toBe('Error: Network timeout');
    });

    it('should return "Not connected" if not connected and no error', () => {
      const status: SyncStatus = {
        lastSyncTime: Date.now(),
        isConnected: false,
      };

      expect(getSyncStatusDescription(status)).toBe('Not connected');
    });

    it('should return "Never synced" if no sync time', () => {
      const status: SyncStatus = {
        lastSyncTime: null,
        isConnected: true,
      };

      expect(getSyncStatusDescription(status)).toBe('Never synced');
    });

    it('should return formatted sync time if connected and synced', () => {
      const recentTime = Date.now() - 5 * 60 * 1000; // 5 minutes ago
      const status: SyncStatus = {
        lastSyncTime: recentTime,
        isConnected: true,
      };

      expect(getSyncStatusDescription(status)).toBe('Synced 5 minutes ago');
    });
  });
});
