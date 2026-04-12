import AsyncStorage from "@react-native-async-storage/async-storage";
import { Student, Payment, StudentWithPayments } from "./types";

const STUDENTS_KEY = "students";
const PAYMENTS_KEY = "payments";
const STORAGE_VERSION_KEY = "storage_version";
const CURRENT_VERSION = "1";

let isInitialized = false;
let initializationError: Error | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize storage with error handling and re-entrancy protection
 * Uses a lock to prevent concurrent initialization attempts
 */
export async function initializeStorage(): Promise<void> {
  // Return existing promise if initialization is in progress
  if (initPromise) {
    return initPromise;
  }

  // Return immediately if already initialized
  if (isInitialized) {
    return;
  }

  // Create initialization promise and store it
  initPromise = (async () => {
    try {
      // Test AsyncStorage availability
      const version = await AsyncStorage.getItem(STORAGE_VERSION_KEY);
      if (!version) {
        await AsyncStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
      }
      
      isInitialized = true;
      initializationError = null;
    } catch (error) {
      initializationError = error instanceof Error ? error : new Error("Unknown storage error");
      console.error("Storage initialization failed:", initializationError);
      // Mark as initialized even on error to prevent retry loops
      isInitialized = true;
    } finally {
      // Clear the promise after initialization completes
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Get all students from storage with safe fallback
 */
export async function getStudents(): Promise<Student[]> {
  try {
    await initializeStorage();
    
    if (initializationError) {
      console.warn("Storage not available, returning empty array");
      return [];
    }
    
    const data = await AsyncStorage.getItem(STUDENTS_KEY);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error reading students:", error);
    return [];
  }
}

/**
 * Get all payments from storage with safe fallback
 */
export async function getPayments(): Promise<Payment[]> {
  try {
    await initializeStorage();
    
    if (initializationError) {
      console.warn("Storage not available, returning empty array");
      return [];
    }
    
    const data = await AsyncStorage.getItem(PAYMENTS_KEY);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error reading payments:", error);
    return [];
  }
}

/**
 * Save a single student to storage
 */
export async function saveStudent(student: Student): Promise<void> {
  try {
    await initializeStorage();
    
    if (initializationError) {
      throw new Error("Storage not available");
    }
    
    const students = await getStudents();
    const index = students.findIndex((s) => s.id === student.id);
    
    if (index >= 0) {
      students[index] = student;
    } else {
      students.push(student);
    }
    
    await AsyncStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  } catch (error) {
    console.error("Error saving student:", error);
    throw error;
  }
}

/**
 * Save multiple students to storage
 */
export async function saveStudents(students: Student[]): Promise<void> {
  try {
    await initializeStorage();
    
    if (initializationError) {
      throw new Error("Storage not available");
    }
    
    await AsyncStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  } catch (error) {
    console.error("Error saving students:", error);
    throw error;
  }
}

/**
 * Delete a student from storage
 */
export async function deleteStudent(studentId: string | number): Promise<void> {
  try {
    await initializeStorage();
    
    if (initializationError) {
      throw new Error("Storage not available");
    }
    
    const students = await getStudents();
    const filtered = students.filter((s) => s.id !== studentId);
    await AsyncStorage.setItem(STUDENTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting student:", error);
    throw error;
  }
}

/**
 * Save a single payment to storage
 */
export async function savePayment(payment: Payment): Promise<void> {
  try {
    await initializeStorage();
    
    if (initializationError) {
      throw new Error("Storage not available");
    }
    
    const payments = await getPayments();
    const index = payments.findIndex((p) => p.id === payment.id);
    
    if (index >= 0) {
      payments[index] = payment;
    } else {
      payments.push(payment);
    }
    
    await AsyncStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
  } catch (error) {
    console.error("Error saving payment:", error);
    throw error;
  }
}

/**
 * Save multiple payments to storage
 */
export async function savePayments(payments: Payment[]): Promise<void> {
  try {
    await initializeStorage();
    
    if (initializationError) {
      throw new Error("Storage not available");
    }
    
    await AsyncStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
  } catch (error) {
    console.error("Error saving payments:", error);
    throw error;
  }
}

/**
 * Delete a payment from storage
 */
export async function deletePayment(paymentId: string | number): Promise<void> {
  try {
    await initializeStorage();
    
    if (initializationError) {
      throw new Error("Storage not available");
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
 * Get students with their payments
 */
export async function getStudentsWithPayments(): Promise<StudentWithPayments[]> {
  try {
    await initializeStorage();
    
    if (initializationError) {
      console.warn("Storage not available, returning empty array");
      return [];
    }
    
    const students = await getStudents();
    const payments = await getPayments();
    
    return students.map((student) => ({
      ...student,
      payments: payments.filter((p) => p.studentId === student.id),
    }));
  } catch (error) {
    console.error("Error getting students with payments:", error);
    return [];
  }
}

/**
 * Update a student in storage
 */
export async function updateStudent(student: Student): Promise<void> {
  return saveStudent(student);
}

/**
 * Get a single student with their payments
 */
export async function getStudentWithPayments(studentId: string): Promise<StudentWithPayments | null> {
  try {
    const students = await getStudents();
    const student = students.find((s) => s.id === studentId);
    if (!student) return null;
    
    const payments = await getPayments();
    return {
      ...student,
      payments: payments.filter((p) => p.studentId === studentId),
    };
  } catch (error) {
    console.error("Error getting student with payments:", error);
    return null;
  }
}

/**
 * Get payment for a specific month and year
 */
export async function getPaymentForMonth(
  studentId: string,
  month: number,
  year: number
): Promise<Payment | undefined> {
  try {
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
    const payments = await getPayments();
    return payments.filter((p) => p.studentId === studentId);
  } catch (error) {
    console.error("Error getting student payments:", error);
    return [];
  }
}

/**
 * Clear all storage (for testing or reset)
 */
export async function clearStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([STUDENTS_KEY, PAYMENTS_KEY, STORAGE_VERSION_KEY]);
    isInitialized = false;
    initializationError = null;
  } catch (error) {
    console.error("Error clearing storage:", error);
    throw error;
  }
}
