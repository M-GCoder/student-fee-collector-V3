import { View, Text, TouchableOpacity, ScrollView, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { useStudents } from "@/lib/student-context";
import { Student, Payment, MONTHS, CURRENCY_SYMBOL } from "@/lib/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

export default function PaymentHistoryScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams();
  const { students, payments } = useStudents();

  const [student, setStudent] = useState<Student | null>(null);
  const [studentPayments, setStudentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && typeof id === "string") {
      const found = students.find((s) => s.id === id);
      setStudent(found || null);
      const studentPay = payments
        .filter((p) => p.studentId === id)
        .sort((a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime());
      setStudentPayments(studentPay);
      setLoading(false);
    }
  }, [id, students, payments]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <View className="bg-surface rounded-lg p-4 mb-3 border border-border flex-row items-center justify-between">
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground">
          {MONTHS[item.month]} {item.year}
        </Text>
        <Text className="text-sm text-muted mt-1">Paid on {formatDate(item.paidDate)}</Text>
      </View>
      <View className="items-end">
        <Text className="text-lg font-bold text-success">{CURRENCY_SYMBOL}{item.amount}</Text>
      </View>
    </View>
  );

  if (loading || !student) {
    return (
      <ScreenContainer className="p-4 items-center justify-center">
        <Text className="text-muted">Loading...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <View className="flex-1">
        {/* Header */}
        <View className="mb-6 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <MaterialIcons name="history" size={28} color={colors.primary} style={{ marginRight: 8 }} />
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">Payment History</Text>
            <Text className="text-sm text-muted mt-1">{student.name}</Text>
          </View>
        </View>

        {/* Payment Stats */}
        <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-2xl font-bold text-primary">{studentPayments.length}</Text>
              <Text className="text-xs text-muted mt-1">Total Payments</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-success">
                {CURRENCY_SYMBOL}{studentPayments.reduce((sum, p) => sum + p.amount, 0)}
              </Text>
              <Text className="text-xs text-muted mt-1">Amount Paid</Text>
            </View>
          </View>
        </View>

        {/* Empty State */}
        {studentPayments.length === 0 && (
          <View className="flex-1 items-center justify-center">
            <MaterialIcons name="receipt" size={48} color={colors.muted} />
            <Text className="text-lg font-semibold text-foreground mt-4">No Payments Yet</Text>
            <Text className="text-sm text-muted text-center mt-2">
              No payment records for {student.name}
            </Text>
          </View>
        )}

        {/* Payment List */}
        {studentPayments.length > 0 && (
          <FlatList
            data={studentPayments}
            renderItem={renderPaymentItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
