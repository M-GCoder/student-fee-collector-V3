import { describe, it, expect, beforeEach, vi } from "vitest";
import * as storage from "../storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Student, Payment } from "../types";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    multiRemove: vi.fn(),
  },
}));

describe("Storage Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getStudents", () => {
    it("should return empty array when no students exist", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
      const result = await storage.getStudents();
      expect(result).toEqual([]);
    });

    it("should return parsed students from storage", async () => {
      const mockStudents: Student[] = [
        {
          id: "1",
          name: "John Doe",
          class: "10-A",
          monthlyFee: 5000,
          createdAt: "2026-03-03T00:00:00Z",
        },
      ];
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(mockStudents));
      const result = await storage.getStudents();
      expect(result).toEqual(mockStudents);
    });
  });

  describe("saveStudent", () => {
    it("should save a new student to storage", async () => {
      const mockStudents: Student[] = [];
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(mockStudents));

      const newStudent: Student = {
        id: "1",
        name: "Jane Doe",
        class: "9-B",
        monthlyFee: 4500,
        createdAt: "2026-03-03T00:00:00Z",
      };

      await storage.saveStudent(newStudent);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "students",
        JSON.stringify([newStudent])
      );
    });
  });

  describe("deleteStudent", () => {
    it("should remove student from storage", async () => {
      const mockStudents: Student[] = [
        {
          id: "1",
          name: "John Doe",
          class: "10-A",
          monthlyFee: 5000,
          createdAt: "2026-03-03T00:00:00Z",
        },
        {
          id: "2",
          name: "Jane Doe",
          class: "9-B",
          monthlyFee: 4500,
          createdAt: "2026-03-03T00:00:00Z",
        },
      ];

      vi.mocked(AsyncStorage.getItem)
        .mockResolvedValueOnce(JSON.stringify(mockStudents)) // First call for getStudents
        .mockResolvedValueOnce(JSON.stringify([])); // Second call for getPayments

      await storage.deleteStudent("1");

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "students",
        JSON.stringify([mockStudents[1]])
      );
    });
  });

  describe("getPayments", () => {
    it("should return empty array when no payments exist", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
      const result = await storage.getPayments();
      expect(result).toEqual([]);
    });

    it("should return parsed payments from storage", async () => {
      const mockPayments: Payment[] = [
        {
          id: "p1",
          studentId: "1",
          month: 0,
          year: 2026,
          paidDate: "2026-03-03T00:00:00Z",
          amount: 5000,
        },
      ];
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(mockPayments));
      const result = await storage.getPayments();
      expect(result).toEqual(mockPayments);
    });
  });

  describe("savePayment", () => {
    it("should save a new payment to storage", async () => {
      const mockPayments: Payment[] = [];
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(mockPayments));

      const newPayment: Payment = {
        id: "p1",
        studentId: "1",
        month: 0,
        year: 2026,
        paidDate: "2026-03-03T00:00:00Z",
        amount: 5000,
      };

      await storage.savePayment(newPayment);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "payments",
        JSON.stringify([newPayment])
      );
    });
  });

  describe("getPaymentForMonth", () => {
    it("should return payment for specific month", async () => {
      const mockPayments: Payment[] = [
        {
          id: "p1",
          studentId: "1",
          month: 0,
          year: 2026,
          paidDate: "2026-03-03T00:00:00Z",
          amount: 5000,
        },
      ];
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(mockPayments));

      const result = await storage.getPaymentForMonth("1", 0, 2026);
      expect(result).toEqual(mockPayments[0]);
    });

    it("should return undefined when payment not found", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify([]));

      const result = await storage.getPaymentForMonth("1", 0, 2026);
      expect(result).toBeUndefined();
    });
  });

  describe("clearAllData", () => {
    it("should clear all data from storage", async () => {
      await storage.clearAllData();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(["students", "payments"]);
    });
  });
});
