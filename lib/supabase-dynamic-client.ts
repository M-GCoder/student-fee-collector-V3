import { createClient, SupabaseClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SUPABASE_CONFIG_KEY = "supabase_config";

export interface SupabaseConfig {
  projectUrl: string;
  anonKey: string;
  configuredAt: string;
}

/**
 * Dynamic Supabase client that loads credentials from AsyncStorage
 * Allows multi-school support with separate Supabase databases
 */
export class DynamicSupabaseClient {
  private static instance: SupabaseClient | null = null;
  private static currentConfig: SupabaseConfig | null = null;

  /**
   * Get the current Supabase client instance
   */
  static async getClient(): Promise<SupabaseClient> {
    // If instance exists and config hasn't changed, return it
    if (this.instance && this.currentConfig) {
      return this.instance;
    }

    // Load config from AsyncStorage
    const config = await this.getConfig();
    if (!config) {
      throw new Error("Supabase not configured. Please configure Supabase credentials first.");
    }

    // Create new client with loaded credentials
    this.instance = createClient(config.projectUrl, config.anonKey);
    this.currentConfig = config;

    return this.instance;
  }

  /**
   * Get stored Supabase configuration
   */
  static async getConfig(): Promise<SupabaseConfig | null> {
    try {
      const configJson = await AsyncStorage.getItem(SUPABASE_CONFIG_KEY);
      if (!configJson) {
        return null;
      }
      return JSON.parse(configJson) as SupabaseConfig;
    } catch (error) {
      console.error("Error loading Supabase config:", error);
      return null;
    }
  }

  /**
   * Save Supabase configuration
   */
  static async setConfig(projectUrl: string, anonKey: string): Promise<void> {
    try {
      const config: SupabaseConfig = {
        projectUrl,
        anonKey,
        configuredAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));

      // Reset instance to force reload with new credentials
      this.instance = null;
      this.currentConfig = null;
    } catch (error) {
      console.error("Error saving Supabase config:", error);
      throw error;
    }
  }

  /**
   * Check if Supabase is configured
   */
  static async isConfigured(): Promise<boolean> {
    const config = await this.getConfig();
    return config !== null;
  }

  /**
   * Clear Supabase configuration
   */
  static async clearConfig(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SUPABASE_CONFIG_KEY);
      this.instance = null;
      this.currentConfig = null;
    } catch (error) {
      console.error("Error clearing Supabase config:", error);
      throw error;
    }
  }

  /**
   * Save student session for portal login
   */
  static async saveStudentSession(student: { id: string; email: string; name: string }): Promise<void> {
    try {
      await AsyncStorage.setItem('student_session', JSON.stringify({
        ...student,
        loginTime: new Date().toISOString(),
      }));
    } catch (error) {
      console.error("Error saving student session:", error);
      throw error;
    }
  }

  /**
   * Get current student session
   */
  static async getStudentSession(): Promise<{ id: string; email: string; name: string } | null> {
    try {
      const session = await AsyncStorage.getItem('student_session');
      if (!session) return null;
      return JSON.parse(session);
    } catch (error) {
      console.error("Error getting student session:", error);
      return null;
    }
  }

  /**
   * Clear student session
   */
  static async clearStudentSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem('student_session');
    } catch (error) {
      console.error("Error clearing student session:", error);
      throw error;
    }
  }

  /**
   * Test connection with given credentials
   */
  static async testConnection(projectUrl: string, anonKey: string): Promise<boolean> {
    try {
      const testClient = createClient(projectUrl, anonKey);
      // Try to query students table to verify connection
      const { error } = await testClient.from("students").select("id").limit(1);
      return !error;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  }
}

/**
 * Database schema types for Supabase
 */
export interface SupabaseStudent {
  id: string;
  name: string;
  class: string;
  monthly_fee: number;
  monthly_due_date?: number; // Day of month (1-31)
  email?: string;
  password?: string;
  created_at: string;
  updated_at: string;
}

export interface SupabasePayment {
  id: string;
  student_id: string;
  month: number; // 0-11
  year: number;
  payment_date?: string; // ISO date string
  paid_date?: string; // When payment was marked as paid
  amount: number;
  created_at?: string;
  updated_at: string;
}

export interface SupabaseSync {
  id: string;
  lastSyncTime: string;
  syncStatus: "pending" | "syncing" | "completed" | "failed";
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}
