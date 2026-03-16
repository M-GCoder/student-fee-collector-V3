import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import {
  createReminder,
  getReminders,
  updateReminder,
  ReminderConfig,
} from "@/lib/recurring-reminder-service";

export default function AddReminderScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams();
  const reminderId = params.id as string;

  const [reminderDate, setReminderDate] = useState("1");
  const [reminderTime, setReminderTime] = useState("09:00");
  const [frequency, setFrequency] = useState<"weekly" | "bi-weekly" | "monthly">("monthly");
  const [message, setMessage] = useState("Please pay your monthly fee");
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reminderId) {
      loadReminder();
    }
  }, [reminderId]);

  const loadReminder = async () => {
    try {
      const reminders = await getReminders();
      const reminder = reminders.find((r) => r.id === reminderId);
      if (reminder) {
        setReminderDate(reminder.reminderDate.toString());
        setReminderTime(reminder.reminderTime);
        setFrequency(reminder.frequency);
        setMessage(reminder.message);
        setEnabled(reminder.enabled);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load reminder");
    }
  };

  const validateForm = () => {
    const dateNum = parseInt(reminderDate, 10);
    if (dateNum < 1 || dateNum > 31) {
      Alert.alert("Invalid Date", "Please enter a date between 1 and 31");
      return false;
    }
    if (!message.trim()) {
      Alert.alert("Invalid Message", "Please enter a reminder message");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const reminderData = {
        enabled,
        reminderDate: parseInt(reminderDate, 10),
        frequency,
        reminderTime,
        message: message.trim(),
      };

      if (reminderId) {
        await updateReminder(reminderId, reminderData);
        Alert.alert("Success", "Reminder updated successfully");
      } else {
        await createReminder(reminderData);
        Alert.alert("Success", "Reminder created successfully");
      }

      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to save reminder");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="mb-6 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-3xl font-bold text-foreground">
              {reminderId ? "Edit Reminder" : "Create Reminder"}
            </Text>
          </View>
        </View>

        {/* Form */}
        <View className="gap-4 mb-6">
          {/* Reminder Date */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Reminder Date (Day of Month)</Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                backgroundColor: colors.surface,
              }}
            >
              <TextInput
                value={reminderDate}
                onChangeText={setReminderDate}
                placeholder="1-31"
                keyboardType="number-pad"
                maxLength={2}
                style={{
                  color: colors.foreground,
                  paddingVertical: 12,
                  fontSize: 16,
                }}
                placeholderTextColor={colors.muted}
              />
            </View>
            <Text className="text-xs text-muted mt-1">The day of each month when the reminder will trigger</Text>
          </View>

          {/* Reminder Time */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Reminder Time (HH:mm)</Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                backgroundColor: colors.surface,
              }}
            >
              <TextInput
                value={reminderTime}
                onChangeText={setReminderTime}
                placeholder="09:00"
                keyboardType="default"
                maxLength={5}
                style={{
                  color: colors.foreground,
                  paddingVertical: 12,
                  fontSize: 16,
                }}
                placeholderTextColor={colors.muted}
              />
            </View>
            <Text className="text-xs text-muted mt-1">Time in 24-hour format (e.g., 09:00, 14:30)</Text>
          </View>

          {/* Frequency */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Frequency</Text>
            <View className="gap-2">
              {(["weekly", "bi-weekly", "monthly"] as const).map((freq) => (
                <TouchableOpacity
                  key={freq}
                  onPress={() => setFrequency(freq)}
                  style={{
                    borderWidth: frequency === freq ? 2 : 1,
                    borderColor: frequency === freq ? colors.primary : colors.border,
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: frequency === freq ? colors.primary + "20" : colors.surface,
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={{
                      color: frequency === freq ? colors.primary : colors.foreground,
                      fontWeight: frequency === freq ? "600" : "400",
                      textTransform: "capitalize",
                    }}
                  >
                    {freq}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Message */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Reminder Message</Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                backgroundColor: colors.surface,
                minHeight: 100,
              }}
            >
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Enter reminder message"
                multiline
                numberOfLines={4}
                style={{
                  color: colors.foreground,
                  paddingVertical: 12,
                  fontSize: 16,
                  textAlignVertical: "top",
                }}
                placeholderTextColor={colors.muted}
              />
            </View>
            <Text className="text-xs text-muted mt-1">This message will be sent in the notification</Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 8,
            paddingVertical: 14,
            alignItems: "center",
            opacity: loading ? 0.6 : 1,
          }}
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-base">
            {loading ? "Saving..." : reminderId ? "Update Reminder" : "Create Reminder"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
