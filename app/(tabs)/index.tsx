import { ScrollView, Text, View, TouchableOpacity, FlatList, Alert, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useStudents } from "@/lib/student-context";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Payment, CURRENCY_SYMBOL } from "@/lib/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { getPaymentStatus, getDueDateMessage } from "@/lib/due-date-service";

import { SplashLoader } from "@/components/splash-loader";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { students, payments, loading, error, refreshData } = useStudents();
  const [studentPaymentStatus, setStudentPaymentStatus] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStudents, setFilteredStudents] = useState(students);

  useEffect(() => {
    refreshData();
  }, []);

  // Check if students have paid this month
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const status: Record<string, boolean> = {};
    students.forEach((student) => {
      const paid = payments.some(
        (p) => p.studentId === student.id && p.month === currentMonth && p.year === currentYear
      );
      status[student.id] = paid;
    });
    setStudentPaymentStatus(status);
  }, [students, payments]);

  // Filter students based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStudents(students);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = students.filter(
        (student) =>
          student.name.toLowerCase().includes(query) || student.class.toLowerCase().includes(query)
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  const handleAddStudent = () => {
    router.push("/add-student");
  };

  const handleStudentPress = (studentId: string) => {
    router.push(`/student-detail/${studentId}`);
  };

  const renderStudentItem = ({ item }: { item: (typeof students)[0] }) => {
    const status = getPaymentStatus(item, payments);
    const statusMessage = getDueDateMessage(item, payments);
    
    let statusColor = colors.warning;
    let statusIcon = "schedule";
    
    if (status === "paid") {
      statusColor = colors.success;
      statusIcon = "check-circle";
    } else if (status === "overdue") {
      statusColor = colors.error;
      statusIcon = "error";
    }
    return (
      <TouchableOpacity
        onPress={() => handleStudentPress(item.id)}
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
              {status === "paid" ? "Paid" : status === "overdue" ? "Due" : "Pending"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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

        {/* Error State */}
        {error && (
          <View className="bg-error/10 border border-error rounded-lg p-4 mb-4">
            <Text className="text-error text-sm">{error}</Text>
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
        {!loading && students.length > 0 && filteredStudents.length === 0 && (
          <View className="flex-1 items-center justify-center py-8">
            <MaterialIcons name="search-off" size={48} color={colors.muted} />
            <Text className="text-lg font-semibold text-foreground mt-4">No Results</Text>
            <Text className="text-sm text-muted text-center mt-2">
              No students match "{searchQuery}"
            </Text>
          </View>
        )}

        {/* Student List */}
        {!loading && filteredStudents.length > 0 && (
          <FlatList
            data={filteredStudents}
            renderItem={renderStudentItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        )}

        {/* Add Student Button */}
        <TouchableOpacity
          onPress={handleAddStudent}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 24,
            marginTop: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={24} color="#ffffff" />
          <Text className="text-white font-semibold ml-2">Add Student</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
