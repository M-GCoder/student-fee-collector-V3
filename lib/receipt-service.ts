import { PDFDocument, PDFPage, rgb } from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';
import { CURRENCY_SYMBOL } from './types';

export interface ReceiptData {
  studentName: string;
  studentClass: string;
  monthYear: string;
  feeAmount: number;
  paymentDate: string;
  receiptNumber: string;
}

/**
 * Generate a PDF receipt for a student fee payment
 */
export async function generatePaymentReceipt(data: ReceiptData): Promise<string> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const { height } = page.getSize();

    // Header
    page.drawText('PAYMENT RECEIPT', {
      x: 50,
      y: height - 50,
      size: 24,
      color: rgb(0.1, 0.5, 0.8),
    });

    // Receipt Number
    page.drawText(`Receipt #: ${data.receiptNumber}`, {
      x: 50,
      y: height - 90,
      size: 12,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Student Information Section
    page.drawText('STUDENT INFORMATION', {
      x: 50,
      y: height - 140,
      size: 14,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`Name: ${data.studentName}`, {
      x: 50,
      y: height - 170,
      size: 12,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(`Class: ${data.studentClass}`, {
      x: 50,
      y: height - 200,
      size: 12,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Payment Details Section
    page.drawText('PAYMENT DETAILS', {
      x: 50,
      y: height - 260,
      size: 14,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`Month: ${data.monthYear}`, {
      x: 50,
      y: height - 290,
      size: 12,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(`Amount: ${CURRENCY_SYMBOL} ${data.feeAmount.toFixed(2)}`, {
      x: 50,
      y: height - 320,
      size: 12,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(`Payment Date: ${data.paymentDate}`, {
      x: 50,
      y: height - 350,
      size: 12,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Status
    page.drawText('✓ PAID', {
      x: 50,
      y: height - 400,
      size: 16,
      color: rgb(0.2, 0.7, 0.2),
    });

    // Footer
    page.drawText('Thank you for your payment', {
      x: 50,
      y: 50,
      size: 12,
      color: rgb(0.6, 0.6, 0.6),
    });

    page.drawText('For inquiries, please contact the administration office', {
      x: 50,
      y: 30,
      size: 10,
      color: rgb(0.7, 0.7, 0.7),
    });

    // Save to file
    const pdfBytes = await pdfDoc.save();
    const fileName = `receipt_${data.receiptNumber}_${Date.now()}.pdf`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, Buffer.from(pdfBytes).toString('base64'), {
      encoding: FileSystem.EncodingType.Base64,
    });

    return filePath;
  } catch (error) {
    console.error('Error generating receipt:', error);
    throw error;
  }
}

/**
 * Generate receipt number based on timestamp
 */
export function generateReceiptNumber(): string {
  const timestamp = Date.now().toString();
  return `RCP-${timestamp.slice(-8)}`;
}
