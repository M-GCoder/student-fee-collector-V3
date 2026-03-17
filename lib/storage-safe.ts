import AsyncStorage from "@react-native-async-storage/async-storage";
import { Student, Payment, StudentWithPayments } from "./types";

const STUDENTS_KEY = "students";
const PAYMENTS_KEY = "payments";
const STORAGE_VERSION_KEY = "storage_version";
const CURRENT_VERSION = "1";

let isInitialized = false;
let initializationError: Error | null = null;

/**
 * Initialize storage with error handling
 * This should be called once at app startup
 */
export async function initializeStorage(): Promise<void> {
  if (isInitialized) return;

  try {
    // Test AsyncStorage availability
    await AsyncStorage.getItem(STORAGE_VERSION_KEY);
    
    // Set version if not exists
    const version = await AsyncStorage.getItem(STORAGE_VERSION_KEY);
    if (!version) {
      await AsyncStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
    }
    
    isInitialized = true;
  } catch (error) {
    initializationError = error instanceof Error ? error : new Error("Unknown storage error");
    console.error("Storage initialization failed:", initializationError);
    // Don't throw - allow app to continue with empty data
  }
}

/**
 * Get all students from storage with safe fallback
 */
export async function getStudents(): Promise<Student[]> {
  try {
    if (!isInitialized) {
      await initializeStorage();
    }
    
    const data = await AsyncStorage.getItem(STUDENTS_KEY);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error getting students:", error);
    return [];
  }
}

/**
 * Save a new student with error handling
 */
export async function saveStudent(student: Student): Promise<void> {
  try {
    if (!isInitialized) {
      await initializeStorage();
    }
    
    const students = await getStudents();
    students.push(student);
    await AsyncStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  } catch (error) {
    console.error("Error saving student:", error);
    throw error;
  }
}

/**
 * Update an existing student with error handling
 */
export async function updateStudent(student: Student): Promise<void> {
  try {
    if (!isInitialized) {
      await initializeStorage();
    }
    
    const students = await getStudents();
    const index = students.findIndex((s) => s.id === student.id);
    if (index !== -1) {
      students[index] = student;
      await AsyncStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
    }
  } catch (error) {
    console.error("Error updating student:", error);
    throw error;
  }
}

/**
 * Delete a student with error handling
 */
export async function deleteStudent(studentId: string): Promise<void> {
  try {
    if (!isInitialized) {
      await initializeStorage();
    }
    
    const students = await getStudents();
    const filtered = students.filter((s) => s.id !== studentId);
    await AsyncStorage.setItem(STUDENTS_KEY, JSON.stringify(filtered));
    
    // Also delete all payments for this student
    await deletePaymentsByStudent(studentId);
  } catch (error) {
    console.error("Error deleting student:", error);
    throw error;
  }
}

/**
 * Get all payments from storage with safe fallback
 */
export async function getPayments(): Promise<Payment[]> {
  try {
    if (!isInitialized) {
      await initializeStorage();
    }
    
    const data = await AsyncStorage.getItem(PAYMENTS_KEY);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error getting payments:", error);
    return [];
  }
}

/**
 * Save a payment with error handling
 */
export async function savePayment(payment: Payment): Promise<void> {
  try {
    if (!isInitialized) {
      await initializeStorage();
    }
    
    const payments = await getPayments();
    payments.push(payment);
    await AsyncStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
  } catch (error) {
    console.error("Error saving payment:", error);
    throw error;
  }
}

/**
 * Delete a payment with error handling
 */
export async function deletePayment(paymentId: string): Promise<void> {
  try {
    if (!isInitialized) {
      await initializeStorage();
    }
    
    const payments = await getPayments();
    const filtered = payments.filter((p) => p.id !== paymentId);
    await AsyncStorage.setItem(PAYMENTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting payment:", error);
    throw error;
  }
}

/**
 * Delete all payments for a student
 */
export async function deletePaymentsByStudent(studentId: string): Promise<void> {
  try {
    if (!isInitialized) {
      await initializeStorage();
    }
    
    const payments = await getPayments();
    const filtered = payments.filter((p) => p.studentId !== studentId);
    await AsyncStorage.setItem(PAYMENTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting payments by student:", error);
    throw error;
  }
}

/**
 * Get student with payments
 */
export async function getStudentWithPayments(
  studentId: string
): Promise<StudentWithPayments | null> {
  try {
    if (!isInitialized) {
      await initializeStorage();
    }
    
    const students = await getStudents();
    const student = students.find((s) => s.id === studentId);
    
    if (!student) return null;
    
    const payments = await getPayments();
    const studentPayments = payments.filter((p) => p.studentId === studentId);
    
    return {
      ...student,
      payments: studentPayments,
    };
  } catch (error) {
    console.error("Error getting student with payments:", error);
    return null;
  }
}

/**
 * Get payment for specific month
 */
export async function getPaymentForMonth(
  studentId: string,
  month: number,
  year: number
): Promise<Payment | undefined> {
  try {
    if (!isInitialized) {
      await initializeStorage();
    }
    
    const payments = await getPayments();
    return payments.find(
      (p) => p.studentId === studentId && p.month === month && p.year === year
    );
  } catch (error) {
    console.error("Error getting payment for month:", error);
    return undefined;
  }
}

/**
 * Get all payments for a student
 */
export async function getStudentPayments(studentId: string): Promise<Payment[]> {
  try {
    if (!isInitialized) {
      await initializeStorage();
    }
    
    const payments = await getPayments();
    return payments.filter((p) => p.studentId === studentId);
  } catch (error) {
    console.error("Error getting student payments:", error);
    return [];
  }
}

/**
 * Clear all data (for testing or reset)
 */
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([STUDENTS_KEY, PAYMENTS_KEY]);
  } catch (error) {
    console.error("Error clearing data:", error);
    throw error;
  }
}

/**
 * Check if storage is available
 */
export function isStorageAvailable(): boolean {
  return isInitialized && !initializationError;
}

/**
 * Get storage initialization error if any
 */
export function getStorageError(): Error | null {
  return initializationError;
}
