import { useState, useEffect, useCallback } from "react";
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
import { Class } from "@/lib/types";
import { ClassService } from "@/lib/class-service";
import { useFocusEffect } from "expo-router";

export default function ClassScreen() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [className, setClassName] = useState("");

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

  const handleAddClass = async () => {
    if (!className.trim()) {
      Alert.alert("Error", "Please enter a class name");
      return;
    }

    try {
      if (editingClass) {
        // Update existing class
        await ClassService.updateClass(editingClass.id, className);
      } else {
        // Add new class
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
    Alert.alert("Delete Class", `Are you sure you want to delete "${classItem.name}"?`, [
      { text: "Cancel", onPress: () => {} },
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

  const handleCloseModal = () => {
    setShowModal(false);
    setClassName("");
    setEditingClass(null);
  };

  const renderClassItem = ({ item }: { item: Class }) => (
    <View className="bg-surface rounded-lg p-4 mb-3 border border-border flex-row items-center justify-between">
      <View className="flex-1">
        <Text className="text-lg font-semibold text-foreground">{item.name}</Text>
        <Text className="text-xs text-muted mt-1">
          Created {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => handleEditClass(item)}
          className="bg-primary px-3 py-2 rounded-lg"
        >
          <Text className="text-white text-sm font-semibold">Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteClass(item)}
          className="bg-error px-3 py-2 rounded-lg"
        >
          <Text className="text-white text-sm font-semibold">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-foreground">Classes</Text>
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            className="bg-primary px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">+ Add Class</Text>
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0a7ea4" />
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
      </View>

      {/* Add/Edit Modal */}
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
              className="border border-border rounded-lg px-4 py-3 mb-6 text-foreground"
              placeholderTextColor="#687076"
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
                <Text className="text-white font-semibold">
                  {editingClass ? "Update" : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
