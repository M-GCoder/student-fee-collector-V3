import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Sync Status Service
 * Tracks last sync time and connection status for cloud data visibility
 */

export interface SyncStatus {
  lastSyncTime: number | null; // Timestamp in milliseconds
  isConnected: boolean;
  lastSyncType?: 'students' | 'payments' | 'full';
  lastError?: string;
}

const SYNC_STATUS_KEY = '@student_fee_collector/sync_status';

/**
 * Get current sync status
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  try {
    const stored = await AsyncStorage.getItem(SYNC_STATUS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      lastSyncTime: null,
      isConnected: false,
    };
  } catch (error) {
    console.error('Error reading sync status:', error);
    return {
      lastSyncTime: null,
      isConnected: false,
    };
  }
}

/**
 * Update sync status after successful sync
 */
export async function updateSyncStatus(
  syncType: 'students' | 'payments' | 'full' = 'full'
): Promise<void> {
  try {
    const status: SyncStatus = {
      lastSyncTime: Date.now(),
      isConnected: true,
      lastSyncType: syncType,
      lastError: undefined,
    };
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
  } catch (error) {
    console.error('Error updating sync status:', error);
  }
}

/**
 * Update sync status with error
 */
export async function updateSyncError(error: string): Promise<void> {
  try {
    const current = await getSyncStatus();
    const status: SyncStatus = {
      ...current,
      isConnected: false,
      lastError: error,
    };
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
  } catch (err) {
    console.error('Error updating sync error status:', err);
  }
}

/**
 * Clear sync status (when data is cleared)
 */
export async function clearSyncStatus(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SYNC_STATUS_KEY);
  } catch (error) {
    console.error('Error clearing sync status:', error);
  }
}

/**
 * Format last sync time for display
 * Returns human-readable format like "2 minutes ago", "1 hour ago", "Yesterday", etc.
 */
export function formatSyncTime(timestamp: number | null): string {
  if (!timestamp) {
    return 'Never synced';
  }

  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  }
}

/**
 * Get sync status description for UI display
 */
export function getSyncStatusDescription(status: SyncStatus): string {
  if (status.lastError) {
    return `Error: ${status.lastError}`;
  }
  if (!status.isConnected) {
    return 'Not connected';
  }
  if (!status.lastSyncTime) {
    return 'Never synced';
  }
  return `Synced ${formatSyncTime(status.lastSyncTime)}`;
}
