import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';
import { getSyncStatus, getSyncStatusDescription, type SyncStatus } from '@/lib/sync-status-service';

export interface SyncStatusIndicatorProps {
  onPress?: () => void;
  refreshInterval?: number; // milliseconds, default 5000
}

/**
 * Sync Status Indicator Component
 * Shows green/red dot with last sync time and connection status
 */
export function SyncStatusIndicator({ onPress, refreshInterval = 5000 }: SyncStatusIndicatorProps) {
  const colors = useColors();
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Load sync status on mount and refresh periodically
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const currentStatus = await getSyncStatus();
        setStatus(currentStatus);
      } catch (error) {
        console.error('Error loading sync status:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStatus();

    // Set up interval to refresh status
    const interval = setInterval(loadStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading || !status) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 6,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 6 }} />
        <Text style={{ fontSize: 12, color: colors.muted }}>Loading...</Text>
      </TouchableOpacity>
    );
  }

  const statusColor = status.isConnected ? colors.success : colors.error;
  const statusIcon = status.isConnected ? 'cloud-done' : 'cloud-off';
  const statusDescription = getSyncStatusDescription(status);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
      activeOpacity={0.7}
    >
      {/* Status Dot */}
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: statusColor,
          marginRight: 6,
        }}
      />

      {/* Status Icon */}
      <MaterialIcons
        name={statusIcon as any}
        size={14}
        color={statusColor}
        style={{ marginRight: 4 }}
      />

      {/* Status Text */}
      <Text
        style={{
          fontSize: 11,
          color: colors.muted,
          fontWeight: '500',
        }}
        numberOfLines={1}
      >
        {statusDescription}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * Sync Status Badge Component
 * Compact version for display in headers
 */
export function SyncStatusBadge({ onPress }: { onPress?: () => void }) {
  const colors = useColors();
  const [status, setStatus] = useState<SyncStatus | null>(null);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const currentStatus = await getSyncStatus();
        setStatus(currentStatus);
      } catch (error) {
        console.error('Error loading sync status:', error);
      }
    };

    loadStatus();

    // Refresh every 10 seconds
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  const statusColor = status.isConnected ? colors.success : colors.error;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: statusColor,
        borderWidth: 2,
        borderColor: colors.background,
      }}
      activeOpacity={0.7}
    />
  );
}
