import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { useStudents } from "@/lib/student-context";
import { Student, CURRENCY_SYMBOL } from "@/lib/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function EditStudentScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams();
  const { students, updateStudent } = useStudents();

  const [student, setStudent] = useState<Student | null>(null);
  const [name, setName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [fee, setFee] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id && typeof id === "string") {
      const found = students.find((s) => s.id === id);
      if (found) {
        setStudent(found);
        setName(found.name);
        setStudentClass(found.class);
        setFee(found.monthlyFee.toString());
        if (found.dueDate) {
          setDueDate(new Date(found.dueDate));
        }
      }
      setLoading(false);
    }
  }, [id, students]);

  const handleUpdateStudent = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter student name");
      return;
    }
    if (!studentClass.trim()) {
      Alert.alert("Error", "Please enter class/grade");
      return;
    }
    if (!fee.trim() || isNaN(parseFloat(fee)) || parseFloat(fee) <= 0) {
      Alert.alert("Error", "Please enter a valid fee amount");
      return;
    }

    if (!student) {
      Alert.alert("Error", "Student not found");
      return;
    }

    try {
      setSaving(true);
      const updatedStudent: Student = {
        ...student,
        name: name.trim(),
        class: studentClass.trim(),
        monthlyFee: parseFloat(fee),
        dueDate: dueDate ? dueDate.toISOString() : undefined,
      };
      await updateStudent(updatedStudent);
      Alert.alert("Success", "Student updated successfully");
      router.back();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to update student");
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDueDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  if (loading) {
    return (
      <ScreenContainer className="p-4 items-center justify-center">
        <Text className="text-muted">Loading...</Text>
      </ScreenContainer>
    );
  }

  if (!student) {
    return (
      <ScreenContainer className="p-4 items-center justify-center">
        <Text className="text-error">Student not found</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="mb-6 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-bold text-foreground">Edit Student</Text>
            <Text className="text-sm text-muted mt-1">Update student details</Text>
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
              editable={!saving}
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
              editable={!saving}
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
              editable={!saving}
            />
          </View>

          {/* Due Date Field */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Payment Due Date (Optional)</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              disabled={saving}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ fontSize: 16, color: dueDate ? colors.foreground : colors.muted }}>
                {dueDate
                  ? dueDate.toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "Select due date"}
              </Text>
              <MaterialIcons name="calendar-today" size={20} color={colors.primary} />
            </TouchableOpacity>
            {dueDate && (
              <TouchableOpacity
                onPress={() => setDueDate(null)}
                style={{ marginTop: 8 }}
              >
                <Text className="text-xs text-primary">Clear date</Text>
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
          />
        )}

        {/* Buttons */}
        <View className="gap-3 mt-auto">
          <TouchableOpacity
            onPress={handleUpdateStudent}
            disabled={saving}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 8,
              paddingVertical: 14,
              alignItems: "center",
              opacity: saving ? 0.6 : 1,
            }}
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold text-base">
              {saving ? "Updating..." : "Update Student"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            disabled={saving}
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
