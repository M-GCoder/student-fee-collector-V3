import { describe, it, expect } from "vitest";
import {
  hashPassword,
  validatePasswordStrength,
  validateEmail,
  sanitizeEmail,
  isCredentialUnique,
} from "../password-utils";

describe("Password Utils", () => {
  describe("hashPassword", () => {
    it("should hash password consistently", () => {
      const password = "test123";
      const hash1 = hashPassword(password);
      const hash2 = hashPassword(password);
      expect(hash1).toBe(hash2);
    });

    it("should return empty string for empty password", () => {
      expect(hashPassword("")).toBe("");
    });

    it("should produce different hashes for different passwords", () => {
      const hash1 = hashPassword("password1");
      const hash2 = hashPassword("password2");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("validatePasswordStrength", () => {
    it("should validate strong password", () => {
      const result = validatePasswordStrength("SecurePass123");
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("should reject password shorter than 6 characters", () => {
      const result = validatePasswordStrength("pass");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must be at least 6 characters long");
    });

    it("should reject empty password", () => {
      const result = validatePasswordStrength("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password is required");
    });

    it("should reject password exceeding 128 characters", () => {
      const longPassword = "a".repeat(129);
      const result = validatePasswordStrength(longPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must not exceed 128 characters");
    });

    it("should accept 6 character password", () => {
      const result = validatePasswordStrength("pass12");
      expect(result.isValid).toBe(true);
    });
  });

  describe("validateEmail", () => {
    it("should validate correct email format", () => {
      expect(validateEmail("student@example.com")).toBe(true);
      expect(validateEmail("john.doe@school.org")).toBe(true);
      expect(validateEmail("test+tag@domain.co.uk")).toBe(true);
    });

    it("should reject invalid email format", () => {
      expect(validateEmail("invalid.email")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
      expect(validateEmail("student@")).toBe(false);
      expect(validateEmail("student @example.com")).toBe(false);
    });

    it("should allow empty email (optional field)", () => {
      expect(validateEmail("")).toBe(true);
    });
  });

  describe("sanitizeEmail", () => {
    it("should convert email to lowercase", () => {
      expect(sanitizeEmail("Student@Example.COM")).toBe("student@example.com");
    });

    it("should trim whitespace", () => {
      expect(sanitizeEmail("  student@example.com  ")).toBe("student@example.com");
    });

    it("should handle both transformations", () => {
      expect(sanitizeEmail("  STUDENT@EXAMPLE.COM  ")).toBe("student@example.com");
    });
  });

  describe("isCredentialUnique", () => {
    it("should return true for empty email", async () => {
      const students = [{ email: "existing@example.com" }];
      expect(await isCredentialUnique("", students)).toBe(true);
    });

    it("should return true for unique email", async () => {
      const students = [{ email: "existing@example.com" }];
      expect(await isCredentialUnique("new@example.com", students)).toBe(true);
    });

    it("should return false for duplicate email (case-insensitive)", async () => {
      const students = [{ email: "student@example.com" }];
      expect(await isCredentialUnique("STUDENT@EXAMPLE.COM", students)).toBe(false);
    });

    it("should return true for empty student list", async () => {
      expect(await isCredentialUnique("student@example.com", [])).toBe(true);
    });

    it("should handle students without email", async () => {
      const students = [{ email: undefined }, { email: "existing@example.com" }];
      expect(await isCredentialUnique("new@example.com", students)).toBe(true);
    });
  });
});
