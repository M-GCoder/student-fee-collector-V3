import { describe, it, expect, vi } from 'vitest';
import { prepareCurrentMonthExportData } from '../current-month-export-service';
import { Student, Payment } from '../types';

describe('Current Month Export Service', () => {
  const mockStudents: Student[] = [
    {
      id: '1',
      name: 'John Doe',
      class: '10-A',
      monthlyFee: 5000,
      dueDate: undefined,
      monthlyDueDate: 15,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Jane Smith',
      class: '10-B',
      monthlyFee: 5000,
      dueDate: undefined,
      monthlyDueDate: 15,
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Bob Wilson',
      class: '11-A',
      monthlyFee: 6000,
      dueDate: undefined,
      monthlyDueDate: 20,
      createdAt: new Date().toISOString(),
    },
  ];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const mockPayments: Payment[] = [
    {
      id: '1',
      studentId: '1',
      month: currentMonth,
      year: currentYear,
      amount: 5000,
      paidDate: new Date().toISOString(),
    },
    {
      id: '2',
      studentId: '3',
      month: currentMonth,
      year: currentYear,
      amount: 6000,
      paidDate: new Date().toISOString(),
    },
  ];

  it('should prepare export data with correct columns', () => {
    const data = prepareCurrentMonthExportData(mockStudents, mockPayments);
    
    expect(data).toHaveLength(3);
    expect(data[0]).toHaveProperty('name');
    expect(data[0]).toHaveProperty('class');
    expect(data[0]).toHaveProperty('fee');
    expect(data[0]).toHaveProperty('paymentDate');
  });

  it('should include all students in export data', () => {
    const data = prepareCurrentMonthExportData(mockStudents, mockPayments);
    
    expect(data).toHaveLength(mockStudents.length);
    expect(data.map(d => d.name)).toContain('John Doe');
    expect(data.map(d => d.name)).toContain('Jane Smith');
    expect(data.map(d => d.name)).toContain('Bob Wilson');
  });

  it('should show payment date for paid students', () => {
    const data = prepareCurrentMonthExportData(mockStudents, mockPayments);
    
    // Student 1 (John Doe) has paid
    expect(data[0].paymentDate).not.toBe('Pending');
    // Student 3 (Bob Wilson) has paid
    expect(data[2].paymentDate).not.toBe('Pending');
  });

  it('should show "Pending" for unpaid students', () => {
    const data = prepareCurrentMonthExportData(mockStudents, mockPayments);
    
    // Student 2 (Jane Smith) has not paid
    expect(data[1].paymentDate).toBe('Pending');
  });

  it('should include correct student information', () => {
    const data = prepareCurrentMonthExportData(mockStudents, mockPayments);
    
    expect(data[0].name).toBe('John Doe');
    expect(data[0].class).toBe('10-A');
    expect(data[0].fee).toBe(5000);
    
    expect(data[1].name).toBe('Jane Smith');
    expect(data[1].class).toBe('10-B');
    expect(data[1].fee).toBe(5000);
    
    expect(data[2].name).toBe('Bob Wilson');
    expect(data[2].class).toBe('11-A');
    expect(data[2].fee).toBe(6000);
  });

  it('should handle empty student list', () => {
    const data = prepareCurrentMonthExportData([], mockPayments);
    
    expect(data).toHaveLength(0);
  });

  it('should handle empty payment list', () => {
    const data = prepareCurrentMonthExportData(mockStudents, []);
    
    expect(data).toHaveLength(3);
    expect(data.every(d => d.paymentDate === 'Pending')).toBe(true);
  });

  it('should filter payments by current month and year', () => {
    const previousMonthPayment: Payment = {
      id: '3',
      studentId: '1',
      month: currentMonth - 1 < 0 ? 11 : currentMonth - 1,
      year: currentMonth - 1 < 0 ? currentYear - 1 : currentYear,
      amount: 5000,
      paidDate: new Date().toISOString(),
    };

    const allPayments = [...mockPayments, previousMonthPayment];
    const data = prepareCurrentMonthExportData(mockStudents, allPayments);
    
    // Should only count current month payment for student 1
    expect(data[0].paymentDate).not.toBe('Pending');
  });

  it('should format payment date correctly', () => {
    const data = prepareCurrentMonthExportData(mockStudents, mockPayments);
    
    // Check that paid students have formatted dates (not "Pending")
    const paidData = data.filter(d => d.paymentDate !== 'Pending');
    paidData.forEach(paid => {
      // Should be in format like "Mar 20, 2026"
      expect(paid.paymentDate).toMatch(/\w+\s\d+,\s\d{4}/);
    });
  });

  it('should maintain data integrity for multiple students', () => {
    const data = prepareCurrentMonthExportData(mockStudents, mockPayments);
    
    const totalFees = data.reduce((sum, d) => sum + d.fee, 0);
    const expectedTotal = 5000 + 5000 + 6000;
    
    expect(totalFees).toBe(expectedTotal);
  });
});
