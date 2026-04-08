# Admin Panel API Guide - All Students Summary

## Overview

This guide provides complete instructions for building an admin panel React project that displays comprehensive summary data for all students, including Data Summary, Class Analytics, and Dashboard statistics.

---

## Part 1: Setup & Configuration

### Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js recharts
```

### Step 2: Environment Variables

Create `.env.local`:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 3: Initialize Supabase Client

```typescript
// lib/supabase-client.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "";
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);
```

---

## Part 2: Data Summary APIs

### API 1: Overall Collection Summary

Get total statistics for current year:

```typescript
// services/admin-service.ts
import { supabase } from "../lib/supabase-client";

export async function getOverallSummary() {
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      id,
      monthly_fee,
      class,
      payments (
        id,
        payment_date,
        amount,
        year
      )
    `
    )
    .eq("payments.year", new Date().getFullYear());

  if (error) throw error;

  const currentYear = new Date().getFullYear();
  let totalStudents = 0;
  let totalClasses = new Set();
  let totalMonthlyFees = 0;
  let totalPaymentsMade = 0;
  let totalPaymentsPending = 0;
  let totalCollected = 0;
  let totalOutstanding = 0;

  data.forEach((student) => {
    totalStudents++;
    totalClasses.add(student.class);
    totalMonthlyFees += student.monthly_fee || 0;

    const payments = student.payments || [];
    payments.forEach((payment) => {
      if (payment.payment_date) {
        totalPaymentsMade++;
        totalCollected += payment.amount || 0;
      } else {
        totalPaymentsPending++;
        totalOutstanding += student.monthly_fee || 0;
      }
    });
  });

  const collectionPercentage =
    totalPaymentsMade + totalPaymentsPending > 0
      ? Math.round(
          (totalPaymentsMade / (totalPaymentsMade + totalPaymentsPending)) * 100
        )
      : 0;

  return {
    year: currentYear,
    totalStudents,
    totalClasses: totalClasses.size,
    totalMonthlyFees,
    totalPaymentsMade,
    totalPaymentsPending,
    totalCollected,
    totalOutstanding,
    collectionPercentage,
  };
}
```

**Response Format:**
```json
{
  "year": 2024,
  "totalStudents": 150,
  "totalClasses": 12,
  "totalMonthlyFees": 750000,
  "totalPaymentsMade": 1200,
  "totalPaymentsPending": 600,
  "totalCollected": 600000,
  "totalOutstanding": 150000,
  "collectionPercentage": 67
}
```

---

### API 2: Monthly Collection Trend

Get monthly breakdown for charts:

```typescript
export async function getMonthlyTrend() {
  const currentYear = new Date().getFullYear();

  const { data, error } = await supabase
    .from("students")
    .select(
      `
      monthly_fee,
      payments (
        month,
        year,
        payment_date,
        amount
      )
    `
    )
    .eq("payments.year", currentYear);

  if (error) throw error;

  const monthlyData = {};

  // Initialize months 1-12
  for (let i = 1; i <= 12; i++) {
    monthlyData[i] = {
      month: i,
      monthName: new Date(currentYear, i - 1).toLocaleString("default", {
        month: "long",
      }),
      totalStudents: 0,
      paymentsMade: 0,
      paymentsPending: 0,
      amountCollected: 0,
      amountOutstanding: 0,
    };
  }

  // Process data
  data.forEach((student) => {
    const payments = student.payments || [];
    payments.forEach((payment) => {
      const month = payment.month;
      if (monthlyData[month]) {
        monthlyData[month].totalStudents++;
        if (payment.payment_date) {
          monthlyData[month].paymentsMade++;
          monthlyData[month].amountCollected += payment.amount || 0;
        } else {
          monthlyData[month].paymentsPending++;
          monthlyData[month].amountOutstanding += student.monthly_fee || 0;
        }
      }
    });
  });

  return Object.values(monthlyData);
}
```

**Response Format:**
```json
[
  {
    "month": 1,
    "monthName": "January",
    "totalStudents": 150,
    "paymentsMade": 120,
    "paymentsPending": 30,
    "amountCollected": 600000,
    "amountOutstanding": 150000
  },
  {
    "month": 2,
    "monthName": "February",
    "totalStudents": 150,
    "paymentsMade": 110,
    "paymentsPending": 40,
    "amountCollected": 550000,
    "amountOutstanding": 200000
  }
]
```

---

### API 3: All Students Summary

Get detailed data for all students:

```typescript
export async function getAllStudentsSummary() {
  const currentYear = new Date().getFullYear();

  const { data, error } = await supabase
    .from("students")
    .select(
      `
      id,
      name,
      class,
      email,
      monthly_fee,
      monthly_due_date,
      payments (
        id,
        month,
        year,
        payment_date,
        amount
      )
    `
    )
    .order("class", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  return data.map((student) => {
    const currentYearPayments = (student.payments || []).filter(
      (p) => p.year === currentYear
    );
    const allPayments = student.payments || [];

    const paymentsMadeCurrentYear = currentYearPayments.filter(
      (p) => p.payment_date
    ).length;
    const paymentsPendingCurrentYear = currentYearPayments.filter(
      (p) => !p.payment_date
    ).length;

    const totalPaidCurrentYear = currentYearPayments
      .filter((p) => p.payment_date)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalDueCurrentYear = paymentsPendingCurrentYear * (student.monthly_fee || 0);

    const lastPaymentDate = allPayments
      .filter((p) => p.payment_date)
      .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))[0]
      ?.payment_date;

    // Determine status
    let status = "Paid";
    if (paymentsPendingCurrentYear > 0) {
      const currentDay = new Date().getDate();
      if (
        student.monthly_due_date &&
        currentDay > student.monthly_due_date
      ) {
        status = "Overdue";
      } else {
        status = "Pending";
      }
    }

    return {
      id: student.id,
      name: student.name,
      class: student.class,
      email: student.email,
      monthlyFee: student.monthly_fee,
      monthlyDueDate: student.monthly_due_date,
      paymentsMadeCurrentYear,
      paymentsPendingCurrentYear,
      totalPaidCurrentYear,
      totalDueCurrentYear,
      totalPaymentsAllTime: allPayments.filter((p) => p.payment_date).length,
      totalPaidAllTime: allPayments
        .filter((p) => p.payment_date)
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      lastPaymentDate,
      status,
    };
  });
}
```

**Response Format:**
```json
[
  {
    "id": "student_001",
    "name": "Raj Kumar",
    "class": "10-A",
    "email": "raj@example.com",
    "monthlyFee": 5000,
    "monthlyDueDate": 15,
    "paymentsMadeCurrentYear": 3,
    "paymentsPendingCurrentYear": 9,
    "totalPaidCurrentYear": 15000,
    "totalDueCurrentYear": 45000,
    "totalPaymentsAllTime": 15,
    "totalPaidAllTime": 75000,
    "lastPaymentDate": "2024-03-15T00:00:00Z",
    "status": "Pending"
  }
]
```

---

## Part 3: Class Analytics APIs

### API 4: Class-wise Summary

Get statistics grouped by class:

```typescript
export async function getClassAnalytics() {
  const currentYear = new Date().getFullYear();

  const { data, error } = await supabase
    .from("students")
    .select(
      `
      class,
      monthly_fee,
      payments (
        payment_date,
        amount,
        year
      )
    `
    );

  if (error) throw error;

  const classStats = {};

  data.forEach((student) => {
    if (!classStats[student.class]) {
      classStats[student.class] = {
        class: student.class,
        totalStudents: 0,
        totalMonthlyFees: 0,
        totalPaymentsMade: 0,
        totalPaymentsPending: 0,
        totalCollected: 0,
        totalOutstanding: 0,
      };
    }

    classStats[student.class].totalStudents++;
    classStats[student.class].totalMonthlyFees += student.monthly_fee || 0;

    const currentYearPayments = (student.payments || []).filter(
      (p) => p.year === currentYear
    );

    currentYearPayments.forEach((payment) => {
      if (payment.payment_date) {
        classStats[student.class].totalPaymentsMade++;
        classStats[student.class].totalCollected += payment.amount || 0;
      } else {
        classStats[student.class].totalPaymentsPending++;
        classStats[student.class].totalOutstanding += student.monthly_fee || 0;
      }
    });
  });

  return Object.values(classStats)
    .map((cls) => ({
      ...cls,
      collectionRate: cls.totalMonthlyFees
        ? Math.round((cls.totalCollected / cls.totalMonthlyFees) * 100)
        : 0,
      paymentCompletionRate:
        cls.totalPaymentsMade + cls.totalPaymentsPending > 0
          ? Math.round(
              (cls.totalPaymentsMade /
                (cls.totalPaymentsMade + cls.totalPaymentsPending)) *
                100
            )
          : 0,
    }))
    .sort((a, b) => a.class.localeCompare(b.class));
}
```

**Response Format:**
```json
[
  {
    "class": "10-A",
    "totalStudents": 50,
    "totalMonthlyFees": 250000,
    "totalPaymentsMade": 420,
    "totalPaymentsPending": 180,
    "totalCollected": 210000,
    "totalOutstanding": 40000,
    "collectionRate": 84,
    "paymentCompletionRate": 70
  }
]
```

---

### API 5: Top & Bottom Performing Classes

```typescript
export async function getTopPerformingClasses(limit = 5) {
  const analytics = await getClassAnalytics();
  return analytics
    .sort((a, b) => b.collectionRate - a.collectionRate)
    .slice(0, limit);
}

export async function getBottomPerformingClasses(limit = 5) {
  const analytics = await getClassAnalytics();
  return analytics
    .sort((a, b) => a.collectionRate - b.collectionRate)
    .slice(0, limit);
}
```

---

## Part 4: Dashboard APIs

### API 6: Key Performance Indicators (KPIs)

```typescript
export async function getKPIs() {
  const summary = await getOverallSummary();

  return {
    totalStudents: {
      label: "Total Students",
      value: summary.totalStudents,
      icon: "👥",
    },
    totalClasses: {
      label: "Total Classes",
      value: summary.totalClasses,
      icon: "🏫",
    },
    totalMonthlyFees: {
      label: "Total Monthly Fees",
      value: `RS ${summary.totalMonthlyFees.toLocaleString()}`,
      icon: "💰",
    },
    totalCollected: {
      label: "Total Collected (Current Year)",
      value: `RS ${summary.totalCollected.toLocaleString()}`,
      icon: "✅",
    },
    totalOutstanding: {
      label: "Total Outstanding",
      value: `RS ${summary.totalOutstanding.toLocaleString()}`,
      icon: "⏳",
    },
    collectionRate: {
      label: "Collection Rate",
      value: `${summary.collectionPercentage}%`,
      icon: "📊",
    },
  };
}
```

---

### API 7: Overdue Payments

```typescript
export async function getOverduePayments() {
  const currentYear = new Date().getFullYear();
  const currentDay = new Date().getDate();

  const { data, error } = await supabase
    .from("students")
    .select(
      `
      id,
      name,
      class,
      monthly_fee,
      monthly_due_date,
      payments (
        month,
        year,
        payment_date
      )
    `
    );

  if (error) throw error;

  const overduePayments = [];

  data.forEach((student) => {
    const overduePaymentsForStudent = (student.payments || []).filter(
      (p) =>
        !p.payment_date &&
        p.year === currentYear &&
        student.monthly_due_date &&
        currentDay > student.monthly_due_date
    );

    overduePaymentsForStudent.forEach((payment) => {
      overduePayments.push({
        studentId: student.id,
        studentName: student.name,
        class: student.class,
        monthlyFee: student.monthly_fee,
        month: payment.month,
        year: payment.year,
        daysOverdue: currentDay - student.monthly_due_date,
        amountDue: student.monthly_fee,
      });
    });
  });

  return overduePayments.sort((a, b) => b.daysOverdue - a.daysOverdue);
}
```

---

### API 8: Payment Status Distribution

```typescript
export async function getPaymentStatusDistribution() {
  const currentYear = new Date().getFullYear();
  const currentDay = new Date().getDate();

  const { data, error } = await supabase
    .from("students")
    .select(
      `
      monthly_fee,
      monthly_due_date,
      payments (
        payment_date,
        amount,
        year
      )
    `
    );

  if (error) throw error;

  let paid = 0;
  let pending = 0;
  let overdue = 0;
  let paidAmount = 0;
  let pendingAmount = 0;
  let overdueAmount = 0;

  data.forEach((student) => {
    const currentYearPayments = (student.payments || []).filter(
      (p) => p.year === currentYear
    );

    currentYearPayments.forEach((payment) => {
      if (payment.payment_date) {
        paid++;
        paidAmount += payment.amount || 0;
      } else if (
        student.monthly_due_date &&
        currentDay > student.monthly_due_date
      ) {
        overdue++;
        overdueAmount += student.monthly_fee || 0;
      } else {
        pending++;
        pendingAmount += student.monthly_fee || 0;
      }
    });
  });

  return [
    {
      status: "Paid",
      count: paid,
      amount: paidAmount,
      percentage: Math.round((paid / (paid + pending + overdue)) * 100) || 0,
    },
    {
      status: "Pending",
      count: pending,
      amount: pendingAmount,
      percentage: Math.round((pending / (paid + pending + overdue)) * 100) || 0,
    },
    {
      status: "Overdue",
      count: overdue,
      amount: overdueAmount,
      percentage: Math.round((overdue / (paid + pending + overdue)) * 100) || 0,
    },
  ];
}
```

---

### API 9: Top Students by Fees Paid

```typescript
export async function getTopStudents(limit = 10) {
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      id,
      name,
      class,
      payments (
        payment_date,
        amount
      )
    `
    );

  if (error) throw error;

  return data
    .map((student) => ({
      id: student.id,
      name: student.name,
      class: student.class,
      totalPayments: (student.payments || []).filter((p) => p.payment_date)
        .length,
      totalPaid: (student.payments || [])
        .filter((p) => p.payment_date)
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      lastPaymentDate: (student.payments || [])
        .filter((p) => p.payment_date)
        .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))[0]
        ?.payment_date,
    }))
    .sort((a, b) => b.totalPaid - a.totalPaid)
    .slice(0, limit);
}
```

---

## Part 5: React Components

### Component 1: Data Summary Dashboard

```typescript
// components/DataSummary.tsx
import { useEffect, useState } from "react";
import { getOverallSummary, getMonthlyTrend } from "../services/admin-service";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function DataSummary() {
  const [summary, setSummary] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const summaryData = await getOverallSummary();
        const trendData = await getMonthlyTrend();
        setSummary(summaryData);
        setMonthlyTrend(trendData);
      } catch (error) {
        console.error("Error loading summary:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!summary) return <div>No data available</div>;

  return (
    <div className="data-summary">
      <h1>Data Summary</h1>

      <div className="kpi-grid">
        <div className="kpi-card">
          <h3>Total Students</h3>
          <p className="value">{summary.totalStudents}</p>
        </div>
        <div className="kpi-card">
          <h3>Total Classes</h3>
          <p className="value">{summary.totalClasses}</p>
        </div>
        <div className="kpi-card">
          <h3>Total Collected</h3>
          <p className="value">RS {summary.totalCollected.toLocaleString()}</p>
        </div>
        <div className="kpi-card">
          <h3>Total Outstanding</h3>
          <p className="value">RS {summary.totalOutstanding.toLocaleString()}</p>
        </div>
        <div className="kpi-card">
          <h3>Collection Rate</h3>
          <p className="value">{summary.collectionPercentage}%</p>
        </div>
      </div>

      <div className="chart-container">
        <h2>Monthly Collection Trend</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="monthName" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="amountCollected"
              stroke="#8884d8"
              name="Collected"
            />
            <Line
              type="monotone"
              dataKey="amountOutstanding"
              stroke="#82ca9d"
              name="Outstanding"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

---

### Component 2: Class Analytics

```typescript
// components/ClassAnalytics.tsx
import { useEffect, useState } from "react";
import { getClassAnalytics, getTopPerformingClasses, getBottomPerformingClasses } from "../services/admin-service";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function ClassAnalytics() {
  const [classData, setClassData] = useState([]);
  const [topClasses, setTopClasses] = useState([]);
  const [bottomClasses, setBottomClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const analytics = await getClassAnalytics();
        const top = await getTopPerformingClasses();
        const bottom = await getBottomPerformingClasses();
        setClassData(analytics);
        setTopClasses(top);
        setBottomClasses(bottom);
      } catch (error) {
        console.error("Error loading class analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="class-analytics">
      <h1>Class Analytics</h1>

      <div className="analytics-grid">
        <div className="section">
          <h2>Collection Rate by Class</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={classData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="class" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="collectionRate" fill="#8884d8" name="Collection Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="section">
          <h2>Top Performing Classes</h2>
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>Students</th>
                <th>Collection Rate</th>
                <th>Collected</th>
              </tr>
            </thead>
            <tbody>
              {topClasses.map((cls) => (
                <tr key={cls.class}>
                  <td>{cls.class}</td>
                  <td>{cls.totalStudents}</td>
                  <td>{cls.collectionRate}%</td>
                  <td>RS {cls.totalCollected.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="section">
          <h2>Bottom Performing Classes</h2>
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>Students</th>
                <th>Collection Rate</th>
                <th>Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {bottomClasses.map((cls) => (
                <tr key={cls.class}>
                  <td>{cls.class}</td>
                  <td>{cls.totalStudents}</td>
                  <td>{cls.collectionRate}%</td>
                  <td>RS {cls.totalOutstanding.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

---

### Component 3: Admin Dashboard

```typescript
// components/AdminDashboard.tsx
import { useEffect, useState } from "react";
import {
  getKPIs,
  getOverduePayments,
  getPaymentStatusDistribution,
  getTopStudents,
} from "../services/admin-service";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export function AdminDashboard() {
  const [kpis, setKpis] = useState({});
  const [overduePayments, setOverduePayments] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

  useEffect(() => {
    const loadData = async () => {
      try {
        const kpiData = await getKPIs();
        const overdue = await getOverduePayments();
        const distribution = await getPaymentStatusDistribution();
        const top = await getTopStudents();
        setKpis(kpiData);
        setOverduePayments(overdue);
        setStatusDistribution(distribution);
        setTopStudents(top);
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      <div className="kpi-section">
        <div className="kpi-grid">
          {Object.values(kpis).map((kpi, index) => (
            <div key={index} className="kpi-card">
              <span className="icon">{kpi.icon}</span>
              <h3>{kpi.label}</h3>
              <p className="value">{kpi.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="charts-section">
        <div className="chart">
          <h2>Payment Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, percentage }) => `${status}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="table-section">
          <h2>Overdue Payments ({overduePayments.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Class</th>
                <th>Days Overdue</th>
                <th>Amount Due</th>
              </tr>
            </thead>
            <tbody>
              {overduePayments.slice(0, 10).map((payment, index) => (
                <tr key={index}>
                  <td>{payment.studentName}</td>
                  <td>{payment.class}</td>
                  <td className="overdue">{payment.daysOverdue} days</td>
                  <td>RS {payment.amountDue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="top-students-section">
        <h2>Top Students by Fees Paid</h2>
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Class</th>
              <th>Total Payments</th>
              <th>Total Paid</th>
            </tr>
          </thead>
          <tbody>
            {topStudents.map((student) => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.class}</td>
                <td>{student.totalPayments}</td>
                <td>RS {student.totalPaid.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## Part 6: CSS Styling

```css
/* styles/admin-dashboard.css */

.admin-dashboard {
  padding: 20px;
  background-color: #f5f5f5;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.kpi-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.kpi-card .icon {
  font-size: 32px;
  display: block;
  margin-bottom: 10px;
}

.kpi-card h3 {
  color: #666;
  font-size: 14px;
  margin: 10px 0;
}

.kpi-card .value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.chart-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

table th {
  background-color: #f0f0f0;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #333;
}

table td {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

table tr:hover {
  background-color: #f9f9f9;
}

.overdue {
  color: #ff6b6b;
  font-weight: bold;
}

.section {
  margin-bottom: 30px;
}
```

---

## Summary

This admin panel provides:

1. **Data Summary:** Overall statistics and monthly trends
2. **Class Analytics:** Class-wise performance and comparisons
3. **Dashboard:** KPIs, overdue payments, and top performers
4. **All Students Data:** Complete summary table for all students
5. **Charts & Visualizations:** Multiple chart types for data representation
6. **Export Ready:** All data can be easily exported to CSV/Excel

Use these APIs and components to build a comprehensive admin panel for your React project!
