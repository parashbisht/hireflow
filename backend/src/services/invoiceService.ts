import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { prisma } from '../lib/prisma';

const INVOICE_ROOT = path.resolve(process.cwd(), 'storage', 'invoices');
const PLACEMENT_FEE = 2500;

export const invoicePath = (orgId: string, candidateId: string): string =>
  path.join(INVOICE_ROOT, orgId, `${candidateId}.pdf`);

export const logNotification = async (orgId: string, candidateId: string): Promise<void> => {
  console.log(`[NOTIFICATION] Invoice sent for org ${orgId} candidate ${candidateId}`);
};

export const generateInvoice = async (orgId: string, candidateId: string): Promise<string> => {
  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, organizationId: orgId },
    include: {
      job: { select: { title: true, company: true } },
      organization: { select: { name: true } },
    },
  });

  if (!candidate) {
    throw new Error('Candidate for invoice was not found');
  }

  const invoiceNumber = `INV-${candidate.createdAt.getTime()}-${candidate.id.slice(-6)}`;
  const invoice = await prisma.invoice.upsert({
    where: { candidateId },
    create: {
      invoiceNumber,
      total: PLACEMENT_FEE,
      organizationId: orgId,
      createdById: candidate.createdById,
      candidateId,
      items: {
        create: {
          description: `Placement fee for ${candidate.job.title}`,
          quantity: 1,
          unitPrice: PLACEMENT_FEE,
        },
      },
    },
    update: {},
    include: { items: true },
  });

  const filePath = invoicePath(orgId, candidateId);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const document = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(filePath);
  document.pipe(stream);

  document.fontSize(20).text('HireFlow Placement Invoice', { align: 'center' });
  document.moveDown();
  document.fontSize(12).text(`Invoice #: ${invoice.invoiceNumber}`);
  document.text(`Date: ${invoice.issuedAt.toISOString().slice(0, 10)}`);
  document.text(`Organization: ${candidate.organization.name}`);
  document.text(`Candidate: ${candidate.name}`);
  document.text(`Position: ${candidate.job.title} @ ${candidate.job.company}`);
  document.moveDown();
  for (const item of invoice.items) {
    document.text(`${item.description} — ${item.quantity} × $${Number(item.unitPrice).toFixed(2)}`);
  }
  document.moveDown();
  document.fontSize(18).text(`Total: $${Number(invoice.total).toFixed(2)}`, { underline: true });
  document.moveDown();
  document.fontSize(12).text('Thank you for using HireFlow.');
  document.end();

  await new Promise<void>((resolve, reject) => {
    stream.once('finish', resolve);
    stream.once('error', reject);
  });

  return filePath;
};
