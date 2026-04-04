# Cloud Synchronization Guide

This guide explains how the Student Fee Collector app synchronizes data with Supabase cloud database across multiple devices.

## Overview

The app provides **full bidirectional cloud synchronization** with the following features:

- **Real-time sync on data changes**: Automatically syncs to cloud when you add, update, or delete students/payments
- **Automatic import from cloud**: Periodically checks for changes made on other devices and imports them
- **Manual sync control**: Users can manually trigger sync at any time
- **Sync status tracking**: Visual indicators show sync status and last sync time
- **Error handling**: Graceful error handling with fallback to local data

## Architecture

### Services

#### 1. SupabaseSyncService
Handles all cloud database operations:
- `syncStudentsToCloud()` - Upload students to cloud
- `syncPaymentsToCloud()` - Upload payments to cloud
- `fetchStudentsFromCloud()` - Download students from cloud
- `fetchPaymentsFromCloud()` - Download payments from cloud
- `deleteStudentFromCloud()` - Delete student from cloud
- `deletePaymentFromCloud()` - Delete payment from cloud

#### 2. CloudImportService
Detects and imports changes from cloud:
- `checkAndImportCloudData()` - Main import logic
- `detectStudentChanges()` - Detect new/updated students
- `detectPaymentChanges()` - Detect new/updated payments
- `importStudentChanges()` - Import student changes
- `importPaymentChanges()` - Import payment changes

#### 3. AutomaticImportService
Manages automatic import preferences:
- `isAutoImportEnabled()` - Check if auto-import is enabled
- `enableAutoImport()` - Enable automatic import
- `disableAutoImport()` - Disable automatic import
- `shouldCheckForImport()` - Check if import interval has passed

#### 4. AutoSyncService
Manages automatic sync preferences:
- `isAutoSyncEnabled()` - Check if auto-sync is enabled
- `toggleAutoSync()` - Toggle auto-sync on/off
- `updateLastAutoSyncTime()` - Track last sync time

#### 5. SyncStatusService
Tracks and displays sync status:
- `updateSyncStatus()` - Update sync status
- `getSyncStatus()` - Get current sync status
- `getLastSyncTime()` - Get last sync timestamp

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Student Fee Collector App                │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            Real-Time Sync      Periodic Import
            (on data change)    (every 30 seconds)
                    │                   │
                    └─────────┬─────────┘
                              ▼
                    ┌─────────────────────┐
                    │ StudentContext      │
                    │ (State Management)  │
                    └─────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            Local Storage      Supabase Cloud
            (AsyncStorage)     (PostgreSQL)
```

## Usage

### Configuration

1. **Open Settings Tab**
   - Tap the 3-dot menu (⋮) in the header
   - Enter your Supabase credentials:
     - Project URL: `https://your-project.supabase.co`
     - Anon Key: Your anonymous key from Supabase dashboard
   - Tap "Test Connection" to verify

2. **Enable Auto-Sync (Optional)**
   - In Cloud Sync Settings section
   - Toggle "Auto-Sync on Launch" to enable
   - App will automatically sync when it starts

3. **Enable Auto-Import (Optional)**
   - In Cloud Sync Settings section
   - Toggle "Auto-Import from Cloud" to enable
   - App will check for cloud changes every 30 seconds

### Manual Sync

1. **Sync to Cloud**
   - Go to Settings tab
   - Tap 3-dot menu (⋮)
   - Tap "Sync to Cloud" button
   - Wait for sync to complete

2. **Import from Cloud**
   - Go to Settings tab
   - Tap 3-dot menu (⋮)
   - Tap "Import from Cloud" button
   - Wait for import to complete

3. **Manual Refresh**
   - Tap the sync status indicator (cloud icon with dot)
   - Shows last sync time and triggers manual refresh

## Sync Behavior

### Real-Time Sync (Automatic)

When you perform any of these actions, the app automatically syncs to cloud:
- Add a new student
- Update student information
- Delete a student
- Record a payment
- Delete a payment

**Sync Status:**
- 🟢 Green dot: Sync successful
- 🔴 Red dot: Sync failed (check connection)
- ⏳ Loading: Sync in progress

### Periodic Import (Every 30 Seconds)

If auto-import is enabled, the app checks for cloud changes every 30 seconds:
- Detects new students added on other devices
- Detects new payments recorded on other devices
- Detects updated student information
- Automatically imports changes to local storage

**Check Interval:**
- First check: When app launches (if auto-sync enabled)
- Subsequent checks: Every 30 seconds
- Skipped if: Auto-import is disabled or not enough time has passed

## Multi-Device Sync

### Scenario: Two Devices

**Device A:**
- Has auto-sync enabled
- Has auto-import enabled

**Device B:**
- Has auto-sync enabled
- Has auto-import enabled

**Workflow:**
1. Add student on Device A
2. Device A syncs to cloud immediately
3. Device B detects change in next 30-second check
4. Device B imports the student automatically
5. Both devices now have the same data

### Scenario: Offline Device

**Device A:**
- Offline (no network)

**Device B:**
- Online with auto-sync enabled

**Workflow:**
1. Add student on Device A (saved locally)
2. Device A cannot sync (network unavailable)
3. When Device A comes online, sync retries automatically
4. Device B receives the data in next import check
5. Both devices sync when network is available

## Data Consistency

