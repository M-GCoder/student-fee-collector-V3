import { Student, Payment, CURRENCY_SYMBOL } from './types';
import { Workbook } from 'exceljs';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Flexible Export Service
 * Exports student payment data for any selected month/year
 */

interface ExportData {
  name: string;
  class: string;
  fee: number;
  paymentDate: string; // Date string or "Pending"
}

/**
 * Prepare export data for selected month/year
 */
export function prepareExportData(
  students: Student[],
  payments: Payment[],
  month: number,
  year: number
): ExportData[] {
  return students.map((student) => {
    const payment = payments.find(
      (p) => p.studentId === student.id && p.month === month && p.year === year
    );

    return {
      name: student.name,
      class: student.class,
      fee: student.monthlyFee,
      paymentDate: payment
        ? new Date(payment.paidDate).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
        : 'Pending',
    };
  });
}

/**
 * Export as CSV for selected month/year
 */
export async function exportAsCSV(
  students: Student[],
  payments: Payment[],
  month: number,
  year: number
): Promise<void> {
  const data = prepareExportData(students, payments, month, year);
  const monthName = new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  // Create CSV content
  const headers = ['Name', 'Class', 'Fee', 'Payment Date'];
  const rows = data.map((row) => [row.name, row.class, row.fee, row.paymentDate]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => (typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell)).join(',')
    ),
  ].join('\n');

  const fileName = `student-fees-${monthName.replace(' ', '-')}.csv`;
  const fileUri = FileSystem.documentDirectory + fileName;

  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: `Export ${monthName}`,
  });
}

/**
 * Export as Excel for selected month/year
 */
export async function exportAsXLS(
  students: Student[],
  payments: Payment[],
  month: number,
  year: number
): Promise<void> {
  const data = prepareExportData(students, payments, month, year);
  const monthName = new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet('Fees');

  // Add header
  const headerRow = worksheet.addRow(['Name', 'Class', 'Fee', 'Payment Date']);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A7EA4' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  // Add data rows
  data.forEach((row) => {
    const dataRow = worksheet.addRow([row.name, row.class, row.fee, row.paymentDate]);
    dataRow.alignment = { horizontal: 'left', vertical: 'middle' };
    if (row.paymentDate === 'Pending') {
      dataRow.font = { color: { argb: 'FFEF4444' } };
    }
  });

  // Adjust column widths
  worksheet.columns = [
    { width: 20 },
    { width: 15 },
    { width: 12 },
    { width: 15 },
  ];

  const fileName = `student-fees-${monthName.replace(' ', '-')}.xlsx`;
  const fileUri = FileSystem.documentDirectory + fileName;

  const buffer = await workbook.xlsx.writeBuffer();
  // Convert buffer to base64 using native API
  let base64: string;
  try {
    // Try using Buffer if available (Node.js environment)
    if (typeof Buffer !== 'undefined') {
      base64 = Buffer.from(buffer).toString('base64');
    } else {
      // Fallback: convert ArrayBuffer to base64 using btoa
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      base64 = btoa(binary);
    }
  } catch (error) {
    console.error('Failed to convert buffer to base64:', error);
    throw new Error('Failed to export Excel file');
  }

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: `Export ${monthName}`,
  });
}

/**
 * Export as PDF for selected month/year
 */
export async function exportAsPDF(
  students: Student[],
  payments: Payment[],
  month: number,
  year: number
): Promise<void> {
  const data = prepareExportData(students, payments, month, year);
  const monthName = new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  // Create HTML content
  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #0a7ea4; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #0a7ea4; color: white; padding: 10px; text-align: left; }
          td { border: 1px solid #ddd; padding: 10px; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .pending { color: #ef4444; font-weight: bold; }
          .summary { margin-top: 20px; padding: 10px; background-color: #f0f0f0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>Student Fee Collection Report - ${monthName}</h1>
        <table>
          <tr>
            <th>Name</th>
            <th>Class</th>
            <th>Fee</th>
            <th>Payment Date</th>
          </tr>
          ${data
            .map(
              (row) => `
            <tr>
              <td>${row.name}</td>
              <td>${row.class}</td>
              <td>${CURRENCY_SYMBOL}${row.fee}</td>
              <td class="${row.paymentDate === 'Pending' ? 'pending' : ''}">${row.paymentDate}</td>
            </tr>
          `
            )
            .join('')}
        </table>
        <div class="summary">
          <p><strong>Total Students:</strong> ${data.length}</p>
          <p><strong>Paid:</strong> ${data.filter((d) => d.paymentDate !== 'Pending').length}</p>
          <p><strong>Pending:</strong> ${data.filter((d) => d.paymentDate === 'Pending').length}</p>
          <p><strong>Total Expected:</strong> ${CURRENCY_SYMBOL}${data.reduce((sum, d) => sum + d.fee, 0)}</p>
        </div>
      </body>
    </html>
  `;

  const fileName = `student-fees-${monthName.replace(' ', '-')}.pdf`;
  const fileUri = FileSystem.documentDirectory + fileName;

  // For PDF generation, we'll use a simple approach
  // In production, you might want to use a library like react-native-html-to-pdf
  // Convert HTML content to base64 using native API
  let base64Content: string;
  try {
    if (typeof Buffer !== 'undefined') {
      base64Content = Buffer.from(htmlContent).toString('base64');
    } else {
      base64Content = btoa(htmlContent);
    }
  } catch (error) {
    console.error('Failed to convert HTML to base64:', error);
    throw new Error('Failed to export PDF');
  }

  await FileSystem.writeAsStringAsync(fileUri, base64Content, {
    encoding: FileSystem.EncodingType.Base64,
  });

  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/pdf',
    dialogTitle: `Export ${monthName}`,
  });
}
