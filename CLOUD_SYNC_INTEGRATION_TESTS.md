# Cloud Sync Integration Tests

This document describes how to test the cloud synchronization features of the Student Fee Collector app with multi-device simulation.

## Test Environment Setup

### Prerequisites
- Supabase project with configured database tables (students, payments)
- Two devices/emulators or two browser windows with the app
- Valid Supabase credentials (Project URL and Anon Key)

### Configuration
1. Configure Supabase credentials in both app instances:
   - Open Settings tab
   - Tap the 3-dot menu (⋮)
   - Enter Project URL and Anon Key
   - Tap "Test Connection" to verify

## Test Scenarios

### Scenario 1: Real-Time Sync on Student Add

**Setup:**
- Device A: App with auto-sync enabled
- Device B: App with auto-sync enabled

**Steps:**
1. On Device A, add a new student:
   - Name: "Test Student 1"
   - Class: "10-A"
   - Monthly Fee: 5000
   - Monthly Due Date: 15
2. Observe sync status indicator on Device A (should show "syncing" then "completed")
3. Wait 30 seconds for periodic import check
4. On Device B, check if the student appears in the list

**Expected Result:**
- Student appears on Device B within 30 seconds
- Sync status shows successful sync on Device A
- Data is identical on both devices

### Scenario 2: Real-Time Sync on Payment Add

**Setup:**
- Device A: App with auto-sync enabled
- Device B: App with auto-sync enabled
- Both devices have the same student

**Steps:**
1. On Device A, navigate to a student's detail screen
2. Mark a payment for current month
3. Observe sync status indicator (should show "syncing" then "completed")
4. Wait 30 seconds for periodic import check
5. On Device B, navigate to the same student's detail screen
6. Check if the payment is marked for the current month

**Expected Result:**
- Payment appears on Device B within 30 seconds
- Sync status shows successful sync on Device A
- Payment date is recorded correctly on both devices

### Scenario 3: Real-Time Sync on Student Delete

**Setup:**
- Device A: App with auto-sync enabled
- Device B: App with auto-sync enabled
- Both devices have the same student

**Steps:**
1. On Device A, delete a student (confirm deletion)
2. Observe sync status indicator (should show "syncing" then "completed")
3. Wait 30 seconds for periodic import check
4. On Device B, check if the student is removed from the list

**Expected Result:**
- Student is removed from Device B within 30 seconds
- Sync status shows successful sync on Device A
- Student no longer appears in the list on either device

### Scenario 4: Automatic Import from Cloud

**Setup:**
- Device A: App with auto-import enabled
- Device B: App with auto-sync enabled
- Both devices have auto-import enabled

**Steps:**
1. On Device B, add a new student
2. Wait 30 seconds for the periodic import check on Device A
3. On Device A, check if the student appears in the list

**Expected Result:**
- Student appears on Device A within 30 seconds
- No manual sync required
- Automatic import works seamlessly

### Scenario 5: Disable Auto-Sync and Manual Sync

**Setup:**
- Device A: App with auto-sync disabled
- Device B: App with auto-sync enabled

**Steps:**
1. On Device B, add a new student
2. Wait 30 seconds (auto-import check interval)
3. On Device A, manually open Settings and tap sync status indicator
4. Check if the student appears

**Expected Result:**
- Student does not appear until manual sync
- Manual sync button works correctly
- Sync status updates after manual sync

### Scenario 6: Disable Auto-Import

**Setup:**
- Device A: App with auto-import disabled
- Device B: App with auto-sync enabled

**Steps:**
1. On Device B, add a new student
2. Wait 60 seconds (longer than import check interval)
3. On Device A, check if the student appears

**Expected Result:**
- Student does not appear automatically
- Manual sync can still be used to import data
- Auto-import toggle works correctly

### Scenario 7: Concurrent Operations

**Setup:**
- Device A: App with auto-sync enabled
- Device B: App with auto-sync enabled

