-- ============================================================================
-- ADMIN PANEL SQL QUERIES FOR ALL STUDENTS SUMMARY
-- ============================================================================
-- These queries provide comprehensive data for admin dashboard showing
-- summary of all students, class analytics, and overall statistics
-- ============================================================================

-- ============================================================================
-- 1. DATA SUMMARY - OVERALL STATISTICS
-- ============================================================================

-- Query 1.1: Overall Collection Summary (Current Year)
SELECT 
  EXTRACT(YEAR FROM CURRENT_DATE) as year,
  COUNT(DISTINCT s.id) as total_students,
  COUNT(DISTINCT s.class) as total_classes,
  SUM(s.monthly_fee) as total_monthly_fees,
  COUNT(CASE WHEN p.payment_date IS NOT NULL THEN 1 END) as total_payments_made,
  COUNT(CASE WHEN p.payment_date IS NULL THEN 1 END) as total_payments_pending,
  SUM(CASE WHEN p.payment_date IS NOT NULL THEN p.amount ELSE 0 END) as total_collected,
  SUM(CASE WHEN p.payment_date IS NULL THEN s.monthly_fee ELSE 0 END) as total_outstanding,
  ROUND(
    (COUNT(CASE WHEN p.payment_date IS NOT NULL THEN 1 END)::NUMERIC / 
     NULLIF(COUNT(*), 0)) * 100, 2
  ) as collection_percentage
FROM students s
LEFT JOIN payments p ON s.id = p.student_id 
  AND p.year = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY EXTRACT(YEAR FROM CURRENT_DATE);

-- Query 1.2: Monthly Collection Trend (Current Year)
SELECT 
  p.month,
  TO_CHAR(TO_DATE(p.month::text, 'MM'), 'Month') as month_name,
  COUNT(DISTINCT s.id) as total_students,
  COUNT(CASE WHEN p.payment_date IS NOT NULL THEN 1 END) as payments_made,
  COUNT(CASE WHEN p.payment_date IS NULL THEN 1 END) as payments_pending,
  SUM(CASE WHEN p.payment_date IS NOT NULL THEN p.amount ELSE 0 END) as amount_collected,
  SUM(CASE WHEN p.payment_date IS NULL THEN s.monthly_fee ELSE 0 END) as amount_outstanding,
  ROUND(
    (COUNT(CASE WHEN p.payment_date IS NOT NULL THEN 1 END)::NUMERIC / 
     NULLIF(COUNT(*), 0)) * 100, 2
  ) as collection_rate
FROM students s
LEFT JOIN payments p ON s.id = p.student_id 
  AND p.year = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE p.month IS NOT NULL
GROUP BY p.month
ORDER BY p.month ASC;

-- Query 1.3: Student-wise Summary (All Students)
SELECT 
  s.id,
  s.name,
  s.class,
  s.monthly_fee,
  s.monthly_due_date,
  s.email,
  COUNT(CASE WHEN p.payment_date IS NOT NULL AND p.year = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 END) as payments_made_current_year,
  COUNT(CASE WHEN p.payment_date IS NULL AND p.year = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 END) as payments_pending_current_year,
  SUM(CASE WHEN p.payment_date IS NOT NULL AND p.year = EXTRACT(YEAR FROM CURRENT_DATE) THEN p.amount ELSE 0 END) as total_paid_current_year,
  SUM(CASE WHEN p.payment_date IS NULL AND p.year = EXTRACT(YEAR FROM CURRENT_DATE) THEN s.monthly_fee ELSE 0 END) as total_due_current_year,
  COUNT(CASE WHEN p.payment_date IS NOT NULL THEN 1 END) as total_payments_all_time,
  SUM(CASE WHEN p.payment_date IS NOT NULL THEN p.amount ELSE 0 END) as total_paid_all_time,
  MAX(p.payment_date) as last_payment_date,
  CASE 
    WHEN COUNT(CASE WHEN p.payment_date IS NULL AND p.year = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 END) > 0 
      AND s.monthly_due_date < EXTRACT(DAY FROM CURRENT_DATE) 
    THEN 'Overdue'
    WHEN COUNT(CASE WHEN p.payment_date IS NULL AND p.year = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 END) > 0 
    THEN 'Pending'
    ELSE 'Paid'
  END as current_status
