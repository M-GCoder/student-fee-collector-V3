import * as XLSX from "xlsx";
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
 * Supports 6 columns: Name, Class, Amount, Due Date, Email, Password
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

    // Read file as base64 (React Native compatible)
    let fileData: any;
    
    try {
      // Try reading from file URI directly using FileSystem
      const base64Data = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Parse base64 data
      fileData = base64Data;
    } catch (fsError) {
      // Fallback: try fetch method with arrayBuffer
      try {
        const response = await fetch(file.uri);
        if (!response.ok) {
          throw new Error(`Failed to read file: ${response.statusText}`);
        }

        // Use text() instead of arrayBuffer() for React Native compatibility
        const text = await response.text();
        fileData = text;
      } catch (fetchError) {
        throw new Error(`Failed to read file: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      }
    }

    if (!fileData) {
      throw new Error("File is empty or could not be read");
    }

    // Parse workbook - handle both base64 string and text
    const workbook = XLSX.read(fileData, { type: typeof fileData === 'string' ? "base64" : "binary" });
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
    const firstRow = rawData[0];
    const hasHeaders = isHeaderRow(firstRow);

    // Convert to array of objects with positional column names
    // 6 columns: Name, Class, Amount, Due Date, Email, Password
    const startIndex = hasHeaders ? 1 : 0;
    const data = rawData.slice(startIndex).map((row) => ({
      column1: row[0] || "", // Name
      column2: row[1] || "", // Class
      column3: row[2] || "", // Monthly Amount/Fee
      column4: row[3] || "", // Due Date (DD/MM/YYYY or DD-MM-YYYY)
      column5: row[4] || "", // Email
      column6: row[5] || "", // Password
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
 * Headers typically contain column names like "Name", "Class", "Amount", "Email", etc.
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
    "email",
    "password",
    "id",
    "roll",
  ];

  // Check if any of the first 6 columns contain header keywords
  const firstSix = row.slice(0, 6).map((cell) => String(cell).toLowerCase().trim());

  const matchCount = firstSix.filter((cell) =>
    headerKeywords.some((keyword) => cell.includes(keyword))
  ).length;

  // If 3 or more columns match header keywords, it's likely a header row
  return matchCount >= 3;
}

/**
 * Parse monthly due date (1-30)
 */
function parseMonthlyDueDate(dueDateStr: string): number | null {
  if (!dueDateStr) return null;

  const dueDate = parseInt(String(dueDateStr).trim(), 10);

  // Validate that it's a number between 1 and 30
  if (isNaN(dueDate) || dueDate < 1 || dueDate > 30) {
    return null;
  }

  return dueDate;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate and process imported student data
 * Handles 6 columns: Name, Class, Amount, Due Date, Email, Password
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
  const existingEmails = new Set(existingStudents.map((s) => s.email?.toLowerCase()).filter(Boolean));

  data.forEach((row, index) => {
    try {
      // Extract fields from positional columns
      const name = String(row.column1 || "").trim();
      const className = String(row.column2 || "").trim();
      const monthlyFee = parseFloat(String(row.column3 || "0"));
      const dueDate = String(row.column4 || "").trim();
      const email = String(row.column5 || "").trim().toLowerCase();
      const password = String(row.column6 || "").trim();

      // Validation
      if (!name) {
        throw new Error("Student name is required (Column 1)");
      }

      if (!className) {
        throw new Error("Class is required (Column 2)");
      }

      if (isNaN(monthlyFee) || monthlyFee <= 0) {
        throw new Error("Monthly amount must be a positive number (Column 3)");
      }

      // Validate monthly due date if provided (1-30)
      let monthlyDueDate: number | undefined;
      if (dueDate) {
        monthlyDueDate = parseMonthlyDueDate(dueDate) || undefined;
        if (dueDate && monthlyDueDate === undefined) {
          throw new Error("Monthly due date must be a number between 1 and 30 (Column 4)");
        }
      }

      // Validate email if provided
      if (email && !isValidEmail(email)) {
        throw new Error("Invalid email format (Column 5)");
      }

      // Validate password if provided
      if (password && password.length < 6) {
        throw new Error("Password must be at least 6 characters (Column 6)");
      }

      // Check for duplicate names
      if (existingNames.has(name.toLowerCase())) {
        throw new Error(`Student "${name}" already exists`);
      }

      // Check for duplicate emails
      if (email && existingEmails.has(email)) {
        throw new Error(`Email "${email}" already exists`);
      }

      // Create student object
      const student: Student = {
        id: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        class: className,
        monthlyFee,
        monthlyDueDate,
        email: email || undefined,
        password: password || undefined,
        createdAt: new Date().toISOString(),
      };

      result.students.push(student);
      result.success++;
      existingNames.add(name.toLowerCase());
      if (email) {
        existingEmails.add(email);
      }
    } catch (error) {
      result.failed++;
      result.errors.push({
        row: index + 1,
        name: String(row.column1 || "Unknown"),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return result;
}

/**
 * Generate sample import template with 6 columns
 */
export async function generateSampleTemplate(): Promise<void> {
  try {
    const sampleData = [
      ["Name", "Class", "Amount", "Monthly Due Date (1-30)", "Email", "Password"],
      ["John Doe", "10-A", "5000", "15", "john@example.com", "password123"],
      ["Jane Smith", "10-B", "5000", "20", "jane@example.com", "password456"],
      ["Bob Johnson", "9-A", "4500", "10", "bob@example.com", "password789"],
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(sampleData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 20 }, // Name
      { wch: 12 }, // Class
      { wch: 12 }, // Amount
      { wch: 18 }, // Monthly Due Date (1-30)
      { wch: 25 }, // Email
      { wch: 15 }, // Password
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    // Generate file
    const fileName = `student_import_template_${Date.now()}.xlsx`;
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

    // Convert workbook to binary string
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "binary" });
    const buf = new ArrayBuffer(wbout.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < wbout.length; i++) {
      view[i] = wbout.charCodeAt(i) & 0xff;
    }

    // Write to file
    await FileSystem.writeAsStringAsync(fileUri, String.fromCharCode.apply(null, Array.from(view)), {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Share file
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: "Download Student Import Template",
    });
  } catch (error) {
    console.error("Error generating sample template:", error);
    throw error;
  }
}
