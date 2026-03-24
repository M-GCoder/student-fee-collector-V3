import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { DuplicateStudent } from "@/lib/duplicate-detection-service";

export interface DuplicateResolutionModalProps {
  visible: boolean;
  duplicates: DuplicateStudent[];
  newStudentCount: number;
  onResolved: (duplicates: DuplicateStudent[]) => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Modal for resolving duplicate students during import
 * Shows each duplicate and allows user to choose: Skip or Overwrite
 */
export function DuplicateResolutionModal({
  visible,
  duplicates,
  newStudentCount,
  onResolved,
  onCancel,
  loading = false,
}: DuplicateResolutionModalProps) {
  const colors = useColors();
  const [resolutions, setResolutions] = useState<Map<string, "skip" | "overwrite">>(
    new Map(duplicates.map((d) => [`${d.existingStudent.id}`, "skip"]))
  );

  const handleToggleResolution = (studentId: string) => {
    const current = resolutions.get(studentId) || "skip";
    const newResolution = current === "skip" ? "overwrite" : "skip";
    setResolutions(new Map(resolutions).set(studentId, newResolution));
  };

  const handleResolve = () => {
    const updatedDuplicates = duplicates.map((dup) => ({
      ...dup,
      action: resolutions.get(dup.existingStudent.id) || "skip",
    }));
    onResolved(updatedDuplicates);
  };

  const overwriteCount = Array.from(resolutions.values()).filter((v) => v === "overwrite").length;
  const skipCount = duplicates.length - overwriteCount;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: colors.surface,
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingTop: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <MaterialIcons name="info" size={24} color={colors.warning} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
                Duplicate Students Found
              </Text>
            </View>
            <TouchableOpacity onPress={onCancel} disabled={loading}>
              <MaterialIcons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 8 }}>
            {newStudentCount} new students | {duplicates.length} duplicates found
          </Text>
        </View>

        {/* Content */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 12 }}>
          {/* Summary */}
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <View
              style={{
                backgroundColor: colors.primary + "15",
                borderRadius: 8,
                padding: 12,
                borderLeftWidth: 4,
                borderLeftColor: colors.primary,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
                Choose an action for each duplicate:
              </Text>
              <Text style={{ fontSize: 12, color: colors.foreground, fontWeight: "500" }}>
                • <Text style={{ color: colors.success }}>Overwrite</Text>: Update fee, keep payment history
              </Text>
              <Text style={{ fontSize: 12, color: colors.foreground, fontWeight: "500", marginTop: 4 }}>
                • <Text style={{ color: colors.muted }}>Skip</Text>: Keep existing student, ignore import
              </Text>
            </View>
          </View>

          {/* Duplicates List */}
          {duplicates.map((duplicate, idx) => {
            const action = resolutions.get(duplicate.existingStudent.id) || "skip";
            const isOverwrite = action === "overwrite";

            return (
              <View
                key={idx}
                style={{
                  marginHorizontal: 16,
                  marginBottom: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: isOverwrite ? colors.success : colors.border,
                  backgroundColor: isOverwrite ? colors.success + "10" : colors.surface,
                  overflow: "hidden",
                }}
              >
                {/* Student Info */}
                <View style={{ padding: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: colors.primary,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#ffffff" }}>
                        {duplicate.importedStudent.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                        {duplicate.importedStudent.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.muted }}>
                        Class: {duplicate.importedStudent.class}
                      </Text>
                    </View>
                  </View>

                  {/* Fee Comparison */}
                  <View
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 6,
                      padding: 8,
                      marginBottom: 12,
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={{ fontSize: 11, color: colors.muted }}>Current Fee</Text>
                      <Text style={{ fontSize: 11, color: colors.muted }}>New Fee</Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>
                        RS{duplicate.existingStudent.monthlyFee}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <MaterialIcons name="arrow-forward" size={16} color={colors.muted} />
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: colors.primary,
                            marginLeft: 8,
                          }}
                        >
                          RS{duplicate.importedStudent.monthlyFee}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => handleToggleResolution(duplicate.existingStudent.id)}
                      disabled={loading}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 6,
                        backgroundColor: isOverwrite ? colors.success : colors.border,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      <MaterialIcons
                        name={isOverwrite ? "check-circle" : "radio-button-unchecked"}
                        size={16}
                        color={isOverwrite ? "#ffffff" : colors.foreground}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: isOverwrite ? "#ffffff" : colors.foreground,
                        }}
                      >
                        Overwrite
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleToggleResolution(duplicate.existingStudent.id)}
                      disabled={loading}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 6,
                        backgroundColor: !isOverwrite ? colors.error + "20" : colors.background,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        borderWidth: !isOverwrite ? 1 : 0,
                        borderColor: colors.error,
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      <MaterialIcons
                        name={!isOverwrite ? "check-circle" : "radio-button-unchecked"}
                        size={16}
                        color={!isOverwrite ? colors.error : colors.foreground}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: !isOverwrite ? colors.error : colors.foreground,
                        }}
                      >
                        Skip
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}

          {/* Summary Footer */}
          <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 24 }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
                Import Summary
              </Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View>
                  <Text style={{ fontSize: 11, color: colors.muted }}>New Students</Text>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.success }}>{newStudentCount}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 11, color: colors.muted }}>Will Overwrite</Text>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>{overwriteCount}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 11, color: colors.muted }}>Will Skip</Text>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.muted }}>{skipCount}</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer Buttons */}
        <View
          style={{
            flexDirection: "row",
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingBottom: 24,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <TouchableOpacity
            onPress={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: colors.border,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              opacity: loading ? 0.6 : 1,
            }}
          >
            <MaterialIcons name="close" size={18} color={colors.foreground} style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResolve}
            disabled={loading}
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: colors.primary,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" style={{ marginRight: 6 }} />
            ) : (
              <MaterialIcons name="done" size={18} color="#ffffff" style={{ marginRight: 6 }} />
            )}
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#ffffff" }}>
              {loading ? "Processing..." : "Proceed with Import"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
