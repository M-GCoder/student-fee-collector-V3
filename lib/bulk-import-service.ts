import XLSX from "xlsx";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
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
 * Pick and parse XLS/CSV file for bulk import
 * Works with files that have or don't have headers
 */
export async function pickAndParseXLSFile(): Promise<{
  data: Array<Record<string, any>>;
  fileName: string;
  hasHeaders: boolean;
} | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return null;
    }

    const file = result.assets[0];

    // Validate file extension
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      throw new Error(`Invalid file format. Supported formats: ${validExtensions.join(", ")}`);
    }

    // Read file as base64
    const response = await fetch(file.uri);
    if (!response.ok) {
      throw new Error(`Failed to read file: ${response.statusText}`);
    }

    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error("File is empty");
    }

    const arrayBuffer = await blob.arrayBuffer();

    // Parse workbook
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error("No sheets found in the file");
    }

    const firstSheet = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheet];

    // Get raw data as arrays (no header interpretation)
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    if (rawData.length === 0) {
      throw new Error("No data found in the sheet");
    }

    // Detect if first row is headers or data
    // Headers typically contain text like "Name", "Class", "Fee", etc.
    // Data rows contain actual student information
    const firstRow = rawData[0];
    const hasHeaders = isHeaderRow(firstRow);

    // Convert to array of objects with positional column names
    const startIndex = hasHeaders ? 1 : 0;
    const data = rawData.slice(startIndex).map((row) => ({
      column1: row[0] || "", // Name
      column2: row[1] || "", // Class
      column3: row[2] || "", // Monthly Fee
    }));

    if (data.length === 0) {
      throw new Error("No data rows found in the sheet");
    }

    return {
      data,
      fileName: file.name,
      hasHeaders,
    };
  } catch (error) {
    console.error("Error picking/parsing XLS file:", error);
    throw error;
  }
}

/**
 * Detect if a row is a header row
 * Headers typically contain column names like "Name", "Class", "Fee", etc.
 */
function isHeaderRow(row: any[]): boolean {
  if (!row || row.length < 3) return false;

  const headerKeywords = [
    "name",
    "student",
    "class",
    "grade",
    "fee",
    "payment",
    "amount",
    "due",
    "date",
    "id",
    "roll",
  ];

  // Check if any of the first 3 columns contain header keywords
  const firstThree = row.slice(0, 3).map((cell) => String(cell).toLowerCase().trim());

  const matchCount = firstThree.filter((cell) =>
    headerKeywords.some((keyword) => cell.includes(keyword))
  ).length;

  // If 2 or more columns match header keywords, it's likely a header row
  return matchCount >= 2;
}

/**
 * Validate and process imported student data
 * Works with positional columns (no header matching needed)
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
      // Extract fields from positional columns
      // Column 1: Name, Column 2: Class, Column 3: Monthly Fee
      const name = String(row.column1 || "").trim();
      const className = String(row.column2 || "").trim();
      const monthlyFee = parseFloat(String(row.column3 || "0"));

      // Validation
      if (!name) {
        throw new Error("Student name is required (Column 1)");
      }

      if (!className) {
        throw new Error("Class is required (Column 2)");
      }

      if (isNaN(monthlyFee) || monthlyFee <= 0) {
        throw new Error("Monthly fee must be a positive number (Column 3)");
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
        row: index + 1, // 1-indexed for user display
        name: String(row.column1 || "Unknown"),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return result;
}

/**
 * Generate and download sample XLS template for import
 */
export async function downloadSampleTemplate(): Promise<void> {
  try {
    const sampleData = [
      { "Student Name": "John Doe", Class: "10-A", "Monthly Fee": 5000 },
      { "Student Name": "Jane Smith", Class: "10-B", "Monthly Fee": 5000 },
      { "Student Name": "Bob Johnson", Class: "10-A", "Monthly Fee": 5500 },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    // Set column widths for better formatting
    worksheet["!cols"] = [{ wch: 25 }, { wch: 12 }, { wch: 15 }];

    // Generate Excel file
    const xlsxData = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });

    const fileName = `student_import_template_${Date.now()}.xlsx`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, xlsxData, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Save Student Import Template",
      });
    }
  } catch (error) {
    console.error("Error downloading sample template:", error);
    throw error;
  }
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