FROM students s
LEFT JOIN payments p ON s.id = p.student_id
GROUP BY s.id, s.name, s.class, s.monthly_fee, s.monthly_due_date, s.email
ORDER BY s.class, s.name;

-- ============================================================================
-- 2. CLASS ANALYTICS - CLASS-WISE STATISTICS
-- ============================================================================

-- Query 2.1: Class-wise Summary (Current Year)
SELECT 
  s.class,
  COUNT(DISTINCT s.id) as total_students,
  SUM(s.monthly_fee) as total_monthly_fees,
  COUNT(CASE WHEN p.payment_date IS NOT NULL THEN 1 END) as total_payments_made,
  COUNT(CASE WHEN p.payment_date IS NULL THEN 1 END) as total_payments_pending,
  SUM(CASE WHEN p.payment_date IS NOT NULL THEN p.amount ELSE 0 END) as total_collected,
  SUM(CASE WHEN p.payment_date IS NULL THEN s.monthly_fee ELSE 0 END) as total_outstanding,
  ROUND(
    (SUM(CASE WHEN p.payment_date IS NOT NULL THEN p.amount ELSE 0 END)::NUMERIC / 
     NULLIF(SUM(s.monthly_fee), 0)) * 100, 2
  ) as collection_rate,
  ROUND(
    (COUNT(CASE WHEN p.payment_date IS NOT NULL THEN 1 END)::NUMERIC / 
     NULLIF(COUNT(*), 0)) * 100, 2
  ) as payment_completion_rate
FROM students s
LEFT JOIN payments p ON s.id = p.student_id 
  AND p.year = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY s.class
ORDER BY s.class;

-- Query 2.2: Class-wise Student Details
SELECT 
  s.class,
  s.id,
  s.name,
  s.monthly_fee,
  COUNT(CASE WHEN p.payment_date IS NOT NULL AND p.year = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 END) as payments_made,
  COUNT(CASE WHEN p.payment_date IS NULL AND p.year = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 END) as payments_pending,
  SUM(CASE WHEN p.payment_date IS NOT NULL AND p.year = EXTRACT(YEAR FROM CURRENT_DATE) THEN p.amount ELSE 0 END) as total_paid,
  SUM(CASE WHEN p.payment_date IS NULL AND p.year = EXTRACT(YEAR FROM CURRENT_DATE) THEN s.monthly_fee ELSE 0 END) as total_due,
  CASE 
    WHEN COUNT(CASE WHEN p.payment_date IS NULL AND p.year = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 END) > 0 
      AND s.monthly_due_date < EXTRACT(DAY FROM CURRENT_DATE) 
    THEN 'Overdue'
    WHEN COUNT(CASE WHEN p.payment_date IS NULL AND p.year = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 END) > 0 
    THEN 'Pending'
    ELSE 'Paid'
  END as status
FROM students s
LEFT JOIN payments p ON s.id = p.student_id
GROUP BY s.class, s.id, s.name, s.monthly_fee, s.monthly_due_date
ORDER BY s.class, s.name;

-- Query 2.3: Top Performing Classes (Highest Collection Rate)
SELECT 
  s.class,
  COUNT(DISTINCT s.id) as total_students,
  ROUND(
    (SUM(CASE WHEN p.payment_date IS NOT NULL THEN p.amount ELSE 0 END)::NUMERIC / 
     NULLIF(SUM(s.monthly_fee), 0)) * 100, 2
  ) as collection_rate,
  SUM(CASE WHEN p.payment_date IS NOT NULL THEN p.amount ELSE 0 END) as total_collected,
  SUM(CASE WHEN p.payment_date IS NULL THEN s.monthly_fee ELSE 0 END) as total_outstanding
FROM students s
LEFT JOIN payments p ON s.id = p.student_id 
  AND p.year = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY s.class
ORDER BY collection_rate DESC
LIMIT 5;

