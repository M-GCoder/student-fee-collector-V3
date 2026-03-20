import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { useStudents } from "@/lib/student-context";
import { Student, Payment, MONTH_SHORT, CURRENCY_SYMBOL } from "@/lib/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { getPaymentStatus, getDueDateMessage, formatDueDate } from "@/lib/due-date-service";
import { getMonthlyDueStatusMessage, getMonthlyDueStatusColor, formatMonthlyDueDate } from "@/lib/monthly-due-date-service";

export default function StudentDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams();
  const { students, payments, addPayment, deletePayment, deleteStudent } = useStudents();

  const [student, setStudent] = useState<Student | null>(null);
  const [studentPayments, setStudentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && typeof id === "string") {
      const found = students.find((s) => s.id === id);
      setStudent(found || null);
      const studentPay = payments.filter((p) => p.studentId === id);
      setStudentPayments(studentPay);
      setLoading(false);
    }
  }, [id, students, payments]);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Calculate current month payments
  const currentMonthPayments = studentPayments.filter(
    (p) => p.month === currentMonth && p.year === currentYear
  ).length;

  const handleMarkPayment = async (month: number) => {
    if (!student) return;

    const existingPayment = studentPayments.find((p) => p.month === month && p.year === currentYear);

    if (existingPayment) {
      Alert.alert(
        "Remove Payment",
        `Remove payment for ${MONTH_SHORT[month]}?`,
        [
          { text: "Cancel", onPress: () => {}, style: "cancel" },
          {
            text: "Remove",
            onPress: async () => {
              try {
                await deletePayment(existingPayment.id);
              } catch (error) {
                Alert.alert("Error", "Failed to remove payment");
              }
            },
            style: "destructive",
          },
        ]
      );
    } else {
      try {
        await addPayment(student.id, month, currentYear);
      } catch (error) {
        Alert.alert("Error", "Failed to mark payment");
      }
    }
  };

  const handleDeleteStudent = () => {
    Alert.alert(
      "Delete Student",
      `Are you sure you want to delete ${student?.name}? This will also remove all payment records.`,
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              if (student) {
                await deleteStudent(student.id);
                router.back();
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete student");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleViewHistory = () => {
    if (student) {
      router.push(`/payment-history/${student.id}`);
    }
  };

  const handleEditStudent = () => {
    if (student) {
      router.push(`/edit-student/${student.id}`);
    }
  };

  if (loading || !student) {
    return (
      <ScreenContainer className="p-4 items-center justify-center">
        <Text className="text-muted">Loading...</Text>
      </ScreenContainer>
    );
  }

  // Split months into two rows (6 months each)
  const firstRow = MONTH_SHORT.slice(0, 6);
  const secondRow = MONTH_SHORT.slice(6, 12);

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="mb-6 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">{student.name}</Text>
            <Text className="text-sm text-muted mt-1">Class: {student.class}</Text>
          </View>
        </View>

        {/* Student Info Card */}
        <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm text-muted">Monthly Fee</Text>
            <Text className="text-lg font-bold text-foreground">{CURRENCY_SYMBOL}{student.monthlyFee}</Text>
          </View>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm text-muted">Year</Text>
            <Text className="text-lg font-bold text-foreground">{currentYear}</Text>
          </View>
          
          {/* Due Date and Status */}
          <View className="pt-3 border-t border-border">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-muted">Payment Status</Text>
              <View className="flex-row items-center">
                {getPaymentStatus(student, studentPayments) === "overdue" ? (
                  <>
                    <MaterialIcons name="error" size={18} color={colors.error} style={{ marginRight: 6 }} />
                    <Text className="text-sm font-semibold" style={{ color: colors.error }}>
                      {getDueDateMessage(student, studentPayments)}
                    </Text>
                  </>
                ) : getPaymentStatus(student, studentPayments) === "paid" ? (
                  <>
                    <MaterialIcons name="check-circle" size={18} color={colors.success} style={{ marginRight: 6 }} />
                    <Text className="text-sm font-semibold" style={{ color: colors.success }}>Paid</Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="schedule" size={18} color={colors.warning} style={{ marginRight: 6 }} />
                    <Text className="text-sm font-semibold" style={{ color: colors.warning }}>
                      {getDueDateMessage(student, studentPayments)}
                    </Text>
                  </>
                )}
              </View>
            </View>
            {student.dueDate && (
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm text-muted">Due Date</Text>
                <Text className="text-sm font-semibold text-foreground">{formatDueDate(student.dueDate)}</Text>
              </View>
            )}
            {student.monthlyDueDate && (
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">Monthly Due Date</Text>
                <Text className="text-sm font-semibold text-foreground">{formatMonthlyDueDate(student.monthlyDueDate)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Monthly Payment Grid - 2 Rows */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-4">Monthly Payments</Text>

          {/* First Row - Jan to Jun */}
          <View className="flex-row justify-between gap-2 mb-3">
            {firstRow.map((month, index) => {
              const isPaid = studentPayments.some((p) => p.month === index && p.year === currentYear);
              const paidDate = studentPayments.find((p) => p.month === index && p.year === currentYear)?.paidDate;

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleMarkPayment(index)}
                  style={{
                    backgroundColor: isPaid ? colors.success : colors.surface,
                    borderWidth: 2,
                    borderColor: isPaid ? colors.success : colors.border,
                    borderRadius: 12,
                    paddingVertical: 16,
                    paddingHorizontal: 8,
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 80,
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: isPaid ? "#ffffff" : colors.foreground,
                      fontWeight: "700",
                      fontSize: 13,
                      marginBottom: 4,
                    }}
                  >
                    {month}
                  </Text>
                  {isPaid ? (
                    <View className="items-center">
                      <MaterialIcons name="check-circle" size={24} color="#ffffff" />
                      {paidDate && (
                        <Text
                          style={{
                            color: "#ffffff",
                            fontSize: 10,
                            marginTop: 4,
                            fontWeight: "500",
                          }}
                        >
                          {new Date(paidDate).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                      )}
                    </View>
                  ) : (
                    <MaterialIcons name="radio-button-unchecked" size={24} color={colors.border} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Second Row - Jul to Dec */}
          <View className="flex-row justify-between gap-2">
            {secondRow.map((month, index) => {
              const monthIndex = index + 6;
              const isPaid = studentPayments.some((p) => p.month === monthIndex && p.year === currentYear);
              const paidDate = studentPayments.find((p) => p.month === monthIndex && p.year === currentYear)?.paidDate;

              return (
                <TouchableOpacity
                  key={monthIndex}
                  onPress={() => handleMarkPayment(monthIndex)}
                  style={{
                    backgroundColor: isPaid ? colors.success : colors.surface,
                    borderWidth: 2,
                    borderColor: isPaid ? colors.success : colors.border,
                    borderRadius: 12,
                    paddingVertical: 16,
                    paddingHorizontal: 8,
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 80,
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: isPaid ? "#ffffff" : colors.foreground,
                      fontWeight: "700",
                      fontSize: 13,
                      marginBottom: 4,
                    }}
                  >
                    {month}
                  </Text>
                  {isPaid ? (
                    <View className="items-center">
                      <MaterialIcons name="check-circle" size={24} color="#ffffff" />
                      {paidDate && (
                        <Text
                          style={{
                            color: "#ffffff",
                            fontSize: 10,
                            marginTop: 4,
                            fontWeight: "500",
                          }}
                        >
                          {new Date(paidDate).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                      )}
                    </View>
                  ) : (
                    <MaterialIcons name="radio-button-unchecked" size={24} color={colors.border} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Payment Summary */}
        <View className="bg-primary/10 rounded-lg p-4 mb-6 border border-primary/20">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-sm text-muted mb-2">Current Month</Text>
              <Text className="text-xl font-bold text-foreground">{currentMonthPayments}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm text-muted mb-2">Payments This Year</Text>
              <Text className="text-xl font-bold text-foreground">
                {studentPayments.filter((p) => p.year === currentYear).length}/12
              </Text>
            </View>
          </View>
          <Text className="text-xs text-muted mt-3">
            Total: {CURRENCY_SYMBOL}
            {studentPayments.filter((p) => p.year === currentYear).reduce((sum, p) => sum + p.amount, 0)}
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="gap-3 mt-auto">
          <TouchableOpacity
            onPress={handleEditStudent}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="edit" size={20} color="#ffffff" />
            <Text className="text-white font-semibold ml-2">Edit Student</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleViewHistory}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="history" size={20} color="#ffffff" />
            <Text className="text-white font-semibold ml-2">View Payment History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteStudent}
            style={{
              backgroundColor: colors.error,
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="delete" size={20} color="#ffffff" />
            <Text className="text-white font-semibold ml-2">Delete Student</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
