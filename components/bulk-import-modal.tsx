import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { importCSV, generateSampleCSV, formatImportResult } from "@/lib/csv-import-service";

interface BulkImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImport: (csvContent: string) => Promise<void>;
  loading?: boolean;
}

export function BulkImportModal({
  visible,
  onClose,
  onImport,
  loading = false,
}: BulkImportModalProps) {
  const colors = useColors();
  const [csvContent, setCSVContent] = useState("");
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/csv",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
        setCSVContent(fileContent);
        setPreview(true);
      }
    } catch (error) {
      Alert.alert("Error", `Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handlePreview = () => {
    if (!csvContent.trim()) {
      Alert.alert("Error", "Please select a CSV file or paste content");
      return;
    }

    const result = importCSV(csvContent);
    setImportResult(result);
    setPreview(true);
  };

  const handleImportConfirm = async () => {
    try {
      setImporting(true);
      await onImport(csvContent);
      Alert.alert("Success", "Students imported successfully!");
      setCSVContent("");
      setImportResult(null);
      setPreview(false);
      onClose();
    } catch (error) {
      Alert.alert("Error", `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadSample = async () => {
    try {
      const sampleCSV = generateSampleCSV();
      const fileName = "sample_students.csv";
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, sampleCSV);
      Alert.alert(
        "Success",
        `Sample CSV downloaded to: ${filePath}\n\nYou can now download it from your device.`
      );
    } catch (error) {
      Alert.alert("Error", `Failed to create sample: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            marginTop: 60,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="upload-file" size={28} color={colors.primary} />
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: colors.foreground,
                  marginLeft: 8,
                }}
              >
                Bulk Import Students
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={importing}>
              <MaterialIcons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              padding: 16,
            }}
          >
            {!preview ? (
              <>
                {/* Instructions */}
                <View
                  style={{
                    backgroundColor: colors.primary + "20",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: colors.primary + "40",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: colors.primary,
                      marginBottom: 8,
                    }}
                  >
                    ℹ️ CSV Format
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.muted,
                      lineHeight: 18,
                    }}
                  >
                    Required columns: Name, Class, Fee, Email, Password{"\n"}
                    Optional columns: Monthly Due Date (1-31){"\n\n"}
                    Example:{"\n"}
                    John Doe, 10-A, 5000, john@example.com, password123
                  </Text>
                </View>

                {/* File Upload Buttons */}
                <TouchableOpacity
                  onPress={handlePickFile}
                  disabled={importing}
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                    opacity: importing ? 0.6 : 1,
                  }}
                >
                  <MaterialIcons name="folder-open" size={20} color="#ffffff" />
                  <Text style={{ color: "#ffffff", fontWeight: "600", marginLeft: 8 }}>
                    Select CSV File
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDownloadSample}
                  disabled={importing}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                    marginBottom: 16,
                    opacity: importing ? 0.6 : 1,
                  }}
                >
                  <MaterialIcons name="download" size={20} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: "600", marginLeft: 8 }}>
                    Download Sample CSV
                  </Text>
                </TouchableOpacity>

                {/* Or Divider */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginVertical: 16,
                  }}
                >
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                  <Text style={{ marginHorizontal: 8, color: colors.muted, fontSize: 12 }}>
                    OR
                  </Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                </View>

                {/* Paste CSV Content */}
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
                  Paste CSV Content
                </Text>
                <TextInput
                  multiline
                  numberOfLines={8}
                  placeholder="Paste your CSV content here..."
                  value={csvContent}
                  onChangeText={setCSVContent}
                  editable={!importing}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.foreground,
                    fontFamily: "monospace",
                    fontSize: 11,
                    marginBottom: 16,
                  }}
                  placeholderTextColor={colors.muted}
                />

                {/* Preview Button */}
                <TouchableOpacity
                  onPress={handlePreview}
                  disabled={!csvContent.trim() || importing}
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: !csvContent.trim() || importing ? 0.6 : 1,
                  }}
                >
                  {importing ? (
                    <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} />
                  ) : (
                    <MaterialIcons name="preview" size={20} color="#ffffff" />
                  )}
                  <Text style={{ color: "#ffffff", fontWeight: "600", marginLeft: 8 }}>
                    Preview & Validate
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Preview Results */}
                {importResult && (
                  <>
                    <View
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <View style={{ flexDirection: "row", marginBottom: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12, color: colors.muted }}>Total Rows</Text>
                          <Text
                            style={{
                              fontSize: 18,
                              fontWeight: "bold",
                              color: colors.foreground,
                            }}
                          >
                            {importResult.totalRows}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12, color: colors.muted }}>Valid</Text>
                          <Text
                            style={{
                              fontSize: 18,
                              fontWeight: "bold",
                              color: colors.success,
                            }}
                          >
                            {importResult.validRows}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12, color: colors.muted }}>Invalid</Text>
                          <Text
                            style={{
                              fontSize: 18,
                              fontWeight: "bold",
                              color: importResult.invalidRows > 0 ? colors.error : colors.success,
                            }}
                          >
                            {importResult.invalidRows}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Errors */}
                    {importResult.errors.length > 0 && (
                      <View
                        style={{
                          backgroundColor: colors.error + "20",
                          borderRadius: 8,
                          padding: 12,
                          marginBottom: 16,
                          borderWidth: 1,
                          borderColor: colors.error + "40",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: colors.error,
                            marginBottom: 8,
                          }}
                        >
                          ⚠️ Errors Found
                        </Text>
                        {importResult.errors.slice(0, 5).map((error: any, index: number) => (
                          <Text
                            key={index}
                            style={{
                              fontSize: 11,
                              color: colors.error,
                              marginBottom: 4,
                            }}
                          >
                            • {error.error}
                          </Text>
                        ))}
                        {importResult.errors.length > 5 && (
                          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>
                            ... and {importResult.errors.length - 5} more errors
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Sample Data */}
                    {importResult.students.length > 0 && (
                      <View
                        style={{
                          backgroundColor: colors.surface,
                          borderRadius: 8,
                          padding: 12,
                          marginBottom: 16,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: colors.foreground,
                            marginBottom: 8,
                          }}
                        >
                          Sample Data (First 3 rows)
                        </Text>
                        {importResult.students.slice(0, 3).map((student: any, index: number) => (
                          <View
                            key={index}
                            style={{
                              backgroundColor: colors.background,
                              borderRadius: 6,
                              padding: 8,
                              marginBottom: 8,
                            }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.foreground }}>
                              {student.name}
                            </Text>
                            <Text style={{ fontSize: 10, color: colors.muted }}>
                              Class: {student.class} | Fee: {student.monthlyFee}
                            </Text>
                            {student.email && (
                              <Text style={{ fontSize: 10, color: colors.muted }}>
                                Email: {student.email}
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                )}

                {/* Action Buttons */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setPreview(false);
                      setImportResult(null);
                    }}
                    disabled={importing}
                    style={{
                      flex: 1,
                      backgroundColor: colors.surface,
                      borderRadius: 8,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                      opacity: importing ? 0.6 : 1,
                    }}
                  >
                    <Text style={{ color: colors.foreground, fontWeight: "600" }}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleImportConfirm}
                    disabled={!importResult || importResult.validRows === 0 || importing}
                    style={{
                      flex: 1,
                      backgroundColor: colors.success,
                      borderRadius: 8,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity:
                        !importResult || importResult.validRows === 0 || importing ? 0.6 : 1,
                    }}
                  >
                    {importing ? (
                      <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} />
                    ) : (
                      <MaterialIcons name="check-circle" size={20} color="#ffffff" />
                    )}
                    <Text style={{ color: "#ffffff", fontWeight: "600", marginLeft: 8 }}>
                      Import ({importResult?.validRows || 0})
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
