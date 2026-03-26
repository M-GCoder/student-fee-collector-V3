import { Student } from "./types";
// Simple ID generator that works on web (no crypto dependency)
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

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
  hasHeaders: boolean;
}

/**
 * Parse CSV text content
 * Handles flexible column structure - only uses first 3 columns
 * Columns: Name (string), Class (string), Monthly Fee (numeric)
 * Works with or without header rows
 */
export function parseCSVContent(csvContent: string): { rows: CSVRow[]; hasHeaders: boolean } {
  const lines = csvContent.trim().split("\n");
  const rows: CSVRow[] = [];

  if (lines.length === 0) {
    return { rows: [], hasHeaders: false };
  }

  // Parse all lines first
  const allRows: string[][] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Parse CSV line (handle quoted values)
    const values = parseCSVLine(line);
    allRows.push(values);
  }

  if (allRows.length === 0) {
    return { rows: [], hasHeaders: false };
  }

  // Detect if first row is headers
  const hasHeaders = isHeaderRow(allRows[0]);

  // Start from row 1 if headers, row 0 if no headers
  const startIndex = hasHeaders ? 1 : 0;

  // Convert to CSVRow objects with positional columns
  for (let i = startIndex; i < allRows.length; i++) {
    const values = allRows[i];
    const row: CSVRow = {
      column1: values[0] || "",
      column2: values[1] || "",
      column3: values[2] || "",
    };
    rows.push(row);
  }

  return { rows, hasHeaders };
}

/**
 * Detect if a row is a header row
 * Headers typically contain column names like "Name", "Class", "Fee", etc.
 */
function isHeaderRow(row: string[]): boolean {
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
      error: `Row ${rowNumber}: Name is required (Column 1)`,
    };
  }

  // Validate class
  if (!classValue) {
    return {
      name,
      class: "",
      monthlyFee: 0,
      isValid: false,
      error: `Row ${rowNumber}: Class is required (Column 2)`,
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
      error: `Row ${rowNumber}: Monthly fee must be a positive number (Column 3, got "${monthlyFeeStr}")`,
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
  const { rows, hasHeaders } = parseCSVContent(csvContent);
  const students: Student[] = [];
  const errors: Array<{
    rowNumber: number;
    error: string;
    data: string[];
  }> = [];

  let validCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + (hasHeaders ? 2 : 1); // Adjust for headers if present

    // Parse and validate
    const parsed = parseStudentRow(row, rowNumber);

    if (!parsed.isValid) {
      errors.push({
        rowNumber,
        error: parsed.error || "Unknown error",
        data: [String(row.column1 || ""), String(row.column2 || ""), String(row.column3 || "")],
      });
      continue;
    }

    // Create student object
    const student: Student = {
      id: `student_${generateId()}`,
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
    hasHeaders,
  };
}

/**
 * Generate sample CSV content for user reference
 */
export function generateSampleCSV(): string {
  return `John Doe,10-A,5000
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
  const { rows } = parseCSVContent(csvContent);
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
