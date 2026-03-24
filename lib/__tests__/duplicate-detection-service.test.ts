import { describe, it, expect } from "vitest";
import {
  detectDuplicates,
  updateStudentFee,
  processDuplicateResolution,
  formatDuplicateDetectionResult,
  getDuplicateSummary,
  DuplicateStudent,
} from "../duplicate-detection-service";
import { Student } from "../types";

describe("Duplicate Detection Service", () => {
  const mockStudents = {
    john: {
      id: "student_1",
      name: "John Doe",
      class: "10-A",
      monthlyFee: 5000,
      createdAt: new Date().toISOString(),
    } as Student,
    jane: {
      id: "student_2",
      name: "Jane Smith",
      class: "10-B",
      monthlyFee: 5500,
      createdAt: new Date().toISOString(),
    } as Student,
    ahmed: {
      id: "student_3",
      name: "Ahmed Khan",
      class: "9-A",
      monthlyFee: 4500,
      createdAt: new Date().toISOString(),
    } as Student,
  };

  describe("detectDuplicates", () => {
    it("should detect no duplicates when importing new students", () => {
      const importedStudents = [
        { ...mockStudents.john, id: "new_1" },
        { ...mockStudents.jane, id: "new_2" },
      ];
      const existingStudents: Student[] = [];

      const result = detectDuplicates(importedStudents, existingStudents);

      expect(result.newStudents).toHaveLength(2);
      expect(result.duplicates).toHaveLength(0);
      expect(result.totalDuplicates).toBe(0);
      expect(result.totalImported).toBe(2);
    });

    it("should detect exact duplicate by name and class", () => {
      const importedStudents = [
        { ...mockStudents.john, id: "new_1", monthlyFee: 6000 },
      ];
      const existingStudents = [mockStudents.john];

      const result = detectDuplicates(importedStudents, existingStudents);

      expect(result.newStudents).toHaveLength(0);
      expect(result.duplicates).toHaveLength(1);
      expect(result.totalDuplicates).toBe(1);
      expect(result.duplicates[0].existingStudent.id).toBe("student_1");
      expect(result.duplicates[0].importedStudent.monthlyFee).toBe(6000);
    });

    it("should be case-insensitive for name and class matching", () => {
      const importedStudents = [
        {
          ...mockStudents.john,
          id: "new_1",
          name: "john doe",
          class: "10-a",
        },
      ];
      const existingStudents = [mockStudents.john];

      const result = detectDuplicates(importedStudents, existingStudents);

      expect(result.duplicates).toHaveLength(1);
      expect(result.newStudents).toHaveLength(0);
    });

    it("should not match students with same name but different class", () => {
      const importedStudents = [
        { ...mockStudents.john, id: "new_1", class: "10-B" },
      ];
      const existingStudents = [mockStudents.john];

      const result = detectDuplicates(importedStudents, existingStudents);

      expect(result.newStudents).toHaveLength(1);
      expect(result.duplicates).toHaveLength(0);
    });

    it("should not match students with same class but different name", () => {
      const importedStudents = [
        { ...mockStudents.john, id: "new_1", name: "Robert Doe" },
      ];
      const existingStudents = [mockStudents.john];

      const result = detectDuplicates(importedStudents, existingStudents);

      expect(result.newStudents).toHaveLength(1);
      expect(result.duplicates).toHaveLength(0);
    });

    it("should handle mixed new and duplicate students", () => {
      const importedStudents = [
        { ...mockStudents.john, id: "new_1", monthlyFee: 6000 },
        { ...mockStudents.jane, id: "new_2" },
        { ...mockStudents.ahmed, id: "new_3", monthlyFee: 5000 },
      ];
      const existingStudents = [mockStudents.john, mockStudents.ahmed];

      const result = detectDuplicates(importedStudents, existingStudents);

      expect(result.newStudents).toHaveLength(1);
      expect(result.duplicates).toHaveLength(2);
      expect(result.totalDuplicates).toBe(2);
      expect(result.totalImported).toBe(3);
    });

    it("should handle empty imported students list", () => {
      const result = detectDuplicates([], [mockStudents.john]);

      expect(result.newStudents).toHaveLength(0);
      expect(result.duplicates).toHaveLength(0);
      expect(result.totalImported).toBe(0);
    });

    it("should handle empty existing students list", () => {
      const importedStudents = [mockStudents.john, mockStudents.jane];
      const result = detectDuplicates(importedStudents, []);

      expect(result.newStudents).toHaveLength(2);
      expect(result.duplicates).toHaveLength(0);
    });
  });

  describe("updateStudentFee", () => {
    it("should update monthly fee while preserving other fields", () => {
      const student = mockStudents.john;
      const newFee = 6000;

      const updated = updateStudentFee(student, newFee);

      expect(updated.monthlyFee).toBe(6000);
      expect(updated.id).toBe(student.id);
      expect(updated.name).toBe(student.name);
      expect(updated.class).toBe(student.class);
      expect(updated.createdAt).toBe(student.createdAt);
    });

    it("should handle fee increase", () => {
      const student = { ...mockStudents.john, monthlyFee: 5000 };
      const updated = updateStudentFee(student, 7000);

      expect(updated.monthlyFee).toBe(7000);
    });

    it("should handle fee decrease", () => {
      const student = { ...mockStudents.john, monthlyFee: 5000 };
      const updated = updateStudentFee(student, 4000);

      expect(updated.monthlyFee).toBe(4000);
    });

    it("should handle decimal fees", () => {
      const student = mockStudents.john;
      const updated = updateStudentFee(student, 5000.5);

      expect(updated.monthlyFee).toBe(5000.5);
    });
  });

  describe("processDuplicateResolution", () => {
    it("should process all new students when no duplicates", () => {
      const duplicateResult = {
        newStudents: [
          { ...mockStudents.john, id: "new_1" },
          { ...mockStudents.jane, id: "new_2" },
        ],
        duplicates: [],
        totalImported: 2,
        totalDuplicates: 0,
      };

      const result = processDuplicateResolution(duplicateResult, []);

      expect(result.studentsToAdd).toHaveLength(2);
      expect(result.studentsToUpdate).toHaveLength(0);
      expect(result.summary.added).toBe(2);
      expect(result.summary.updated).toBe(0);
      expect(result.summary.skipped).toBe(0);
    });

    it("should overwrite fee when action is overwrite", () => {
      const duplicate: DuplicateStudent = {
        importedStudent: { ...mockStudents.john, monthlyFee: 6000 },
        existingStudent: mockStudents.john,
        isDuplicate: true,
        action: "overwrite",
      };

      const duplicateResult = {
        newStudents: [],
        duplicates: [duplicate],
        totalImported: 1,
        totalDuplicates: 1,
      };

      const result = processDuplicateResolution(duplicateResult, [mockStudents.john]);

      expect(result.studentsToUpdate).toHaveLength(1);
      expect(result.studentsToUpdate[0].monthlyFee).toBe(6000);
      expect(result.summary.updated).toBe(1);
      expect(result.summary.skipped).toBe(0);
    });

    it("should skip when action is skip", () => {
      const duplicate: DuplicateStudent = {
        importedStudent: { ...mockStudents.john, monthlyFee: 6000 },
        existingStudent: mockStudents.john,
        isDuplicate: true,
        action: "skip",
      };

      const duplicateResult = {
        newStudents: [],
        duplicates: [duplicate],
        totalImported: 1,
        totalDuplicates: 1,
      };

      const result = processDuplicateResolution(duplicateResult, [mockStudents.john]);

      expect(result.studentsToUpdate).toHaveLength(0);
      expect(result.summary.skipped).toBe(1);
      expect(result.summary.updated).toBe(0);
    });

    it("should handle mixed new and duplicate students", () => {
      const duplicate: DuplicateStudent = {
        importedStudent: { ...mockStudents.john, monthlyFee: 6000 },
        existingStudent: mockStudents.john,
        isDuplicate: true,
        action: "overwrite",
      };

      const duplicateResult = {
        newStudents: [{ ...mockStudents.jane, id: "new_1" }],
        duplicates: [duplicate],
        totalImported: 2,
        totalDuplicates: 1,
      };

      const result = processDuplicateResolution(duplicateResult, [mockStudents.john]);

      expect(result.studentsToAdd).toHaveLength(1);
      expect(result.studentsToUpdate).toHaveLength(1);
      expect(result.summary.added).toBe(1);
      expect(result.summary.updated).toBe(1);
    });
  });

  describe("formatDuplicateDetectionResult", () => {
    it("should format result with no duplicates", () => {
      const result = {
        newStudents: [mockStudents.john, mockStudents.jane],
        duplicates: [],
        totalImported: 2,
        totalDuplicates: 0,
      };

      const formatted = formatDuplicateDetectionResult(result);

      expect(formatted).toContain("Total students in file: 2");
      expect(formatted).toContain("New students: 2");
      expect(formatted).toContain("Duplicates found: 0");
    });

    it("should format result with duplicates", () => {
      const duplicate: DuplicateStudent = {
        importedStudent: { ...mockStudents.john, monthlyFee: 6000 },
        existingStudent: mockStudents.john,
        isDuplicate: true,
        action: "skip",
      };

      const result = {
        newStudents: [],
        duplicates: [duplicate],
        totalImported: 1,
        totalDuplicates: 1,
      };

      const formatted = formatDuplicateDetectionResult(result);

      expect(formatted).toContain("Duplicates (by Name & Class)");
      expect(formatted).toContain("John Doe");
      expect(formatted).toContain("Current fee: RS5000");
      expect(formatted).toContain("New fee: RS6000");
    });
  });

  describe("getDuplicateSummary", () => {
    it("should return summary with no duplicates", () => {
      const result = {
        newStudents: [mockStudents.john, mockStudents.jane],
        duplicates: [],
        totalImported: 2,
        totalDuplicates: 0,
      };

      const summary = getDuplicateSummary(result);

      expect(summary.newCount).toBe(2);
      expect(summary.duplicateCount).toBe(0);
      expect(summary.duplicatesList).toHaveLength(0);
    });

    it("should return summary with duplicates", () => {
      const duplicate: DuplicateStudent = {
        importedStudent: { ...mockStudents.john, monthlyFee: 6000 },
        existingStudent: mockStudents.john,
        isDuplicate: true,
        action: "skip",
      };

      const result = {
        newStudents: [mockStudents.jane],
        duplicates: [duplicate],
        totalImported: 2,
        totalDuplicates: 1,
      };

      const summary = getDuplicateSummary(result);

      expect(summary.newCount).toBe(1);
      expect(summary.duplicateCount).toBe(1);
      expect(summary.duplicatesList).toHaveLength(1);
      expect(summary.duplicatesList[0].name).toBe("John Doe");
      expect(summary.duplicatesList[0].currentFee).toBe(5000);
      expect(summary.duplicatesList[0].newFee).toBe(6000);
    });
  });

  describe("Edge Cases", () => {
    it("should handle students with special characters in names", () => {
      const student: Student = {
        id: "student_1",
        name: "José García",
        class: "10-A",
        monthlyFee: 5000,
        createdAt: new Date().toISOString(),
      };

      const imported: Student = {
        ...student,
        id: "new_1",
        monthlyFee: 6000,
      };

      const result = detectDuplicates([imported], [student]);

      expect(result.duplicates).toHaveLength(1);
    });

    it("should handle students with unicode characters", () => {
      const student: Student = {
        id: "student_1",
        name: "李明",
        class: "11-B",
        monthlyFee: 5500,
        createdAt: new Date().toISOString(),
      };

      const imported: Student = {
        ...student,
        id: "new_1",
        monthlyFee: 6000,
      };

      const result = detectDuplicates([imported], [student]);

      expect(result.duplicates).toHaveLength(1);
    });

    it("should handle whitespace in names", () => {
      const student: Student = {
        id: "student_1",
        name: "John Doe",
        class: "10-A",
        monthlyFee: 5000,
        createdAt: new Date().toISOString(),
      };

      const imported: Student = {
        ...student,
        id: "new_1",
        name: "  John Doe  ",
        monthlyFee: 6000,
      };

      // Note: Whitespace should be trimmed during import
      const result = detectDuplicates([imported], [student]);

      // This will not match because whitespace is not trimmed in the detection
      // The trimming should happen during CSV/XLS parsing
      expect(result.newStudents).toHaveLength(1);
    });
  });
});
