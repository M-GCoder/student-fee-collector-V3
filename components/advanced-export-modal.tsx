import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

export interface ExportOptions {
  format: "csv" | "xls" | "pdf";
  month?: number;
  year?: number;
  useCurrentMonth: boolean;
}

export interface AdvancedExportModalProps {
  visible: boolean;
  onExport: (options: ExportOptions) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  formats: ("csv" | "xls" | "pdf")[];
}

/**
 * Advanced export modal allowing users to select format and optional month/year
 */
export function AdvancedExportModal({
  visible,
  onExport,
  onCancel,
  loading = false,
  formats,
}: AdvancedExportModalProps) {
  const colors = useColors();
  const [selectedFormat, setSelectedFormat] = useState<"csv" | "xls" | "pdf">(formats[0] || "csv");
  const [useCurrentMonth, setUseCurrentMonth] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Generate month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(currentYear, currentMonth - i, 1);
    return {
      month: date.getMonth(),
      year: date.getFullYear(),
      label: date.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    };
  });

  const handleExport = async () => {
    const options: ExportOptions = {
      format: selectedFormat,
      useCurrentMonth,
      ...(useCurrentMonth
        ? { month: currentMonth, year: currentYear }
        : { month: selectedMonth, year: selectedYear }),
    };
    await onExport(options);
  };

  const formatLabel = {
    csv: "CSV",
    xls: "Excel",
    pdf: "PDF",
  };

  const formatIcon: Record<"csv" | "xls" | "pdf", string> = {
    csv: "table-chart",
    xls: "description",
    pdf: "picture-as-pdf",
  };

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
              <MaterialIcons name="download" size={24} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
                Export Data
              </Text>
            </View>
            <TouchableOpacity onPress={onCancel} disabled={loading}>
              <MaterialIcons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 16 }}>
          {/* Format Selection */}
          <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
              Select Format
            </Text>
            <View style={{ gap: 8 }}>
              {formats.map((format) => (
                <TouchableOpacity
                  key={format}
                  onPress={() => setSelectedFormat(format)}
                  disabled={loading}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: selectedFormat === format ? colors.primary + "20" : colors.surface,
                    borderWidth: 1,
                    borderColor: selectedFormat === format ? colors.primary : colors.border,
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: selectedFormat === format ? colors.primary : colors.border,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    {selectedFormat === format && (
                      <MaterialIcons name="check" size={16} color="#ffffff" />
                    )}
                  </View>
                  <MaterialIcons
                    name={formatIcon[format] as any}
                    size={20}
                    color={selectedFormat === format ? colors.primary : colors.foreground}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: selectedFormat === format ? colors.primary : colors.foreground,
                    }}
                  >
                    {formatLabel[format]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date Selection */}
          <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
              Select Period
            </Text>

            {/* Current Month Toggle */}
            <TouchableOpacity
              onPress={() => setUseCurrentMonth(!useCurrentMonth)}
              disabled={loading}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 12,
                opacity: loading ? 0.6 : 1,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: useCurrentMonth ? colors.primary : colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                {useCurrentMonth && <MaterialIcons name="check" size={16} color="#ffffff" />}
              </View>
              <MaterialIcons name="today" size={20} color={colors.foreground} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "500", color: colors.foreground }}>
                  Current Month
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                  {currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Custom Month Selection */}
            {!useCurrentMonth && (
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
                  Select Month
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {monthOptions.map((option, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        setSelectedMonth(option.month);
                        setSelectedYear(option.year);
                      }}
                      disabled={loading}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 6,
                        backgroundColor:
                          selectedMonth === option.month && selectedYear === option.year
                            ? colors.primary
                            : colors.border,
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color:
                            selectedMonth === option.month && selectedYear === option.year
                              ? "#ffffff"
                              : colors.foreground,
                        }}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Info Box */}
          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: colors.primary + "15",
              borderRadius: 8,
              padding: 12,
              borderLeftWidth: 4,
              borderLeftColor: colors.primary,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>
              {useCurrentMonth
                ? `Export will include all students and their payment data for ${currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}.`
                : `Export will include all students and their payment data for ${new Date(selectedYear, selectedMonth, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}.`}
            </Text>
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
            onPress={handleExport}
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
              <MaterialIcons name="download" size={18} color="#ffffff" style={{ marginRight: 6 }} />
            )}
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#ffffff" }}>
              {loading ? "Exporting..." : "Export"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
