import { supabase, SupabaseStudent, SupabasePayment } from "./supabase-client";
import { Student, Payment } from "./types";

/**
 * Supabase sync service for managing cloud data persistence
 */
export class SupabaseSyncService {
  /**
   * Initialize Supabase tables if they don't exist
   */
  static async initializeTables(): Promise<void> {
    try {
      // Check if tables exist by querying them
      await supabase.from("students").select("id").limit(1);
      await supabase.from("payments").select("id").limit(1);
      console.log("Supabase tables initialized successfully");
    } catch (error) {
      console.error("Error initializing Supabase tables:", error);
      throw error;
    }
  }

  /**
   * Sync all local students to Supabase
   */
  static async syncStudentsToCloud(students: Student[]): Promise<void> {
    try {
      const supabaseStudents: SupabaseStudent[] = students.map((student) => ({
        id: student.id,
        name: student.name,
        class: student.class,
        monthly_fee: student.monthlyFee,
        monthly_due_date: student.monthlyDueDate,
        due_date: student.dueDate,
        created_at: student.createdAt,
        updated_at: new Date().toISOString(),
      }));

      // Upsert students (insert or update if exists)
      const { error } = await supabase.from("students").upsert(supabaseStudents, {
        onConflict: "id",
      });

      if (error) {
        throw error;
      }

      console.log(`Synced ${supabaseStudents.length} students to cloud`);
      await this.logSyncOperation("completed");
    } catch (error) {
      console.error("Error syncing students to cloud:", error);
      await this.logSyncOperation("failed", String(error));
      throw error;
    }
  }

  /**
   * Sync all local payments to Supabase
   */
  static async syncPaymentsToCloud(payments: Payment[]): Promise<void> {
    try {
      const supabasePayments: SupabasePayment[] = payments.map((payment) => ({
        id: payment.id,
        student_id: payment.studentId,
        month: payment.month,
        year: payment.year,
        payment_date: payment.paidDate,
        amount: payment.amount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Upsert payments (insert or update if exists)
      const { error } = await supabase.from("payments").upsert(supabasePayments, {
        onConflict: "id",
      });

      if (error) {
        throw error;
      }

      console.log(`Synced ${supabasePayments.length} payments to cloud`);
      await this.logSyncOperation("completed");
    } catch (error) {
      console.error("Error syncing payments to cloud:", error);
      await this.logSyncOperation("failed", String(error));
      throw error;
    }
  }

  /**
   * Fetch all students from Supabase cloud
   */
  static async fetchStudentsFromCloud(): Promise<Student[]> {
    try {
      const { data, error } = await supabase.from("students").select("*");

      if (error) {
        throw error;
      }

      if (!data) {
        return [];
      }

      const students: Student[] = data.map((row: any) => ({
        id: row.id,
        name: row.name,
        class: row.class,
        monthlyFee: row.monthly_fee,
        monthlyDueDate: row.monthly_due_date,
        dueDate: row.due_date,
        createdAt: row.created_at,
      }));

      console.log(`Fetched ${students.length} students from cloud`);
      return students;
    } catch (error) {
      console.error("Error fetching students from cloud:", error);
      throw error;
    }
  }

  /**
   * Fetch all payments from Supabase cloud
   */
  static async fetchPaymentsFromCloud(): Promise<Payment[]> {
    try {
      const { data, error } = await supabase.from("payments").select("*");

      if (error) {
        throw error;
      }

      if (!data) {
        return [];
      }

      const payments: Payment[] = data.map((row: any) => ({
        id: row.id,
        studentId: row.student_id,
        month: row.month,
        year: row.year,
        paidDate: row.payment_date,
        amount: row.amount,
      }));

      console.log(`Fetched ${payments.length} payments from cloud`);
      return payments;
    } catch (error) {
      console.error("Error fetching payments from cloud:", error);
      throw error;
    }
  }

  /**
   * Delete a student from Supabase
   */
  static async deleteStudentFromCloud(studentId: string): Promise<void> {
    try {
      const { error } = await supabase.from("students").delete().eq("id", studentId);

      if (error) {
        throw error;
      }

      console.log(`Deleted student ${studentId} from cloud`);
    } catch (error) {
      console.error("Error deleting student from cloud:", error);
      throw error;
    }
  }

  /**
   * Delete a payment from Supabase
   */
  static async deletePaymentFromCloud(paymentId: string): Promise<void> {
    try {
      const { error } = await supabase.from("payments").delete().eq("id", paymentId);

      if (error) {
        throw error;
      }

      console.log(`Deleted payment ${paymentId} from cloud`);
    } catch (error) {
      console.error("Error deleting payment from cloud:", error);
      throw error;
    }
  }

  /**
   * Log sync operation to track sync history (client-side only)
   * Note: Sync logging is now done locally to avoid database table dependencies
   */
  static async logSyncOperation(
    status: "pending" | "syncing" | "completed" | "failed",
    errorMessage?: string
  ): Promise<void> {
    try {
      // Log to console for debugging
      const logEntry = {
        timestamp: new Date().toISOString(),
        status,
        errorMessage: errorMessage || null,
      };
      console.log("Sync operation logged:", logEntry);
      // In a production app, you could store this in AsyncStorage for local history
    } catch (error) {
      console.error("Error in logSyncOperation:", error);
    }
  }

  /**
   * Check if Supabase connection is available
   */
  static async checkConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from("students").select("id").limit(1);
      return !error;
    } catch (error) {
      console.error("Error checking Supabase connection:", error);
      return false;
    }
  }
}
