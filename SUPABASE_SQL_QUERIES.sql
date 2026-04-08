-- ============================================================================
-- SUPABASE SQL QUERIES FOR STUDENT FEE COLLECTOR APP
-- ============================================================================
-- Copy and paste these queries into your Supabase SQL Editor to create tables
-- ============================================================================

-- ============================================================================
-- 1. CREATE STUDENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  monthly_fee DECIMAL(10, 2) NOT NULL,
  monthly_due_date INTEGER,
  due_date TEXT,
  email TEXT,
  password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);

-- Create index on class for filtering
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);

-- ============================================================================
-- 2. CREATE PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE,
  amount DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, month, year)
);

-- Create index on student_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);

-- Create index on payment_date for filtering
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

-- Create index on month and year for filtering
CREATE INDEX IF NOT EXISTS idx_payments_month_year ON payments(month, year);

-- ============================================================================
-- 3. CREATE SYNC_LOGS TABLE (Optional - for tracking sync operations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sync_logs (
  id TEXT PRIMARY KEY,
  operation TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on created_at for filtering recent syncs
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at);

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS) - OPTIONAL BUT RECOMMENDED
-- ============================================================================
-- Uncomment these lines if you want to enable RLS for security

-- ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CREATE POLICIES FOR RLS (Optional)
-- ============================================================================
-- Uncomment these if you enabled RLS above

-- CREATE POLICY "Allow all access to students" ON students
--   FOR ALL USING (true) WITH CHECK (true);

-- CREATE POLICY "Allow all access to payments" ON payments
--   FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 6. SAMPLE DATA (Optional - for testing)
-- ============================================================================
-- Uncomment to insert sample data for testing

-- INSERT INTO students (id, name, class, monthly_fee, monthly_due_date, email, password)
-- VALUES
--   ('student_001', 'Raj Kumar', '10-A', 5000, 15, 'raj@example.com', 'dGVzdDEyMw=='),
--   ('student_002', 'Priya Singh', '10-B', 4500, 10, 'priya@example.com', 'dGVzdDEyMw=='),
--   ('student_003', 'Amit Patel', '9-A', 4000, 20, 'amit@example.com', 'dGVzdDEyMw==');

-- INSERT INTO payments (id, student_id, month, year, payment_date, amount)
-- VALUES
--   ('payment_001', 'student_001', 1, 2024, '2024-01-15', 5000),
--   ('payment_002', 'student_001', 2, 2024, '2024-02-14', 5000),
--   ('payment_003', 'student_002', 1, 2024, '2024-01-10', 4500),
--   ('payment_004', 'student_003', 1, 2024, NULL, NULL);

-- ============================================================================
-- 7. USEFUL QUERIES FOR STUDENT PAYMENT STATS
-- ============================================================================

-- Query 1: Get student with all payment history
-- SELECT 
--   s.id,
--   s.name,
--   s.class,
--   s.monthly_fee,
--   s.monthly_due_date,
--   s.email,
--   p.month,
--   p.year,
--   p.payment_date,
--   p.amount,
--   CASE WHEN p.payment_date IS NULL THEN 'Pending' ELSE 'Paid' END as payment_status
-- FROM students s
-- LEFT JOIN payments p ON s.id = p.student_id
-- WHERE s.email = 'raj@example.com'
-- ORDER BY p.year DESC, p.month DESC;

-- Query 2: Get student payment summary for current year
-- SELECT 
--   s.id,
--   s.name,
--   s.class,
--   s.monthly_fee,
--   COUNT(CASE WHEN p.payment_date IS NOT NULL THEN 1 END) as payments_made,
--   COUNT(CASE WHEN p.payment_date IS NULL THEN 1 END) as payments_pending,
--   SUM(CASE WHEN p.payment_date IS NOT NULL THEN p.amount ELSE 0 END) as total_paid,
--   SUM(CASE WHEN p.payment_date IS NULL THEN s.monthly_fee ELSE 0 END) as total_due
-- FROM students s
-- LEFT JOIN payments p ON s.id = p.student_id AND p.year = EXTRACT(YEAR FROM CURRENT_DATE)
-- WHERE s.email = 'raj@example.com'
-- GROUP BY s.id, s.name, s.class, s.monthly_fee;

-- Query 3: Get student with overdue status
-- SELECT 
--   s.id,
--   s.name,
--   s.class,
--   s.monthly_fee,
--   s.monthly_due_date,
--   p.month,
--   p.year,
--   p.payment_date,
--   CASE 
--     WHEN p.payment_date IS NULL AND s.monthly_due_date < EXTRACT(DAY FROM CURRENT_DATE) THEN 'Overdue'
--     WHEN p.payment_date IS NULL THEN 'Pending'
--     ELSE 'Paid'
--   END as payment_status
-- FROM students s
-- LEFT JOIN payments p ON s.id = p.student_id AND p.year = EXTRACT(YEAR FROM CURRENT_DATE)
-- WHERE s.email = 'raj@example.com'
-- ORDER BY p.month DESC;

-- ============================================================================
-- END OF SQL QUERIES
-- ============================================================================
