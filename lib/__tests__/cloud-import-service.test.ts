import { describe, it, expect, beforeEach, vi } from "vitest";
import { CloudImportService } from "../cloud-import-service";
import { Student, Payment } from "../types";
import { AutomaticImportService } from "../automatic-import-service";
import { SupabaseSyncService } from "../supabase-sync-service";
import * as storage from "../storage-safe";

// Mock dependencies
vi.mock("../automatic-import-service");
vi.mock("../supabase-sync-service");
vi.mock("../storage-safe");

describe("CloudImportService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkAndImportCloudData", () => {
    it("should return false if auto-import is disabled", async () => {
      vi.mocked(AutomaticImportService.isAutoImportEnabled).mockResolvedValueOnce(false);

      const result = await CloudImportService.checkAndImportCloudData();

      expect(result).toBe(false);
      expect(AutomaticImportService.isAutoImportEnabled).toHaveBeenCalled();
    });

    it("should return false if not enough time has passed since last check", async () => {
      vi.mocked(AutomaticImportService.isAutoImportEnabled).mockResolvedValueOnce(true);
      vi.mocked(AutomaticImportService.shouldCheckForImport).mockResolvedValueOnce(false);

      const result = await CloudImportService.checkAndImportCloudData();

      expect(result).toBe(false);
    });

    it("should return false if no changes detected", async () => {
      const students: Student[] = [
        {
          id: "1",
          name: "John Doe",
          class: "10-A",
          monthlyFee: 5000,
          monthlyDueDate: 15,
          createdAt: new Date().toISOString(),
        },
      ];

      vi.mocked(AutomaticImportService.isAutoImportEnabled).mockResolvedValueOnce(true);
      vi.mocked(AutomaticImportService.shouldCheckForImport).mockResolvedValueOnce(true);
      vi.mocked(SupabaseSyncService.fetchStudentsFromCloud).mockResolvedValueOnce(students);
      vi.mocked(SupabaseSyncService.fetchPaymentsFromCloud).mockResolvedValueOnce([]);
      vi.mocked(storage.getStudents).mockResolvedValueOnce(students);
      vi.mocked(storage.getPayments).mockResolvedValueOnce([]);

      const result = await CloudImportService.checkAndImportCloudData();

      expect(result).toBe(false);
    });

    it("should import new students from cloud", async () => {
      const localStudents: Student[] = [];
      const cloudStudents: Student[] = [
        {
          id: "1",
          name: "John Doe",
          class: "10-A",
          monthlyFee: 5000,
          monthlyDueDate: 15,
          createdAt: new Date().toISOString(),
        },
      ];

      vi.mocked(AutomaticImportService.isAutoImportEnabled).mockResolvedValueOnce(true);
      vi.mocked(AutomaticImportService.shouldCheckForImport).mockResolvedValueOnce(true);
      vi.mocked(SupabaseSyncService.fetchStudentsFromCloud).mockResolvedValueOnce(cloudStudents);
      vi.mocked(SupabaseSyncService.fetchPaymentsFromCloud).mockResolvedValueOnce([]);
      vi.mocked(storage.getStudents).mockResolvedValueOnce(localStudents);
      vi.mocked(storage.getPayments).mockResolvedValueOnce([]);
      vi.mocked(storage.saveStudent).mockResolvedValueOnce();
      vi.mocked(AutomaticImportService.updateLastImportCheckTime).mockResolvedValueOnce();

      const result = await CloudImportService.checkAndImportCloudData();

      expect(result).toBe(true);
      expect(storage.saveStudent).toHaveBeenCalledWith(cloudStudents[0]);
    });

    it("should import new payments from cloud", async () => {
      const localPayments: Payment[] = [];
      const cloudPayments: Payment[] = [
        {
          id: "p1",
          studentId: "1",
          month: 3,
          year: 2026,
          paidDate: new Date().toISOString(),
          amount: 5000,
        },
      ];

      vi.mocked(AutomaticImportService.isAutoImportEnabled).mockResolvedValueOnce(true);
      vi.mocked(AutomaticImportService.shouldCheckForImport).mockResolvedValueOnce(true);
      vi.mocked(SupabaseSyncService.fetchStudentsFromCloud).mockResolvedValueOnce([]);
      vi.mocked(SupabaseSyncService.fetchPaymentsFromCloud).mockResolvedValueOnce(cloudPayments);
      vi.mocked(storage.getStudents).mockResolvedValueOnce([]);
      vi.mocked(storage.getPayments).mockResolvedValueOnce(localPayments);
      vi.mocked(storage.savePayment).mockResolvedValueOnce();
      vi.mocked(AutomaticImportService.updateLastImportCheckTime).mockResolvedValueOnce();

      const result = await CloudImportService.checkAndImportCloudData();

      expect(result).toBe(true);
      expect(storage.savePayment).toHaveBeenCalledWith(cloudPayments[0]);
    });

    it("should handle errors gracefully", async () => {
      vi.mocked(AutomaticImportService.isAutoImportEnabled).mockRejectedValueOnce(
        new Error("Storage error")
      );
      vi.mocked(AutomaticImportService.updateLastImportCheckTime).mockResolvedValueOnce();

      const result = await CloudImportService.checkAndImportCloudData();

      expect(result).toBe(false);
    });
  });

  describe("detectStudentChanges", () => {
    it("should detect new students", () => {
      const localStudents: Student[] = [];
      const cloudStudents: Student[] = [
        {
          id: "1",
          name: "John Doe",
          class: "10-A",
          monthlyFee: 5000,
          monthlyDueDate: 15,
          createdAt: new Date().toISOString(),
        },
      ];

      const hasChanges = CloudImportService.detectStudentChanges(localStudents, cloudStudents);

      expect(hasChanges).toBe(true);
    });

    it("should detect updated students", () => {
      const now = new Date();
      const earlier = new Date(now.getTime() - 60000);

      const localStudents: Student[] = [
        {
          id: "1",
          name: "John Doe",
          class: "10-A",
          monthlyFee: 5000,
          monthlyDueDate: 15,
          createdAt: earlier.toISOString(),
        },
      ];

      const cloudStudents: Student[] = [
        {
          id: "1",
          name: "John Doe",
          class: "10-B",
          monthlyFee: 6000,
          monthlyDueDate: 20,
          createdAt: now.toISOString(),
        },
      ];

      const hasChanges = CloudImportService.detectStudentChanges(localStudents, cloudStudents);

      expect(hasChanges).toBe(true);
    });

    it("should return false if no changes", () => {
      const date = new Date().toISOString();

      const localStudents: Student[] = [
        {
          id: "1",
          name: "John Doe",
          class: "10-A",
          monthlyFee: 5000,
          monthlyDueDate: 15,
          createdAt: date,
        },
      ];

      const cloudStudents: Student[] = [
        {
          id: "1",
          name: "John Doe",
          class: "10-A",
          monthlyFee: 5000,
          monthlyDueDate: 15,
          createdAt: date,
        },
      ];

      const hasChanges = CloudImportService.detectStudentChanges(localStudents, cloudStudents);

      expect(hasChanges).toBe(false);
    });
  });

  describe("detectPaymentChanges", () => {
    it("should detect new payments", () => {
      const localPayments: Payment[] = [];
      const cloudPayments: Payment[] = [
        {
          id: "p1",
          studentId: "1",
          month: 3,
          year: 2026,
          paidDate: new Date().toISOString(),
          amount: 5000,
        },
      ];

      const hasChanges = CloudImportService.detectPaymentChanges(localPayments, cloudPayments);

      expect(hasChanges).toBe(true);
    });

    it("should detect updated payment amounts", () => {
      const localPayments: Payment[] = [
        {
          id: "p1",
          studentId: "1",
          month: 3,
          year: 2026,
          paidDate: new Date().toISOString(),
          amount: 5000,
        },
      ];

      const cloudPayments: Payment[] = [
        {
          id: "p1",
          studentId: "1",
          month: 3,
          year: 2026,
          paidDate: new Date().toISOString(),
          amount: 6000,
        },
      ];

      const hasChanges = CloudImportService.detectPaymentChanges(localPayments, cloudPayments);

      expect(hasChanges).toBe(true);
    });

    it("should return false if no payment changes", () => {
      const date = new Date().toISOString();

      const localPayments: Payment[] = [
        {
          id: "p1",
          studentId: "1",
          month: 3,
          year: 2026,
          paidDate: date,
          amount: 5000,
        },
      ];

      const cloudPayments: Payment[] = [
        {
          id: "p1",
          studentId: "1",
          month: 3,
          year: 2026,
          paidDate: date,
          amount: 5000,
        },
      ];

      const hasChanges = CloudImportService.detectPaymentChanges(localPayments, cloudPayments);

      expect(hasChanges).toBe(false);
    });
  });

  describe("importStudentChanges", () => {
    it("should save new students", async () => {
      const localStudents: Student[] = [];
      const cloudStudents: Student[] = [
        {
          id: "1",
          name: "John Doe",
          class: "10-A",
          monthlyFee: 5000,
          monthlyDueDate: 15,
          createdAt: new Date().toISOString(),
        },
      ];

      vi.mocked(storage.saveStudent).mockResolvedValueOnce();

      await CloudImportService.importStudentChanges(cloudStudents, localStudents);

      expect(storage.saveStudent).toHaveBeenCalledWith(cloudStudents[0]);
    });

    it("should update existing students with changes", async () => {
      const now = new Date();
      const earlier = new Date(now.getTime() - 60000);

      const localStudents: Student[] = [
        {
          id: "1",
          name: "John Doe",
          class: "10-A",
          monthlyFee: 5000,
          monthlyDueDate: 15,
          createdAt: earlier.toISOString(),
        },
      ];

      const cloudStudents: Student[] = [
        {
          id: "1",
          name: "John Doe",
          class: "10-B",
          monthlyFee: 6000,
          monthlyDueDate: 20,
          createdAt: now.toISOString(),
        },
      ];

      vi.mocked(storage.updateStudent).mockResolvedValueOnce();

      await CloudImportService.importStudentChanges(cloudStudents, localStudents);

      expect(storage.updateStudent).toHaveBeenCalledWith(cloudStudents[0]);
    });
  });

  describe("importPaymentChanges", () => {
    it("should save new payments", async () => {
      const localPayments: Payment[] = [];
      const cloudPayments: Payment[] = [
        {
          id: "p1",
          studentId: "1",
          month: 3,
          year: 2026,
          paidDate: new Date().toISOString(),
          amount: 5000,
        },
      ];

      vi.mocked(storage.savePayment).mockResolvedValueOnce();

      await CloudImportService.importPaymentChanges(cloudPayments, localPayments);

      expect(storage.savePayment).toHaveBeenCalledWith(cloudPayments[0]);
    });

    it("should update existing payments with changes", async () => {
      const date = new Date().toISOString();

      const localPayments: Payment[] = [
        {
          id: "p1",
          studentId: "1",
          month: 3,
          year: 2026,
          paidDate: date,
          amount: 5000,
        },
      ];

      const cloudPayments: Payment[] = [
        {
          id: "p1",
          studentId: "1",
          month: 3,
          year: 2026,
          paidDate: date,
          amount: 6000,
        },
      ];

      vi.mocked(storage.deletePayment).mockResolvedValueOnce();
      vi.mocked(storage.savePayment).mockResolvedValueOnce();

      await CloudImportService.importPaymentChanges(cloudPayments, localPayments);

      expect(storage.deletePayment).toHaveBeenCalledWith("p1");
      expect(storage.savePayment).toHaveBeenCalledWith(cloudPayments[0]);
    });
  });
});
