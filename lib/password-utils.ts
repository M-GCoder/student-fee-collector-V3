/**
 * Password utility functions for secure password handling
 */

/**
 * Simple hash function for passwords (not cryptographically secure)
 * For production, use bcrypt or similar library
 * This is a basic implementation for demonstration
 */
export function hashPassword(password: string): string {
  if (!password) return "";
  
  // Simple hash using base64 encoding with salt
  // In production, use bcrypt: import bcrypt from 'bcryptjs'
  const salt = "student_fee_collector_2024";
  const combined = password + salt;
  
  // Convert to base64 as a simple hash representation
  // Use btoa (native browser/RN API) instead of Buffer for compatibility
  try {
    return btoa(combined);
  } catch (error) {
    // If btoa fails, return the combined string as fallback
    console.warn("Failed to hash password:", error);
    return combined;
  }
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password) {
    errors.push("Password is required");
    return { isValid: false, errors };
  }

  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (password.length > 128) {
    errors.push("Password must not exceed 128 characters");
  }

  // Optional: Add more strength requirements
  // if (!/[A-Z]/.test(password)) {
  //   errors.push("Password must contain at least one uppercase letter");
  // }
  // if (!/[0-9]/.test(password)) {
  //   errors.push("Password must contain at least one number");
  // }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email) return true; // Email is optional
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize email (lowercase, trim)
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Check if password and email combination is unique (placeholder)
 * In production, this would query the database
 */
export async function isCredentialUnique(
  email: string,
  existingStudents: Array<{ email?: string }>
): Promise<boolean> {
  if (!email) return true; // Email is optional
  
  const sanitized = sanitizeEmail(email);
  const exists = existingStudents.some(
    (student) => student.email && sanitizeEmail(student.email) === sanitized
  );
  
  return !exists;
}
