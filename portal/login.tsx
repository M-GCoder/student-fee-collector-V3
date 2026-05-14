import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { DynamicSupabaseClient } from '@/lib/supabase-dynamic-client';
import { ScreenContainer } from '@/components/screen-container';

export default function StudentPortalLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const supabase = await DynamicSupabaseClient.getClient();
      
      // Query students table to find student by email
      const { data: students, error: queryError } = await supabase
        .from('students')
        .select('*')
        .eq('email', email)
        .single();

      if (queryError || !students) {
        Alert.alert('Error', 'Student not found');
        setLoading(false);
        return;
      }

      // Verify password (basic comparison - in production, use hashed passwords)
      if (students.password !== password) {
        Alert.alert('Error', 'Invalid password');
        setLoading(false);
        return;
      }

      // Store student session
      await DynamicSupabaseClient.saveStudentSession({
        id: students.id,
        email: students.email,
        name: students.name,
      });
      
      // Navigate to dashboard
      router.replace('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
        <View className="flex-1 justify-center gap-6">
          {/* Header */}
          <View className="items-center gap-2 mb-8">
            <Text className="text-4xl font-bold text-foreground">Student Portal</Text>
            <Text className="text-base text-muted text-center">
              View your payment history and due dates
            </Text>
          </View>

          {/* Login Form */}
          <View className="gap-4">
            {/* Email Input */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Email</Text>
              <TextInput
                className="border border-border rounded-lg px-4 py-3 text-foreground bg-surface"
                placeholder="Enter your email"
                placeholderTextColor="#9BA1A6"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Password</Text>
              <TextInput
                className="border border-border rounded-lg px-4 py-3 text-foreground bg-surface"
                placeholder="Enter your password"
                placeholderTextColor="#9BA1A6"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                secureTextEntry
              />
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="bg-primary rounded-lg py-3 items-center mt-4"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-base">Login</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
            <Text className="text-sm text-blue-900">
              💡 <Text className="font-semibold">Tip:</Text> Use the email and password provided during student registration.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
