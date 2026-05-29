-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create timetable table for class schedules
CREATE TABLE IF NOT EXISTS timetables (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  day TEXT NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  subject TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create test_schedules table
CREATE TABLE IF NOT EXISTS test_schedules (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  test_date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create results table for exam results
CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  exam_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  class_id TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  expiry_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_expiry CHECK (expiry_date > created_at),
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_classes_name ON classes(name);
CREATE INDEX IF NOT EXISTS idx_timetables_class_id ON timetables(class_id);
CREATE INDEX IF NOT EXISTS idx_timetables_day ON timetables(day);
CREATE INDEX IF NOT EXISTS idx_test_schedules_class_id ON test_schedules(class_id);
CREATE INDEX IF NOT EXISTS idx_test_schedules_date ON test_schedules(test_date);
CREATE INDEX IF NOT EXISTS idx_results_class_id ON results(class_id);
CREATE INDEX IF NOT EXISTS idx_results_exam_name ON results(exam_name);
CREATE INDEX IF NOT EXISTS idx_announcements_class_id ON announcements(class_id);
CREATE INDEX IF NOT EXISTS idx_announcements_expiry_date ON announcements(expiry_date);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since we're using anon key)
-- Classes policies
CREATE POLICY "Enable read access for all users" ON classes FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON classes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON classes FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON classes FOR DELETE USING (true);

-- Timetables policies
CREATE POLICY "Enable read access for all users" ON timetables FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON timetables FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON timetables FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON timetables FOR DELETE USING (true);

-- Test Schedules policies
CREATE POLICY "Enable read access for all users" ON test_schedules FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON test_schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON test_schedules FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON test_schedules FOR DELETE USING (true);

-- Results policies
CREATE POLICY "Enable read access for all users" ON results FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON results FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON results FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON results FOR DELETE USING (true);

-- Announcements policies
CREATE POLICY "Enable read access for all users" ON announcements FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON announcements FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON announcements FOR DELETE USING (true);
