# Data Recovery Guide - Student Fee Collector

## Overview

If you lose your phone or need to restore your data on a new device, you can recover **all your data** from Supabase using just your **Project URL** and **Anon Key**. No data is lost!

## What Gets Recovered?

When you import from cloud, the following data is restored:

### ✅ Students Data
- Student ID (unique identifier)
- Student Name
- Class/Grade
- Monthly Fee
- Monthly Due Date (if set)
- Single Due Date (if set)
- Creation Date

### ✅ Payment History
- Payment ID (unique identifier)
- Student ID (links payment to student)
- Month and Year of payment
- Payment Date (when payment was made)
- Payment Amount
- Creation Date

### ✅ Payment Status
- All marked payments (paid/unpaid status)
- Complete payment history for each student
- Monthly payment tracking across all years

### ✅ Additional Data
- Sync logs (for debugging)
- All timestamps and metadata

## Data Recovery Process

### Step 1: Install the App on New Device

1. Install Student Fee Collector on your new phone
2. Open the app
3. Go to the **Summary** tab
4. Tap the **3-dot menu** (⋮) in the top-right corner

### Step 2: Enter Your Supabase Credentials

In the Supabase Config Modal, enter:
- **Project URL**: `https://your-project.supabase.co` (from your Supabase dashboard)
- **Anon Key**: `eyJhbGciOiJIUzI1NiIs...` (from Settings → API in Supabase)

### Step 3: Test Connection

1. Click **Test Connection**
2. Wait for the confirmation message
3. If successful, your credentials are saved locally

### Step 4: Import from Cloud

1. Click **Import from Cloud**
2. The app will download:
   - All students
   - All payments
   - All payment history
3. Wait for the confirmation message showing how many records were imported

### Step 5: Verify Your Data

1. Go to the **Home** tab
2. You should see all your students listed
3. Tap on a student to view their complete payment history
4. Check the **Summary** tab to see total counts

## Complete Data Recovery Example

**Scenario**: You had 50 students with 2 years of payment history (24 months per student)

**What Gets Recovered**:
- 50 student records with all details
- 50 × 24 = 1,200 payment records
- All payment dates and amounts
- All monthly due dates
- Complete payment status for each month

**Time to Recover**: Usually 30-60 seconds depending on internet speed

## Important Notes

### ✅ What's Safe
- All student data is encrypted in Supabase
- Your Anon Key is safe to use (it's designed for public use)
- Data is backed up in Supabase cloud servers
- Multiple backups exist on Supabase infrastructure

### ⚠️ Important Points
- **Never share your Project URL or Anon Key** with untrusted people
- **Keep your Supabase project active** - if you delete the project, data will be lost
- **Backup your credentials** - write down your Project URL and Anon Key somewhere safe
- **Test recovery regularly** - import data occasionally to ensure backups work

### 🔒 Security
- Anon Key is public-safe (designed for client-side apps)
- Service Role Key should NEVER be shared (not used in this app)
- Row Level Security (RLS) policies protect your data
- Data is encrypted in transit (HTTPS)

## Troubleshooting Data Recovery

### "Could not find the table" Error
- **Cause**: Tables haven't been created in Supabase yet
- **Solution**: Run the SQL migration in your Supabase dashboard (see SUPABASE_SETUP.md)

### "Import shows 0 records"
- **Cause**: You haven't synced data to cloud yet
- **Solution**: Go back to your old phone/device and click "Sync to Cloud" first

### "Connection failed" Error
- **Cause**: Wrong Project URL or Anon Key
- **Solution**: Double-check credentials in your Supabase dashboard Settings → API

### "Import takes too long"
- **Cause**: Slow internet or large dataset
- **Solution**: Wait longer or check your internet connection

### "Some students missing after import"
- **Cause**: Those students were only on your phone (never synced)
- **Solution**: Sync to cloud from your old device before importing on new device

## Data Sync Workflow

### For Maximum Data Safety

1. **Regularly sync to cloud**
   - Every week or after adding new students
   - Click "Sync to Cloud" in the 3-dot menu

2. **Test recovery periodically**
   - Once a month, import from cloud to verify data is safe
   - This also creates a backup on your device

3. **Keep credentials safe**
   - Write down Project URL and Anon Key
   - Store in a secure password manager
   - Don't share with others

### Recommended Sync Schedule

| Frequency | Action |
|-----------|--------|
| After adding students | Sync to Cloud |
| After marking payments | Sync to Cloud |
| Weekly | Sync to Cloud |
| Monthly | Import from Cloud (test recovery) |
| Before device change | Sync to Cloud |

## Advanced: Manual Data Verification

You can verify your data is in Supabase by checking directly:

1. Go to your Supabase dashboard
2. Click **SQL Editor**
3. Run these queries:

**Check students count**:
```sql
SELECT COUNT(*) as total_students FROM students;
```

**Check payments count**:
```sql
SELECT COUNT(*) as total_payments FROM payments;
```

**View recent students**:
```sql
SELECT name, class, monthly_fee FROM students ORDER BY created_at DESC LIMIT 10;
```

**View recent payments**:
```sql
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;
```

## Recovery Checklist

Before considering your data safe, verify:

- [ ] Supabase project created and active
- [ ] Database tables created (SQL migration run)
- [ ] App configured with Project URL and Anon Key
- [ ] Connection test passed
- [ ] First sync to cloud completed
- [ ] Import from cloud tested successfully
- [ ] All students visible after import
- [ ] Payment history shows correct data
- [ ] Monthly payment status accurate

## What If Something Goes Wrong?

### Data Lost Before Syncing
- **Problem**: You lost your phone before syncing to cloud
- **Solution**: Unfortunately, that data is lost. Always sync regularly!

### Supabase Project Deleted
- **Problem**: You accidentally deleted your Supabase project
- **Solution**: Data is permanently lost. Supabase doesn't have backups of deleted projects.

### Wrong Data Imported
- **Problem**: You imported data from a different Supabase project
- **Solution**: Clear all data and import from the correct project

### Duplicate Records After Import
- **Problem**: Importing multiple times created duplicates
- **Solution**: This shouldn't happen (upsert prevents duplicates), but clear data and import once

## Support

If you have issues with data recovery:

1. **Check SUPABASE_SETUP.md** for configuration help
2. **Review sync logs** in Supabase dashboard (sync_logs table)
3. **Verify credentials** are exactly correct (copy-paste from Supabase)
4. **Test connection** before importing
5. **Check internet connection** during import

## Summary

✅ **Your data is safe in the cloud**
✅ **You can recover everything with just Project URL + Anon Key**
✅ **Recovery takes less than 1 minute**
✅ **No data is lost if you sync regularly**

**Remember**: Sync to cloud regularly, keep your credentials safe, and test recovery occasionally!
