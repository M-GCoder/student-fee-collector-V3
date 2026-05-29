# Supabase Integration Setup Guide

This guide explains how to set up Supabase cloud data persistence for the Student Fee Collector app.

## Overview

The app now supports syncing student and payment data to Supabase cloud, ensuring your data is never lost and can be accessed from multiple devices.

## Prerequisites

- A Supabase account (free tier available at https://supabase.com)
- Your Supabase Project URL and Anon Key

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign up or log in
2. Create a new project
3. Note your **Project URL** and **Anon Key** (found in Settings → API)

## Step 2: Create Database Tables

### Initial Setup (Run First)
1. Go to your Supabase dashboard
2. Click on **SQL Editor** in the left sidebar
3. Create a new query and paste the SQL from `supabase/migrations/001_create_tables.sql`
4. Click **Run** to create the tables

The SQL creates three tables:
- **students**: Stores student information (name, class, monthly fee, due date)
- **payments**: Stores payment records (student ID, month, year, payment date, amount)
- **sync_logs**: Tracks sync operations for debugging

### Add New Tables (Run Second)
5. Create another new query and paste the SQL from `supabase/migrations/002_add_classes_announcements_results.sql`
6. Click **Run** to create the new tables

The SQL creates five new tables:
- **classes**: Stores class information
- **timetables**: Stores class schedules with subjects and time periods
- **test_schedules**: Stores test schedules for classes
- **results**: Stores exam results (images/PDFs)
- **announcements**: Stores class announcements with optional attachments and expiry dates

## Step 3: Configure the App

1. Open the Student Fee Collector app
2. Go to the **Summary** tab
3. Tap the **3-dot menu** (⋮) in the top-right corner
4. Paste your Supabase credentials:
   - **Project URL**: `https://your-project.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIs...`
5. Click **Test Connection** to verify the credentials
6. Click **Save** (credentials are stored locally)

## Step 4: Sync Your Data

### Upload to Cloud (Sync to Cloud)

1. In the Supabase Config modal, click **Sync to Cloud**
2. All your local students and payments will be uploaded to Supabase
3. A confirmation message shows how many records were synced

### Download from Cloud (Import from Cloud)

1. In the Supabase Config modal, click **Import from Cloud**
2. All data from Supabase will be downloaded and saved locally
3. This is useful when switching devices or restoring data

## Features

### Automatic Sync
- Data is synced whenever you use the sync buttons
- Sync logs are tracked in the `sync_logs` table for debugging

### Data Persistence
- All student records are stored in the cloud
- All payment records are backed up
- Data survives app uninstalls and device changes

### Conflict Resolution
- Uses upsert (insert or update) to handle duplicates
- Existing records are updated with the latest data
- No data loss during sync operations

## Step 3: Create Storage Buckets

You also need to set up storage buckets for file uploads:

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket named **results** (for exam result files, max 5MB)
3. Create a new bucket named **announcements** (for announcement attachments, max 12MB)
4. Set appropriate file size limits and make them public if needed

## Database Schema

### Classes Table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary Key (UUID) |
| name | TEXT | Class name (unique) |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### Timetables Table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary Key (UUID) |
| class_id | TEXT | Foreign key to classes |
| day | TEXT | Day of week (Monday-Sunday) |
| subject | TEXT | Subject name |
| start_time | TEXT | Start time (HH:MM format) |
| end_time | TEXT | End time (HH:MM format) |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### Test Schedules Table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary Key (UUID) |
| class_id | TEXT | Foreign key to classes |
| subject | TEXT | Subject name |
| test_date | DATE | Date of the test |
| start_time | TEXT | Start time (optional, HH:MM format) |
| end_time | TEXT | End time (optional, HH:MM format) |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### Results Table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary Key (UUID) |
| class_id | TEXT | Foreign key to classes |
| exam_name | TEXT | Name of the exam |
| file_name | TEXT | Original file name |
| file_url | TEXT | URL to the file in Supabase Storage |
| file_size | INTEGER | File size in bytes |
| uploaded_at | TIMESTAMP | Upload timestamp |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### Announcements Table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary Key (UUID) |
| title | TEXT | Announcement title |
| description | TEXT | Announcement description |
| class_id | TEXT | Foreign key to classes ("all" for all classes) |
| file_url | TEXT | URL to attached file (optional) |
| file_name | TEXT | Original file name (optional) |
| file_size | INTEGER | File size in bytes (optional) |
| expiry_date | TIMESTAMP | Date when announcement expires |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### Students Table
```sql
id: TEXT (Primary Key)
name: TEXT
class: TEXT
monthly_fee: NUMERIC
monthly_due_date: INTEGER (1-31, optional)
due_date: TIMESTAMP (optional)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

### Payments Table
```sql
id: TEXT (Primary Key)
student_id: TEXT (Foreign Key → students.id)
month: INTEGER (0-11)
year: INTEGER
payment_date: TIMESTAMP
amount: NUMERIC
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

### Sync Logs Table
```sql
id: UUID (Primary Key)
sync_status: TEXT ('pending', 'syncing', 'completed', 'failed')
last_sync_time: TIMESTAMP
error_message: TEXT (optional)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

## Troubleshooting

### "Could not find the table" Error
- Ensure you've run the SQL migration to create tables
- Check that you're using the correct Supabase project

### "Invalid credentials" Error
- Verify your Project URL and Anon Key are correct
- Check that your Supabase project is active
- Ensure Row Level Security (RLS) policies are enabled

### Sync Fails
- Check your internet connection
- Verify Supabase credentials in the config modal
- Check the sync logs in Supabase dashboard for error details

### Data Not Syncing
- Click "Test Connection" to verify credentials
- Ensure you have students/payments to sync
- Check that sync_logs table exists and is accessible

## Security Notes

- **Anon Key**: This is a public key and is safe to include in the app
- **Service Role Key**: Never include this in client-side code
- **Row Level Security**: Policies are configured to allow all operations (suitable for local/personal use)
- For production, consider implementing user authentication and stricter RLS policies

## Advanced: Manual Database Queries

You can query your data directly from the Supabase dashboard:

### View all students
```sql
SELECT * FROM students ORDER BY created_at DESC;
```

### View all payments for a student
```sql
SELECT * FROM payments 
WHERE student_id = 'student_id_here' 
ORDER BY year DESC, month DESC;
```

### View sync history
```sql
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 20;
```

### Export data as CSV
1. Go to SQL Editor
2. Run your query
3. Click the download icon to export as CSV

## Support

For issues with:
- **Supabase**: Visit https://supabase.com/docs
- **App**: Check the error messages in the Supabase Config modal
- **Database**: Review sync logs in the `sync_logs` table

## Next Steps

1. Set up your Supabase project
2. Run the SQL migration
3. Configure the app with your credentials
4. Test the connection
5. Sync your existing data to the cloud
6. Start using the app with cloud backup enabled!

---

**Note**: Data syncing is manual. Use the "Sync to Cloud" and "Import from Cloud" buttons to control when data is synced. This gives you full control over your data.
