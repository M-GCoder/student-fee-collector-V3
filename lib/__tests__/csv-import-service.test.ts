import { describe, it, expect } from "vitest";
import {
  parseCSVContent,
  parseStudentRow,
  importCSV,
  generateSampleCSV,
  isValidCSVStructure,
  formatImportResult,
} from "../csv-import-service";

describe("CSV Import Service", () => {
  describe("parseCSVContent", () => {
    it("should parse simple CSV with 3 columns (no headers)", () => {
      const csv = `John Doe,10-A,5000
Jane Smith,10-B,5500`;

      const { rows, hasHeaders } = parseCSVContent(csv);

      expect(hasHeaders).toBe(false);
      expect(rows).toHaveLength(2);
      expect(rows[0].column1).toBe("John Doe");
      expect(rows[0].column2).toBe("10-A");
      expect(rows[0].column3).toBe("5000");
    });

    it("should detect and skip header row", () => {
      const csv = `Name,Class,Fee
John Doe,10-A,5000
Jane Smith,10-B,5500`;

      const { rows, hasHeaders } = parseCSVContent(csv);

      expect(hasHeaders).toBe(true);
      expect(rows).toHaveLength(2);
      expect(rows[0].column1).toBe("John Doe");
    });

    it("should handle CSV with more than 3 columns (only take first 3)", () => {
      const csv = `John Doe,10-A,5000,extra1,extra2`;

      const { rows } = parseCSVContent(csv);

      expect(rows).toHaveLength(1);
      expect(rows[0].column1).toBe("John Doe");
      expect(rows[0].column2).toBe("10-A");
      expect(rows[0].column3).toBe("5000");
      expect(rows[0].column4).toBeUndefined();
    });

    it("should handle quoted values with commas", () => {
      const csv = `"Doe, John",10-A,5000`;

      const { rows } = parseCSVContent(csv);

      expect(rows).toHaveLength(1);
      expect(rows[0].column1).toBe("Doe, John");
    });

    it("should skip empty lines", () => {
      const csv = `John Doe,10-A,5000

Jane Smith,10-B,5500`;

      const { rows } = parseCSVContent(csv);

      expect(rows).toHaveLength(2);
    });

    it("should handle whitespace", () => {
      const csv = `  John Doe  ,  10-A  ,  5000  `;

      const { rows } = parseCSVContent(csv);

      expect(rows).toHaveLength(1);
      expect(rows[0].column1).toBe("John Doe");
      expect(rows[0].column2).toBe("10-A");
      expect(rows[0].column3).toBe("5000");
    });

    it("should detect headers with various keyword matches", () => {
      const csv1 = `Student Name,Class,Monthly Fee
John Doe,10-A,5000`;
      const { hasHeaders: h1 } = parseCSVContent(csv1);
      expect(h1).toBe(true);

      const csv2 = `ID,Grade,Amount
1,10,5000`;
      const { hasHeaders: h2 } = parseCSVContent(csv2);
      expect(h2).toBe(true);

      const csv3 = `John Doe,10-A,5000`;
      const { hasHeaders: h3 } = parseCSVContent(csv3);
      expect(h3).toBe(false);
    });
  });

  describe("parseStudentRow", () => {
    it("should parse valid student row", () => {
      const row = {
        column1: "John Doe",
        column2: "10-A",
        column3: "5000",
      };

      const result = parseStudentRow(row, 1);

      expect(result.isValid).toBe(true);
      expect(result.name).toBe("John Doe");
      expect(result.class).toBe("10-A");
      expect(result.monthlyFee).toBe(5000);
    });

    it("should reject missing name", () => {
      const row = {
        column1: "",
        column2: "10-A",
        column3: "5000",
      };

      const result = parseStudentRow(row, 1);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Name is required");
    });

    it("should reject missing class", () => {
      const row = {
        column1: "John Doe",
        column2: "",
        column3: "5000",
      };

      const result = parseStudentRow(row, 1);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Class is required");
    });

    it("should reject invalid monthly fee (non-numeric)", () => {
      const row = {
        column1: "John Doe",
        column2: "10-A",
        column3: "abc",
      };

      const result = parseStudentRow(row, 1);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("positive number");
    });

    it("should reject zero or negative monthly fee", () => {
      const row = {
        column1: "John Doe",
        column2: "10-A",
        column3: "0",
      };

      const result = parseStudentRow(row, 1);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("positive number");
    });

    it("should handle decimal monthly fee", () => {
      const row = {
        column1: "John Doe",
        column2: "10-A",
        column3: "5000.50",
      };

      const result = parseStudentRow(row, 1);

      expect(result.isValid).toBe(true);
      expect(result.monthlyFee).toBe(5000.5);
    });
  });

  describe("importCSV", () => {
    it("should import valid CSV successfully (no headers)", () => {
      const csv = `John Doe,10-A,5000
Jane Smith,10-B,5500`;

      const result = importCSV(csv);

      expect(result.hasHeaders).toBe(false);
      expect(result.totalRows).toBe(2);
      expect(result.validRows).toBe(2);
      expect(result.invalidRows).toBe(0);
      expect(result.students).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it("should import valid CSV with headers", () => {
      const csv = `Name,Class,Fee
John Doe,10-A,5000
Jane Smith,10-B,5500`;

      const result = importCSV(csv);

      expect(result.hasHeaders).toBe(true);
      expect(result.totalRows).toBe(2);
      expect(result.validRows).toBe(2);
      expect(result.students).toHaveLength(2);
    });

    it("should handle mixed valid and invalid rows", () => {
      const csv = `John Doe,10-A,5000
Jane Smith,,5500
Ahmed Khan,9-A,4500`;

      const result = importCSV(csv);

      expect(result.totalRows).toBe(3);
      expect(result.validRows).toBe(2);
      expect(result.invalidRows).toBe(1);
      expect(result.students).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
    });

    it("should generate unique IDs for each student", () => {
      const csv = `John Doe,10-A,5000
Jane Smith,10-B,5500`;

      const result = importCSV(csv);

      expect(result.students[0].id).not.toBe(result.students[1].id);
      expect(result.students[0].id).toMatch(/^student_/);
    });

    it("should set createdAt timestamp", () => {
      const csv = `John Doe,10-A,5000`;

      const result = importCSV(csv);

      expect(result.students[0].createdAt).toBeDefined();
      expect(new Date(result.students[0].createdAt)).toBeInstanceOf(Date);
    });

    it("should handle CSV with extra columns", () => {
      const csv = `John Doe,10-A,5000,extra1,extra2
Jane Smith,10-B,5500,extra3`;

      const result = importCSV(csv);

      expect(result.validRows).toBe(2);
      expect(result.students).toHaveLength(2);
    });
  });

  describe("generateSampleCSV", () => {
    it("should generate valid sample CSV without headers", () => {
      const sample = generateSampleCSV();

      expect(sample).toContain("John Doe");
      expect(sample).toContain("10-A");
      expect(sample).toContain("5000");
      // Should NOT have header row
      expect(sample).not.toContain("Name");
      expect(sample).not.toContain("Class");
    });

    it("sample CSV should be importable", () => {
      const sample = generateSampleCSV();
      const result = importCSV(sample);

      expect(result.validRows).toBeGreaterThan(0);
      expect(result.students.length).toBeGreaterThan(0);
    });
  });

  describe("isValidCSVStructure", () => {
    it("should return true for valid CSV", () => {
      const csv = `John Doe,10-A,5000`;

      expect(isValidCSVStructure(csv)).toBe(true);
    });

    it("should return false for empty CSV", () => {
      expect(isValidCSVStructure("")).toBe(false);
    });

    it("should return false for only whitespace", () => {
      expect(isValidCSVStructure("   \n   ")).toBe(false);
    });
  });

  describe("formatImportResult", () => {
    it("should format successful import result", () => {
      const csv = `John Doe,10-A,5000
Jane Smith,10-B,5500`;
      const result = importCSV(csv);
      const formatted = formatImportResult(result);

      expect(formatted).toContain("Import Summary");
      expect(formatted).toContain("Total rows: 2");
      expect(formatted).toContain("Valid: 2");
      expect(formatted).toContain("Invalid: 0");
    });

    it("should format import result with errors", () => {
      const csv = `John Doe,10-A,5000
Jane Smith,,5500`;
      const result = importCSV(csv);
      const formatted = formatImportResult(result);

      expect(formatted).toContain("Errors");
    });
  });

  describe("Edge cases", () => {
    it("should handle single row CSV", () => {
      const csv = `John Doe,10-A,5000`;

      const result = importCSV(csv);

      expect(result.validRows).toBe(1);
      expect(result.students).toHaveLength(1);
    });

    it("should handle large monthly fees", () => {
      const csv = `John Doe,10-A,999999.99`;

      const result = importCSV(csv);

      expect(result.validRows).toBe(1);
      expect(result.students[0].monthlyFee).toBe(999999.99);
    });

    it("should handle special characters in names and classes", () => {
      const csv = `José García,10-A (Special),5000
李明,11-B,5500`;

      const result = importCSV(csv);

      expect(result.validRows).toBe(2);
      expect(result.students[0].name).toBe("José García");
      expect(result.students[1].name).toBe("李明");
    });

    it("should trim whitespace from all fields", () => {
      const csv = `  John Doe  ,  10-A  ,  5000  `;

      const result = importCSV(csv);

      expect(result.students[0].name).toBe("John Doe");
      expect(result.students[0].class).toBe("10-A");
    });
  });
});
