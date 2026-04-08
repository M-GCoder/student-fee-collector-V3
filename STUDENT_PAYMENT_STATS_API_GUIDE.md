# Student Payment Stats API Guide

## Overview

This guide provides complete instructions for your second project to connect with the Supabase database and display student payment statistics using email and password authentication.

---

## Part 1: Database Setup

### Step 1: Create Tables in Supabase

Copy and paste the SQL queries from `SUPABASE_SQL_QUERIES.sql` into your Supabase SQL Editor:

1. Go to your Supabase project

1. Click **SQL Editor** in the left sidebar

1. Click **New Query**

1. Copy the SQL from `SUPABASE_SQL_QUERIES.sql` and paste it

1. Click **Run** to execute

This creates:

- `students` table with email and password fields

- `payments` table with payment records

- `sync_logs` table for tracking operations

- Proper indexes for performance

---

## Part 2: Authentication Flow

### Step 1: Student Login

When a student enters their email and password, authenticate them:

```typescript
// Example: TypeScript/React implementation
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

async function authenticateStudent(email: string, password: string) {
  try {
    // Query student by email
    const { data: students, error } = await supabase
      .from("students")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !students) {
      return { success: false, error: "Student not found" };
    }

    // Verify password (compare hashes)
    // Note: In production, use bcrypt.compare()
    const passwordHash = hashPassword(password);
    if (students.password !== passwordHash) {
      return { success: false, error: "Invalid password" };
    }

    return { success: true, student: students };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// Simple hash function (same as in main app)
function hashPassword(password: string): string {
  const salt = "student_fee_collector_2024";
  const combined = password + salt;
  return Buffer.from(combined).toString("base64");
}
```

---

## Part 3: Fetch Student Payment Stats

### Query 1: Complete Payment History

Get all payment records for a student:

```typescript
async function getStudentPaymentHistory(studentId: string) {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("student_id", studentId)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (error) throw error;

  return data; // Array of payment records
}
```

**Response Format:**