**Steps:**
1. On Device A, add Student 1
2. On Device B, add Student 2 (at the same time)
3. Wait 30 seconds for import checks
4. On both devices, verify both students appear

**Expected Result:**
- Both students appear on both devices
- No data loss or conflicts
- Sync handles concurrent operations correctly

### Scenario 8: Network Error Handling

**Setup:**
- Device A: App with auto-sync enabled
- Device B: App with auto-sync enabled
- Simulate network error (disable network temporarily)

**Steps:**
1. On Device A, disable network
2. Try to add a new student
3. Observe error handling
4. Re-enable network
5. Check if sync retries automatically

**Expected Result:**
- App shows error gracefully
- Data is saved locally
- Sync retries when network is restored
- No data loss

### Scenario 9: Bulk Import with Cloud Sync

**Setup:**
- Device A: App with auto-sync enabled
- Device B: App with auto-sync enabled

**Steps:**
1. On Device A, perform bulk import (CSV/XLSX with 5 students)
2. Observe sync status indicator
3. Wait 30 seconds for import check on Device B
4. On Device B, verify all 5 students appear

**Expected Result:**
- All imported students sync to cloud
- Sync status shows successful sync
- Students appear on Device B within 30 seconds
- Bulk import and cloud sync work together

### Scenario 10: Data Consistency After Restart

**Setup:**
- Device A: App with auto-sync enabled
- Device B: App with auto-sync enabled

**Steps:**
1. On Device A, add a new student
2. Wait for sync to complete
3. Close and reopen the app on Device B
4. Check if the student appears

**Expected Result:**
- Student appears after app restart
- Auto-sync on launch fetches cloud data
- Data is consistent across restarts

## Performance Tests

### Test 1: Sync Performance with Large Dataset

**Setup:**
- Device A: App with 100+ students and 500+ payments

**Steps:**
1. Enable auto-sync
2. Measure time to complete sync
3. Monitor app responsiveness during sync

**Expected Result:**
- Sync completes within 10 seconds
- App remains responsive
- No UI freezing or lag

### Test 2: Import Check Interval

**Setup:**
- Device A: App with auto-import enabled

**Steps:**
1. Add a student on another device
2. Measure time until it appears on Device A
3. Repeat 5 times

**Expected Result:**
- Average import time: 30-35 seconds
- Consistent import intervals
- No excessive API calls

## Troubleshooting

### Student doesn't appear after sync
- Check Supabase connection status
- Verify credentials are correct
- Check console logs for errors
- Manually trigger sync to verify connectivity

### Sync status shows red dot
- Check network connectivity
- Verify Supabase credentials
- Check Supabase project status
- Review error message in console

### Auto-import not working
- Verify auto-import is enabled in Settings
- Check if auto-sync is enabled (required for initial data fetch)
- Verify Supabase credentials
- Check console logs for errors

### Duplicate data after import
- This should not occur with proper change detection
- If it happens, clear local data and re-sync
- Report as a bug with reproduction steps

## Test Checklist

- [ ] Real-time sync on student add
- [ ] Real-time sync on payment add
- [ ] Real-time sync on student delete
- [ ] Automatic import from cloud
- [ ] Manual sync works
- [ ] Auto-import toggle works
- [ ] Concurrent operations handled
- [ ] Network errors handled gracefully
- [ ] Bulk import syncs to cloud
- [ ] Data consistent after restart
- [ ] Sync performance acceptable
- [ ] Import check interval consistent
- [ ] No duplicate data
- [ ] Sync status indicators accurate
- [ ] Both auto-sync and auto-import work together

## Notes

- Sync status updates are logged to console for debugging
- Check browser DevTools console for detailed sync logs
- Import check interval is 30 seconds (configurable in AutomaticImportService)
- Periodic import checks run every 30 seconds in the background
- All sync operations are non-blocking and don't freeze the UI
