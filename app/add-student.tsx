import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useStudents } from "@/lib/student-context";
import { CURRENCY_SYMBOL } from "@/lib/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function AddStudentScreen() {
  const router = useRouter();
  const colors = useColors();
  const { addStudent } = useStudents();

  const [name, setName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [fee, setFee] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [monthlyDueDate, setMonthlyDueDate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddStudent = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter Student Name");
      return;
    }
    if (!studentClass.trim()) {
      Alert.alert("Error", "Please enter Class/Grade");
      return;
    }
    if (!fee.trim() || isNaN(parseFloat(fee)) || parseFloat(fee) <= 0) {
      Alert.alert("Error", "Please enter a valid Fee amount");
      return;
    }

    try {
      setLoading(true);
      await addStudent({
        name: name.trim(),
        class: studentClass.trim(),
        monthlyFee: parseFloat(fee),
        dueDate: dueDate ? dueDate.toISOString() : undefined,
        monthlyDueDate: monthlyDueDate || undefined,
      });
      Alert.alert("Success", "Student added successfully");
      router.back();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to add student");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDueDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="mb-6 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-bold text-foreground">Add Student</Text>
            <Text className="text-sm text-muted mt-1">Enter student details</Text>
          </View>
        </View>

        {/* Form */}
        <View className="gap-6 mb-8">
          {/* Name Field */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Student Name</Text>
            <TextInput
              placeholder="Enter student name"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 16,
                color: colors.foreground,
              }}
              editable={!loading}
            />
          </View>

          {/* Class Field */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Class/Grade</Text>
            <TextInput
              placeholder="e.g., 10-A, Grade 5"
              placeholderTextColor={colors.muted}
              value={studentClass}
              onChangeText={setStudentClass}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 16,
                color: colors.foreground,
              }}
              editable={!loading}
            />
          </View>

          {/* Fee Field */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Monthly Fee ({CURRENCY_SYMBOL})</Text>
            <TextInput
              placeholder="Enter monthly fee amount"
              placeholderTextColor={colors.muted}
              value={fee}
              onChangeText={setFee}
              keyboardType="decimal-pad"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 16,
                color: colors.foreground,
              }}
              editable={!loading}
            />
          </View>

          {/* Monthly Due Date Field */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Monthly Payment Due Date (Optional)</Text>
            <Text className="text-xs text-muted mb-3">Select the day of month when fees are due every month (1-31)</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <TouchableOpacity
                  key={day}
                  onPress={() => setMonthlyDueDate(monthlyDueDate === day ? null : day)}
                  style={{
                    width: "22%",
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: monthlyDueDate === day ? colors.primary : colors.border,
                    backgroundColor: monthlyDueDate === day ? colors.primary : colors.surface,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: monthlyDueDate === day ? "white" : colors.foreground,
                    }}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {monthlyDueDate && (
              <TouchableOpacity
                onPress={() => setMonthlyDueDate(null)}
                style={{ marginTop: 8 }}
              >
                <Text className="text-xs text-primary">Clear selection</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Buttons */}
        <View className="gap-3 mt-auto">
          <TouchableOpacity
            onPress={handleAddStudent}
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
              {loading ? "Adding..." : "Add Student"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            disabled={loading}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingVertical: 14,
              alignItems: "center",
            }}
            activeOpacity={0.7}
          >
            <Text className="text-foreground font-semibold text-base">Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
