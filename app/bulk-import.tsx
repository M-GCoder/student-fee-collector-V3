import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { useStudents } from "@/lib/student-context";
import {
  pickAndParseXLSFile,
  validateAndProcessStudents,
  formatImportErrors,
  downloadSampleTemplate,
} from "@/lib/bulk-import-service";

export default function BulkImportScreen() {
  const router = useRouter();
  const colors = useColors();
  const { students, addStudent } = useStudents();
  const [loading, setLoading] = useState(false);
  const [importData, setImportData] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);

  const handleSelectFile = async () => {
    try {
      setLoading(true);
      const result = await pickAndParseXLSFile();

      if (!result) {
        return;
      }

      // Validate and process
      const validation = validateAndProcessStudents(result.data, students);
      setImportData({
        fileName: result.fileName,
        rowCount: result.data.length,
      });
      setImportResult(validation);
    } catch (error) {
      Alert.alert("Error", "Failed to read XLS file. Please ensure it has columns: Student Name, Class, Monthly Fee");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportStudents = async () => {
    if (!importResult || importResult.students.length === 0) {
      Alert.alert("No Valid Students", "No valid students to import");
      return;
    }

    try {
      setLoading(true);

      // Add all valid students
      for (const student of importResult.students) {
        await addStudent(student);
      }

      Alert.alert(
        "Import Successful",
        `Successfully imported ${importResult.success} student(s)${
          importResult.failed > 0 ? ` (${importResult.failed} failed)` : ""
        }`,
        [
          {
            text: "OK",
            onPress: () => {
              setImportData(null);
              setImportResult(null);
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to import students");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImportData(null);
    setImportResult(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      await downloadSampleTemplate();
      Alert.alert("Success", "Sample template downloaded successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to download template");
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
          <MaterialIcons name="upload-file" size={28} color={colors.primary} style={{ marginRight: 8 }} />
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">Bulk Import</Text>
            <Text className="text-sm text-muted mt-1">Import students from XLS file</Text>
          </View>
        </View>

        {!importData ? (
          <>
            {/* Instructions */}
            <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
              <Text className="text-sm font-semibold text-foreground mb-3">How to Import</Text>
              <Text className="text-xs text-muted leading-relaxed">
                1. Prepare an XLS file with columns: Student Name, Class, Monthly Fee{"\n"}
                2. Each row should contain one student{"\n"}
                3. Select the file to preview and validate{"\n"}
                4. Review errors (if any) and import valid students
              </Text>
            </View>

            {/* File Selection */}
            <TouchableOpacity
              onPress={handleSelectFile}
              disabled={loading}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingVertical: 16,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                opacity: loading ? 0.6 : 1,
              }}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} />
              ) : (
                <MaterialIcons name="file-upload" size={24} color="#ffffff" />
              )}
              <Text className="text-white font-semibold ml-3">
                {loading ? "Reading File..." : "Select XLS File"}
              </Text>
            </TouchableOpacity>

            {/* Template Info */}
            <View className="bg-primary/10 rounded-lg p-4 border border-primary/20 mt-6">
              <Text className="text-sm font-semibold text-foreground mb-2">File Format</Text>
              <Text className="text-xs text-muted mb-3">
                Required columns: Student Name, Class, Monthly Fee{"\n"}
                Example: John Doe | 10-A | 5000
              </Text>
              <TouchableOpacity
                onPress={handleDownloadTemplate}
                disabled={loading}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 6,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: loading ? 0.6 : 1,
                }}
                activeOpacity={0.8}
              >
                <MaterialIcons name="download" size={16} color="#ffffff" />
                <Text className="text-white font-semibold text-xs ml-2">Download Template</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* File Info */}
            <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
              <View className="flex-row items-center mb-3">
                <MaterialIcons name="check-circle" size={20} color={colors.success} />
                <Text className="text-sm font-semibold text-foreground ml-2">File Loaded</Text>
              </View>
              <Text className="text-xs text-muted mb-2">
                <Text className="font-semibold">File:</Text> {importData.fileName}
              </Text>
              <Text className="text-xs text-muted">
                <Text className="font-semibold">Rows:</Text> {importData.rowCount}
              </Text>
            </View>

            {/* Import Results */}
            <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
              <Text className="text-sm font-semibold text-foreground mb-4">Import Summary</Text>
              <View className="flex-row justify-between mb-3">
                <View className="flex-1">
                  <Text className="text-xs text-muted mb-1">Valid Students</Text>
                  <Text className="text-lg font-bold text-success">{importResult.success}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted mb-1">Errors</Text>
                  <Text className="text-lg font-bold text-error">{importResult.failed}</Text>
                </View>
              </View>
            </View>

            {/* Error List */}
            {importResult.errors.length > 0 && (
              <View className="bg-error/10 rounded-lg p-4 mb-6 border border-error/20">
                <Text className="text-sm font-semibold text-error mb-3">Import Errors</Text>
                {importResult.errors.map((err: any, idx: number) => (
                  <View key={idx} className="mb-2">
                    <Text className="text-xs text-error font-semibold">
                      Row {err.row} ({err.name})
                    </Text>
                    <Text className="text-xs text-error/80">{err.error}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Preview */}
            {importResult.students.length > 0 && (
              <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
                <Text className="text-sm font-semibold text-foreground mb-3">Preview</Text>
                {importResult.students.slice(0, 3).map((student: any, idx: number) => (
                  <View key={idx} className="mb-2 pb-2 border-b border-border">
                    <Text className="text-xs font-semibold text-foreground">{student.name}</Text>
                    <Text className="text-xs text-muted">
                      Class: {student.class} | Fee: RS{student.monthlyFee}
                    </Text>
                  </View>
                ))}
                {importResult.students.length > 3 && (
                  <Text className="text-xs text-muted mt-2">
                    ... and {importResult.students.length - 3} more
                  </Text>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View className="gap-3 mb-6">
              {importResult.students.length > 0 && (
                <TouchableOpacity
                  onPress={handleImportStudents}
                  disabled={loading}
                  style={{
                    backgroundColor: colors.success,
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: loading ? 0.6 : 1,
                  }}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} />
                  ) : (
                    <MaterialIcons name="done-all" size={20} color="#ffffff" />
                  )}
                  <Text className="text-white font-semibold ml-2">
                    {loading ? "Importing..." : `Import ${importResult.students.length} Student(s)`}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleReset}
                disabled={loading}
                style={{
                  backgroundColor: colors.border,
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: loading ? 0.6 : 1,
                }}
                activeOpacity={0.8}
              >
                <MaterialIcons name="refresh" size={20} color={colors.foreground} />
                <Text className="text-foreground font-semibold ml-2">Select Another File</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