-- Query 2.4: Bottom Performing Classes (Lowest Collection Rate)
SELECT 
  s.class,
  COUNT(DISTINCT s.id) as total_students,
  ROUND(
    (SUM(CASE WHEN p.payment_date IS NOT NULL THEN p.amount ELSE 0 END)::NUMERIC / 
     NULLIF(SUM(s.monthly_fee), 0)) * 100, 2
  ) as collection_rate,
  SUM(CASE WHEN p.payment_date IS NOT NULL THEN p.amount ELSE 0 END) as total_collected,
  SUM(CASE WHEN p.payment_date IS NULL THEN s.monthly_fee ELSE 0 END) as total_outstanding
FROM students s
LEFT JOIN payments p ON s.id = p.student_id 
  AND p.year = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY s.class
ORDER BY collection_rate ASC
LIMIT 5;

-- ============================================================================
-- 3. DASHBOARD - KEY METRICS & INSIGHTS
-- ============================================================================

-- Query 3.1: Key Performance Indicators (KPIs)
SELECT 
  'Total Students' as metric,
  COUNT(DISTINCT s.id)::TEXT as value
FROM students s
UNION ALL
SELECT 'Total Classes', COUNT(DISTINCT s.class)::TEXT
FROM students s
UNION ALL
SELECT 'Total Monthly Fees', SUM(s.monthly_fee)::TEXT
FROM students s
UNION ALL
SELECT 'Current Year Collection', 
  SUM(CASE WHEN p.payment_date IS NOT NULL THEN p.amount ELSE 0 END)::TEXT
FROM students s
LEFT JOIN payments p ON s.id = p.student_id 
  AND p.year = EXTRACT(YEAR FROM CURRENT_DATE)
UNION ALL
SELECT 'Current Year Outstanding', 
  SUM(CASE WHEN p.payment_date IS NULL THEN s.monthly_fee ELSE 0 END)::TEXT
FROM students s
LEFT JOIN payments p ON s.id = p.student_id 
  AND p.year = EXTRACT(YEAR FROM CURRENT_DATE)
UNION ALL
SELECT 'Collection Rate (%)', 
  ROUND(
    (SUM(CASE WHEN p.payment_date IS NOT NULL THEN p.amount ELSE 0 END)::NUMERIC / 
     NULLIF(SUM(s.monthly_fee), 0)) * 100, 2
  )::TEXT
FROM students s
LEFT JOIN payments p ON s.id = p.student_id 
  AND p.year = EXTRACT(YEAR FROM CURRENT_DATE);

-- Query 3.2: Overdue Payments Summary
SELECT 
  s.id,
  s.name,
  s.class,
  s.monthly_fee,
  s.monthly_due_date,
  p.month,
  p.year,
  EXTRACT(DAY FROM CURRENT_DATE) - s.monthly_due_date as days_overdue,
  s.monthly_fee as amount_due
FROM students s
LEFT JOIN payments p ON s.id = p.student_id
WHERE p.payment_date IS NULL
  AND p.year = EXTRACT(YEAR FROM CURRENT_DATE)
  AND s.monthly_due_date < EXTRACT(DAY FROM CURRENT_DATE)
ORDER BY days_overdue DESC, s.class, s.name;

-- Query 3.3: Payment Status Distribution (Current Year)
SELECT 
  CASE 
    WHEN p.payment_date IS NOT NULL THEN 'Paid'
    WHEN s.monthly_due_date < EXTRACT(DAY FROM CURRENT_DATE) THEN 'Overdue'
    ELSE 'Pending'
  END as payment_status,
  COUNT(*) as count,
  SUM(CASE WHEN p.payment_date IS NOT NULL THEN p.amount ELSE s.monthly_fee END) as total_amount
FROM students s
LEFT JOIN payments p ON s.id = p.student_id 
  AND p.year = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY payment_status
ORDER BY 
  CASE 
    WHEN payment_status = 'Paid' THEN 1
    WHEN payment_status = 'Pending' THEN 2
    ELSE 3
  END;

-- Query 3.4: Top 10 Students by Total Fees Paid (All Time)
SELECT 
  s.id,
  s.name,
  s.class,
  COUNT(CASE WHEN p.payment_date IS NOT NULL THEN 1 END) as total_payments,
  SUM(CASE WHEN p.payment_date IS NOT NULL THEN p.amount ELSE 0 END) as total_paid,
  MAX(p.payment_date) as last_payment_date
