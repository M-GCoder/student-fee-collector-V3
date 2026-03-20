import * as FileSystem from 'expo-file-system/legacy';
import { Student, Payment, CURRENCY_SYMBOL } from './types';
import { Workbook } from 'exceljs';
import * as Sharing from 'expo-sharing';

/**
 * Current Month Export Service
 * Exports student payment data for the current month with 4 columns:
 * Name, Class, Fee, Payment Date (or "Pending")
 */

interface CurrentMonthExportData {
  name: string;
  class: string;
  fee: number;
  paymentDate: string; // Date string or "Pending"
}

/**
 * Get current month and year
 */
function getCurrentMonthYear() {
  const now = new Date();
  return {
    month: now.getMonth(),
    year: now.getFullYear(),
  };
}

/**
 * Prepare current month export data
 */
export function prepareCurrentMonthExportData(
  students: Student[],
  payments: Payment[]
): CurrentMonthExportData[] {
  const { month, year } = getCurrentMonthYear();

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
            month: 'short',
            day: 'numeric',
          })
        : 'Pending',
    };
  });
}

/**
 * Export current month data as XLS
 */
export async function exportCurrentMonthAsXLS(
  students: Student[],
  payments: Payment[]
): Promise<void> {
  try {
    const data = prepareCurrentMonthExportData(students, payments);
    const { month, year } = getCurrentMonthYear();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    // Create workbook
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Current Month');

    // Add title
    worksheet.mergeCells('A1:D1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `${monthNames[month]} ${year} - Student Fee Collection`;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF1F4E79' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 24;

    // Add generation date
    worksheet.mergeCells('A2:D2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `Generated: ${new Date().toLocaleDateString('en-IN')}`;
    dateCell.font = { size: 10, color: { argb: 'FF666666' } };
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Add headers
    const headerRow = worksheet.getRow(4);
    const headers = ['Name', 'Class', 'Fee', 'Payment Date'];
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF1F4E79' } },
        bottom: { style: 'thin', color: { argb: 'FF1F4E79' } },
        left: { style: 'thin', color: { argb: 'FF1F4E79' } },
        right: { style: 'thin', color: { argb: 'FF1F4E79' } },
      };
    });
    headerRow.height = 20;

    // Add data rows
    data.forEach((row, index) => {
      const dataRow = worksheet.getRow(5 + index);
      dataRow.getCell(1).value = row.name;
      dataRow.getCell(2).value = row.class;
      dataRow.getCell(3).value = row.fee;
      dataRow.getCell(4).value = row.paymentDate;

      // Format fee column
      const feeCell = dataRow.getCell(3);
      feeCell.numFmt = `${CURRENCY_SYMBOL}#,##0.00`;

      // Alternate row colors
      if (index % 2 === 0) {
        for (let i = 1; i <= 4; i++) {
          dataRow.getCell(i).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF5F5F5' },
          };
        }
      }

      // Add borders
      for (let i = 1; i <= 4; i++) {
        dataRow.getCell(i).border = {
          top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          right: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        };
      }
    });

    // Set column widths
    worksheet.columns = [
      { width: 25 }, // Name
      { width: 12 }, // Class
      { width: 12 }, // Fee
      { width: 15 }, // Payment Date
    ];

    // Add summary
    const summaryRow = 5 + data.length + 1;
    worksheet.mergeCells(`A${summaryRow}:B${summaryRow}`);
    const summaryLabelCell = worksheet.getCell(`A${summaryRow}`);
    summaryLabelCell.value = 'Total Students:';
    summaryLabelCell.font = { bold: true };
    summaryLabelCell.alignment = { horizontal: 'right' };

    const totalCell = worksheet.getCell(`C${summaryRow}`);
    totalCell.value = data.length;
    totalCell.font = { bold: true };

    const paidCount = data.filter((d) => d.paymentDate !== 'Pending').length;
    const pendingRow = summaryRow + 1;
    worksheet.mergeCells(`A${pendingRow}:B${pendingRow}`);
    const pendingLabelCell = worksheet.getCell(`A${pendingRow}`);
    pendingLabelCell.value = 'Paid:';
    pendingLabelCell.font = { bold: true };
    pendingLabelCell.alignment = { horizontal: 'right' };

    const paidCell = worksheet.getCell(`C${pendingRow}`);
    paidCell.value = paidCount;
    paidCell.font = { bold: true, color: { argb: 'FF22C55E' } };

    // Save file
    const fileName = `Student_Fees_${monthNames[month]}_${year}.xlsx`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    try {
      const buffer = await workbook.xlsx.writeBuffer();
      // Convert buffer to base64 string for file writing
      let base64String = '';
      if (typeof buffer === 'string') {
        base64String = buffer;
      } else if (buffer instanceof ArrayBuffer) {
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          base64String += String.fromCharCode(bytes[i]);
        }
        base64String = btoa(base64String);
      } else {
        // For other buffer types, convert to string
        base64String = String(buffer);
      }
      
      await FileSystem.writeAsStringAsync(fileUri, base64String, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch (bufferError) {
      console.error('Buffer conversion error:', bufferError);
      throw new Error('Failed to convert Excel file to base64 format');
    }

    // Share file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Export Student Fees',
      });
    }
  } catch (error) {
    console.error('Error exporting as XLS:', error);
    throw error;
  }
}

