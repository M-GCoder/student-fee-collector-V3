import { Student, Payment } from "./types";

export interface ClassAnalytics {
  className: string;
  totalStudents: number;
  totalFeeAmount: number;
  collectedAmount: number;
  outstandingAmount: number;
  collectionRate: number;
  paidStudents: number;
  pendingStudents: number;
}

export interface AnalyticsData {
  classes: ClassAnalytics[];
  totalStudents: number;
  totalFeeAmount: number;
  totalCollectedAmount: number;
  totalOutstandingAmount: number;
  overallCollectionRate: number;
  topPerformingClass: ClassAnalytics | null;
  lowestPerformingClass: ClassAnalytics | null;
}

/**
 * Calculate analytics data for current month by class
 */
export function calculateClassAnalytics(
  students: Student[],
  payments: Payment[]
): AnalyticsData {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter payments for current month
  const currentMonthPayments = payments.filter(
    (p) => p.month === currentMonth && p.year === currentYear
  );

  // Group students by class
  const classesByName = new Map<string, Student[]>();
  students.forEach((student) => {
    if (!classesByName.has(student.class)) {
      classesByName.set(student.class, []);
    }
    classesByName.get(student.class)!.push(student);
  });

  // Calculate analytics for each class
  const classAnalytics: ClassAnalytics[] = [];

  classesByName.forEach((classStudents, className) => {
    const totalStudents = classStudents.length;
    const totalFeeAmount = classStudents.reduce((sum, s) => sum + s.monthlyFee, 0);

    const classPayments = currentMonthPayments.filter((p) =>
      classStudents.some((s) => s.id === p.studentId)
    );

    const collectedAmount = classPayments.reduce((sum, p) => sum + p.amount, 0);
    const outstandingAmount = totalFeeAmount - collectedAmount;
    const paidStudents = classPayments.length;
    const pendingStudents = totalStudents - paidStudents;
    const collectionRate = totalStudents > 0 ? (paidStudents / totalStudents) * 100 : 0;

    classAnalytics.push({
      className,
      totalStudents,
      totalFeeAmount,
      collectedAmount,
      outstandingAmount,
      collectionRate,
      paidStudents,
      pendingStudents,
    });
  });

  // Sort by class name
  classAnalytics.sort((a, b) => a.className.localeCompare(b.className));

  // Calculate overall statistics
  const totalStudents = students.length;
  const totalFeeAmount = students.reduce((sum, s) => sum + s.monthlyFee, 0);
  const totalCollectedAmount = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstandingAmount = totalFeeAmount - totalCollectedAmount;
  const overallCollectionRate = totalStudents > 0 ? (currentMonthPayments.length / totalStudents) * 100 : 0;

  // Find top and lowest performing classes
  const topPerformingClass =
    classAnalytics.length > 0
      ? classAnalytics.reduce((max, current) =>
          current.collectionRate > max.collectionRate ? current : max
        )
      : null;

  const lowestPerformingClass =
    classAnalytics.length > 0
      ? classAnalytics.reduce((min, current) =>
          current.collectionRate < min.collectionRate ? current : min
        )
      : null;

  return {
    classes: classAnalytics,
    totalStudents,
    totalFeeAmount,
    totalCollectedAmount,
    totalOutstandingAmount,
    overallCollectionRate,
    topPerformingClass,
    lowestPerformingClass,
  };
}

/**
 * Get chart data for collection rates by class
 */
export function getCollectionRateChartData(classAnalytics: ClassAnalytics[]) {
  return {
    labels: classAnalytics.map((c) => c.className),
    datasets: [
      {
        label: "Collection Rate (%)",
        data: classAnalytics.map((c) => c.collectionRate),
        backgroundColor: classAnalytics.map((c) =>
          c.collectionRate >= 80 ? "#22C55E" : c.collectionRate >= 50 ? "#F59E0B" : "#EF4444"
        ),
      },
    ],
  };
}

/**
 * Get chart data for outstanding amounts by class
 */
export function getOutstandingAmountChartData(classAnalytics: ClassAnalytics[]) {
  return {
    labels: classAnalytics.map((c) => c.className),
    datasets: [
      {
        label: "Outstanding Amount (RS)",
        data: classAnalytics.map((c) => c.outstandingAmount),
        backgroundColor: "#EF4444",
      },
    ],
  };
}

/**
 * Get chart data for collected vs outstanding comparison
 */
export function getCollectionComparisonChartData(classAnalytics: ClassAnalytics[]) {
  return {
    labels: classAnalytics.map((c) => c.className),
    datasets: [
      {
        label: "Collected (RS)",
        data: classAnalytics.map((c) => c.collectedAmount),
        backgroundColor: "#22C55E",
      },
      {
        label: "Outstanding (RS)",
        data: classAnalytics.map((c) => c.outstandingAmount),
        backgroundColor: "#EF4444",
      },
    ],
  };
}

/**
 * Get chart data for student count by class
 */
export function getStudentCountChartData(classAnalytics: ClassAnalytics[]) {
  return {
    labels: classAnalytics.map((c) => c.className),
    datasets: [
      {
        label: "Paid Students",
        data: classAnalytics.map((c) => c.paidStudents),
        backgroundColor: "#22C55E",
      },
      {
        label: "Pending Students",
        data: classAnalytics.map((c) => c.pendingStudents),
        backgroundColor: "#F59E0B",
      },
    ],
  };
}
