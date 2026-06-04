import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useStudents } from "@/lib/student-context";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { AutoSyncService, type SyncStatus } from "@/lib/auto-sync-service";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { exportAsCSV as exportAsCSVFlex, exportAsPDF as exportAsPDFFlex } from "@/lib/flexible-export-service";
import { SupabaseConfigModal } from "@/components/supabase-config-modal";
import { AdvancedExportModal, type ExportOptions } from "@/components/advanced-export-modal";
import { SyncStatusIndicator } from "@/components/sync-status-indicator";
import { updateSyncStatus } from "@/lib/sync-status-service";

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { students, payments, refreshData } = useStudents();
  const [exporting, setExporting] = useState(false);
  const [supabaseModalVisible, setSupabaseModalVisible] = useState(false);
  const [advancedExportVisible, setAdvancedExportVisible] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf" | null>(null);
  const [syncStatusKey, setSyncStatusKey] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    lastSyncTime: null,
    pendingChanges: 0,
    error: null,
  });
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all');

  useEffect(() => {
    const unsubscribe = AutoSyncService.onStatusChange((status) => {
      setSyncStatus(status);
    });

    return () => unsubscribe();
  }, []);

  const {
    unpaidCount,
    filteredPayments,
    filteredPaidCount,
    filteredPendingCount,
    filteredAmount
  } = React.useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const monthPayments = payments.filter(
      (p) => p.month === currentMonth && p.year === currentYear
    );

    const monthCount = monthPayments.length;
    const unpaid = students.length - monthCount;

    const filtered = paymentFilter === 'all'
      ? monthPayments
      : paymentFilter === 'paid'
        ? monthPayments.filter(p => p.paidDate)
        : monthPayments.filter(p => !p.paidDate);

    const paidCount = monthPayments.filter(p => p.paidDate).length;
    const pendingCount = monthPayments.filter(p => !p.paidDate).length;
    const amount = filtered.reduce((sum, p) => sum + p.amount, 0);

    return {
      currentMonthPayments: monthPayments,
      unpaidCount: unpaid,
      filteredPayments: filtered,
      filteredPaidCount: paidCount,
      filteredPendingCount: pendingCount,
      filteredAmount: amount
    };
  }, [payments, students.length, paymentFilter]);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const currentDate = new Date();
      await exportAsCSVFlex(students, payments, currentDate.getMonth(), currentDate.getFullYear());
      Alert.alert("Success", "Current month CSV exported successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to export CSV file");
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const currentDate = new Date();
      await exportAsPDFFlex(students, payments, currentDate.getMonth(), currentDate.getFullYear());
      Alert.alert("Success", "Current month PDF exported successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to export PDF file");
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleAdvancedExport = async (options: ExportOptions) => {
    if (!options.month || !options.year) return;

    try {
      setExporting(true);
      if (options.format === "csv") {
        await exportAsCSVFlex(students, payments, options.month, options.year);
      } else if (options.format === "pdf") {
        await exportAsPDFFlex(students, payments, options.month, options.year);
      }
      Alert.alert("Success", `${options.format.toUpperCase()} exported successfully`);
      setAdvancedExportVisible(false);
      setExportFormat(null);
    } catch (error) {
      Alert.alert("Error", "Failed to export file");
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header with 3-dot Menu and Sync Status */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1">
              <MaterialIcons name="dashboard" size={28} color={colors.primary} style={{ marginRight: 8 }} />
              <View className="flex-1">
                <Text className="text-3xl font-bold text-foreground">Summary</Text>
                <Text className="text-sm text-muted mt-1">App configuration and data management</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setSupabaseModalVisible(true)}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 8,
                padding: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="more-vert" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          {/* Sync Status Indicator */}
          <SyncStatusIndicator
            key={syncStatusKey}
            onPress={() => setSyncStatusKey(syncStatusKey + 1)}
          />
        </View>

        {/* Data Summary */}
        <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-sm font-semibold text-foreground">Data Summary</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setPaymentFilter('all')}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor: paymentFilter === 'all' ? colors.primary : colors.border,
                }}
              >
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: paymentFilter === 'all' ? 'white' : colors.foreground,
                }}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPaymentFilter('paid')}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor: paymentFilter === 'paid' ? colors.success : colors.border,
                }}
              >
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: paymentFilter === 'paid' ? 'white' : colors.foreground,
                }}>Paid</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPaymentFilter('pending')}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor: paymentFilter === 'pending' ? colors.error : colors.border,
                }}
              >
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: paymentFilter === 'pending' ? 'white' : colors.foreground,
                }}>Pending</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View className="flex-row justify-between mb-3">
            <View className="flex-1">
              <Text className="text-xs text-muted mb-1">Total Students</Text>
              <Text className="text-lg font-bold text-foreground">{students.length}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted mb-1">Current Month Payments</Text>
              <Text className="text-lg font-bold text-foreground">{filteredPayments.length}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted mb-1">{paymentFilter === 'all' ? 'Unpaid This Month' : paymentFilter === 'paid' ? 'Paid' : 'Pending'}</Text>
              <Text className={`text-lg font-bold ${paymentFilter === 'paid' ? 'text-success' : paymentFilter === 'pending' ? 'text-error' : 'text-foreground'}`}>
                {paymentFilter === 'all' ? unpaidCount : paymentFilter === 'paid' ? filteredPaidCount : filteredPendingCount}
              </Text>
            </View>
          </View>
          <View className="flex-row justify-between pt-3 border-t border-border mb-3">
            <Text className="text-sm text-muted">Total Amount Collected</Text>
            <Text className="text-sm font-semibold text-success">
              RS{payments.reduce((sum, p) => sum + p.amount, 0)}
            </Text>
          </View>
          <View className="flex-row justify-between pt-3 border-t border-border">
            <Text className="text-sm text-muted">{paymentFilter === 'all' ? 'Current Month Amount' : paymentFilter === 'paid' ? 'Paid Amount' : 'Pending Amount'}</Text>
            <Text className="text-sm font-semibold text-success">
              RS{filteredAmount}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-3">Quick Actions</Text>
          <View className="gap-3">
            <TouchableOpacity
              onPress={() => router.push("../dashboard")}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="analytics" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-3">View Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("../bulk-import")}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="upload-file" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-3">Bulk Import Students</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("../class-analytics")}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="bar-chart" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-3">Class Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Export Section */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-3">Export Data</Text>
          <View className="gap-3">
            <TouchableOpacity
              onPress={handleExportCSV}
              disabled={exporting || students.length === 0}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                opacity: exporting || students.length === 0 ? 0.6 : 1,
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="table-chart" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-3 flex-1">
                {exporting ? "Exporting..." : "Export as CSV"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setExportFormat("csv");
                  setAdvancedExportVisible(true);
                }}
                disabled={exporting || students.length === 0}
              >
                <MaterialIcons name="expand-more" size={20} color="#ffffff" />
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleExportPDF}
              disabled={exporting || students.length === 0}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                opacity: exporting || students.length === 0 ? 0.6 : 1,
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="picture-as-pdf" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-3 flex-1">
                {exporting ? "Exporting..." : "Export as PDF"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setExportFormat("pdf");
                  setAdvancedExportVisible(true);
                }}
                disabled={exporting || students.length === 0}
              >
                <MaterialIcons name="expand-more" size={20} color="#ffffff" />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </View>


      </ScrollView>

      {/* Supabase Config Modal */}
      <SupabaseConfigModal
        visible={supabaseModalVisible}
        onClose={() => setSupabaseModalVisible(false)}
        onConfigured={async () => {
          setSupabaseModalVisible(false);
          refreshData();
          await updateSyncStatus('full');
          setSyncStatusKey(syncStatusKey + 1);
        }}
      />

      {/* Advanced Export Modal */}
      {exportFormat && (
        <AdvancedExportModal
          visible={advancedExportVisible}
          formats={[exportFormat]}
          onExport={handleAdvancedExport}
          onCancel={() => {
            setAdvancedExportVisible(false);
            setExportFormat(null);
          }}
          loading={exporting}
        />
      )}
    </ScreenContainer>
  );
}
