import { ScrollView, Text, View, TouchableOpacity, FlatList, Alert, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useStudents } from "@/lib/student-context";
import { useRouter } from "expo-router";
import { useEffect, useState, useMemo, memo, useCallback } from "react";
import { Payment, CURRENCY_SYMBOL } from "@/lib/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { getPaymentStatus, getDueDateMessage } from "@/lib/due-date-service";
import { getMonthlyDueStatusMessage, getMonthlyDueStatusColor } from "@/lib/monthly-due-date-service";

import { SplashLoader } from "@/components/splash-loader";
import { BulkImportModal } from "@/components/bulk-import-modal";
import { importCSV } from "@/lib/csv-import-service";

// Memoized StudentItem component
const StudentItem = memo(({ item, payments, colors, onPress }: { item: any; payments: Payment[]; colors: any; onPress: () => void }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthPayment = payments.find(
    (p) => p.studentId === item.id && p.month === currentMonth && p.year === currentYear
  );

  let statusMessage = getDueDateMessage(item, payments);
  let statusColor = colors.warning;
  let statusIcon = "schedule";
  let statusLabel = "Pending";

  if (item.monthlyDueDate) {
    statusMessage = getMonthlyDueStatusMessage(item.monthlyDueDate, currentMonth, currentYear, currentMonthPayment?.paidDate);
    statusColor = getMonthlyDueStatusColor(item.monthlyDueDate, currentMonth, currentYear, currentMonthPayment?.paidDate);

    if (currentMonthPayment?.paidDate) {
      statusIcon = "check-circle";
      statusLabel = "Paid";
    } else if (statusColor === colors.error) {
      statusIcon = "error";
      statusLabel = "Due";
    } else {
      statusIcon = "schedule";
      statusLabel = "Pending";
    }
  } else {
    const status = getPaymentStatus(item, payments);
    if (status === "paid") {
      statusColor = colors.success;
      statusIcon = "check-circle";
      statusLabel = "Paid";
    } else if (status === "overdue") {
      statusColor = colors.error;
      statusIcon = "error";
      statusLabel = "Due";
    }
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ opacity: 1 }}
      activeOpacity={0.7}
    >
      <View className="bg-surface rounded-lg p-4 mb-3 border border-border flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground">{item.name}</Text>
          <Text className="text-sm text-muted mt-1">
            Class: {item.class} | Fee: {CURRENCY_SYMBOL}{item.monthlyFee}
          </Text>
          <Text className="text-xs mt-2" style={{ color: statusColor }}>
            {statusMessage}
          </Text>
        </View>
        <View className="items-center ml-4">
          <View className="rounded-full p-2" style={{ backgroundColor: statusColor }}>
            <MaterialIcons name={statusIcon as any} size={20} color="#ffffff" />
          </View>
          <Text className="text-xs text-muted mt-1 text-center" style={{ maxWidth: 50 }}>
            {statusLabel}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

StudentItem.displayName = 'StudentItem';

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { students, payments, loading, error, refreshData, addStudent } = useStudents();
  const [searchQuery, setSearchQuery] = useState("");
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [importingBulk, setImportingBulk] = useState(false);



  // Memoized filtered students to avoid unnecessary recalculations
  const filteredStudentsMemo = useMemo(() => {
    if (searchQuery.trim() === "") {
      return students;
    }
    const query = searchQuery.toLowerCase();
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) || student.class.toLowerCase().includes(query)
    );
  }, [searchQuery, students]);

  const handleAddStudent = useCallback(() => {
    router.push("/add-student");
  }, [router]);

  const handleBulkImport = useCallback(
    async (csvContent: string) => {
      try {
        setImportingBulk(true);
        const result = importCSV(csvContent);

        if (result.validRows === 0) {
          throw new Error("No valid students found in CSV");
        }

        // Add all valid students
        for (const student of result.students) {
          await addStudent({
            name: student.name,
            class: student.class,
            monthlyFee: student.monthlyFee,
            email: student.email,
            password: student.password,
            monthlyDueDate: student.monthlyDueDate,
          });
        }

        // Refresh data
        await refreshData();
        setShowBulkImportModal(false);
      } catch (error) {
        throw error;
      } finally {
        setImportingBulk(false);
      }
    },
    [addStudent, refreshData]
  );

  const handleStudentPress = useCallback((studentId: string) => {
    router.push(`/student-detail/${studentId}`);
  }, [router]);

  const renderStudentItem = useCallback((item: (typeof students)[0]) => (
    <StudentItem key={item.id} item={item} payments={payments} colors={colors} onPress={() => handleStudentPress(item.id)} />
  ), [payments, colors, handleStudentPress]);

  if (loading) {
    return <SplashLoader />;
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">Students</Text>
          <Text className="text-sm text-muted mt-1">Manage student fee collection</Text>
        </View>

        {/* Error State */}
        {error && (
          <View className="bg-error rounded-lg p-4 mb-4 border border-error">
            <Text className="text-sm text-white font-semibold">Error: {error}</Text>
            <TouchableOpacity onPress={refreshData} style={{ marginTop: 8 }}>
              <Text className="text-sm text-white underline">Retry</Text>
            </TouchableOpacity>
          </View>
        )}


        {/* Search Bar */}
        <View className="mb-4 flex-row items-center bg-surface rounded-lg border border-border px-3 py-2">
          <MaterialIcons name="search" size={20} color={colors.muted} />
          <TextInput
            placeholder="Search by name or class"
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              marginLeft: 8,
              fontSize: 14,
              color: colors.foreground,
            }}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={{ padding: 4 }}>
              <MaterialIcons name="close" size={20} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Loading State */}
        {loading && (
          <View className="flex-1 items-center justify-center py-8">
            <Text className="text-muted">Loading students...</Text>
          </View>
        )}



        {/* Empty State */}
        {!loading && students.length === 0 && (
          <View className="flex-1 items-center justify-center py-8">
            <MaterialIcons name="school" size={48} color={colors.muted} />
            <Text className="text-lg font-semibold text-foreground mt-4">No Students Yet</Text>
            <Text className="text-sm text-muted text-center mt-2">
              Add your first student to get started
            </Text>
          </View>
        )}

        {/* No Search Results */}
        {!loading && students.length > 0 && filteredStudentsMemo.length === 0 && (
          <View className="flex-1 items-center justify-center py-8">
            <MaterialIcons name="search-off" size={48} color={colors.muted} />
            <Text className="text-lg font-semibold text-foreground mt-4">No Results</Text>
            <Text className="text-sm text-muted text-center mt-2">
              No students match "{searchQuery}"
            </Text>
          </View>
        )}

        {/* Student List */}
        {!loading && filteredStudentsMemo.length > 0 && (
          <View className="flex-1">
            {filteredStudentsMemo.map((item) => renderStudentItem(item))}
          </View>
        )}

        {/* Action Buttons */}
        {!loading && (
          <View style={{ marginTop: 16, gap: 12 }}>
            <TouchableOpacity
              onPress={handleAddStudent}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingVertical: 16,
                paddingHorizontal: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add" size={24} color="#ffffff" />
              <Text className="text-white font-semibold ml-2">Add Student</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowBulkImportModal(true)}
              style={{
                backgroundColor: colors.success,
                borderRadius: 8,
                paddingVertical: 16,
                paddingHorizontal: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="upload-file" size={24} color="#ffffff" />
              <Text className="text-white font-semibold ml-2">Bulk Import CSV</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bulk Import Modal */}
      <BulkImportModal
        visible={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onImport={handleBulkImport}
        loading={importingBulk}
      />
    </ScreenContainer>
  );
}
