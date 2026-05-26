import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { useStudents } from "@/lib/student-context";
import { Student, CURRENCY_SYMBOL, Class } from "@/lib/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ClassService } from "@/lib/class-service";

export default function EditStudentScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams();
  const { students, updateStudent } = useStudents();

  const [student, setStudent] = useState<Student | null>(null);
  const [name, setName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [studentClassId, setStudentClassId] = useState("");
  const [fee, setFee] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [monthlyDueDate, setMonthlyDueDate] = useState<Date | null>(null);
  const [showMonthlyDatePicker, setShowMonthlyDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [showClassModal, setShowClassModal] = useState(false);

  useEffect(() => {
    loadClasses();
    if (id && typeof id === "string") {
      const found = students.find((s) => s.id === id);
      if (found) {
        setStudent(found);
        setName(found.name);
        setStudentClass(found.class);
        setFee(found.monthlyFee.toString());
        setEmail(found.email || "");
        setPassword(found.password || "");
        if (found.monthlyDueDate) {
          const date = new Date();
          date.setDate(found.monthlyDueDate);
          setMonthlyDueDate(date);
        }
      }
      setLoading(false);
    }
  }, [id, students]);

  const loadClasses = async () => {
    try {
      const loadedClasses = await ClassService.getLocalClasses();
      setClasses(loadedClasses);
    } catch (error) {
      console.error("Error loading classes:", error);
    }
  };

  const handleUpdateStudent = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter student name");
      return;
    }
    if (!studentClass.trim()) {
      Alert.alert("Error", "Please select a class");
      return;
    }
    if (!fee.trim() || isNaN(parseFloat(fee)) || parseFloat(fee) <= 0) {
      Alert.alert("Error", "Please enter a valid fee amount");
      return;
    }
    if (email.trim() && !isValidEmail(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }
    if (password.trim() && password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
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
        email: email.trim() || undefined,
        password: password.trim() || undefined,
        monthlyDueDate: monthlyDueDate ? monthlyDueDate.getDate() : undefined,
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

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDueDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  const handleMonthlyDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setMonthlyDueDate(selectedDate);
    }
    setShowMonthlyDatePicker(false);
  };

  const handleSelectClass = (classItem: Class) => {
    setStudentClass(classItem.name);
    setStudentClassId(classItem.id);
    setShowClassModal(false);
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
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

        {/* Class Field - Dropdown */}
        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">Class/Grade</Text>
          <TouchableOpacity
            onPress={() => setShowClassModal(true)}
            disabled={saving || classes.length === 0}
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
              opacity: saving || classes.length === 0 ? 0.6 : 1,
            }}
          >
            <Text style={{ fontSize: 16, color: studentClass ? colors.foreground : colors.muted }}>
              {studentClass || "Select a class"}
            </Text>
            <MaterialIcons name="expand-more" size={20} color={colors.primary} />
          </TouchableOpacity>
          {classes.length === 0 && (
            <Text className="text-xs text-error mt-1">
              No classes available. Create a class in the Class tab first.
            </Text>
          )}
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

        {/* Email Field */}
        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">Email (Optional)</Text>
          <TextInput
            placeholder="Enter student email"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
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

        {/* Password Field */}
        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">Password (Optional)</Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: 12,
            }}
          >
            <TextInput
              placeholder="Enter student password"
              placeholderTextColor={colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              style={{
                flex: 1,
                paddingVertical: 10,
                fontSize: 16,
                color: colors.foreground,
              }}
              editable={!saving}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 8 }}>
              <MaterialIcons
                name={showPassword ? "visibility" : "visibility-off"}
                size={20}
                color={colors.muted}
              />
            </TouchableOpacity>
          </View>
          {password && password.length < 6 && (
            <Text className="text-xs text-error mt-1">Password must be at least 6 characters</Text>
          )}
        </View>

        {/* Monthly Due Date Field */}
        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">Monthly Payment Due Date (Optional)</Text>
          <TouchableOpacity
            onPress={() => setShowMonthlyDatePicker(true)}
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
            <Text style={{ fontSize: 16, color: monthlyDueDate ? colors.foreground : colors.muted }}>
              {monthlyDueDate
                ? monthlyDueDate.toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "Select due date"}
            </Text>
            <MaterialIcons name="calendar-today" size={20} color={colors.primary} />
          </TouchableOpacity>
          {monthlyDueDate && (
            <TouchableOpacity onPress={() => setMonthlyDueDate(null)} style={{ marginTop: 8 }}>
              <Text className="text-xs text-primary">Clear date</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

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

      {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {showMonthlyDatePicker && (
        <DateTimePicker
          value={monthlyDueDate || new Date()}
          mode="date"
          display="default"
          onChange={handleMonthlyDateChange}
        />
      )}

      {/* Class Selection Modal */}
      <Modal visible={showClassModal} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-background rounded-2xl p-6 w-full max-w-sm max-h-96">
            <Text className="text-2xl font-bold text-foreground mb-4">Select Class</Text>

            {classes.length === 0 ? (
              <View className="items-center justify-center py-8">
                <Text className="text-muted text-center">No classes available. Create one first.</Text>
              </View>
            ) : (
              <FlatList
                data={classes}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelectClass(item)}
                    className="border-b border-border py-3"
                  >
                    <Text className="text-lg text-foreground">{item.name}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                scrollEnabled={true}
              />
            )}

            <TouchableOpacity
              onPress={() => setShowClassModal(false)}
              className="bg-border px-4 py-3 rounded-lg items-center mt-4"
            >
              <Text className="text-foreground font-semibold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
