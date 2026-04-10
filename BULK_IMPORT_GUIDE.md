# Bulk Import Guide - 6 Columns

The Student Fee Collector app now supports bulk importing students with complete information including email and password credentials.

## Supported File Formats

- **XLS** (.xls) - Microsoft Excel 97-2003
- **XLSX** (.xlsx) - Microsoft Excel 2007+
- **CSV** (.csv) - Comma-Separated Values

## Required Columns

The import file must contain exactly 6 columns in the following order:

| Column # | Name | Type | Description | Example |
|----------|------|------|-------------|---------|
| 1 | Name | Text | Student's full name | John Doe |
| 2 | Class | Text | Class/Grade designation | 10-A |
| 3 | Amount | Number | Monthly fee amount | 5000 |
| 4 | Monthly Due Date | Number | Day of month (1-30) | 15 |
| 5 | Email | Email | Student's email address | john@example.com |
| 6 | Password | Text | Login password (min 6 chars) | password123 |

## Validation Rules

### Name (Column 1)
- **Required**: Must not be empty
- **Type**: Text
- **Uniqueness**: Must not duplicate existing student names
- **Example**: "John Doe"

### Class (Column 2)
- **Required**: Must not be empty
- **Type**: Text
- **Format**: Any class designation (e.g., "10-A", "Class 5", "Grade 9")
- **Example**: "10-A"

### Amount (Column 3)
- **Required**: Must not be empty
- **Type**: Numeric
- **Validation**: Must be a positive number greater than 0
- **Example**: "5000"

### Monthly Due Date (Column 4)
- **Required**: Can be empty (optional)
- **Type**: Numeric
- **Range**: 1 to 30 (representing day of month)
- **Validation**: Must be a valid day number or empty
- **Example**: "15" (means payment due on 15th of every month)

### Email (Column 5)
- **Required**: Can be empty (optional)
- **Type**: Email
- **Validation**: Must be valid email format if provided
- **Uniqueness**: Must not duplicate existing student emails
- **Format**: standard@email.com
- **Example**: "john.doe@example.com"

### Password (Column 6)
- **Required**: Can be empty (optional)
- **Type**: Text
- **Validation**: Must be at least 6 characters if provided
- **Security**: Passwords are hashed before storage
- **Example**: "password123"

## Sample Data

Here's a valid sample import file:

```
Name,Class,Amount,Monthly Due Date (1-30),Email,Password
John Doe,10-A,5000,15,john.doe@example.com,password123
Jane Smith,10-B,5500,20,jane.smith@example.com,password456
Bob Johnson,9-A,4500,10,bob.johnson@example.com,password789
Alice Brown,9-B,5000,25,alice.brown@example.com,password101
```

## How to Import

1. **Open the App** → Navigate to Settings tab
2. **Select Bulk Import** → Tap "Bulk Import" option
3. **Choose File** → Select your CSV or XLSX file
4. **Review Data** → Check for any validation errors
5. **Confirm Import** → Tap "Import" to add students to the system
6. **Verify Results** → Check the home screen for newly added students

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Student name is required" | Name column is empty | Ensure Column 1 has a name |
| "Class is required" | Class column is empty | Ensure Column 2 has a class |
| "Monthly amount must be positive" | Amount is 0 or negative | Use positive numbers only |
| "Monthly due date must be 1-30" | Due date is invalid | Use numbers 1-30 or leave empty |
| "Invalid email format" | Email doesn't match format | Use valid email (e.g., user@domain.com) |
| "Password must be 6+ characters" | Password is too short | Use at least 6 characters |
| "Student already exists" | Duplicate name found | Use unique student names |
| "Email already exists" | Duplicate email found | Use unique email addresses |

## Download Template

You can download a pre-formatted template from the app:

1. Open Bulk Import screen
2. Tap "Download Template" button
3. Fill in your student data
4. Import the file back into the app

## Data Storage

Imported students are stored in:
- **Local Storage**: AsyncStorage (device memory)
- **Cloud Storage**: Supabase (if cloud sync is enabled)

## Cloud Synchronization

If you have enabled cloud sync in Settings:
- All imported students automatically sync to Supabase
- Changes appear on other devices within 30 seconds
- Auto-import feature pulls changes from other devices

## Tips for Success

1. **Use the Template**: Download and fill the template to ensure correct format
2. **Validate Before Import**: Check data in Excel before importing
3. **Unique Names & Emails**: Ensure no duplicate names or emails
4. **Password Security**: Use strong passwords (min 6 characters)
5. **Due Dates**: Use 1-30 for monthly recurring due dates
6. **Test First**: Import a small batch first to verify the process

## Troubleshooting

### File Won't Upload
- Check file format (must be .xlsx, .xls, or .csv)
- Ensure file is not corrupted
- Try saving file again from Excel

### Import Shows Errors
- Review error messages for each row
- Fix the data and re-import
- Check for duplicate names or emails

### Data Not Appearing
- Check if cloud sync is enabled
- Wait 30 seconds for auto-import
- Refresh the app or restart

## Supported Formats Details

### CSV Format
- Plain text with comma separators
- Can be created in Excel, Google Sheets, or any text editor
- Save as "CSV (Comma delimited) (*.csv)"

### XLS Format
- Legacy Excel format (1997-2003)
- Supported but XLSX is recommended
- Save as "Excel 97-2003 Workbook (*.xls)"

### XLSX Format
- Modern Excel format (2007+)
- Recommended format for best compatibility
- Save as "Excel Workbook (*.xlsx)"

## Example Workflow

```
1. Create spreadsheet with 6 columns
2. Add headers (optional - auto-detected)
3. Enter student data (8 rows example provided)
4. Save as CSV or XLSX
5. Open app → Settings → Bulk Import
6. Select file → Review errors (if any)
7. Confirm import → Done!
8. Students appear in home screen
9. Auto-sync to cloud (if enabled)
```

## Security Notes

- Passwords are hashed before storage
- Email addresses are validated
- Duplicate detection prevents data conflicts
- Cloud sync uses encrypted connections
- All data is stored securely on device and cloud

## Support

For issues or questions:
1. Check this guide for common solutions
2. Review error messages carefully
3. Verify file format and data
4. Try downloading and using the template
