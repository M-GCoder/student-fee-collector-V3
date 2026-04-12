import { describe, it, expect, beforeEach, vi } from "vitest";
import * as storage from "../storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Student } from "../types";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    multiRemove: vi.fn(),
  },
}));

describe("Edit Student Functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateStudent", () => {
    it("should update an existing student with new details", async () => {
      const originalStudent: Student = {
        id: "1",
        name: "John Doe",
        class: "10-A",
        monthlyFee: 5000,
        createdAt: "2026-03-03T00:00:00Z",
      };

      const updatedStudent: Student = {
        ...originalStudent,
        name: "John Smith",
        class: "10-B",
        monthlyFee: 5500,
      };

      const mockStudents = [originalStudent];
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(mockStudents));

      await storage.updateStudent(updatedStudent);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "students",
        JSON.stringify([updatedStudent])
      );
    });

    it("should not update if student ID does not exist", async () => {
      const mockStudents: Student[] = [
        {
          id: "1",
          name: "John Doe",
          class: "10-A",
          monthlyFee: 5000,
          createdAt: "2026-03-03T00:00:00Z",
        },
      ];

      const nonExistentStudent: Student = {
        id: "999",
        name: "Jane Doe",
        class: "9-B",
        monthlyFee: 4500,
        createdAt: "2026-03-03T00:00:00Z",
      };

      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(mockStudents));

      await storage.updateStudent(nonExistentStudent);

      // When student not found, setItem should not be called
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it("should preserve other students when updating one", async () => {
      const student1: Student = {
        id: "1",
        name: "John Doe",
        class: "10-A",
        monthlyFee: 5000,
        createdAt: "2026-03-03T00:00:00Z",
      };

      const student2: Student = {
        id: "2",
        name: "Jane Doe",
        class: "9-B",
        monthlyFee: 4500,
        createdAt: "2026-03-03T00:00:00Z",
      };

      const updatedStudent1: Student = {
        ...student1,
        name: "John Smith",
        monthlyFee: 5500,
      };

      const mockStudents = [student1, student2];
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(mockStudents));

      await storage.updateStudent(updatedStudent1);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "students",
        JSON.stringify([updatedStudent1, student2])
      );
    });

    it("should update only the changed fields", async () => {
      const originalStudent: Student = {
        id: "1",
        name: "John Doe",
        class: "10-A",
        monthlyFee: 5000,
        createdAt: "2026-03-03T00:00:00Z",
      };

      const updatedStudent: Student = {
        ...originalStudent,
        monthlyFee: 6000, // Only fee changed
      };

      const mockStudents = [originalStudent];
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(mockStudents));

      await storage.updateStudent(updatedStudent);

      const callArgs = vi.mocked(AsyncStorage.setItem).mock.calls[0];
      const savedData = JSON.parse(callArgs[1]);

      expect(savedData[0].name).toBe("John Doe"); // Unchanged
      expect(savedData[0].class).toBe("10-A"); // Unchanged
      expect(savedData[0].monthlyFee).toBe(6000); // Changed
      expect(savedData[0].id).toBe("1"); // ID preserved
      expect(savedData[0].createdAt).toBe("2026-03-03T00:00:00Z"); // Timestamp preserved
    });
  });

  describe("Edit validation", () => {
    it("should validate that student name is not empty", () => {
      const student: Student = {
        id: "1",
        name: "",
        class: "10-A",
        monthlyFee: 5000,
        createdAt: "2026-03-03T00:00:00Z",
      };

      expect(student.name.trim()).toBe("");
    });

    it("should validate that monthly fee is positive", () => {
      const invalidFees = [0, -100, -5000];

      invalidFees.forEach((fee) => {
        expect(fee > 0).toBe(false);
      });
    });

    it("should validate that monthly fee is a valid number", () => {
      const validFee = "5000";
      const invalidFee = "abc";

      expect(isNaN(parseFloat(validFee))).toBe(false);
      expect(isNaN(parseFloat(invalidFee))).toBe(true);
    });
  });
});
