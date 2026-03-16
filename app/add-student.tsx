import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useStudents } from "@/lib/student-context";
import { CURRENCY_SYMBOL } from "@/lib/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

export default function AddStudentScreen() {
  const router = useRouter();
  const colors = useColors();
  const { addStudent } = useStudents();

  const [name, setName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [fee, setFee] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddStudent = async () => {
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

    try {
      setLoading(true);
      await addStudent({
        name: name.trim(),
        class: studentClass.trim(),
        monthlyFee: parseFloat(fee),
      });
      Alert.alert("Success", "Student added successfully");
      router.back();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to add student");
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
        </View>

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
