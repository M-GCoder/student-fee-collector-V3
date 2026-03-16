import { View, Text, FlatList, TouchableOpacity, ScrollView } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useStudents } from "@/lib/student-context";
import { useEffect, useState } from "react";
import { Payment, MONTHS, Student } from "@/lib/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

export default function HistoryScreen() {
  const colors = useColors();
  const { students, payments, refreshData } = useStudents();
  const [sortedPayments, setSortedPayments] = useState<(Payment & { studentName: string })[]>([]);

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    const paymentsWithNames = payments.map((payment) => {
      const student = students.find((s) => s.id === payment.studentId);
      return {
        ...payment,
        studentName: student?.name || "Unknown",
      };
    });

    const sorted = paymentsWithNames.sort(
      (a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime()
    );

    setSortedPayments(sorted);
  }, [payments, students]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCurrentMonthMetrics = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthPayments = sortedPayments.filter(
      (p) => p.month === currentMonth && p.year === currentYear
    );

    return {
      count: currentMonthPayments.length,
      amount: currentMonthPayments.reduce((sum, p) => sum + p.amount, 0),
    };
  };

  const renderPaymentItem = ({ item }: { item: Payment & { studentName: string } }) => (
    <View className="bg-surface rounded-lg p-4 mb-3 border border-border">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-base font-semibold text-foreground">{item.studentName}</Text>
        <Text className="text-lg font-bold text-success">RS{item.amount}</Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-muted">
          {MONTHS[item.month]} {item.year}
        </Text>
        <Text className="text-xs text-muted">{formatDate(item.paidDate)}</Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">Payment History</Text>
          <Text className="text-sm text-muted mt-1">All student payments</Text>
        </View>

        {/* Stats */}
        {sortedPayments.length > 0 && (
          <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
            <View className="flex-row justify-around mb-4">
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary">{sortedPayments.length}</Text>
                <Text className="text-xs text-muted mt-1">Total Payments</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-success">
                  RS{sortedPayments.reduce((sum, p) => sum + p.amount, 0)}
                </Text>
                <Text className="text-xs text-muted mt-1">Total Amount</Text>
              </View>
            </View>
            <View className="border-t border-border pt-4 flex-row justify-around">
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary">{getCurrentMonthMetrics().count}</Text>
                <Text className="text-xs text-muted mt-1">Current Month</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-success">
                  RS{getCurrentMonthMetrics().amount}
                </Text>
                <Text className="text-xs text-muted mt-1">Current Month Amount</Text>
              </View>
            </View>
          </View>
        )}

        {/* Empty State */}
        {sortedPayments.length === 0 && (
          <View className="flex-1 items-center justify-center py-8">
            <MaterialIcons name="receipt" size={48} color={colors.muted} />
            <Text className="text-lg font-semibold text-foreground mt-4">No Payments Yet</Text>
            <Text className="text-sm text-muted text-center mt-2">
              Payment history will appear here
            </Text>
          </View>
        )}

        {/* Payment List */}
        {sortedPayments.length > 0 && (
          <FlatList
            data={sortedPayments}
            renderItem={renderPaymentItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
