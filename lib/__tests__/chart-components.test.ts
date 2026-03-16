import { describe, it, expect } from "vitest";
import { ClassAnalytics } from "../analytics-service";

describe("Chart Components", () => {
  const mockClassData: ClassAnalytics[] = [
    {
      className: "10-A",
      totalStudents: 30,
      totalFeeAmount: 150000,
      collectedAmount: 120000,
      outstandingAmount: 30000,
      collectionRate: 80,
      paidStudents: 24,
      pendingStudents: 6,
    },
    {
      className: "10-B",
      totalStudents: 25,
      totalFeeAmount: 125000,
      collectedAmount: 62500,
      outstandingAmount: 62500,
      collectionRate: 50,
      paidStudents: 12,
      pendingStudents: 13,
    },
    {
      className: "10-C",
      totalStudents: 28,
      totalFeeAmount: 140000,
      collectedAmount: 126000,
      outstandingAmount: 14000,
      collectionRate: 90,
      paidStudents: 25,
      pendingStudents: 3,
    },
  ];

  describe("Collection Rate Chart Data", () => {
    it("should have correct class names in chart data", () => {
      const classNames = mockClassData.map((c) => c.className);
      expect(classNames).toEqual(["10-A", "10-B", "10-C"]);
    });

    it("should have collection rates between 0 and 100", () => {
      mockClassData.forEach((classData) => {
        expect(classData.collectionRate).toBeGreaterThanOrEqual(0);
        expect(classData.collectionRate).toBeLessThanOrEqual(100);
      });
    });

    it("should correctly identify high, medium, and low collection rates", () => {
      const highRate = mockClassData.find((c) => c.collectionRate >= 80);
      const mediumRate = mockClassData.find((c) => c.collectionRate >= 50 && c.collectionRate < 80);
      const lowRate = mockClassData.find((c) => c.collectionRate < 50);

      expect(highRate).toBeDefined();
      expect(highRate!.className).toBe("10-A");
      expect(mediumRate).toBeDefined();
      expect(mediumRate!.className).toBe("10-B");
      expect(lowRate).toBeUndefined();
    });
  });

  describe("Outstanding Amount Chart Data", () => {
    it("should calculate total outstanding amount correctly", () => {
      const totalOutstanding = mockClassData.reduce((sum, c) => sum + c.outstandingAmount, 0);
      expect(totalOutstanding).toBe(106500);
    });

    it("should calculate percentage of each class in outstanding amount", () => {
      const totalOutstanding = mockClassData.reduce((sum, c) => sum + c.outstandingAmount, 0);
      mockClassData.forEach((classData) => {
        const percentage = (classData.outstandingAmount / totalOutstanding) * 100;
        expect(percentage).toBeGreaterThanOrEqual(0);
        expect(percentage).toBeLessThanOrEqual(100);
      });
    });

    it("should identify class with highest outstanding amount", () => {
      const highestOutstanding = mockClassData.reduce((max, current) =>
        current.outstandingAmount > max.outstandingAmount ? current : max
      );
      expect(highestOutstanding.className).toBe("10-B");
      expect(highestOutstanding.outstandingAmount).toBe(62500);
    });
  });

  describe("Collection Comparison Chart Data", () => {
    it("should have matching total amounts for each class", () => {
      mockClassData.forEach((classData) => {
        const total = classData.collectedAmount + classData.outstandingAmount;
        expect(total).toBe(classData.totalFeeAmount);
      });
    });

    it("should show correct collected vs outstanding ratio", () => {
      mockClassData.forEach((classData) => {
        const collectedRatio = classData.collectedAmount / classData.totalFeeAmount;
        const outstandingRatio = classData.outstandingAmount / classData.totalFeeAmount;
        expect(collectedRatio + outstandingRatio).toBeCloseTo(1, 5);
      });
    });

    it("should identify highest collected amount", () => {
      const highestCollected = mockClassData.reduce((max, current) =>
        current.collectedAmount > max.collectedAmount ? current : max
      );
      expect(highestCollected.className).toBe("10-C");
      expect(highestCollected.collectedAmount).toBe(126000);
    });
  });

  describe("Chart Data Validation", () => {
    it("should have valid data for all classes", () => {
      mockClassData.forEach((classData) => {
        expect(classData.className).toBeTruthy();
        expect(classData.totalStudents).toBeGreaterThan(0);
        expect(classData.totalFeeAmount).toBeGreaterThan(0);
        expect(classData.collectionRate).toBeGreaterThanOrEqual(0);
        expect(classData.collectionRate).toBeLessThanOrEqual(100);
        expect(classData.paidStudents).toBeLessThanOrEqual(classData.totalStudents);
        expect(classData.pendingStudents).toBeLessThanOrEqual(classData.totalStudents);
      });
    });

    it("should have consistent student counts", () => {
      mockClassData.forEach((classData) => {
        const totalStudents = classData.paidStudents + classData.pendingStudents;
        expect(totalStudents).toBe(classData.totalStudents);
      });
    });

    it("should have consistent financial amounts", () => {
      mockClassData.forEach((classData) => {
        const total = classData.collectedAmount + classData.outstandingAmount;
        expect(total).toBe(classData.totalFeeAmount);
      });
    });
  });
});
