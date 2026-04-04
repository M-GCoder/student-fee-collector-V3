import { SupabaseSyncService } from "./supabase-sync-service";
import { AutomaticImportService } from "./automatic-import-service";
import { Student, Payment } from "./types";
import * as storage from "./storage-safe";

/**
 * Service for automatically importing data from cloud and detecting changes
 */
export const CloudImportService = {
  /**
   * Check for new/updated data from cloud and import if changes detected
   * Returns true if data was imported, false otherwise
   */
  async checkAndImportCloudData(): Promise<boolean> {
    try {
      // Check if auto-import is enabled
      const isEnabled = await AutomaticImportService.isAutoImportEnabled();
      if (!isEnabled) {
        console.log("Auto-import is disabled, skipping cloud check");
        return false;
      }

      // Check if enough time has passed since last import check
      const shouldCheck = await AutomaticImportService.shouldCheckForImport();
      if (!shouldCheck) {
        console.log("Not enough time passed since last import check");
        return false;
      }

      console.log("Checking for cloud data changes...");

      // Fetch current data from cloud
      const cloudStudents = await SupabaseSyncService.fetchStudentsFromCloud();
      const cloudPayments = await SupabaseSyncService.fetchPaymentsFromCloud();

      // Get local data
      const localStudents = await storage.getStudents();
      const localPayments = await storage.getPayments();

      // Check if there are any changes
      const hasStudentChanges = this.detectStudentChanges(localStudents || [], cloudStudents);
      const hasPaymentChanges = this.detectPaymentChanges(localPayments || [], cloudPayments);

      if (!hasStudentChanges && !hasPaymentChanges) {
        console.log("No cloud data changes detected");
        await AutomaticImportService.updateLastImportCheckTime();
        return false;
      }

      console.log("Cloud data changes detected, importing...");

      // Import new/updated data
      if (hasStudentChanges) {
        await this.importStudentChanges(cloudStudents, localStudents || []);
      }

      if (hasPaymentChanges) {
        await this.importPaymentChanges(cloudPayments, localPayments || []);
      }

      // Update last import check time
      await AutomaticImportService.updateLastImportCheckTime();

      console.log("Cloud data import completed successfully");
      return true;
    } catch (error) {
      console.error("Error checking and importing cloud data:", error);
      // Still update the check time to avoid hammering the API
      try {
        await AutomaticImportService.updateLastImportCheckTime();
      } catch (e) {
        console.error("Error updating import check time:", e);
      }
      return false;
    }
  },

  /**
   * Detect if there are any changes in students between local and cloud
   */
  detectStudentChanges(localStudents: Student[], cloudStudents: Student[]): boolean {
    // If counts differ, there are changes
    if (localStudents.length !== cloudStudents.length) {
      return true;
    }

    // Check if any student is new or updated
    for (const cloudStudent of cloudStudents) {
      const localStudent = localStudents.find((s) => s.id === cloudStudent.id);

      if (!localStudent) {
        // New student in cloud
        return true;
      }

      // Check if student was updated (compare timestamps)
      if (new Date(cloudStudent.createdAt) > new Date(localStudent.createdAt)) {
        return true;
      }

      // Check if any field changed
      if (
        cloudStudent.name !== localStudent.name ||
        cloudStudent.class !== localStudent.class ||
        cloudStudent.monthlyFee !== localStudent.monthlyFee ||
        cloudStudent.monthlyDueDate !== localStudent.monthlyDueDate
      ) {
        return true;
      }
    }

    return false;
  },

  /**
   * Detect if there are any changes in payments between local and cloud
   */
  detectPaymentChanges(localPayments: Payment[], cloudPayments: Payment[]): boolean {
    // If counts differ, there are changes
    if (localPayments.length !== cloudPayments.length) {
      return true;
    }

    // Check if any payment is new or updated
    for (const cloudPayment of cloudPayments) {
      const localPayment = localPayments.find((p) => p.id === cloudPayment.id);

      if (!localPayment) {
        // New payment in cloud
        return true;
      }

      // Check if payment was updated
      if (cloudPayment.amount !== localPayment.amount) {
        return true;
      }
    }

    return false;
  },

  /**
   * Import student changes from cloud (new or updated students)
   */
  async importStudentChanges(cloudStudents: Student[], localStudents: Student[]): Promise<void> {
    const localStudentIds = new Set(localStudents.map((s) => s.id));

    for (const cloudStudent of cloudStudents) {
      if (!localStudentIds.has(cloudStudent.id)) {
        // New student - save it
        console.log(`Importing new student: ${cloudStudent.name}`);
        await storage.saveStudent(cloudStudent);
      } else {
        // Check if student was updated
        const localStudent = localStudents.find((s) => s.id === cloudStudent.id);
        if (
          localStudent &&
          (cloudStudent.name !== localStudent.name ||
            cloudStudent.class !== localStudent.class ||
            cloudStudent.monthlyFee !== localStudent.monthlyFee ||
            cloudStudent.monthlyDueDate !== localStudent.monthlyDueDate)
        ) {
          console.log(`Updating student: ${cloudStudent.name}`);
          await storage.updateStudent(cloudStudent);
        }
      }
    }
  },

  /**
   * Import payment changes from cloud (new or updated payments)
   */
  async importPaymentChanges(cloudPayments: Payment[], localPayments: Payment[]): Promise<void> {
    const localPaymentIds = new Set(localPayments.map((p) => p.id));

    for (const cloudPayment of cloudPayments) {
      if (!localPaymentIds.has(cloudPayment.id)) {
        // New payment - save it
        console.log(`Importing new payment for student: ${cloudPayment.studentId}`);
        await storage.savePayment(cloudPayment);
      } else {
        // Check if payment was updated
        const localPayment = localPayments.find((p) => p.id === cloudPayment.id);
        if (localPayment && cloudPayment.amount !== localPayment.amount) {
          console.log(`Updating payment: ${cloudPayment.id}`);
          // Delete old payment and save new one
          await storage.deletePayment(cloudPayment.id);
          await storage.savePayment(cloudPayment);
        }
      }
    }
  },
};
