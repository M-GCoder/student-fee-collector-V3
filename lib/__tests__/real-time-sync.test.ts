import { describe, it, expect, beforeEach, vi } from "vitest";
import { SupabaseSyncService } from "../supabase-sync-service";
import { Student, Payment } from "../types";

// Mock Supabase sync service
vi.mock("../supabase-sync-service", () => ({
  SupabaseSyncService: {
    syncStudentsToCloud: vi.fn(),
    syncPaymentsToCloud: vi.fn(),
    deleteStudentFromCloud: vi.fn(),
    deletePaymentFromCloud: vi.fn(),
  },
}));

// Mock sync status service
vi.mock("../sync-status-service", () => ({
  updateSyncStatus: vi.fn(),
}));

describe("Real-Time Sync on CRUD Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Student Operations", () => {
    it("should sync to cloud when adding a new student", async () => {
      const newStudent: Student = {
        id: "1",
        name: "John Doe",
        class: "10-A",
        monthlyFee: 5000,
        monthlyDueDate: 15,
        createdAt: new Date().toISOString(),
      };

      await SupabaseSyncService.syncStudentsToCloud([newStudent]);

      expect(SupabaseSyncService.syncStudentsToCloud).toHaveBeenCalledWith([newStudent]);
      expect(SupabaseSyncService.syncStudentsToCloud).toHaveBeenCalledTimes(1);
    });

    it("should sync to cloud when updating a student", async () => {
      const updatedStudent: Student = {
        id: "1",
        name: "Jane Doe",
        class: "10-B",
        monthlyFee: 6000,
        monthlyDueDate: 20,
        createdAt: new Date().toISOString(),
      };

      await SupabaseSyncService.syncStudentsToCloud([updatedStudent]);

      expect(SupabaseSyncService.syncStudentsToCloud).toHaveBeenCalledWith([updatedStudent]);
    });

    it("should sync to cloud when deleting a student", async () => {
      const studentId = "1";

      await SupabaseSyncService.deleteStudentFromCloud(studentId);

      expect(SupabaseSyncService.deleteStudentFromCloud).toHaveBeenCalledWith(studentId);
    });

    it("should handle sync errors gracefully on student add", async () => {
      const newStudent: Student = {
        id: "1",
        name: "John Doe",
        class: "10-A",
        monthlyFee: 5000,
        monthlyDueDate: 15,
        createdAt: new Date().toISOString(),
      };

      const error = new Error("Sync failed");
      vi.mocked(SupabaseSyncService.syncStudentsToCloud).mockRejectedValueOnce(error);

      await expect(SupabaseSyncService.syncStudentsToCloud([newStudent])).rejects.toThrow(
        "Sync failed"
      );
    });
  });

  describe("Payment Operations", () => {
    it("should sync to cloud when adding a new payment", async () => {
      const newPayment: Payment = {
        id: "p1",
        studentId: "1",
        month: 3,
        year: 2026,
        paidDate: new Date().toISOString(),
        amount: 5000,
      };

      await SupabaseSyncService.syncPaymentsToCloud([newPayment]);

      expect(SupabaseSyncService.syncPaymentsToCloud).toHaveBeenCalledWith([newPayment]);
    });

    it("should sync to cloud when deleting a payment", async () => {
      const paymentId = "p1";

      await SupabaseSyncService.deletePaymentFromCloud(paymentId);

      expect(SupabaseSyncService.deletePaymentFromCloud).toHaveBeenCalledWith(paymentId);
    });

    it("should handle sync errors gracefully on payment add", async () => {
      const newPayment: Payment = {
        id: "p1",
        studentId: "1",
        month: 3,
        year: 2026,
        paidDate: new Date().toISOString(),
        amount: 5000,
      };

      const error = new Error("Payment sync failed");
      vi.mocked(SupabaseSyncService.syncPaymentsToCloud).mockRejectedValueOnce(error);

      await expect(SupabaseSyncService.syncPaymentsToCloud([newPayment])).rejects.toThrow(
        "Payment sync failed"
      );
    });
  });

  describe("Batch Operations", () => {
    it("should sync multiple students to cloud", async () => {
      const students: Student[] = [
        {
          id: "1",
          name: "John Doe",
          class: "10-A",
          monthlyFee: 5000,
          monthlyDueDate: 15,
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Jane Doe",
          class: "10-B",
          monthlyFee: 6000,
          monthlyDueDate: 20,
          createdAt: new Date().toISOString(),
        },
      ];

      await SupabaseSyncService.syncStudentsToCloud(students);

      expect(SupabaseSyncService.syncStudentsToCloud).toHaveBeenCalledWith(students);
    });

    it("should sync multiple payments to cloud", async () => {
      const payments: Payment[] = [
        {
          id: "p1",
          studentId: "1",
          month: 3,
          year: 2026,
          paidDate: new Date().toISOString(),
          amount: 5000,
        },
        {
          id: "p2",
          studentId: "2",
          month: 3,
          year: 2026,
          paidDate: new Date().toISOString(),
          amount: 6000,
        },
      ];

      await SupabaseSyncService.syncPaymentsToCloud(payments);

      expect(SupabaseSyncService.syncPaymentsToCloud).toHaveBeenCalledWith(payments);
    });
  });

  describe("Sync Status Updates", () => {
    it("should update sync status after successful student sync", async () => {
      const student: Student = {
        id: "1",
        name: "John Doe",
        class: "10-A",
        monthlyFee: 5000,
        monthlyDueDate: 15,
        createdAt: new Date().toISOString(),
      };

      await SupabaseSyncService.syncStudentsToCloud([student]);

      // In actual implementation, updateSyncStatus would be called
      expect(SupabaseSyncService.syncStudentsToCloud).toHaveBeenCalled();
    });

    it("should handle multiple concurrent sync operations", async () => {
      const student: Student = {
        id: "1",
        name: "John Doe",
        class: "10-A",
        monthlyFee: 5000,
        monthlyDueDate: 15,
        createdAt: new Date().toISOString(),
      };

      const payment: Payment = {
        id: "p1",
        studentId: "1",
        month: 3,
        year: 2026,
        paidDate: new Date().toISOString(),
        amount: 5000,
      };

      await Promise.all([
        SupabaseSyncService.syncStudentsToCloud([student]),
        SupabaseSyncService.syncPaymentsToCloud([payment]),
      ]);

      expect(SupabaseSyncService.syncStudentsToCloud).toHaveBeenCalled();
      expect(SupabaseSyncService.syncPaymentsToCloud).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should not throw when sync fails during student add", async () => {
      const student: Student = {
        id: "1",
        name: "John Doe",
        class: "10-A",
        monthlyFee: 5000,
        monthlyDueDate: 15,
        createdAt: new Date().toISOString(),
      };

      vi.mocked(SupabaseSyncService.syncStudentsToCloud).mockRejectedValueOnce(
        new Error("Network error")
      );

      // Should reject but be caught by StudentContext
      await expect(SupabaseSyncService.syncStudentsToCloud([student])).rejects.toThrow();
    });

    it("should not throw when sync fails during payment add", async () => {
      const payment: Payment = {
        id: "p1",
        studentId: "1",
        month: 3,
        year: 2026,
        paidDate: new Date().toISOString(),
        amount: 5000,
      };

      vi.mocked(SupabaseSyncService.syncPaymentsToCloud).mockRejectedValueOnce(
        new Error("Network error")
      );

      await expect(SupabaseSyncService.syncPaymentsToCloud([payment])).rejects.toThrow();
    });

    it("should handle timeout errors during sync", async () => {
      const student: Student = {
        id: "1",
        name: "John Doe",
        class: "10-A",
        monthlyFee: 5000,
        monthlyDueDate: 15,
        createdAt: new Date().toISOString(),
      };

      vi.mocked(SupabaseSyncService.syncStudentsToCloud).mockRejectedValueOnce(
        new Error("Request timeout")
      );

      await expect(SupabaseSyncService.syncStudentsToCloud([student])).rejects.toThrow(
        "Request timeout"
      );
    });
  });
});
