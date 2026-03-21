-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  monthly_fee NUMERIC NOT NULL,
  monthly_due_date INTEGER,
  due_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  CONSTRAINT valid_monthly_due_date CHECK (monthly_due_date IS NULL OR (monthly_due_date >= 1 AND monthly_due_date <= 31))
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  payment_date TIMESTAMP NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  CONSTRAINT valid_month CHECK (month >= 0 AND month <= 11),
  CONSTRAINT valid_year CHECK (year > 1900),
  UNIQUE(student_id, month, year)
);

-- Create sync_logs table for tracking sync operations
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_status TEXT NOT NULL CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
  last_sync_time TIMESTAMP NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_year_month ON payments(year, month);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since we're using anon key)
CREATE POLICY "Enable read access for all users" ON students FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON students FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON students FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON payments FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON payments FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON payments FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON sync_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON sync_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON sync_logs FOR UPDATE USING (true);
