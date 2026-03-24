import { Student, Payment } from "./types";

/**
 * Represents a duplicate student found during import
 */
export interface DuplicateStudent {
  importedStudent: Student;
  existingStudent: Student;
  isDuplicate: boolean;
  action: "skip" | "overwrite"; // User's choice
}

/**
 * Result of duplicate detection
 */
export interface DuplicateDetectionResult {
  newStudents: Student[]; // Students with no duplicates
  duplicates: DuplicateStudent[]; // Students that have duplicates
  totalImported: number;
  totalDuplicates: number;
}

/**
 * Detect duplicate students by Name and Class
 */
export function detectDuplicates(
  importedStudents: Student[],
  existingStudents: Student[]
): DuplicateDetectionResult {
  const result: DuplicateDetectionResult = {
    newStudents: [],
    duplicates: [],
    totalImported: importedStudents.length,
    totalDuplicates: 0,
  };

  // Create a map of existing students for quick lookup (by Name + Class)
  const existingMap = new Map<string, Student>();
  existingStudents.forEach((student) => {
    const key = `${student.name.toLowerCase()}|${student.class.toLowerCase()}`;
    existingMap.set(key, student);
  });

  // Check each imported student for duplicates
  importedStudents.forEach((importedStudent) => {
    const key = `${importedStudent.name.toLowerCase()}|${importedStudent.class.toLowerCase()}`;
    const existingStudent = existingMap.get(key);

    if (existingStudent) {
      // Duplicate found
      result.duplicates.push({
        importedStudent,
        existingStudent,
        isDuplicate: true,
        action: "skip", // Default action
      });
      result.totalDuplicates++;
    } else {
      // New student
      result.newStudents.push(importedStudent);
    }
  });

  return result;
}

/**
 * Update student fee while preserving payment history
 * The new fee applies from the current month onwards
 */
export function updateStudentFee(
  student: Student,
  newMonthlyFee: number
): Student {
  return {
    ...student,
    monthlyFee: newMonthlyFee,
  };
}

/**
 * Process duplicate resolution
 * Returns the final list of students to add (new + overwritten)
 */
export function processDuplicateResolution(
  duplicateDetectionResult: DuplicateDetectionResult,
  existingStudents: Student[]
): {
  studentsToAdd: Student[];
  studentsToUpdate: Student[];
  summary: {
    added: number;
    updated: number;
    skipped: number;
  };
} {
  const studentsToAdd: Student[] = [...duplicateDetectionResult.newStudents];
  const studentsToUpdate: Student[] = [];
  let skipped = 0;

  duplicateDetectionResult.duplicates.forEach((duplicate) => {
    if (duplicate.action === "overwrite") {
      // Update the fee of the existing student
      const updatedStudent = updateStudentFee(
        duplicate.existingStudent,
        duplicate.importedStudent.monthlyFee
      );
      studentsToUpdate.push(updatedStudent);
    } else {
      // Skip this duplicate
      skipped++;
    }
  });

  return {
    studentsToAdd,
    studentsToUpdate,
    summary: {
      added: studentsToAdd.length,
      updated: studentsToUpdate.length,
      skipped,
    },
  };
}

/**
 * Format duplicate detection result for display
 */
export function formatDuplicateDetectionResult(
  result: DuplicateDetectionResult
): string {
  let message = `Import Analysis:\n`;
  message += `Total students in file: ${result.totalImported}\n`;
  message += `New students: ${result.newStudents.length}\n`;
  message += `Duplicates found: ${result.totalDuplicates}\n\n`;

  if (result.totalDuplicates > 0) {
    message += `Duplicates (by Name & Class):\n`;
    result.duplicates.forEach((dup, idx) => {
      message += `${idx + 1}. ${dup.importedStudent.name} (${dup.importedStudent.class})\n`;
      message += `   Current fee: RS${dup.existingStudent.monthlyFee}\n`;
      message += `   New fee: RS${dup.importedStudent.monthlyFee}\n`;
    });
  }

  return message;
}

/**
 * Get duplicate summary for UI display
 */
export function getDuplicateSummary(
  result: DuplicateDetectionResult
): {
  newCount: number;
  duplicateCount: number;
  duplicatesList: Array<{
    name: string;
    class: string;
    currentFee: number;
    newFee: number;
  }>;
} {
  return {
    newCount: result.newStudents.length,
    duplicateCount: result.totalDuplicates,
    duplicatesList: result.duplicates.map((dup) => ({
      name: dup.importedStudent.name,
      class: dup.importedStudent.class,
      currentFee: dup.existingStudent.monthlyFee,
      newFee: dup.importedStudent.monthlyFee,
    })),
  };
}