```json
[
  {
    "id": "payment_001",
    "student_id": "student_001",
    "month": 1,
    "year": 2024,
    "payment_date": "2024-01-15T00:00:00Z",
    "amount": 5000,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

---

### Query 2: Payment Status (Paid/Pending)

Get payment status for each month:

```typescript
async function getMonthlyPaymentStatus(
  studentId: string,
  year: number
) {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("student_id", studentId)
    .eq("year", year)
    .order("month", { ascending: true });

  if (error) throw error;

  // Transform to include status
  return data.map((payment) => ({
    ...payment,
    status: payment.payment_date ? "Paid" : "Pending",
    paidDate: payment.payment_date ? new Date(payment.payment_date) : null,
  }));
}
```

---

### Query 3: Payment Summary (Current Year)

Get total paid, total due, and payment count:

```typescript
async function getPaymentSummary(studentId: string) {
  const currentYear = new Date().getFullYear();

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .single();

  if (studentError) throw studentError;

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("*")
    .eq("student_id", studentId)
    .eq("year", currentYear);

  if (paymentsError) throw paymentsError;

  // Calculate summary
  const totalPaid = payments
    .filter((p) => p.payment_date)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalDue = payments
    .filter((p) => !p.payment_date)
    .reduce((sum) => sum + (student.monthly_fee || 0), 0);

  const paymentsMade = payments.filter((p) => p.payment_date).length;
  const paymentsPending = payments.filter((p) => !p.payment_date).length;

  return {
    studentName: student.name,
    studentClass: student.class,
    monthlyFee: student.monthly_fee,
    totalPaid,
    totalDue,
    paymentsMade,
    paymentsPending,
    paymentHistory: payments,
  };
}
```

**Response Format:**

```json
{
  "studentName": "Raj Kumar",
  "studentClass": "10-A",
  "monthlyFee": 5000,
  "totalPaid": 15000,
  "totalDue": 10000,
  "paymentsMade": 3,
  "paymentsPending": 2,
  "paymentHistory": [
    {
      "month": 1,
      "year": 2024,
      "status": "Paid",
      "paidDate": "2024-01-15T00:00:00Z",
      "amount": 5000
    },
    {
      "month": 2,
      "year": 2024,
      "status": "Paid",
      "paidDate": "2024-02-14T00:00:00Z",
      "amount": 5000
    },
    {
      "month": 3,
      "year": 2024,
      "status": "Pending",
      "paidDate": null,
      "amount": 5000
    }
  ]
}
```

---

### Query 4: Overdue Status

Check if payment is overdue:

```typescript
async function getOverdueStatus(studentId: string) {
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .single();

  if (studentError) throw studentError;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentDay = new Date().getDate();

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("*")
    .eq("student_id", studentId)
    .eq("year", currentYear);

  if (paymentsError) throw paymentsError;

  // Check each month for overdue status
  return payments.map((payment) => {
    const isOverdue =
      !payment.payment_date &&
      (payment.month < currentMonth ||
        (payment.month === currentMonth &&
          student.monthly_due_date &&
          currentDay > student.monthly_due_date));

    return {
      month: payment.month,
      status: payment.payment_date ? "Paid" : isOverdue ? "Overdue" : "Pending",
      dueDate: student.monthly_due_date,
      paidDate: payment.payment_date,
    };
  });
}
```

---

### Query 5: Complete Student Dashboard

Get all stats in one query:

```typescript
async function getStudentDashboard(studentId: string) {
  const currentYear = new Date().getFullYear();

  // Get student details
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .single();

  if (studentError) throw studentError;

  // Get all payments
  const { data: allPayments, error: allPaymentsError } = await supabase
    .from("payments")
    .select("*")
    .eq("student_id", studentId)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (allPaymentsError) throw allPaymentsError;

  // Get current year payments
  const currentYearPayments = allPayments.filter((p) => p.year === currentYear);

  // Calculate statistics
  const stats = {
    student: {
      id: student.id,
      name: student.name,
      class: student.class,
      email: student.email,
      monthlyFee: student.monthly_fee,
      monthlyDueDate: student.monthly_due_date,
      dueDate: student.due_date,
    },
    currentYear: {
      year: currentYear,
      totalPayments: currentYearPayments.length,
      paidPayments: currentYearPayments.filter((p) => p.payment_date).length,
      pendingPayments: currentYearPayments.filter((p) => !p.payment_date).length,
      totalPaid: currentYearPayments
        .filter((p) => p.payment_date)
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      totalDue: currentYearPayments
        .filter((p) => !p.payment_date)
        .reduce((sum) => sum + (student.monthly_fee || 0), 0),
      paymentPercentage: Math.round(
        (currentYearPayments.filter((p) => p.payment_date).length /
          currentYearPayments.length) *
          100
      ),
    },
    paymentHistory: allPayments.map((payment) => ({
      id: payment.id,
      month: payment.month,
      year: payment.year,
      amount: payment.amount,
      paidDate: payment.payment_date,
      status: payment.payment_date ? "Paid" : "Pending",
    })),
    monthlyBreakdown: currentYearPayments.map((payment) => ({
      month: payment.month,
      monthName: new Date(currentYear, payment.month - 1).toLocaleString(
        "default",
        { month: "long" }
      ),
      amount: payment.amount || student.monthly_fee,
      paidDate: payment.payment_date,
      status: payment.payment_date ? "Paid" : "Pending",
      daysOverdue: calculateDaysOverdue(
        payment.month,
        student.monthly_due_date
      ),
    })),
  };

  return stats;
}

function calculateDaysOverdue(month: number, dueDay: number | null): number {
  if (!dueDay) return 0;

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentDay = currentDate.getDate();

  if (month >= currentMonth) return 0; // Not yet due

  const dueDate = new Date(currentDate.getFullYear(), month - 1, dueDay);
  const today = new Date();

  const diffTime = today.getTime() - dueDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}
```

**Response Format:**

```json
{
  "student": {
    "id": "student_001",
    "name": "Raj Kumar",
    "class": "10-A",
    "email": "raj@example.com",
    "monthlyFee": 5000,
    "monthlyDueDate": 15
  },
  "currentYear": {
    "year": 2024,
    "totalPayments": 12,
    "paidPayments": 3,
    "pendingPayments": 9,
    "totalPaid": 15000,
    "totalDue": 45000,
    "paymentPercentage": 25
  },
  "paymentHistory": [
    {
      "month": 1,
      "year": 2024,
      "amount": 5000,
      "paidDate": "2024-01-15T00:00:00Z",
      "status": "Paid"
    }
  ],
  "monthlyBreakdown": [
    {
      "month": 1,
      "monthName": "January",
      "amount": 5000,
      "paidDate": "2024-01-15T00:00:00Z",
      "status": "Paid",
      "daysOverdue": 0
    },
    {
      "month": 2,
      "monthName": "February",
      "amount": 5000,
      "paidDate": null,
      "status": "Pending",
      "daysOverdue": 22
    }
  ]
}
```

---

## Part 4: Implementation Steps for Your Second Project

### Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js
```

