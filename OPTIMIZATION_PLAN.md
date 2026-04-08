# Project Optimization Plan

## Files to Remove (Unnecessary/Duplicate)

### Documentation Files (Move to separate docs folder or remove)
- [ ] APK_CRASH_FIXES.md - Move to docs/
- [ ] CLOUD_SYNC_GUIDE.md - Move to docs/
- [ ] CLOUD_SYNC_INTEGRATION_TESTS.md - Move to docs/
- [ ] SUPABASE_SQL_QUERIES.sql - Move to docs/
- [ ] STUDENT_PAYMENT_STATS_API_GUIDE.md - Move to docs/
- [ ] ADMIN_PANEL_SQL_QUERIES.sql - Move to docs/
- [ ] ADMIN_PANEL_API_GUIDE.md - Move to docs/
- [ ] design.md - Keep but review

### Duplicate/Redundant Services
- [ ] export-service.ts - Check if flexible-export-service.ts covers all functionality
- [ ] storage.ts - Check if storage-safe.ts is complete replacement
- [ ] csv-import-service.ts - Check if bulk-import-service.ts covers this

### Unused/Commented Out Screens
- [ ] app/add-reminder.tsx - Commented out in navigation
- [ ] app/edit-reminder/[id].tsx - Commented out in navigation
- [ ] app/notification-history.tsx - Commented out in navigation
- [ ] app/notification-settings.tsx - Commented out in navigation
- [ ] app/recurring-reminders.tsx - Commented out in navigation

### Dev/Test Files
- [ ] app/dev/theme-lab.tsx - Development only

### Unused Components
- [ ] components/external-link.tsx - Check if used
- [ ] components/parallax-scroll-view.tsx - Check if used
- [ ] components/hello-wave.tsx - Check if used

## Code Optimization Tasks

### Services to Optimize
- [ ] Consolidate export services
- [ ] Consolidate storage services
- [ ] Consolidate import services
- [ ] Optimize sync services (auto-sync, cloud-import, supabase-sync)
- [ ] Optimize analytics service
- [ ] Optimize notification service

### Components to Optimize
- [ ] Reduce prop drilling
- [ ] Memoize expensive components
- [ ] Extract reusable logic
- [ ] Remove unused imports

### Performance Improvements
- [ ] Lazy load screens
- [ ] Optimize re-renders
- [ ] Reduce bundle size
- [ ] Cache calculations

## Current Stats
- Total lib files: ~50
- Total lines in lib: ~4500
- Test files: ~18
- Screen files: ~15
