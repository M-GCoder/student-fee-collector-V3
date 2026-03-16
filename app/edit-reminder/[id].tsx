import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import {
  getReminders,
  updateReminder,
  ReminderConfig,
} from "@/lib/recurring-reminder-service";

export default function EditReminderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const [reminder, setReminder] = useState<ReminderConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [reminderDate, setReminderDate] = useState(1);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [frequency, setFrequency] = useState<"weekly" | "bi-weekly" | "monthly">("monthly");

  useEffect(() => {
    if (id) {
      loadReminder();
    }
  }, [id]);

  const loadReminder = async () => {
    try {
      setLoading(true);
      if (id) {
        const reminders = await getReminders();
        const found = reminders.find((r) => r.id === id);
        if (found) {
          setReminder(found);
          setMessage(found.message);
          setReminderDate(found.reminderDate);
          setReminderTime(found.reminderTime);
          setFrequency(found.frequency);
        }
      }
    } catch (error) {
      console.error("Error loading reminder:", error);
      Alert.alert("Error", "Failed to load reminder");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!message.trim()) {
      Alert.alert("Validation Error", "Please enter a reminder message");
      return;
    }

    if (reminderDate < 1 || reminderDate > 31) {
      Alert.alert("Validation Error", "Reminder date must be between 1 and 31");
      return;
    }

    try {
      if (reminder) {
        await updateReminder(reminder.id, {
          message,
          reminderDate,
          reminderTime,
          frequency,
        });
        Alert.alert("Success", "Reminder updated successfully");
        router.back();
      }
    } catch (error) {
      console.error("Error updating reminder:", error);
      Alert.alert("Error", "Failed to update reminder");
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="p-4 items-center justify-center">
        <MaterialIcons name="schedule" size={48} color={colors.muted} />
        <Text className="text-lg font-semibold text-foreground mt-4">Loading...</Text>
      </ScreenContainer>
    );
  }

  if (!reminder) {
    return (
      <ScreenContainer className="p-4 items-center justify-center">
        <MaterialIcons name="error" size={48} color={colors.error} />
        <Text className="text-lg font-semibold text-foreground mt-4">Reminder not found</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="mb-6 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-3xl font-bold text-foreground">Edit Reminder</Text>
            <Text className="text-sm text-muted mt-1">Update reminder settings</Text>
          </View>
        </View>

        {/* Form Fields */}
        <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
          {/* Message Field */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Reminder Message</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Enter reminder message"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                color: colors.foreground,
                backgroundColor: colors.background,
              }}
            />
          </View>

          {/* Date Field */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Reminder Date (Day of Month)</Text>
            <TextInput
              value={reminderDate.toString()}
              onChangeText={(text) => setReminderDate(parseInt(text) || 1)}
              placeholder="1-31"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                color: colors.foreground,
                backgroundColor: colors.background,
              }}
            />
          </View>

          {/* Time Field */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Reminder Time</Text>
            <TextInput
              value={reminderTime}
              onChangeText={setReminderTime}
              placeholder="HH:MM"
              placeholderTextColor={colors.muted}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                color: colors.foreground,
                backgroundColor: colors.background,
              }}
            />
          </View>

          {/* Frequency Field */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Frequency</Text>
            <View className="flex-row gap-2">
              {(["weekly", "bi-weekly", "monthly"] as const).map((freq) => (
                <TouchableOpacity
                  key={freq}
                  onPress={() => setFrequency(freq)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: frequency === freq ? colors.primary : colors.border,
                    backgroundColor: frequency === freq ? colors.primary : colors.background,
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      color: frequency === freq ? "#ffffff" : colors.foreground,
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
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              flex: 1,
              backgroundColor: colors.border,
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: colors.foreground, fontWeight: "600" }}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            style={{
              flex: 1,
              backgroundColor: colors.primary,
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: "#ffffff", fontWeight: "600" }}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
