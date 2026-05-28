import { useState, useCallback } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
  TextInput,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { Class, Result } from "@/lib/types";
import { ClassService } from "@/lib/class-service";
import { ResultService } from "@/lib/result-service";
import { useFocusEffect } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ResultScreen() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [examName, setExamName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showClassSelector, setShowClassSelector] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

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

      if (loadedClasses.length > 0 && !selectedClassId) {
        setSelectedClassId(loadedClasses[0].id);
      }

      const loadedResults = await ResultService.getLocalResults();
      setResults(loadedResults);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handlePickFile = async () => {
    if (!selectedClassId) {
      Alert.alert("Error", "Please select a class first");
      return;
    }

    if (!examName.trim()) {
      Alert.alert("Error", "Please enter exam name");
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      const fileName = file.name;
      const fileSize = file.size || 0;

      // Validate file size
      if (!ResultService.validateFileSize(fileSize)) {
        Alert.alert(
          "File Too Large",
          `File size is ${(fileSize / 1024 / 1024).toFixed(2)}MB. Maximum allowed is 5MB.`
        );
        return;
      }

      setUploading(true);

      // Upload file
      const uploadedResult = await ResultService.uploadResult(
        selectedClassId,
        examName,
        file.uri,
        fileName,
        fileSize
      );

      // Reload results
      const updatedResults = await ResultService.getLocalResults();
      setResults(updatedResults);

      // Reset form
      setExamName("");
      setShowUploadForm(false);

      Alert.alert("Success", "Result uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResult = (result: Result) => {
    Alert.alert("Delete Result", `Are you sure you want to delete "${result.fileName}"?`, [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await ResultService.deleteResult(result.id, result.classId, result.fileName);
            const updatedResults = await ResultService.getLocalResults();
            setResults(updatedResults);
            Alert.alert("Success", "Result deleted successfully");
          } catch (error) {
            console.error("Error deleting result:", error);
            Alert.alert("Error", "Failed to delete result");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const getSelectedClassName = () => {
    const selectedClass = classes.find((c) => c.id === selectedClassId);
    return selectedClass?.name || "Select Class";
  };

  const filteredResults = selectedClassId
    ? results.filter((r) => r.classId === selectedClassId)
    : [];

  const getTimeAgo = (dateString: string): string => {
    const uploadDate = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - uploadDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return uploadDate.toLocaleDateString();
  };

  const renderResultItem = ({ item }: { item: Result }) => (
    <View className="bg-surface rounded-lg p-4 mb-3 border border-border">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">{item.examName}</Text>
          <Text className="text-sm text-muted mt-1">{item.fileName}</Text>
          <Text className="text-xs text-muted mt-1">
            {(item.fileSize / 1024 / 1024).toFixed(2)}MB • {getTimeAgo(item.uploadedAt)}
          </Text>
        </View>
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => Linking.openURL(item.fileUrl)}
          className="flex-1 bg-primary px-3 py-2 rounded-lg items-center"
        >
          <Text className="text-white text-sm font-semibold">View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteResult(item)}
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
        <Text className="text-2xl font-bold text-foreground mb-6">Results</Text>

        {/* Class Selector */}
        <TouchableOpacity
          onPress={() => setShowClassSelector(true)}
          className="bg-surface border border-border rounded-lg px-4 py-3 mb-6"
        >
          <Text className="text-xs text-muted mb-1">Selected Class</Text>
          <Text className="text-lg font-semibold text-foreground">{getSelectedClassName()}</Text>
        </TouchableOpacity>

        {/* Loading State */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0a7ea4" />
          </View>
        ) : classes.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-lg text-muted text-center">
              No classes available. Create a class first.
            </Text>
          </View>
        ) : (
          <>
            {/* Upload Button */}
            <TouchableOpacity
              onPress={() => setShowUploadForm(true)}
              disabled={uploading}
              className="bg-primary px-4 py-3 rounded-lg items-center mb-6"
            >
              {uploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-semibold">+ Upload Result</Text>
              )}
            </TouchableOpacity>

            {/* Results List */}
            {filteredResults.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-lg text-muted text-center">
                  No results uploaded for this class yet.
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredResults}
                renderItem={renderResultItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </>
        )}
      </View>

      {/* Class Selector Modal */}
      <Modal visible={showClassSelector} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-background rounded-2xl p-6 w-full max-w-sm max-h-96">
            <Text className="text-2xl font-bold text-foreground mb-4">Select Class</Text>

            <FlatList
              data={classes}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedClassId(item.id);
                    setShowClassSelector(false);
                  }}
                  className="border-b border-border py-3"
                >
                  <Text className="text-lg text-foreground">{item.name}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={true}
            />

            <TouchableOpacity
              onPress={() => setShowClassSelector(false)}
              className="bg-border px-4 py-3 rounded-lg items-center mt-4"
            >
              <Text className="text-foreground font-semibold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Upload Form Modal */}
      <Modal visible={showUploadForm} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-background rounded-2xl p-6 w-full max-w-sm">
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-2xl font-bold text-foreground mb-6">Upload Result</Text>

              {/* Class Selector */}
              <Text className="text-sm font-semibold text-foreground mb-2">Class</Text>
              <TouchableOpacity
                onPress={() => setShowClassSelector(true)}
                className="border border-border rounded-lg px-4 py-3 mb-6 flex-row items-center justify-between"
              >
                <Text className="text-foreground font-semibold flex-1">{getSelectedClassName()}</Text>
                <Text className="text-primary">v</Text>
              </TouchableOpacity>

              {/* Exam Name Input */}
              <Text className="text-sm font-semibold text-foreground mb-2">Exam Name</Text>
              <TextInput
                placeholder="e.g., Midterm Exam, Final Test"
                value={examName}
                onChangeText={setExamName}
                className="border border-border rounded-lg px-4 py-3 mb-6 text-foreground"
                placeholderTextColor="#687076"
              />

              {/* File Upload Info */}
              <Text className="text-sm font-semibold text-foreground mb-2">Select File</Text>
              <TouchableOpacity
                onPress={handlePickFile}
                disabled={uploading || !examName.trim()}
                className="border-2 border-dashed border-primary rounded-lg px-4 py-6 items-center mb-6"
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#0a7ea4" />
                ) : (
                  <>
                    <Text className="text-primary font-semibold text-lg">📁</Text>
                    <Text className="text-primary font-semibold mt-2">Choose Image or PDF</Text>
                    <Text className="text-xs text-muted mt-1">Max 5MB</Text>
                  </>
                )}
              </TouchableOpacity>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => {
                    setShowUploadForm(false);
                    setExamName("");
                  }}
                  className="flex-1 bg-border px-4 py-3 rounded-lg items-center"
                >
                  <Text className="text-foreground font-semibold">Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
