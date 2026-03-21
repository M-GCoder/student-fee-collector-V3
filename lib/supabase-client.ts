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
  monthlyFee: number;
  monthlyDueDate?: number; // Day of month (1-31)
  dueDate?: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}

export interface SupabasePayment {
  id: string;
  studentId: string;
  month: number; // 0-11
  year: number;
  paymentDate: string; // ISO date string
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupabaseSync {
  id: string;
  lastSyncTime: string;
  syncStatus: "pending" | "syncing" | "completed" | "failed";
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}
