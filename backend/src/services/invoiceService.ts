import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { Candidate } from '../models/Candidate';

const INVOICE_ROOT = path.resolve(process.cwd(), 'storage', 'invoices');

export const invoicePath = (orgId: string, candidateId: string): string => {
  return path.join(INVOICE_ROOT, String(orgId), `${String(candidateId)}.pdf`);
};

export const logNotification = async (orgId: string, candidateId: string): Promise<void> => {
  console.log(`[NOTIFICATION] Invoice sent for org ${orgId} candidate ${candidateId}`);
  return Promise.resolve();
};

export const generateInvoice = async (orgId: string, candidateId: string): Promise<string> => {
  const candidate = await Candidate.findOne({ _id: candidateId, orgId }).populate('job', 'title company');

  if (!candidate) {
    return '';
  }

  const invoiceNumber = `INV-${candidate.createdAt.getTime()}-${candidate._id.toString().slice(-6)}`;
  const filePath = invoicePath(orgId, candidateId);
  const directory = path.dirname(filePath);

  fs.mkdirSync(directory, { recursive: true });

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const jobTitle =
    typeof candidate.job === 'object' && candidate.job !== null && 'title' in candidate.job && typeof candidate.job.title === 'string'
      ? candidate.job.title
      : 'Unassigned Role';

  const candidateName = typeof candidate.name === 'string' ? candidate.name : 'Candidate';
  const invoiceDate = new Date().toISOString().slice(0, 10);

  doc.fontSize(20).text('HireFlow Placement Invoice', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Invoice #: ${invoiceNumber}`);
  doc.text(`Date: ${invoiceDate}`);
  doc.text(`Organization ID: ${orgId}`);
  doc.text(`Candidate: ${candidateName}`);
  doc.text(`Position: ${jobTitle}`);
  doc.moveDown();
  doc.fontSize(16).text('Placement Fee');
  doc.fontSize(18).text('$2,500.00', { underline: true });
  doc.moveDown();
  doc.text('Thank you for using HireFlow. This invoice was generated automatically upon candidate hire.');
  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on('finish', () => resolve());
    stream.on('error', (error: Error) => reject(error));
  });

  return filePath;
};
