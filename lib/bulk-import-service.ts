import XLSX from "xlsx";
import * as DocumentPicker from "expo-document-picker";
import { Student } from "./types";

/**
 * Bulk import result with success and error counts
 */
export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    name: string;
    error: string;
  }>;
  students: Student[];
}

/**
 * Pick and parse XLS file for bulk import
 */
export async function pickAndParseXLSFile(): Promise<{
  data: Array<Record<string, any>>;
  fileName: string;
} | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return null;
    }

    const file = result.assets[0];

    // Read file as base64
    const response = await fetch(file.uri);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    // Parse workbook
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheet = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheet];

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);

    return {
      data: data as Array<Record<string, any>>,
      fileName: file.name,
    };
  } catch (error) {
    console.error("Error picking/parsing XLS file:", error);
    throw error;
  }
}

/**
 * Validate and process imported student data
 */
export function validateAndProcessStudents(
  data: Array<Record<string, any>>,
  existingStudents: Student[]
): ImportResult {
  const result: ImportResult = {
    success: 0,
    failed: 0,
    errors: [],
    students: [],
  };

  const existingNames = new Set(existingStudents.map((s) => s.name.toLowerCase()));

  data.forEach((row, index) => {
    try {
      // Extract and validate fields
      const name = String(row["Student Name"] || row["Name"] || "").trim();
      const className = String(row["Class"] || row["class"] || "").trim();
      const monthlyFee = parseFloat(String(row["Monthly Fee"] || row["Fee"] || "0"));

      // Validation
      if (!name) {
        throw new Error("Student name is required");
      }

      if (!className) {
        throw new Error("Class is required");
      }

      if (isNaN(monthlyFee) || monthlyFee <= 0) {
        throw new Error("Monthly fee must be a positive number");
      }

      // Check for duplicates
      if (existingNames.has(name.toLowerCase())) {
        throw new Error(`Student "${name}" already exists`);
      }

      // Create student object
      const student: Student = {
        id: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        class: className,
        monthlyFee,
        createdAt: new Date().toISOString(),
      };

      result.students.push(student);
      result.success++;
      existingNames.add(name.toLowerCase());
    } catch (error) {
      result.failed++;
      result.errors.push({
        row: index + 2, // +2 because of header and 0-indexing
        name: String(row["Student Name"] || row["Name"] || "Unknown"),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return result;
}

/**
 * Generate sample XLS template for import
 */
export function generateSampleTemplate(): string {
  const sampleData = [
    { "Student Name": "John Doe", Class: "10-A", "Monthly Fee": 5000 },
    { "Student Name": "Jane Smith", Class: "10-B", "Monthly Fee": 5000 },
    { "Student Name": "Bob Johnson", Class: "10-A", "Monthly Fee": 5500 },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

  // Set column widths
  worksheet["!cols"] = [{ wch: 20 }, { wch: 10 }, { wch: 15 }];

  return XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
}

/**
 * Format import errors for display
 */
export function formatImportErrors(errors: ImportResult["errors"]): string {
  if (errors.length === 0) return "";

  const errorMessages = errors
    .map((err) => `Row ${err.row} (${err.name}): ${err.error}`)
    .join("\n");

  return errorMessages;
}
