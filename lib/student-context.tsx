import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Student, Payment, StudentWithPayments } from "./types";
import * as storage from "./storage";

interface StudentContextType {
  students: Student[];
  payments: Payment[];
  loading: boolean;
  error: string | null;

  // Student operations
  addStudent: (student: Omit<Student, "id" | "createdAt">) => Promise<void>;
  updateStudent: (student: Student) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  getStudentWithPayments: (studentId: string) => Promise<StudentWithPayments | null>;

  // Payment operations
  addPayment: (studentId: string, month: number, year: number) => Promise<void>;
  deletePayment: (paymentId: string) => Promise<void>;
  getPaymentForMonth: (studentId: string, month: number, year: number) => Promise<Payment | undefined>;
  getStudentPayments: (studentId: string) => Promise<Payment[]>;

  // Utility
  refreshData: () => Promise<void>;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [studentsData, paymentsData] = await Promise.all([storage.getStudents(), storage.getPayments()]);
      setStudents(studentsData);
      setPayments(paymentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async (studentData: Omit<Student, "id" | "createdAt">) => {
    try {
      const newStudent: Student = {
        ...studentData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      await storage.saveStudent(newStudent);
      setStudents((prev) => [...prev, newStudent]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add student");
      throw err;
    }
  };

  const updateStudent = async (student: Student) => {
    try {
      await storage.updateStudent(student);
      setStudents((prev) => prev.map((s) => (s.id === student.id ? student : s)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update student");
      throw err;
    }
  };

  const deleteStudent = async (studentId: string) => {
    try {
      await storage.deleteStudent(studentId);
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      setPayments((prev) => prev.filter((p) => p.studentId !== studentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete student");
      throw err;
    }
  };

  const getStudentWithPayments = async (studentId: string) => {
    try {
      return await storage.getStudentWithPayments(studentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get student");
      return null;
    }
  };

  const addPayment = async (studentId: string, month: number, year: number) => {
    try {
      const student = students.find((s) => s.id === studentId);
      if (!student) throw new Error("Student not found");

      const newPayment: Payment = {
        id: Date.now().toString(),
        studentId,
        month,
        year,
        paidDate: new Date().toISOString(),
        amount: student.monthlyFee,
      };
      await storage.savePayment(newPayment);
      setPayments((prev) => [...prev, newPayment]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add payment");
      throw err;
    }
  };

  const deletePayment = async (paymentId: string) => {
    try {
      await storage.deletePayment(paymentId);
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete payment");
      throw err;
    }
  };

  const getPaymentForMonth = async (studentId: string, month: number, year: number) => {
    try {
      return await storage.getPaymentForMonth(studentId, month, year);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get payment");
      return undefined;
    }
  };

  const getStudentPayments = async (studentId: string) => {
    try {
      return await storage.getStudentPayments(studentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get payments");
      return [];
    }
  };

  const value: StudentContextType = {
    students,
    payments,
    loading,
    error,
    addStudent,
    updateStudent,
    deleteStudent,
    getStudentWithPayments,
    addPayment,
    deletePayment,
    getPaymentForMonth,
    getStudentPayments,
    refreshData,
  };

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
}

export function useStudents() {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error("useStudents must be used within StudentProvider");
  }
  return context;
}
