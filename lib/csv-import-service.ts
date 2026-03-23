import { Student } from "./types";
import { v4 as uuidv4 } from "uuid";

/**
 * CSV row interface (flexible, any number of columns)
 */
export interface CSVRow {
  [key: string]: string | number;
}

/**
 * Parsed student from CSV
 */
export interface ParsedStudent {
  name: string;
  class: string;
  monthlyFee: number;
  isValid: boolean;
  error?: string;
}

/**
 * CSV import result
 */
export interface CSVImportResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  students: Student[];
  errors: Array<{
    rowNumber: number;
    error: string;
    data: string[];
  }>;
}

/**
 * Parse CSV text content
 * Handles flexible column structure - only uses first 3 columns
 * Columns: Name (string), Class (string), Monthly Fee (numeric)
 */
export function parseCSVContent(csvContent: string): CSVRow[] {
  const lines = csvContent.trim().split("\n");
  const rows: CSVRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Parse CSV line (handle quoted values)
    const values = parseCSVLine(line);

    // Only take first 3 columns
    const row: CSVRow = {
      column1: values[0] || "",
      column2: values[1] || "",
      column3: values[2] || "",
    };

    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      // End of field
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current.trim());

  return result;
}

/**
 * Validate and parse a CSV row into a Student object
 */
export function parseStudentRow(row: CSVRow, rowNumber: number): ParsedStudent {
  const name = String(row.column1 || "").trim();
  const classValue = String(row.column2 || "").trim();
  const monthlyFeeStr = String(row.column3 || "").trim();

  // Validate name
  if (!name) {
    return {
      name: "",
      class: "",
      monthlyFee: 0,
      isValid: false,
      error: `Row ${rowNumber}: Name is required`,
    };
  }

  // Validate class
  if (!classValue) {
    return {
      name,
      class: "",
      monthlyFee: 0,
      isValid: false,
      error: `Row ${rowNumber}: Class is required`,
    };
  }

  // Validate and parse monthly fee
  const monthlyFee = parseFloat(monthlyFeeStr);
  if (isNaN(monthlyFee) || monthlyFee <= 0) {
    return {
      name,
      class: classValue,
      monthlyFee: 0,
      isValid: false,
      error: `Row ${rowNumber}: Monthly fee must be a positive number (got "${monthlyFeeStr}")`,
    };
  }

  return {
    name,
    class: classValue,
    monthlyFee,
    isValid: true,
  };
}

/**
 * Import CSV content and convert to Student objects
 */
export function importCSV(csvContent: string): CSVImportResult {
  const rows = parseCSVContent(csvContent);
  const students: Student[] = [];
  const errors: Array<{
    rowNumber: number;
    error: string;
    data: string[];
  }> = [];

  let validCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1; // 1-indexed for user display

    // Parse and validate
    const parsed = parseStudentRow(row, rowNumber);

    if (!parsed.isValid) {
      errors.push({
        rowNumber,
        error: parsed.error || "Unknown error",
        data: [
          String(row.column1 || ""),
          String(row.column2 || ""),
          String(row.column3 || ""),
        ],
      });
      continue;
    }

    // Create student object
    const student: Student = {
      id: `student_${uuidv4()}`,
      name: parsed.name,
      class: parsed.class,
      monthlyFee: parsed.monthlyFee,
      createdAt: new Date().toISOString(),
    };

    students.push(student);
    validCount++;
  }

  return {
    totalRows: rows.length,
    validRows: validCount,
    invalidRows: errors.length,
    students,
    errors,
  };
}

/**
 * Generate sample CSV content for user reference
 */
export function generateSampleCSV(): string {
  return `Name,Class,Monthly Fee
John Doe,10-A,5000
Jane Smith,10-B,5500
Ahmed Khan,9-A,4500
Priya Sharma,9-B,5000
Raj Patel,11-A,6000`;
}

/**
 * Validate CSV structure
 * Returns true if CSV has at least 1 row with 3 columns
 */
export function isValidCSVStructure(csvContent: string): boolean {
  const rows = parseCSVContent(csvContent);
  return rows.length > 0;
}

/**
 * Format CSV import result for display
 */
export function formatImportResult(result: CSVImportResult): string {
  let message = `Import Summary:\n`;
  message += `Total rows: ${result.totalRows}\n`;
  message += `Valid: ${result.validRows}\n`;
  message += `Invalid: ${result.invalidRows}\n`;

  if (result.errors.length > 0) {
    message += `\nErrors:\n`;
    result.errors.forEach((error) => {
      message += `- Row ${error.rowNumber}: ${error.error}\n`;
    });
  }

  return message;
}
