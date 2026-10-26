import 'dotenv/config';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_ci_only';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL must point to a dedicated PostgreSQL test database');
}

const databaseName = decodeURIComponent(new URL(testDatabaseUrl).pathname.split('/')[1] ?? '');
if (!databaseName.endsWith('_test')) {
  throw new Error('TEST_DATABASE_URL database name must end in "_test"');
}

process.env.DATABASE_URL = testDatabaseUrl;
const { prisma } = require('../src/lib/prisma') as typeof import('../src/lib/prisma');

beforeAll(async () => {
  await prisma.$connect();
});

afterEach(async () => {
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
