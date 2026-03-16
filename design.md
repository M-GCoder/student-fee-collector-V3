# Student Fee Collector - Design Plan

## Overview
A mobile app for managing student fee collection with one-time student entry and monthly payment tracking. Teachers/administrators can add students, record monthly payments, and view payment history with exact dates.

## Screen List

1. **Home Screen** - Dashboard with student list and quick actions
2. **Add Student Screen** - Form to enter student name, class, and fee amount
3. **Student Detail Screen** - View individual student info and monthly payment status
4. **Payment History Screen** - Detailed view of payment dates for each month
5. **Settings Screen** - App configuration and data management

## Primary Content and Functionality

### Home Screen
- **Content**: List of all students with their basic info (name, class, total fee)
- **Functionality**:
  - Display students in a scrollable list
  - Show quick payment status indicator (paid/unpaid for current month)
  - Search/filter students by name or class
  - Quick action button to add new student
  - Tap student to view details

### Add Student Screen
- **Content**: Form fields for student entry
- **Functionality**:
  - Input: Student Name (text field)
  - Input: Class/Grade (dropdown or text)
  - Input: Monthly Fee Amount (number field)
  - Submit button to save student
  - Cancel button to go back
  - Validation: All fields required, fee must be positive number

### Student Detail Screen
- **Content**: Student info and monthly payment grid
- **Functionality**:
  - Display student name, class, and monthly fee
  - Show 12-month payment grid (Jan-Dec)
  - Each month cell shows:
    - Checkbox/tick button to mark payment
    - Payment date (if paid)
  - Tap month to see/edit payment details
  - Delete student option
  - Edit student info option

### Payment History Screen
- **Content**: Detailed payment records
- **Functionality**:
  - List all payments with dates (month, day, year)
  - Show payment amount and date paid
  - Sort by date (newest first)
  - Export or share payment history

### Settings Screen
- **Content**: App configuration options
- **Functionality**:
  - Export data as CSV
  - Clear all data (with confirmation)
  - About app information

## Key User Flows

### Flow 1: Add a New Student
1. User taps "Add Student" button on Home
2. Navigates to Add Student Screen
3. Enters name, class, and monthly fee
4. Taps "Save"
5. Returns to Home Screen with new student added

### Flow 2: Mark Monthly Payment
1. User views Home Screen
2. Taps on a student name
3. Navigates to Student Detail Screen
4. Sees 12-month grid
5. Taps on a month (e.g., January)
6. Confirms payment or edits payment date
7. Payment is recorded with current date/time
8. Month cell shows checkmark and date

### Flow 3: View Payment History
1. User is on Student Detail Screen
2. Taps "View History" or payment history icon
3. Navigates to Payment History Screen
4. Sees chronological list of all payments with dates
5. Can tap to see payment details

## Color Choices

- **Primary**: `#0a7ea4` (Professional Blue) - Used for buttons, active states, and highlights
- **Background**: `#ffffff` (White) - Main screen background
- **Surface**: `#f5f5f5` (Light Gray) - Card backgrounds, list items
- **Foreground**: `#11181C` (Dark Gray) - Primary text
- **Muted**: `#687076` (Medium Gray) - Secondary text, hints
- **Border**: `#E5E7EB` (Light Border) - Dividers and borders
- **Success**: `#22C55E` (Green) - Payment completed indicator
- **Error**: `#EF4444` (Red) - Delete actions, warnings
- **Warning**: `#F59E0B` (Amber) - Pending payments

## Layout Principles

- **Portrait orientation** (9:16) optimized for one-handed usage
- **Bottom tab bar** for main navigation (Home, History, Settings)
- **Large touch targets** (44pt minimum) for payment checkboxes
- **Scrollable lists** for students and payment history
- **Modal sheets** for adding/editing students
- **Clear visual hierarchy** with consistent spacing and typography
