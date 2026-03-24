import { View, Text, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { useStudents } from "@/lib/student-context";
import { CURRENCY_SYMBOL } from "@/lib/types";

export default function DashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const { students, payments } = useStudents();

  // Calculate metrics
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const currentMonthPayments = payments.filter(
    (p) => p.month === currentMonth && p.year === currentYear
  );

  const currentMonthCollected = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
  const currentMonthExpected = students.reduce((sum, s) => sum + s.monthlyFee, 0);
  const currentMonthCompletion = students.length > 0 ? (currentMonthPayments.length / students.length) * 100 : 0;

  // Calculate monthly trends (last 3 months)
  const monthlyTrends = Array.from({ length: 3 }, (_, i) => {
    const date = new Date(currentYear, currentMonth - i, 1);
    const month = date.getMonth();
    const year = date.getFullYear();
    const monthPayments = payments.filter((p) => p.month === month && p.year === year);
    const collected = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    const expected = students.reduce((sum, s) => sum + s.monthlyFee, 0);

    return {
      month: date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      collected,
      expected,
      completion: students.length > 0 ? (monthPayments.length / students.length) * 100 : 0,
    };
  }).reverse();

  // Outstanding fees - Current month only
  const outstandingByStudent = students.map((student) => {
    // Check if student paid for current month
    const currentMonthPayment = payments.find(
      (p) => p.studentId === student.id && p.month === currentMonth && p.year === currentYear
    );
    
    // If not paid, outstanding = monthly fee; if paid, outstanding = 0
    const outstanding = currentMonthPayment ? 0 : student.monthlyFee;
    const studentPayments = payments.filter((p) => p.studentId === student.id);

    return {
      student,
      outstanding,
      paymentCount: studentPayments.length,
    };
  });

  const topOutstanding = outstandingByStudent
    .sort((a, b) => b.outstanding - a.outstanding)
    .slice(0, 3);

  const topPayers = outstandingByStudent
    .sort((a, b) => b.paymentCount - a.paymentCount)
    .slice(0, 3);

  const totalOutstanding = outstandingByStudent.reduce((sum, s) => sum + s.outstanding, 0);

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="mb-6 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <MaterialIcons name="analytics" size={28} color={colors.primary} style={{ marginRight: 8 }} />
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">Dashboard</Text>
            <Text className="text-sm text-muted mt-1">Fee collection analytics</Text>
          </View>
        </View>

        {/* Current Month Summary */}
        <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
          <Text className="text-sm font-semibold text-foreground mb-4">Current Month</Text>
          <View className="flex-row justify-between mb-4">
            <View className="flex-1">
              <Text className="text-xs text-muted mb-1">Collected</Text>
              <Text className="text-xl font-bold text-success">
                {CURRENCY_SYMBOL}{currentMonthCollected}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted mb-1">Expected</Text>
              <Text className="text-xl font-bold text-foreground">
                {CURRENCY_SYMBOL}{currentMonthExpected}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted mb-1">Completion</Text>
              <Text className="text-xl font-bold text-primary">
                {currentMonthCompletion.toFixed(0)}%
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="bg-border rounded-full h-2 overflow-hidden">
            <View
              style={{
                width: `${Math.min(currentMonthCompletion, 100)}%`,
                height: "100%",
                backgroundColor: colors.primary,
              }}
            />
          </View>
        </View>

        {/* Monthly Trends */}
        <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
          <Text className="text-sm font-semibold text-foreground mb-4">3 Month Trend</Text>
          {monthlyTrends.map((trend, idx) => (
            <View key={idx} className="mb-4">
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs font-semibold text-foreground">{trend.month}</Text>
                <Text className="text-xs text-muted">
                  {CURRENCY_SYMBOL}{trend.collected} / {CURRENCY_SYMBOL}{trend.expected}
                </Text>
              </View>
              <View className="bg-border rounded-full h-2 overflow-hidden">
                <View
                  style={{
                    width: `${Math.min(trend.completion, 100)}%`,
                    height: "100%",
                    backgroundColor: trend.completion >= 80 ? colors.success : colors.warning,
                  }}
                />
              </View>
              <Text className="text-xs text-muted mt-1">{trend.completion.toFixed(0)}% complete</Text>
            </View>
          ))}
        </View>

        {/* Outstanding Fees */}
        <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
          <Text className="text-sm font-semibold text-foreground mb-3">Outstanding Fees</Text>
          <View className="bg-error/10 rounded-lg p-3 mb-4 border border-error/20">
            <Text className="text-xs text-error mb-1">Total Outstanding</Text>
            <Text className="text-2xl font-bold text-error">
              {CURRENCY_SYMBOL}{totalOutstanding}
            </Text>
          </View>

          {topOutstanding.length > 0 && (
            <View>
              <Text className="text-xs font-semibold text-foreground mb-2">Top Outstanding</Text>
              {topOutstanding.map((item, idx) => (
                <View key={idx} className="flex-row justify-between items-center mb-2 pb-2 border-b border-border">
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-foreground">{item.student.name}</Text>
                    <Text className="text-xs text-muted">{item.student.class}</Text>
                  </View>
                  <Text className="text-xs font-bold text-error">
                    {CURRENCY_SYMBOL}{item.outstanding}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Top Payers */}
        {topPayers.length > 0 && (
          <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
            <Text className="text-sm font-semibold text-foreground mb-3">Top Payers</Text>
            {topPayers.map((item, idx) => (
              <View key={idx} className="flex-row justify-between items-center mb-2 pb-2 border-b border-border">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-foreground">{item.student.name}</Text>
                  <Text className="text-xs text-muted">{item.student.class}</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <MaterialIcons name="check-circle" size={16} color={colors.success} />
                  <Text className="text-xs font-bold text-success">{item.paymentCount}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Summary Stats */}
        <View className="bg-primary/10 rounded-lg p-4 border border-primary/20">
          <Text className="text-sm font-semibold text-foreground mb-3">Summary</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-muted">Total Students</Text>
            <Text className="text-xs font-bold text-foreground">{students.length}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-muted">Total Payments</Text>
            <Text className="text-xs font-bold text-foreground">{payments.length}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-muted">Total Collected</Text>
            <Text className="text-xs font-bold text-success">
              {CURRENCY_SYMBOL}{payments.reduce((sum, p) => sum + p.amount, 0)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
