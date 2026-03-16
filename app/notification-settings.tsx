import { View, Text, TouchableOpacity, ScrollView, Alert, Switch } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  NotificationPreferences,
  scheduleNotificationCheck,
} from "@/lib/notification-service";

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      Alert.alert("Error", "Failed to load notification preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (!preferences) return;

    const updated = { ...preferences, enabled };
    setPreferences(updated);

    try {
      setSaving(true);
      await saveNotificationPreferences(updated);
      if (enabled) {
        await scheduleNotificationCheck(updated);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update notification settings");
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  const handleDayChange = async (day: number) => {
    if (!preferences) return;

    const updated = { ...preferences, reminderDay: day };
    setPreferences(updated);

    try {
      setSaving(true);
      await saveNotificationPreferences(updated);
      await scheduleNotificationCheck(updated);
    } catch (error) {
      Alert.alert("Error", "Failed to update reminder day");
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  const handleHourChange = async (hour: number) => {
    if (!preferences) return;

    const updated = { ...preferences, reminderHour: hour };
    setPreferences(updated);

    try {
      setSaving(true);
      await saveNotificationPreferences(updated);
      await scheduleNotificationCheck(updated);
    } catch (error) {
      Alert.alert("Error", "Failed to update reminder time");
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !preferences) {
    return (
      <ScreenContainer className="p-4 items-center justify-center">
        <Text className="text-muted">Loading...</Text>
      </ScreenContainer>
    );
  }

  const dayOptions = Array.from({ length: 28 }, (_, i) => i + 1);
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="mb-6 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <MaterialIcons name="notifications" size={28} color={colors.primary} style={{ marginRight: 8 }} />
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">Notifications</Text>
            <Text className="text-sm text-muted mt-1">Manage fee reminders</Text>
          </View>
        </View>

        {/* Enable/Disable Toggle */}
        <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">Enable Notifications</Text>
              <Text className="text-xs text-muted mt-1">
                Receive reminders for unpaid student fees
              </Text>
            </View>
            <Switch
              value={preferences.enabled}
              onValueChange={handleToggleNotifications}
              disabled={saving}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={preferences.enabled ? colors.success : colors.muted}
            />
          </View>
        </View>

        {preferences.enabled && (
          <>
            {/* Reminder Day Selection */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-3">
                Reminder Day (Day of Month)
              </Text>
              <View className="bg-surface rounded-lg p-4 border border-border">
                <View className="flex-row flex-wrap gap-2">
                  {dayOptions.map((day) => (
                    <TouchableOpacity
                      key={day}
                      onPress={() => handleDayChange(day)}
                      disabled={saving}
                      style={{
                        backgroundColor:
                          preferences.reminderDay === day ? colors.primary : colors.background,
                        borderWidth: preferences.reminderDay === day ? 0 : 1,
                        borderColor: colors.border,
                        borderRadius: 8,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        minWidth: 40,
                        alignItems: "center",
                        opacity: saving ? 0.6 : 1,
                      }}
                    >
                      <Text
                        style={{
                          color:
                            preferences.reminderDay === day ? "#ffffff" : colors.foreground,
                          fontWeight: "600",
                          fontSize: 12,
                        }}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text className="text-xs text-muted mt-3">
                  Selected: {preferences.reminderDay}th of each month
                </Text>
              </View>
            </View>

            {/* Reminder Hour Selection */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-3">
                Reminder Time (Hour)
              </Text>
              <View className="bg-surface rounded-lg p-4 border border-border">
                <View className="flex-row flex-wrap gap-2">
                  {hourOptions.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      onPress={() => handleHourChange(hour)}
                      disabled={saving}
                      style={{
                        backgroundColor:
                          preferences.reminderHour === hour ? colors.primary : colors.background,
                        borderWidth: preferences.reminderHour === hour ? 0 : 1,
                        borderColor: colors.border,
                        borderRadius: 8,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        minWidth: 45,
                        alignItems: "center",
                        opacity: saving ? 0.6 : 1,
                      }}
                    >
                      <Text
                        style={{
                          color:
                            preferences.reminderHour === hour ? "#ffffff" : colors.foreground,
                          fontWeight: "600",
                          fontSize: 12,
                        }}
                      >
                        {hour.toString().padStart(2, "0")}:00
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text className="text-xs text-muted mt-3">
                  Selected: {preferences.reminderHour.toString().padStart(2, "0")}:00
                </Text>
              </View>
            </View>

            {/* Summary */}
            <View className="bg-primary/10 rounded-lg p-4 border border-primary/20 mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2">Reminder Schedule</Text>
              <Text className="text-sm text-muted">
                You will receive a notification on the {preferences.reminderDay}
                {preferences.reminderDay === 1
                  ? "st"
                  : preferences.reminderDay === 2
                    ? "nd"
                    : preferences.reminderDay === 3
                      ? "rd"
                      : "th"}{" "}
                of each month at {preferences.reminderHour.toString().padStart(2, "0")}:00
              </Text>
            </View>
          </>
        )}

        {!preferences.enabled && (
          <View className="bg-warning/10 rounded-lg p-4 border border-warning/20">
            <Text className="text-sm text-warning font-semibold">Notifications Disabled</Text>
            <Text className="text-xs text-muted mt-2">
              Enable notifications to receive reminders about unpaid student fees.
            </Text>
          </View>
        )}

        {/* Info Section */}
        <View className="bg-surface rounded-lg p-4 border border-border mt-auto">
          <Text className="text-sm font-semibold text-foreground mb-2">About Notifications</Text>
          <Text className="text-xs text-muted">
            Notifications remind you to check for unpaid student fees on your selected day and
            time. You can manually send notifications anytime from the Home screen.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
