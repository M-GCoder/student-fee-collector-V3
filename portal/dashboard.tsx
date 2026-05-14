import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { DynamicSupabaseClient } from '@/lib/supabase-dynamic-client';
import { ScreenContainer } from '@/components/screen-container';
import { Payment, MONTHS } from '@/lib/types';

interface StudentData {
  id: string;
  name: string;
  email: string;
  class: string;
  monthlyFee: number;
  monthlyDueDate?: number;
}

export default function StudentPortalDashboard() {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      // Get student session
      const session = await DynamicSupabaseClient.getStudentSession();
      if (!session) {
        router.replace('/dashboard');
        return;
      }

      const supabase = await DynamicSupabaseClient.getClient();

      // Fetch student details
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', session.id)
        .single();

      if (studentError || !studentData) {
        Alert.alert('Error', 'Failed to load student data');
        return;
      }

      setStudent(studentData);

      // Fetch student payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', session.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (!paymentsError && paymentsData) {
        setPayments(paymentsData);
      }
    } catch (error) {
      console.error('Error loading student data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await DynamicSupabaseClient.clearStudentSession();
    router.replace('/dashboard');
  };

  const getPaymentStatus = (payment: Payment) => {
    return payment.paidDate ? 'Paid' : 'Pending';
  };

  const getPaymentStatusColor = (payment: Payment) => {
    return payment.paidDate ? '#22C55E' : '#EF4444';
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
      </ScreenContainer>
    );
  }

  if (!student) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground">Student data not found</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView className="flex-1">
        <View className="p-6 gap-6">
          {/* Header with Logout */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-bold text-foreground">{student.name}</Text>
              <Text className="text-sm text-muted mt-1">{student.class}</Text>
            </View>
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-error px-4 py-2 rounded-lg"
            >
              <Text className="text-white text-sm font-semibold">Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Student Info Card */}
          <View className="bg-surface border border-border rounded-lg p-4 gap-3">
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">Email</Text>
              <Text className="text-sm font-semibold text-foreground">{student.email}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">Monthly Fee</Text>
              <Text className="text-sm font-semibold text-foreground">RS {student.monthlyFee}</Text>
            </View>
            {student.monthlyDueDate && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Payment Due Date</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {student.monthlyDueDate}th of each month
                </Text>
              </View>
            )}
          </View>

          {/* Payment Summary */}
          <View className="gap-2">
            <Text className="text-lg font-bold text-foreground">Payment History</Text>
            <View className="flex-row gap-3">
              <View className="flex-1 bg-success/10 border border-success rounded-lg p-3">
                <Text className="text-xs text-muted">Paid</Text>
                <Text className="text-lg font-bold text-success">
                  {payments.filter(p => p.paidDate).length}
                </Text>
              </View>
              <View className="flex-1 bg-error/10 border border-error rounded-lg p-3">
                <Text className="text-xs text-muted">Pending</Text>
                <Text className="text-lg font-bold text-error">
                  {payments.filter(p => !p.paidDate).length}
                </Text>
              </View>
            </View>
          </View>

          {/* Payments List */}
          <View className="gap-2">
            <Text className="text-lg font-bold text-foreground">Payments</Text>
            {payments.length === 0 ? (
              <View className="bg-surface border border-border rounded-lg p-4 items-center">
                <Text className="text-muted">No payments found</Text>
              </View>
            ) : (
              <FlatList
                scrollEnabled={false}
                data={payments}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View className="bg-surface border border-border rounded-lg p-4 mb-3 flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground">
                        {MONTHS[item.month]} {item.year}
                      </Text>
                      <Text className="text-xs text-muted mt-1">RS {item.amount}</Text>
                    </View>
                    <View
                      className="px-3 py-1 rounded-full"
                      style={{ backgroundColor: getPaymentStatusColor(item) + '20' }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: getPaymentStatusColor(item) }}
                      >
                        {getPaymentStatus(item)}
                      </Text>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
