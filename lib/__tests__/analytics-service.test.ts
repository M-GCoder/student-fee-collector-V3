import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateClassAnalytics,
  getCollectionRateChartData,
  getOutstandingAmountChartData,
  getCollectionComparisonChartData,
  getStudentCountChartData,
} from "../analytics-service";
import { Student, Payment } from "../types";

describe("Analytics Service", () => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();



  const mockStudents: Student[] = [
    {
      id: "1",
      name: "John Doe",
      class: "10-A",
      monthlyFee: 5000,
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Jane Smith",
      class: "10-A",
      monthlyFee: 5000,
      createdAt: new Date().toISOString(),
    },
    {
      id: "3",
      name: "Bob Johnson",
      class: "10-B",
      monthlyFee: 5000,
      createdAt: new Date().toISOString(),
    },
    {
      id: "4",
      name: "Alice Brown",
      class: "10-B",
      monthlyFee: 5000,
      createdAt: new Date().toISOString(),
    },
  ];

  const mockPayments: Payment[] = [
    {
      id: "p1",
      studentId: "1",
      month: currentMonth,
      year: currentYear,
      amount: 5000,
      paidDate: new Date().toISOString(),
    },
    {
      id: "p2",
      studentId: "2",
      month: currentMonth,
      year: currentYear,
      amount: 5000,
      paidDate: new Date().toISOString(),
    },
    {
      id: "p3",
      studentId: "3",
      month: currentMonth,
      year: currentYear,
      amount: 5000,
      paidDate: new Date().toISOString(),
    },
  ];

  describe("calculateClassAnalytics", () => {
    it("should calculate correct analytics for each class", () => {
      const analytics = calculateClassAnalytics(mockStudents, mockPayments);

      expect(analytics.classes).toHaveLength(2);
      expect(analytics.totalStudents).toBe(4);
      expect(analytics.totalFeeAmount).toBe(20000);
      expect(analytics.totalCollectedAmount).toBe(15000);
      expect(analytics.totalOutstandingAmount).toBe(5000);
    });

    it("should calculate correct collection rate for class 10-A", () => {
      const analytics = calculateClassAnalytics(mockStudents, mockPayments);
      const classA = analytics.classes.find((c) => c.className === "10-A");

      expect(classA).toBeDefined();
      expect(classA!.totalStudents).toBe(2);
      expect(classA!.paidStudents).toBe(2);
      expect(classA!.collectionRate).toBe(100);
      expect(classA!.collectedAmount).toBe(10000);
    });

    it("should calculate correct collection rate for class 10-B", () => {
      const analytics = calculateClassAnalytics(mockStudents, mockPayments);
      const classB = analytics.classes.find((c) => c.className === "10-B");

      expect(classB).toBeDefined();
      expect(classB!.totalStudents).toBe(2);
      expect(classB!.paidStudents).toBe(1);
      expect(classB!.pendingStudents).toBe(1);
      expect(classB!.collectionRate).toBe(50);
      expect(classB!.collectedAmount).toBe(5000);
      expect(classB!.outstandingAmount).toBe(5000);
    });

    it("should identify top performing class", () => {
      const analytics = calculateClassAnalytics(mockStudents, mockPayments);

      expect(analytics.topPerformingClass).toBeDefined();
      expect(analytics.topPerformingClass!.className).toBe("10-A");
      expect(analytics.topPerformingClass!.collectionRate).toBe(100);
    });

    it("should identify lowest performing class", () => {
      const analytics = calculateClassAnalytics(mockStudents, mockPayments);

      expect(analytics.lowestPerformingClass).toBeDefined();
      expect(analytics.lowestPerformingClass!.className).toBe("10-B");
      expect(analytics.lowestPerformingClass!.collectionRate).toBe(50);
    });

    it("should calculate overall collection rate correctly", () => {
      const analytics = calculateClassAnalytics(mockStudents, mockPayments);

      expect(analytics.overallCollectionRate).toBe(75);
    });

    it("should handle empty students list", () => {
      const analytics = calculateClassAnalytics([], []);

      expect(analytics.classes).toHaveLength(0);
      expect(analytics.totalStudents).toBe(0);
      expect(analytics.totalFeeAmount).toBe(0);
      expect(analytics.overallCollectionRate).toBe(0);
    });

    it("should handle payments from previous months", () => {
      const previousMonthPayment: Payment = {
        id: "p4",
        studentId: "4",
        month: (currentMonth - 1 + 12) % 12,
        year: currentMonth === 0 ? currentYear - 1 : currentYear,
        amount: 5000,
        paidDate: new Date().toISOString(),
      };

      const analytics = calculateClassAnalytics(mockStudents, [...mockPayments, previousMonthPayment]);

      expect(analytics.totalCollectedAmount).toBe(15000);
      expect(analytics.classes.find((c) => c.className === "10-B")!.collectionRate).toBe(50);
    });
  });

  describe("Chart Data Functions", () => {
    it("should generate collection rate chart data", () => {
      const analytics = calculateClassAnalytics(mockStudents, mockPayments);
      const chartData = getCollectionRateChartData(analytics.classes);

      expect(chartData.labels).toEqual(["10-A", "10-B"]);
      expect(chartData.datasets[0].data).toEqual([100, 50]);
    });

    it("should generate outstanding amount chart data", () => {
      const analytics = calculateClassAnalytics(mockStudents, mockPayments);
      const chartData = getOutstandingAmountChartData(analytics.classes);

      expect(chartData.labels).toEqual(["10-A", "10-B"]);
      expect(chartData.datasets[0].data).toEqual([0, 5000]);
    });

    it("should generate collection comparison chart data", () => {
      const analytics = calculateClassAnalytics(mockStudents, mockPayments);
      const chartData = getCollectionComparisonChartData(analytics.classes);

      expect(chartData.labels).toEqual(["10-A", "10-B"]);
      expect(chartData.datasets[0].data).toEqual([10000, 5000]);
      expect(chartData.datasets[1].data).toEqual([0, 5000]);
    });

    it("should generate student count chart data", () => {
      const analytics = calculateClassAnalytics(mockStudents, mockPayments);
      const chartData = getStudentCountChartData(analytics.classes);

      expect(chartData.labels).toEqual(["10-A", "10-B"]);
      expect(chartData.datasets[0].data).toEqual([2, 1]);
      expect(chartData.datasets[1].data).toEqual([0, 1]);
    });
  });
});