### Conflict Resolution

The app uses **upsert** (update or insert) strategy:
- If student exists: Update with cloud data
- If student is new: Insert into local storage
- Payment conflicts: Resolved by ID matching

### Change Detection

The app detects changes by comparing:
- **Students**: ID, name, class, monthly fee, due date, timestamp
- **Payments**: ID, student ID, amount, date

### Data Integrity

- All operations are atomic (complete or fail entirely)
- No partial updates
- Local data is always preserved
- Failed syncs don't corrupt data

## Troubleshooting

### Sync Not Working

**Check:**
1. Network connectivity (WiFi or mobile data)
2. Supabase credentials are correct
3. Supabase project is active
4. Auto-sync is enabled in Settings

**Fix:**
1. Verify network connection
2. Re-enter Supabase credentials
3. Tap "Test Connection" to verify
4. Manually trigger sync

### Data Not Appearing

**Check:**
1. Auto-import is enabled
2. Sufficient time has passed (30 seconds)
3. Other device synced successfully
4. Network connectivity

**Fix:**
1. Wait 30 seconds for import check
2. Manually refresh by tapping sync indicator
3. Check other device's sync status
4. Verify network connection

### Duplicate Data

**Should not occur** with proper change detection. If it happens:
1. Clear local data (Settings > Danger Zone > Clear All Data)
2. Re-sync from cloud (Settings > 3-dot menu > Import from Cloud)
3. Report as a bug with reproduction steps

### Sync Status Shows Red Dot

**Causes:**
1. Network disconnected
2. Invalid Supabase credentials
3. Supabase project is down
4. API rate limit exceeded

**Fix:**
1. Check network connection
2. Verify Supabase credentials
3. Check Supabase dashboard status
4. Wait a few minutes and retry

## Performance

### Sync Performance

- **Small dataset** (< 100 students): < 2 seconds
- **Medium dataset** (100-500 students): 2-5 seconds
- **Large dataset** (> 500 students): 5-10 seconds

### Import Check Performance

- **Check interval**: 30 seconds
- **Detection time**: < 1 second
- **Import time**: Depends on data size
- **Background operation**: Non-blocking

### Network Usage

- **Per sync**: ~1-10 KB (depending on data size)
- **Per import check**: ~1 KB (change detection)
- **Recommended**: WiFi for large datasets

## Security

### Data Protection

- All data is encrypted in transit (HTTPS)
- Supabase uses Row Level Security (RLS)
- Credentials are stored securely in AsyncStorage
- No sensitive data is logged

### Best Practices

1. **Keep credentials private**: Don't share Supabase keys
2. **Use strong passwords**: For Supabase account
3. **Enable RLS**: In Supabase dashboard
4. **Regular backups**: Export data periodically
5. **Monitor access**: Check Supabase logs

## Advanced Configuration

### Change Import Check Interval

Edit `lib/automatic-import-service.ts`:
```typescript
const IMPORT_CHECK_INTERVAL = 30000; // milliseconds
```

### Change Sync Status Update Frequency

Edit `lib/sync-status-service.ts`:
```typescript
const SYNC_STATUS_RETENTION = 3600000; // milliseconds
```

### Disable Auto-Sync on Error

Edit `app/_layout.tsx`:
```typescript
// Auto-sync is disabled on error to prevent app blocking
```

## API Reference

### CloudImportService

```typescript
// Check for cloud changes and import if detected
const imported = await CloudImportService.checkAndImportCloudData();

// Detect student changes
const hasChanges = CloudImportService.detectStudentChanges(local, cloud);

// Detect payment changes
const hasChanges = CloudImportService.detectPaymentChanges(local, cloud);

// Import student changes
await CloudImportService.importStudentChanges(cloud, local);

// Import payment changes
await CloudImportService.importPaymentChanges(cloud, local);
```

### AutomaticImportService

```typescript
// Check if auto-import is enabled
const enabled = await AutomaticImportService.isAutoImportEnabled();

// Enable auto-import
await AutomaticImportService.enableAutoImport();

// Disable auto-import
await AutomaticImportService.disableAutoImport();

// Check if should import
const shouldCheck = await AutomaticImportService.shouldCheckForImport();

// Update last check time
await AutomaticImportService.updateLastImportCheckTime();
```

### AutoSyncService

```typescript
// Check if auto-sync is enabled
const enabled = await AutoSyncService.isAutoSyncEnabled();

// Toggle auto-sync
const newState = await AutoSyncService.toggleAutoSync();

// Update last sync time
await AutoSyncService.updateLastAutoSyncTime();
```

## Testing

See `CLOUD_SYNC_INTEGRATION_TESTS.md` for comprehensive testing procedures including:
- Real-time sync scenarios
- Automatic import scenarios
- Multi-device synchronization
- Error handling
- Performance testing

## Support

For issues or questions:
1. Check console logs (DevTools > Console)
2. Review troubleshooting section above
3. Check Supabase dashboard for errors
4. Verify network connectivity
5. Try clearing local data and re-syncing

## Future Enhancements

Potential improvements for future versions:
- Conflict resolution UI for simultaneous edits
- Selective sync (sync only specific students/payments)
- Sync scheduling (sync at specific times)
- Bandwidth optimization (delta sync)
- Offline mode with queue
- Sync history and audit logs
- Real-time notifications for remote changes
