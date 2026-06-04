import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { Class, Timetable, TestSchedule } from "@/lib/types";
import { ClassService } from "@/lib/class-service";
import { TimetableService } from "@/lib/timetable-service";
import { TestScheduleService } from "@/lib/test-schedule-service";
import { useFocusEffect } from "expo-router";
import React, { useState, useCallback } from "react";
import { useStudents } from "@/lib/student-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import DateTimePicker from "@react-native-community/datetimepicker";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ClassScreen() {
  const colors = useColors();
  const { students } = useStudents();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [className, setClassName] = useState("");
  const [activeTab, setActiveTab] = useState<"classes" | "timetable" | "tests">("classes");
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  // Timetable state
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [timetableDay, setTimetableDay] = useState("Monday");
  const [timetableSubject, setTimetableSubject] = useState("");
  const [timetableStartTime, setTimetableStartTime] = useState("09:00");
  const [timetableEndTime, setTimetableEndTime] = useState("10:00");

  // Test schedule state
  const [testSchedules, setTestSchedules] = useState<TestSchedule[]>([]);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testSubject, setTestSubject] = useState("");
  const [testDate, setTestDate] = useState(new Date());
  const [showTestDatePicker, setShowTestDatePicker] = useState(false);
  const [testStartTime, setTestStartTime] = useState("09:00");
  const [testEndTime, setTestEndTime] = useState("10:00");

  // Load classes when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadClasses();
    }, [])
  );

  const loadClasses = async () => {
    setLoading(true);
    try {
      const loadedClasses = await ClassService.getLocalClasses();
      setClasses(loadedClasses);
    } catch (error) {
      console.error("Error loading classes:", error);
      Alert.alert("Error", "Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  // Memoized student counts
  const studentCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const classItem of classes) {
      counts[classItem.id] = students.filter((s) => s.class === classItem.id).length;
    }
    return counts;
  }, [students, classes]);

  const loadTimetables = async (classItem: Class) => {
    try {
      const loaded = await TimetableService.getTimetablesForClass(classItem.id);
      setTimetables(loaded);
    } catch (error) {
      console.error("Error loading timetables:", error);
    }
  };

  const loadTestSchedules = async (classItem: Class) => {
    try {
      const loaded = await TestScheduleService.getTestSchedulesForClass(classItem.id);
      setTestSchedules(loaded);
    } catch (error) {
      console.error("Error loading test schedules:", error);
    }
  };

  const handleAddClass = async () => {
    if (!className.trim()) {
      Alert.alert("Error", "Please enter a class name");
      return;
    }

    try {
      if (editingClass) {
        await ClassService.updateClass(editingClass.id, className);
      } else {
        await ClassService.addClass(className);
      }
      setClassName("");
      setEditingClass(null);
      setShowModal(false);
      await loadClasses();
    } catch (error) {
      console.error("Error saving class:", error);
      Alert.alert("Error", "Failed to save class");
    }
  };

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem);
    setClassName(classItem.name);
    setShowModal(true);
  };

  const handleDeleteClass = (classItem: Class) => {
    const studentCount = studentCounts[classItem.id] || 0;

    if (studentCount > 0) {
      Alert.alert(
        "Cannot Delete Class",
        `This class has ${studentCount} student${studentCount !== 1 ? 's' : ''} assigned to it. Please remove all students from this class before deleting it.`,
        [{ text: "OK", onPress: () => { } }]
      );
      return;
    }

    Alert.alert("Delete Class", `Are you sure you want to delete "${classItem.name}"?`, [
      { text: "Cancel", onPress: () => { } },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await ClassService.deleteClass(classItem.id);
            await loadClasses();
          } catch (error) {
            console.error("Error deleting class:", error);
            Alert.alert("Error", "Failed to delete class");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleAddTimetable = async () => {
    if (!selectedClass || !timetableSubject.trim()) {
      Alert.alert("Error", "Please enter subject name");
      return;
    }

    try {
      await TimetableService.addTimetable(
        selectedClass.id,
        timetableDay,
        timetableSubject,
        timetableStartTime,
        timetableEndTime
      );
      setTimetableSubject("");
      setTimetableStartTime("09:00");
      setTimetableEndTime("10:00");
      setShowTimetableModal(false);
      await loadTimetables(selectedClass);
    } catch (error) {
      console.error("Error adding timetable:", error);
      Alert.alert("Error", "Failed to add timetable entry");
    }
  };

  const handleDeleteTimetable = (timetable: Timetable) => {
    Alert.alert("Delete Timetable", "Are you sure you want to delete this entry?", [
      { text: "Cancel", onPress: () => { } },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await TimetableService.deleteTimetable(timetable.id);
            if (selectedClass) {
              await loadTimetables(selectedClass);
            }
          } catch (error) {
            console.error("Error deleting timetable:", error);
            Alert.alert("Error", "Failed to delete timetable entry");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleAddTestSchedule = async () => {
    if (!selectedClass || !testSubject.trim()) {
      Alert.alert("Error", "Please enter subject name");
      return;
    }

    try {
      await TestScheduleService.addTestSchedule(
        selectedClass.id,
        testSubject,
        testDate.toISOString(),
        testStartTime,
        testEndTime
      );
      setTestSubject("");
      setTestDate(new Date());
      setTestStartTime("09:00");
      setTestEndTime("10:00");
      setShowTestModal(false);
      await loadTestSchedules(selectedClass);
    } catch (error) {
      console.error("Error adding test schedule:", error);
      Alert.alert("Error", "Failed to add test schedule");
    }
  };

  const handleDeleteTestSchedule = (schedule: TestSchedule) => {
    Alert.alert("Delete Test Schedule", "Are you sure you want to delete this test?", [
      { text: "Cancel", onPress: () => { } },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await TestScheduleService.deleteTestSchedule(schedule.id);
            if (selectedClass) {
              await loadTestSchedules(selectedClass);
            }
          } catch (error) {
            console.error("Error deleting test schedule:", error);
            Alert.alert("Error", "Failed to delete test schedule");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleSelectClass = (classItem: Class) => {
    setSelectedClass(classItem);
    setActiveTab("timetable");
    loadTimetables(classItem);
  };

  const handleSelectClassForTests = (classItem: Class) => {
    setSelectedClass(classItem);
    setActiveTab("tests");
    loadTestSchedules(classItem);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setClassName("");
    setEditingClass(null);
  };

  const renderClassItem = useCallback(({ item }: { item: Class }) => {
    const studentCount = studentCounts[item.id] || 0;
    return (
      <View className="bg-surface rounded-lg p-4 mb-3 border border-border">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-foreground flex-1">{item.name}</Text>
        </View>
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xs text-muted">Created {new Date(item.createdAt).toLocaleDateString()}</Text>
          <Text className="text-xs font-semibold text-primary">Students: {studentCount}</Text>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => handleEditClass(item)}
            className="flex-1 bg-primary px-3 py-2 rounded-lg items-center"
          >
            <Text className="text-white text-sm font-semibold">Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSelectClass(item)}
            className="flex-1 bg-blue-500 px-3 py-2 rounded-lg items-center"
          >
            <Text className="text-white text-sm font-semibold">Timetable</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSelectClassForTests(item)}
            className="flex-1 bg-orange-500 px-3 py-2 rounded-lg items-center"
          >
            <Text className="text-white text-sm font-semibold">Tests</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteClass(item)}
            className="flex-1 bg-error px-3 py-2 rounded-lg items-center"
          >
            <Text className="text-white text-sm font-semibold">Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [studentCounts]);

  const renderTimetableItem = useCallback(({ item }: { item: Timetable }) => (
    <View className="bg-surface rounded-lg p-4 mb-3 border border-border flex-row items-center justify-between">
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground">{item.subject}</Text>
        <Text className="text-sm text-muted mt-1">
          {item.day} • {item.startTime} - {item.endTime}
        </Text>
      </View>
      <TouchableOpacity onPress={() => handleDeleteTimetable(item)} className="bg-error px-3 py-2 rounded-lg">
        <Text className="text-white text-xs font-semibold">Delete</Text>
      </TouchableOpacity>
    </View>
  ), []);

  const renderTestScheduleItem = useCallback(({ item }: { item: TestSchedule }) => (
    <View className="bg-surface rounded-lg p-4 mb-3 border border-border flex-row items-center justify-between">
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground">{item.subject}</Text>
        <Text className="text-sm text-muted mt-1">
          {new Date(item.testDate).toLocaleDateString()} {item.startTime && `• ${item.startTime} - ${item.endTime}`}
        </Text>
      </View>
      <TouchableOpacity onPress={() => handleDeleteTestSchedule(item)} className="bg-error px-3 py-2 rounded-lg">
        <Text className="text-white text-xs font-semibold">Delete</Text>
      </TouchableOpacity>
    </View>
  ), []);

  return (
    <ScreenContainer className="p-4">
      <View className="flex-1">
        {/* Tab Navigation */}
        <View className="flex-row gap-2 mb-6">
          <TouchableOpacity
            onPress={() => setActiveTab("classes")}
            className={`flex-1 py-3 rounded-lg items-center ${activeTab === "classes" ? "bg-primary" : "bg-surface border border-border"}`}
          >
            <Text className={`font-semibold ${activeTab === "classes" ? "text-white" : "text-foreground"}`}>
              Classes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (selectedClass) {
                setActiveTab("timetable");
                loadTimetables(selectedClass);
              } else {
                Alert.alert("Info", "Please select a class first");
              }
            }}
            className={`flex-1 py-3 rounded-lg items-center ${activeTab === "timetable" ? "bg-blue-500" : "bg-surface border border-border"}`}
          >
            <Text className={`font-semibold ${activeTab === "timetable" ? "text-white" : "text-foreground"}`}>
              Timetable
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (selectedClass) {
                setActiveTab("tests");
                loadTestSchedules(selectedClass);
              } else {
                Alert.alert("Info", "Please select a class first");
              }
            }}
            className={`flex-1 py-3 rounded-lg items-center ${activeTab === "tests" ? "bg-orange-500" : "bg-surface border border-border"}`}
          >
            <Text className={`font-semibold ${activeTab === "tests" ? "text-white" : "text-foreground"}`}>Tests</Text>
          </TouchableOpacity>
        </View>

        {/* Classes Tab */}
        {activeTab === "classes" && (
          <>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-bold text-foreground">Classes</Text>
              <TouchableOpacity
                onPress={() => setShowModal(true)}
                className="bg-primary px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-semibold">+ Add</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : classes.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-lg text-muted text-center">No classes yet. Create one to get started!</Text>
              </View>
            ) : (
              <FlatList
                data={classes}
                renderItem={renderClassItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </>
        )}

        {/* Timetable Tab */}
        {activeTab === "timetable" && selectedClass && (
          <>
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-2xl font-bold text-foreground">Timetable</Text>
                <Text className="text-sm text-muted mt-1">{selectedClass.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowTimetableModal(true)}
                className="bg-blue-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-semibold">+ Add</Text>
              </TouchableOpacity>
            </View>

            {timetables.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-lg text-muted text-center">No timetable entries yet</Text>
              </View>
            ) : (
              <FlatList
                data={timetables}
                renderItem={renderTimetableItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </>
        )}

        {/* Test Schedule Tab */}
        {activeTab === "tests" && selectedClass && (
          <>
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-2xl font-bold text-foreground">Test Schedule</Text>
                <Text className="text-sm text-muted mt-1">{selectedClass.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowTestModal(true)}
                className="bg-orange-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-semibold">+ Add</Text>
              </TouchableOpacity>
            </View>

            {testSchedules.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-lg text-muted text-center">No test schedules yet</Text>
              </View>
            ) : (
              <FlatList
                data={testSchedules}
                renderItem={renderTestScheduleItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </>
        )}
      </View>

      {/* Add/Edit Class Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-background rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-2xl font-bold text-foreground mb-4">
              {editingClass ? "Edit Class" : "Add New Class"}
            </Text>

            <TextInput
              placeholder="Enter class name (e.g., Class 10A)"
              value={className}
              onChangeText={setClassName}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 24,
                fontSize: 16,
                color: colors.foreground,
              }}
              placeholderTextColor={colors.muted}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleCloseModal}
                className="flex-1 bg-border px-4 py-3 rounded-lg items-center"
              >
                <Text className="text-foreground font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddClass}
                className="flex-1 bg-primary px-4 py-3 rounded-lg items-center"
              >
                <Text className="text-white font-semibold">{editingClass ? "Update" : "Add"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Timetable Modal */}
      <Modal visible={showTimetableModal} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-background rounded-2xl p-6 w-full max-w-sm max-h-96">
            <ScrollView>
              <Text className="text-2xl font-bold text-foreground mb-4">Add Timetable Entry</Text>

              {/* Day Selector */}
              <Text className="text-sm font-semibold text-foreground mb-2">Day</Text>
              <View className="border border-border rounded-lg mb-4 overflow-hidden">
                {DAYS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setTimetableDay(item)}
                    className={`p-3 border-b border-border ${timetableDay === item ? "bg-primary" : "bg-surface"}`}
                  >
                    <Text className={`${timetableDay === item ? "text-white" : "text-foreground"}`}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Subject Input */}
              <Text className="text-sm font-semibold text-foreground mb-2">Subject</Text>
              <TextInput
                placeholder="Enter subject name"
                value={timetableSubject}
                onChangeText={setTimetableSubject}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 16,
                  fontSize: 16,
                  color: colors.foreground,
                }}
                placeholderTextColor={colors.muted}
              />

              {/* Start Time */}
              <Text className="text-sm font-semibold text-foreground mb-2">Start Time</Text>
              <TextInput
                placeholder="HH:MM"
                value={timetableStartTime}
                onChangeText={setTimetableStartTime}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 16,
                  fontSize: 16,
                  color: colors.foreground,
                }}
                placeholderTextColor={colors.muted}
              />

              {/* End Time */}
              <Text className="text-sm font-semibold text-foreground mb-2">End Time</Text>
              <TextInput
                placeholder="HH:MM"
                value={timetableEndTime}
                onChangeText={setTimetableEndTime}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 16,
                  fontSize: 16,
                  color: colors.foreground,
                }}
                placeholderTextColor={colors.muted}
              />

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setShowTimetableModal(false)}
                  className="flex-1 bg-border px-4 py-3 rounded-lg items-center"
                >
                  <Text className="text-foreground font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddTimetable}
                  className="flex-1 bg-blue-500 px-4 py-3 rounded-lg items-center"
                >
                  <Text className="text-white font-semibold">Add</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Test Schedule Modal */}
      <Modal visible={showTestModal} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-background rounded-2xl p-6 w-full max-w-sm max-h-96">
            <ScrollView>
              <Text className="text-2xl font-bold text-foreground mb-4">Add Test Schedule</Text>

              {/* Subject Input */}
              <Text className="text-sm font-semibold text-foreground mb-2">Subject</Text>
              <TextInput
                placeholder="Enter subject name"
                value={testSubject}
                onChangeText={setTestSubject}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 16,
                  fontSize: 16,
                  color: colors.foreground,
                }}
                placeholderTextColor={colors.muted}
              />

              {/* Test Date */}
              <Text className="text-sm font-semibold text-foreground mb-2">Test Date</Text>
              <TouchableOpacity
                onPress={() => setShowTestDatePicker(true)}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: colors.surface,
                }}
              >
                <Text style={{ fontSize: 16, color: colors.foreground }}>
                  {testDate.toLocaleDateString()}
                </Text>
                <MaterialIcons name="calendar-today" size={20} color={colors.primary} />
              </TouchableOpacity>

              {/* Start Time */}
              <Text className="text-sm font-semibold text-foreground mb-2">Start Time (Optional)</Text>
              <TextInput
                placeholder="HH:MM"
                value={testStartTime}
                onChangeText={setTestStartTime}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 16,
                  fontSize: 16,
                  color: colors.foreground,
                }}
                placeholderTextColor={colors.muted}
              />

              {/* End Time */}
              <Text className="text-sm font-semibold text-foreground mb-2">End Time (Optional)</Text>
              <TextInput
                placeholder="HH:MM"
                value={testEndTime}
                onChangeText={setTestEndTime}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 16,
                  fontSize: 16,
                  color: colors.foreground,
                }}
                placeholderTextColor={colors.muted}
              />

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setShowTestModal(false)}
                  className="flex-1 bg-border px-4 py-3 rounded-lg items-center"
                >
                  <Text className="text-foreground font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddTestSchedule}
                  className="flex-1 bg-orange-500 px-4 py-3 rounded-lg items-center"
                >
                  <Text className="text-white font-semibold">Add</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {showTestDatePicker && (
        <DateTimePicker
          value={testDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            if (selectedDate) {
              setTestDate(selectedDate);
            }
            setShowTestDatePicker(false);
          }}
        />
      )}
    </ScreenContainer>
  );
}
