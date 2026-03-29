import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Database schema types for Supabase
 */
export interface SupabaseStudent {
  id: string;
  name: string;
  class: string;
  monthly_fee: number;
  monthly_due_date?: number; // Day of month (1-31)
  due_date?: string; // ISO date string
  created_at: string;
  updated_at: string;
}

export interface SupabasePayment {
  id: string;
  student_id: string;
  month: number; // 0-11
  year: number;
  payment_date: string; // ISO date string
  amount: number;
  created_at: string;
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
