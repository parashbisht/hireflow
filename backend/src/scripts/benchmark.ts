import 'dotenv/config';
import { randomUUID } from 'crypto';
import request from 'supertest';

const benchmarkIterations = 30;

const percentile = (values: number[], p: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.max(0, Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1));
  return Number(sorted[rank].toFixed(2));
};

const measure = async (fn: () => Promise<void>): Promise<{ p50: number; p95: number }> => {
  const samples: number[] = [];
  for (let index = 0; index < benchmarkIterations; index += 1) {
    const startedAt = performance.now();
    await fn();
    samples.push(performance.now() - startedAt);
  }
  return { p50: percentile(samples, 50), p95: percentile(samples, 95) };
};

const main = async (): Promise<void> => {
  const benchmarkDatabaseUrl = process.env.BENCHMARK_DATABASE_URL;
  if (!benchmarkDatabaseUrl) {
    throw new Error('BENCHMARK_DATABASE_URL must point to a dedicated benchmark database');
  }
  const databaseName = decodeURIComponent(new URL(benchmarkDatabaseUrl).pathname.split('/')[1] ?? '');
  if (!databaseName.endsWith('_benchmark')) {
    throw new Error('BENCHMARK_DATABASE_URL database name must end in "_benchmark"');
  }

  process.env.DATABASE_URL = benchmarkDatabaseUrl;
  const [{ prisma }, { default: app }] = await Promise.all([
    import('../lib/prisma'),
    import('../app'),
  ]);
  await prisma.$connect();

  const benchmarkEmail = `benchmark-${randomUUID()}@example.com`;
  let organizationId: string | undefined;

  try {
    const registration = await request(app).post('/api/auth/register').send({
      name: 'Benchmark Admin',
      email: benchmarkEmail,
      password: 'Password123',
      organizationName: 'Benchmark Org',
    });
    if (registration.status !== 201 || !registration.body?.data?.token) {
      throw new Error(`Benchmark registration failed: ${registration.status}`);
    }

    const token = String(registration.body.data.token);
    const registeredOrganizationId = registration.body.data.user.orgId;
    if (typeof registeredOrganizationId !== 'string') {
      throw new Error('Benchmark registration did not return an organization ID');
    }
    organizationId = registeredOrganizationId;
    const user = await prisma.user.findUnique({ where: { email: benchmarkEmail } });
    if (!user) throw new Error('Created benchmark user was not found');

    const job = await prisma.job.create({
      data: {
        title: 'Benchmark Engineer',
        company: 'HireFlow Labs',
        location: 'Remote',
        employmentType: 'FULL_TIME',
        description: 'Benchmark position for candidate list queries.',
        requiredSkills: ['TypeScript', 'Node.js', 'React'],
        experience: '3+ years',
        salaryRange: '$110k - $140k',
        status: 'OPEN',
        organizationId: registeredOrganizationId,
        createdById: user.id,
      },
    });

    await prisma.candidate.createMany({
      data: Array.from({ length: 10000 }, (_, index) => ({
        name: `Candidate ${index + 1}`,
        email: `candidate-${index + 1}@example.com`,
        phone: `555-${String(index + 1).padStart(5, '0')}`,
        skills: ['TypeScript', 'Node.js', 'PostgreSQL'],
        experienceYears: (index % 10) + 1,
        resumeText: `Benchmark resume ${index + 1}`,
        jobId: job.id,
        stage: index % 6 === 0 ? 'HIRED' as const : 'APPLIED' as const,
        organizationId: registeredOrganizationId,
        createdById: user.id,
      })),
    });

    const list = await measure(async () => {
      const response = await request(app).get('/api/candidates').set('Authorization', `Bearer ${token}`).query({ limit: 10 });
      if (response.status !== 200) throw new Error(`List benchmark failed: ${response.status}`);
    });
    const firstPage = await request(app)
      .get('/api/candidates')
      .set('Authorization', `Bearer ${token}`)
      .query({ limit: 10 });
    const cursor = firstPage.body?.nextCursor;
    const cursorPage = await measure(async () => {
      const response = await request(app)
        .get('/api/candidates')
        .set('Authorization', `Bearer ${token}`)
        .query({ limit: 10, cursor });
      if (response.status !== 200) throw new Error(`Cursor benchmark failed: ${response.status}`);
    });
    const search = await measure(async () => {
      const response = await request(app)
        .get('/api/candidates')
        .set('Authorization', `Bearer ${token}`)
        .query({ limit: 10, search: 'candidate-9999' });
      if (response.status !== 200) throw new Error(`Search benchmark failed: ${response.status}`);
    });

    console.log(`list p50=${list.p50}ms p95=${list.p95}ms`);
    console.log(`cursor p50=${cursorPage.p50}ms p95=${cursorPage.p95}ms`);
    console.log(`search p50=${search.p50}ms p95=${search.p95}ms`);
  } finally {
    try {
      const user = await prisma.user.findUnique({ where: { email: benchmarkEmail }, select: { organizationId: true } });
      const orgId = organizationId ?? user?.organizationId;
      if (orgId) {
        await prisma.candidate.deleteMany({ where: { organizationId: orgId } });
        await prisma.job.deleteMany({ where: { organizationId: orgId } });
        await prisma.user.deleteMany({ where: { organizationId: orgId } });
        await prisma.organization.deleteMany({ where: { id: orgId } });
      }
    } finally {
      await prisma.$disconnect();
    }
  }
};

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Unknown benchmark error');
  process.exitCode = 1;
});