FROM students s
LEFT JOIN payments p ON s.id = p.student_id
GROUP BY s.id, s.name, s.class
ORDER BY total_paid DESC
LIMIT 10;

-- Query 3.5: Students with Outstanding Fees (Current Year)
SELECT 
  s.id,
  s.name,
  s.class,
  s.monthly_fee,
  COUNT(CASE WHEN p.payment_date IS NULL THEN 1 END) as pending_months,
  (COUNT(CASE WHEN p.payment_date IS NULL THEN 1 END) * s.monthly_fee) as total_outstanding,
  MAX(p.payment_date) as last_payment_date
FROM students s
LEFT JOIN payments p ON s.id = p.student_id 
  AND p.year = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE p.payment_date IS NULL
GROUP BY s.id, s.name, s.class, s.monthly_fee
ORDER BY total_outstanding DESC;

-- Query 3.6: Monthly Trend Chart Data (Last 12 Months)
SELECT 
  p.month,
  TO_CHAR(TO_DATE(p.month::text, 'MM'), 'Mon') as month_short,
  SUM(CASE WHEN p.payment_date IS NOT NULL THEN p.amount ELSE 0 END) as collected,
  SUM(CASE WHEN p.payment_date IS NULL THEN s.monthly_fee ELSE 0 END) as outstanding,
  COUNT(CASE WHEN p.payment_date IS NOT NULL THEN 1 END) as payments_made,
  COUNT(CASE WHEN p.payment_date IS NULL THEN 1 END) as payments_pending
FROM students s
LEFT JOIN payments p ON s.id = p.student_id 
  AND p.year = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE p.month IS NOT NULL
GROUP BY p.month
ORDER BY p.month ASC;

-- Query 3.7: Class Distribution Pie Chart Data
SELECT 
  s.class,
  COUNT(DISTINCT s.id) as student_count,
  SUM(s.monthly_fee) as total_fees,
  ROUND(
    (COUNT(DISTINCT s.id)::NUMERIC / 
     (SELECT COUNT(DISTINCT id) FROM students)) * 100, 2
  ) as percentage
FROM students s
GROUP BY s.class
ORDER BY student_count DESC;

-- ============================================================================
-- 4. EXPORT DATA - FOR REPORTS
-- ============================================================================

-- Query 4.1: Complete Student Report (All Data)
SELECT 
  s.id,
  s.name,
  s.class,
  s.email,
  s.monthly_fee,
  s.monthly_due_date,
  COUNT(CASE WHEN p.payment_date IS NOT NULL AND p.year = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 END) as payments_made_current_year,
  COUNT(CASE WHEN p.payment_date IS NULL AND p.year = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 END) as payments_pending_current_year,
  SUM(CASE WHEN p.payment_date IS NOT NULL AND p.year = EXTRACT(YEAR FROM CURRENT_DATE) THEN p.amount ELSE 0 END) as total_paid_current_year,
  SUM(CASE WHEN p.payment_date IS NULL AND p.year = EXTRACT(YEAR FROM CURRENT_DATE) THEN s.monthly_fee ELSE 0 END) as total_due_current_year,
  s.created_at,
  MAX(p.payment_date) as last_payment_date
FROM students s
LEFT JOIN payments p ON s.id = p.student_id
GROUP BY s.id, s.name, s.class, s.email, s.monthly_fee, s.monthly_due_date, s.created_at
ORDER BY s.class, s.name;

-- Query 4.2: Payment Details Report (All Payments)
SELECT 
  s.name,
  s.class,
  s.email,
  s.monthly_fee,
  p.id,
  p.month,
  p.year,
  TO_CHAR(TO_DATE(p.month::text, 'MM'), 'Month') as month_name,
  p.payment_date,
  p.amount,
  CASE WHEN p.payment_date IS NOT NULL THEN 'Paid' ELSE 'Pending' END as status
FROM students s
LEFT JOIN payments p ON s.id = p.student_id
ORDER BY s.class, s.name, p.year DESC, p.month DESC;

-- ============================================================================
-- END OF ADMIN PANEL SQL QUERIES
-- ============================================================================
