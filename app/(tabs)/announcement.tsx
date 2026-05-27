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
  Linking,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { Class, Announcement } from "@/lib/types";
import { ClassService } from "@/lib/class-service";
import { AnnouncementService } from "@/lib/announcement-service";
import { useFocusEffect } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function AnnouncementScreen() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    size: number;
  } | null>(null);
  const [uploading, setUploading] = useState(false);

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const loadedClasses = await ClassService.getLocalClasses();
      setClasses(loadedClasses);

      // Delete expired announcements
      await AnnouncementService.deleteExpiredAnnouncements();

      const loadedAnnouncements = await AnnouncementService.getActiveAnnouncements();
      setAnnouncements(loadedAnnouncements);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExpiryDate(selectedDate);
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      const fileSize = file.size || 0;

      // Validate file size
      if (!AnnouncementService.validateFileSize(fileSize)) {
        Alert.alert(
          "File Too Large",
          `File size is ${(fileSize / 1024 / 1024).toFixed(2)}MB. Maximum allowed is 12MB.`
        );
        return;
      }

      setSelectedFile({
        uri: file.uri,
        name: file.name,
        size: fileSize,
      });
    } catch (error) {
      console.error("Error picking file:", error);
      Alert.alert("Error", "Failed to pick file");
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description");
      return;
    }

    if (expiryDate <= new Date()) {
      Alert.alert("Error", "Expiry date must be in the future");
      return;
    }

    try {
      setUploading(true);

      if (editingAnnouncement) {
        // Update existing announcement
        await AnnouncementService.updateAnnouncement(
          editingAnnouncement.id,
          title,
          description,
          selectedClassId,
          expiryDate.toISOString()
        );
      } else {
        // Create new announcement
        await AnnouncementService.createAnnouncement(
          title,
          description,
          selectedClassId,
          expiryDate.toISOString(),
          selectedFile?.uri,
          selectedFile?.name,
          selectedFile?.size
        );
      }

      // Reload announcements
      await loadData();
      handleCloseModal();
      Alert.alert("Success", editingAnnouncement ? "Announcement updated" : "Announcement created");
    } catch (error) {
      console.error("Error saving announcement:", error);
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to save announcement");
    } finally {
      setUploading(false);
    }
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setTitle(announcement.title);
    setDescription(announcement.description);
    setSelectedClassId(announcement.classId);
    setExpiryDate(new Date(announcement.expiryDate));
    setShowModal(true);
  };

  const handleDeleteAnnouncement = (announcement: Announcement) => {
    Alert.alert("Delete Announcement", `Are you sure you want to delete "${announcement.title}"?`, [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await AnnouncementService.deleteAnnouncement(announcement.id, announcement.fileName);
            await loadData();
            Alert.alert("Success", "Announcement deleted");
          } catch (error) {
            console.error("Error deleting announcement:", error);
            Alert.alert("Error", "Failed to delete announcement");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTitle("");
    setDescription("");
    setSelectedClassId("all");
    setExpiryDate(new Date());
    setSelectedFile(null);
    setEditingAnnouncement(null);
  };

  const getClassNameById = (classId: string) => {
    if (classId === "all") return "All Classes";
    return classes.find((c) => c.id === classId)?.name || "Unknown";
  };

  const getTimeAgo = (dateString: string): string => {
    const createdDate = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return createdDate.toLocaleDateString();
  };

  const renderAnnouncementItem = ({ item }: { item: Announcement }) => (
    <View className="bg-surface rounded-lg p-4 mb-3 border border-border">
      <View className="mb-2">
        <Text className="text-lg font-semibold text-foreground">{item.title}</Text>
        <Text className="text-sm text-muted mt-1">{item.description}</Text>
        <View className="flex-row gap-2 mt-2">
          <Text className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
            {getClassNameById(item.classId)}
          </Text>
          <Text className="text-xs bg-warning/20 text-warning px-2 py-1 rounded">
            Posted {getTimeAgo(item.createdAt)}
          </Text>
          <Text className="text-xs bg-error/20 text-error px-2 py-1 rounded">
            Expires {new Date(item.expiryDate).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {item.fileUrl && (
        <TouchableOpacity
          onPress={() => Linking.openURL(item.fileUrl!)}
          className="bg-primary/10 px-3 py-2 rounded-lg mb-3"
        >
          <Text className="text-primary text-sm font-semibold">📎 {item.fileName}</Text>
        </TouchableOpacity>
      )}

      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => handleEditAnnouncement(item)}
          className="flex-1 bg-primary px-3 py-2 rounded-lg items-center"
        >
          <Text className="text-white text-sm font-semibold">Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteAnnouncement(item)}
          className="flex-1 bg-error px-3 py-2 rounded-lg items-center"
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
          <Text className="text-2xl font-bold text-foreground">Announcements</Text>
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            className="bg-primary px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">+ Create</Text>
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0a7ea4" />
          </View>
        ) : announcements.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-lg text-muted text-center">
              No announcements yet. Create one to get started!
            </Text>
          </View>
        ) : (
          <FlatList
            data={announcements}
            renderItem={renderAnnouncementItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Create/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-background rounded-2xl p-6 w-full max-w-sm max-h-96">
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-2xl font-bold text-foreground mb-4">
                {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
              </Text>

              {/* Title */}
              <Text className="text-sm font-semibold text-foreground mb-2">Title</Text>
              <TextInput
                placeholder="Announcement title"
                value={title}
                onChangeText={setTitle}
                className="border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
                placeholderTextColor="#687076"
              />

              {/* Description */}
              <Text className="text-sm font-semibold text-foreground mb-2">Description</Text>
              <TextInput
                placeholder="Announcement description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                className="border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
                placeholderTextColor="#687076"
              />

              {/* Class Selection */}
              <Text className="text-sm font-semibold text-foreground mb-2">Target Class</Text>
              <View className="border border-border rounded-lg mb-4 overflow-hidden">
                <TouchableOpacity
                  onPress={() => setSelectedClassId("all")}
                  className={`px-4 py-3 ${selectedClassId === "all" ? "bg-primary" : "bg-surface"}`}
                >
                  <Text className={selectedClassId === "all" ? "text-white font-semibold" : "text-foreground"}>
                    All Classes
                  </Text>
                </TouchableOpacity>
                {classes.map((classItem) => (
                  <TouchableOpacity
                    key={classItem.id}
                    onPress={() => setSelectedClassId(classItem.id)}
                    className={`px-4 py-3 border-t border-border ${
                      selectedClassId === classItem.id ? "bg-primary" : "bg-surface"
                    }`}
                  >
                    <Text
                      className={selectedClassId === classItem.id ? "text-white font-semibold" : "text-foreground"}
                    >
                      {classItem.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* File Upload */}
              <Text className="text-sm font-semibold text-foreground mb-2">Attachment (Optional)</Text>
              {selectedFile ? (
                <View className="bg-success/10 border border-success rounded-lg px-4 py-3 mb-4 flex-row items-center justify-between">
                  <Text className="text-success font-semibold flex-1">{selectedFile.name}</Text>
                  <TouchableOpacity onPress={() => setSelectedFile(null)}>
                    <Text className="text-error font-bold">✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handlePickFile}
                  className="border-2 border-dashed border-border rounded-lg px-4 py-6 mb-4 items-center"
                >
                  <Text className="text-muted">📁 Tap to select file (Max 12MB)</Text>
                </TouchableOpacity>
              )}

              {/* Expiry Date */}
              <Text className="text-sm font-semibold text-foreground mb-2">Expiry Date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="border border-border rounded-lg px-4 py-3 mb-4"
              >
                <Text className="text-foreground font-semibold">
                  📅 {expiryDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              {/* Action Buttons */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={handleCloseModal}
                  className="flex-1 bg-border px-4 py-3 rounded-lg items-center"
                >
                  <Text className="text-foreground font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreateAnnouncement}
                  disabled={uploading}
                  className="flex-1 bg-primary px-4 py-3 rounded-lg items-center"
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-semibold">
                      {editingAnnouncement ? "Update" : "Create"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={expiryDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
    </ScreenContainer>
  );
}
