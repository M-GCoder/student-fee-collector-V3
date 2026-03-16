import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import XLSX from "xlsx";
import { Student, Payment, CURRENCY_SYMBOL } from "./types";

/**
 * Build the export rows for all students.
 * Each row has: Name, Class, Payment Date (or "Pending"), Fee's, Total Amount of Fee's
 */
function buildExportRows(students: Student[], payments: Payment[]) {
  return students.map((student) => {
    const studentPayments = payments.filter((p) => p.studentId === student.id);
    const totalAmount = studentPayments.reduce((sum, p) => sum + p.amount, 0);

    // Most recent payment
    const sortedPayments = [...studentPayments].sort(
      (a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime()
    );
    const lastPayment = sortedPayments[0];

    const paymentDate = lastPayment
      ? new Date(lastPayment.paidDate).toLocaleDateString("en-IN")
      : "Pending";

    return {
      name: student.name,
      class: student.class,
      paymentDate,
      fee: student.monthlyFee,
      totalAmount,
    };
  });
}

/**
 * Export student payment data as CSV file
 */
export async function exportAsCSV(
  students: Student[],
  payments: Payment[]
): Promise<string | null> {
  try {
    const rows = buildExportRows(students, payments);

    let csvContent = "Name,Class,Payment Date,Fee's,Total Amount of Fee's\n";

    for (const row of rows) {
      csvContent += `"${row.name}","${row.class}","${row.paymentDate}",${row.fee},${row.totalAmount}\n`;
    }

    const fileName = `student_fees_${new Date().getTime()}.csv`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, csvContent);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: "text/csv",
        dialogTitle: "Export Student Fee Data (CSV)",
      });
    }

    return filePath;
  } catch (error) {
    console.error("Error exporting CSV:", error);
    throw error;
  }
}

/**
 * Export student payment data as XLS file
 */
export async function exportAsXLS(
  students: Student[],
  payments: Payment[]
): Promise<string | null> {
  try {
    const rows = buildExportRows(students, payments);

    const sheetData = rows.map((row) => ({
      Name: row.name,
      Class: row.class,
      "Payment Date": row.paymentDate,
      "Fee's": row.fee,
      "Total Amount of Fee's": row.totalAmount,
    }));

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, sheet, "Students");

    const fileName = `student_fees_${new Date().getTime()}.xlsx`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    const xlsxData = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });

    await FileSystem.writeAsStringAsync(filePath, xlsxData, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Export Student Fee Data (XLS)",
      });
    }

    return filePath;
  } catch (error) {
    console.error("Error exporting XLS:", error);
    throw error;
  }
}

/**
 * Export student payment data as PDF (HTML) file
 */
export async function exportAsPDF(
  students: Student[],
  payments: Payment[]
): Promise<string | null> {
  try {
    const rows = buildExportRows(students, payments);
    const grandTotal = rows.reduce((sum, r) => sum + r.totalAmount, 0);

    let htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background-color: #0a7ea4; color: white; padding: 10px; text-align: left; }
            td { padding: 8px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f5f5f5; }
            .summary { background-color: #f0f8ff; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Student Fee Collection Report</h1>
          <p class="summary">
            <strong>Report Generated:</strong> ${new Date().toLocaleDateString("en-IN")}<br>
            <strong>Total Students:</strong> ${students.length}<br>
            <strong>Total Amount Collected:</strong> ${CURRENCY_SYMBOL}${grandTotal}
          </p>

          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Class</th>
                <th>Payment Date</th>
                <th>Fee's</th>
                <th>Total Amount of Fee's</th>
              </tr>
            </thead>
            <tbody>
    `;

    for (const row of rows) {
      htmlContent += `
              <tr>
                <td>${row.name}</td>
                <td>${row.class}</td>
                <td>${row.paymentDate}</td>
                <td>${CURRENCY_SYMBOL}${row.fee}</td>
                <td>${CURRENCY_SYMBOL}${row.totalAmount}</td>
              </tr>
      `;
    }

    htmlContent += `
            </tbody>
          </table>

          <div class="footer">
            <p>This is an auto-generated report from Student Fee Collector</p>
            <p>Generated on ${new Date().toLocaleString("en-IN")}</p>
          </div>
        </body>
      </html>
    `;

    const fileName = `student_fees_${new Date().getTime()}.html`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, htmlContent);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: "text/html",
        dialogTitle: "Export Student Fee Data (PDF/HTML)",
      });
    }

    return filePath;
  } catch (error) {
    console.error("Error exporting PDF:", error);
    throw error;
  }
}
