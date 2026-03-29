# Supabase Database Setup Guide

This guide explains how to create the required tables in your Supabase database.

## Problem
When syncing data to Supabase, you get this error:
```
Error syncing students to cloud: {"code": "PGRST205", "message": "Could not find the table 'public.students' in the schema cache"}
```

**Solution:** You need to create the database tables first.

---

## Step 1: Log in to Supabase Dashboard

1. Go to https://supabase.com/
2. Click "Sign In"
3. Log in with your account
4. Select your project: **gtjjklulfzkwqjvoqclg**

---

## Step 2: Open SQL Editor

1. In the left sidebar, click **"SQL Editor"**
2. Click **"New Query"** button
3. You'll see a blank SQL editor

---

## Step 3: Copy and Paste SQL

Copy the entire SQL code below and paste it into the SQL editor:

```sql
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
```

---

## Step 4: Execute the SQL

1. Click the **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
2. Wait for the query to complete (usually 2-5 seconds)
3. You should see a success message: **"Query executed successfully"**

---

## Step 5: Verify Tables Were Created

1. In the left sidebar, click **"Table Editor"**
2. You should see three new tables:
   - ✅ **students**
   - ✅ **payments**
   - ✅ **sync_logs**

If you see all three tables, you're done! ✅

---

## Step 6: Test Sync in Your App

1. Go back to your app
2. Open the **Summary** tab
3. Click the **3-dot menu** (⋮)
4. Enter your Supabase credentials:
   - **Project URL:** `https://gtjjklulfzkwqjvoqclg.supabase.co`
   - **Anon Key:** (your key from the setup)
5. Click **"Test Connection"** - should show ✅ Connected
6. Click **"Sync to Cloud"** - should now work without errors!

---

## What Each Table Does

| Table | Purpose |
|-------|---------|
| **students** | Stores student information (name, class, monthly fee) |
| **payments** | Stores payment records (which student paid, when, how much) |
| **sync_logs** | Tracks when data was synced (for debugging) |

---

## Troubleshooting

### Issue: "Table already exists"
**Solution:** This is fine! The `IF NOT EXISTS` clause prevents errors. Just run the query again.

### Issue: "Permission denied"
**Solution:** Make sure you're logged in as the project owner. Check your Supabase account permissions.

### Issue: "Syntax error"
**Solution:** Make sure you copied the entire SQL code correctly. Try copying it again.

### Issue: Tables created but sync still fails
**Solution:** 
1. Refresh your app (close and reopen)
2. Clear app cache/data
3. Try syncing again

---

## Next Steps

Once tables are created:

1. **Add students** to your app
2. **Record payments** for students
3. **Sync to Cloud** using the 3-dot menu
4. **Import from Cloud** on another device to verify sync works
5. **Test data recovery** by uninstalling and reinstalling the app

---

## Database Schema Diagram

```
students
├── id (TEXT, PRIMARY KEY)
├── name (TEXT)
├── class (TEXT)
├── monthly_fee (NUMERIC)
├── monthly_due_date (INTEGER)
├── due_date (TIMESTAMP)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

payments
├── id (TEXT, PRIMARY KEY)
├── student_id (TEXT, FOREIGN KEY → students.id)
├── month (INTEGER)
├── year (INTEGER)
├── payment_date (TIMESTAMP)
├── amount (NUMERIC)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

sync_logs
├── id (UUID, PRIMARY KEY)
├── sync_status (TEXT)
├── last_sync_time (TIMESTAMP)
├── error_message (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

---

## Need Help?

- **Supabase Docs:** https://supabase.com/docs
- **SQL Reference:** https://www.postgresql.org/docs/current/
- **Contact Support:** Check your Supabase dashboard for support options

---

**Once you've created the tables, your sync feature will work perfectly!** 🎉