/**
 * Export current month data as CSV
 */
export async function exportCurrentMonthAsCSV(
  students: Student[],
  payments: Payment[]
): Promise<void> {
  try {
    const data = prepareCurrentMonthExportData(students, payments);
    const { month, year } = getCurrentMonthYear();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    // Create CSV content
    let csvContent = `${monthNames[month]} ${year} - Student Fee Collection\n`;
    csvContent += `Generated: ${new Date().toLocaleDateString('en-IN')}\n\n`;
    csvContent += 'Name,Class,Fee,Payment Date\n';

    data.forEach((row) => {
      csvContent += `"${row.name}","${row.class}","${CURRENCY_SYMBOL}${row.fee}","${row.paymentDate}"\n`;
    });

    // Add summary
    const paidCount = data.filter((d) => d.paymentDate !== 'Pending').length;
    csvContent += `\nTotal Students,${data.length}\n`;
    csvContent += `Paid,${paidCount}\n`;
    csvContent += `Pending,${data.length - paidCount}\n`;

    // Save file
    const fileName = `Student_Fees_${monthNames[month]}_${year}.csv`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, csvContent);

    // Share file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Student Fees',
      });
    }
  } catch (error) {
    console.error('Error exporting as CSV:', error);
    throw error;
  }
}

/**
 * Export current month data as PDF
 */
export async function exportCurrentMonthAsPDF(
  students: Student[],
  payments: Payment[]
): Promise<void> {
  try {
    const data = prepareCurrentMonthExportData(students, payments);
    const { month, year } = getCurrentMonthYear();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    // Create HTML content for PDF
    let htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; color: #1F4E79; }
            .meta { text-align: center; color: #666; font-size: 12px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background-color: #1F4E79; color: white; padding: 10px; text-align: left; }
            td { padding: 8px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f5f5f5; }
            .summary { margin-top: 20px; }
            .summary-row { margin: 5px 0; }
            .paid { color: #22C55E; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${monthNames[month]} ${year} - Student Fee Collection</h1>
          <div class="meta">Generated: ${new Date().toLocaleDateString('en-IN')}</div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Class</th>
                <th>Fee</th>
                <th>Payment Date</th>
              </tr>
            </thead>
            <tbody>
    `;

    data.forEach((row) => {
      htmlContent += `
        <tr>
          <td>${row.name}</td>
          <td>${row.class}</td>
          <td>${CURRENCY_SYMBOL}${row.fee}</td>
          <td>${row.paymentDate}</td>
        </tr>
      `;
    });

    const paidCount = data.filter((d) => d.paymentDate !== 'Pending').length;
    htmlContent += `
            </tbody>
          </table>
          <div class="summary">
            <div class="summary-row"><strong>Total Students:</strong> ${data.length}</div>
            <div class="summary-row"><strong class="paid">Paid:</strong> ${paidCount}</div>
            <div class="summary-row"><strong>Pending:</strong> ${data.length - paidCount}</div>
          </div>
        </body>
      </html>
    `;

    // Save HTML as PDF (using a simple approach)
    const fileName = `Student_Fees_${monthNames[month]}_${year}.html`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, htmlContent);

    // Share file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/html',
        dialogTitle: 'Export Student Fees',
      });
    }
  } catch (error) {
    console.error('Error exporting as PDF:', error);
    throw error;
  }
}