### Step 2: Set Up Supabase Client

```typescript
// lib/supabase-client.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "";
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Step 3: Create Login Component

```typescript
// components/StudentLogin.tsx
import { useState } from "react";
import { authenticateStudent } from "../services/auth-service";

export function StudentLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const result = await authenticateStudent(email, password);

    if (result.success) {
      // Store student data and redirect to dashboard
      localStorage.setItem("student", JSON.stringify(result.student));
      window.location.href = "/dashboard";
    } else {
      setError(result.error || "Login failed");
    }

    setLoading(false);
  };

  return (
    <div className="login-form">
      <h1>Student Login</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin} disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

### Step 4: Create Dashboard Component

```typescript
// components/StudentDashboard.tsx
import { useEffect, useState } from "react";
import { getStudentDashboard } from "../services/payment-service";

export function StudentDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const student = JSON.parse(localStorage.getItem("student") || "{}");
    if (student.id) {
      getStudentDashboard(student.id).then(setStats).finally(() => setLoading(false));
    }
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>No data found</div>;

  return (
    <div className="dashboard">
      <h1>{stats.student.name}</h1>
      <p>Class: {stats.student.class}</p>
      <p>Monthly Fee: RS {stats.student.monthlyFee}</p>

      <div className="summary">
        <h2>Current Year ({stats.currentYear.year})</h2>
        <p>Total Paid: RS {stats.currentYear.totalPaid}</p>
        <p>Total Due: RS {stats.currentYear.totalDue}</p>
        <p>Payment Status: {stats.currentYear.paymentPercentage}%</p>
      </div>

      <div className="monthly-breakdown">
        <h2>Monthly Breakdown</h2>
        {stats.monthlyBreakdown.map((month) => (
          <div key={month.month} className={`month ${month.status.toLowerCase()}`}>
            <p>{month.monthName}</p>
            <p>Amount: RS {month.amount}</p>
            <p>Status: {month.status}</p>
            {month.paidDate && <p>Paid: {new Date(month.paidDate).toLocaleDateString()}</p>}
            {month.daysOverdue > 0 && <p className="overdue">Overdue by {month.daysOverdue} days</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Part 5: Environment Variables

Create a `.env.local` file in your second project:

```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from your Supabase project settings.

---

## Part 6: Security Considerations

1. **Password Hashing:** Use bcrypt in production instead of base64

1. **HTTPS Only:** Always use HTTPS for authentication

1. **Row Level Security:** Enable RLS policies in Supabase

1. **Rate Limiting:** Implement rate limiting on login attempts

1. **Token Management:** Use secure session tokens for logged-in users

---

## Part 7: Useful SQL Queries

### Get all students in a class:

```sql
SELECT * FROM students WHERE class = '10-A' ORDER BY name;
```

### Get total fees collected this month:

```sql
SELECT 
  SUM(amount ) as total_collected,
  COUNT(*) as payment_count
FROM payments
WHERE EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)
  AND payment_date IS NOT NULL;
```

### Get overdue payments:

```sql
SELECT 
  s.name,
  s.class,
  s.monthly_fee,
  p.month,
  p.year
FROM students s
LEFT JOIN payments p ON s.id = p.student_id
WHERE p.payment_date IS NULL
  AND p.year = EXTRACT(YEAR FROM CURRENT_DATE)
  AND s.monthly_due_date < EXTRACT(DAY FROM CURRENT_DATE)
ORDER BY s.name;
```

---

## Support & Troubleshooting

- **Connection Issues:** Verify Supabase URL and API key

- **Authentication Fails:** Check email/password hashing consistency

- **No Data Returned:** Ensure tables are created and have data

- **CORS Errors:** Configure CORS in Supabase project settings

---

## Next Steps

1. Create tables using SQL queries

1. Set up your second project with Supabase client

1. Implement login component

1. Build dashboard to display payment stats

1. Test with sample student data

