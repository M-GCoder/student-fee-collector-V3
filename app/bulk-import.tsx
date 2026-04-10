import { ScrollView, View, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { DragDropFileUpload } from "@/components/drag-drop-file-upload";
import { DuplicateResolutionModal } from "@/components/duplicate-resolution-modal";
import { useRouter } from "expo-router";
import { useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { useStudents } from "@/lib/student-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import {
  pickAndParseXLSFile,
  validateAndProcessStudents,
  generateSampleTemplate,
} from "@/lib/bulk-import-service";

import {
  detectDuplicates,
  processDuplicateResolution,
  type DuplicateStudent,
} from "@/lib/duplicate-detection-service";

export default function BulkImportScreen() {
  const router = useRouter();
  const colors = useColors();
  const { students, addStudent, updateStudent } = useStudents();
  const [loading, setLoading] = useState(false);
  const [importData, setImportData] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [importType, setImportType] = useState<"xls" | "csv" | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateData, setDuplicateData] = useState<{
    duplicates: DuplicateStudent[];
    newStudents: any[];
  } | null>(null);

  const handleSelectXLSFile = async () => {
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
      setImportType("xls");
    } catch (error) {
      Alert.alert("Error", "Failed to read XLS file. Please ensure it has columns: Student Name, Class, Monthly Fee");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCSVFile = async () => {
    try {
      setLoading(true);
      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: "text/csv",
        copyToCacheDirectory: true,
      });

      if (pickerResult.canceled) {
        return;
      }

      const asset = pickerResult.assets[0];
      const fileUri = asset.uri;

      // Read file content
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Parse file using bulk-import-service
      const response = await fetch(fileUri);
      if (!response.ok) {
        throw new Error("Failed to read file");
      }
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const XLSX = require("xlsx");
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheet];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (rawData.length === 0) {
        Alert.alert("Error", "No data found in the file");
        setLoading(false);
        return;
      }

      const processedData = rawData.map((row: any[]) => ({
        column1: row[0] || "",
        column2: row[1] || "",
        column3: row[2] || "",
      }));

      const importResult = validateAndProcessStudents(processedData, students);
      setImportData({
        fileName: asset.name,
        rowCount: processedData.length,
      });
      setImportResult(importResult);
      setImportType("xls");
    } catch (error) {
      Alert.alert("Error", "Failed to read CSV file. Please ensure it has columns: Name, Class, Monthly Fee");
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

      // Check for duplicates
      const duplicateResult = detectDuplicates(importResult.students, students);

      if (duplicateResult.totalDuplicates > 0) {
        // Show duplicate resolution modal
        setDuplicateData({
          duplicates: duplicateResult.duplicates,
          newStudents: duplicateResult.newStudents,
        });
        setShowDuplicateModal(true);
        setLoading(false);
        return;
      }

      // No duplicates, proceed with import
      await proceedWithImport(importResult.students);
    } catch (error) {
      Alert.alert("Error", "Failed to import students");
      console.error(error);
      setLoading(false);
    }
  };

  const proceedWithImport = async (studentsToImport: any[]) => {
    try {
      setLoading(true);

      // Add all students
      for (const student of studentsToImport) {
        await addStudent(student);
      }

      Alert.alert(
        "Import Successful",
        `Successfully imported ${studentsToImport.length} student(s)`,
        [
          {
            text: "OK",
            onPress: () => {
              setImportData(null);
              setImportResult(null);
              setImportType(null);
              setShowDuplicateModal(false);
              setDuplicateData(null);
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

  const handleDuplicateResolution = async (resolvedDuplicates: DuplicateStudent[]) => {
    if (!duplicateData) return;

    try {
      setLoading(true);

      const resolution = processDuplicateResolution(
        {
          newStudents: duplicateData.newStudents,
          duplicates: resolvedDuplicates,
          totalImported: duplicateData.newStudents.length + resolvedDuplicates.length,
          totalDuplicates: resolvedDuplicates.length,
        },
        students
      );

      // Add new students
      for (const student of resolution.studentsToAdd) {
        await addStudent(student);
      }

      // Update existing students with new fees
      for (const student of resolution.studentsToUpdate) {
        await updateStudent(student);
      }

      setShowDuplicateModal(false);
      setDuplicateData(null);

      Alert.alert(
        "Import Complete",
        `Added: ${resolution.summary.added} | Updated: ${resolution.summary.updated} | Skipped: ${resolution.summary.skipped}`,
        [
          {
            text: "OK",
            onPress: () => {
              setImportData(null);
              setImportResult(null);
              setImportType(null);
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to process duplicate resolution");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImportData(null);
    setImportResult(null);
    setImportType(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      await generateSampleTemplate();
      Alert.alert("Success", "Sample template downloaded successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to download template");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragDropFile = async (file: File | null) => {
    if (!file) return;

    try {
      setLoading(true);
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      const fileContent = await file.text();

      if (fileExtension === ".xlsx" || fileExtension === ".xls" || fileExtension === ".csv") {
        // Parse XLS
        const arrayBuffer = await file.arrayBuffer();
        const XLSX = require("xlsx");
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Convert to positional columns
        const startIndex = data.length > 0 && isHeaderRow(data[0]) ? 1 : 0;
        const rows = data.slice(startIndex).map((row: any) => ({
          column1: row[0] || "",
          column2: row[1] || "",
          column3: row[2] || "",
        }));

        const validation = validateAndProcessStudents(rows, students);
        setImportData({
          fileName: file.name,
          rowCount: rows.length,
        });
        setImportResult(validation);
        setImportType("xls");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to read file. Please ensure it has the correct format.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isHeaderRow = (row: any[]): boolean => {
    if (!row || row.length < 3) return false;
    const headerKeywords = [
      "name",
      "student",
      "class",
      "grade",
      "fee",
      "payment",
      "amount",
      "due",
      "date",
      "id",
      "roll",
    ];
    const firstThree = row.slice(0, 3).map((cell) => String(cell).toLowerCase().trim());
    const matchCount = firstThree.filter((cell) =>
      headerKeywords.some((keyword) => cell.includes(keyword))
    ).length;
    return matchCount >= 2;
  };

  return (
    <>
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
              <Text className="text-sm text-muted mt-1">Import students from XLS or CSV file</Text>
            </View>
          </View>

          {!importData ? (
            <>
              {/* Instructions */}
              <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
                <Text className="text-sm font-semibold text-foreground mb-3">How to Import</Text>
                <Text className="text-xs text-muted leading-relaxed">
                  1. Prepare a file (XLS or CSV) with columns: Name, Class, Monthly Fee{"\n"}
                  2. Each row should contain one student{"\n"}
                  3. Select the file to preview and validate{"\n"}
                  4. Review errors (if any) and import valid students{"\n"}
                  5. If duplicates are found, choose to overwrite or skip
                </Text>
              </View>

              {/* Drag-Drop File Upload */}
              <View className="mb-6">
                <DragDropFileUpload
                  onFileSelected={handleDragDropFile}
                  acceptedFormats={[".xlsx", ".xls", ".csv"]}
                  disabled={loading}
                  loading={loading}
                />
              </View>

              {/* Divider */}
              <View className="flex-row items-center mb-6">
                <View className="flex-1 h-px bg-border" />
                <Text className="text-xs text-muted px-3">OR</Text>
                <View className="flex-1 h-px bg-border" />
              </View>

              {/* File Selection - XLS */}
              <TouchableOpacity
                onPress={handleSelectXLSFile}
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

              {/* File Selection - CSV */}
              <TouchableOpacity
                onPress={handleSelectCSVFile}
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
                  marginTop: 12,
                }}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} />
                ) : (
                  <MaterialIcons name="description" size={24} color="#ffffff" />
                )}
                <Text className="text-white font-semibold ml-3">
                  {loading ? "Reading File..." : "Select CSV File"}
                </Text>
              </TouchableOpacity>

              {/* Template Info */}
              <View className="bg-primary/10 rounded-lg p-4 border border-primary/20 mt-6">
                <Text className="text-sm font-semibold text-foreground mb-2">File Format</Text>
                <Text className="text-xs text-muted mb-3">
                  Supported: XLS and CSV files{"\n"}
                  Required columns: Name, Class, Monthly Fee{"\n"}
                  Example: John Doe | 10-A | 5000{"\n"}
                  Note: Only first 3 columns are used
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
                  <Text className="text-sm font-semibold text-foreground ml-2">File Loaded ({importType?.toUpperCase()})</Text>
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

      {/* Duplicate Resolution Modal */}
      {duplicateData && (
        <DuplicateResolutionModal
          visible={showDuplicateModal}
          duplicates={duplicateData.duplicates}
          newStudentCount={duplicateData.newStudents.length}
          onResolved={handleDuplicateResolution}
          onCancel={() => {
            setShowDuplicateModal(false);
            setDuplicateData(null);
          }}
          loading={loading}
        />
      )}
    </>
  );
}
