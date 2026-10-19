import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';
import { Candidate } from '../models/Candidate';
import { Job } from '../models/Job';
import { User } from '../models/User';

const benchmarkIterations = 30;

const percentile = (values: number[], p: number): number => {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.max(0, Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1));
  return Number(sorted[rank].toFixed(2));
};

const measure = async (label: string, fn: () => Promise<void>): Promise<{ label: string; p50: number; p95: number }> => {
  const samples: number[] = [];

  for (let index = 0; index < benchmarkIterations; index += 1) {
    const startedAt = performance.now();
    await fn();
    samples.push(performance.now() - startedAt);
  }

  return {
    label,
    p50: percentile(samples, 50),
    p95: percentile(samples, 95),
  };
};

const main = async (): Promise<void> => {
  const mongod = await MongoMemoryServer.create();

  try {
    await mongoose.connect(mongod.getUri());

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Benchmark Admin',
        email: 'benchmark@example.com',
        password: 'Password123',
        organizationName: 'Benchmark Org',
      });

    if (registerResponse.status !== 201 || !registerResponse.body?.data?.token) {
      throw new Error(`Benchmark registration failed: ${registerResponse.status} ${JSON.stringify(registerResponse.body)}`);
    }

    const token = String(registerResponse.body.data.token);
    const orgId = registerResponse.body.data.user.orgId;
    const createdBy = await User.findOne({ email: 'benchmark@example.com' });

    if (!createdBy) {
      throw new Error('Created benchmark user was not found');
    }

    const job = await Job.create({
      title: 'Benchmark Engineer',
      company: 'HireFlow Labs',
      location: 'Remote',
      employmentType: 'FULL_TIME',
      description: 'Benchmark position for candidate list queries.',
      requiredSkills: ['TypeScript', 'Node.js', 'React'],
      experience: '3+ years',
      salaryRange: '$110k - $140k',
      status: 'OPEN',
      orgId,
      createdBy: createdBy._id,
    });

    const candidateRecords = Array.from({ length: 10000 }, (_, index) => ({
      name: `Candidate ${index + 1}`,
      email: `candidate-${index + 1}@example.com`,
      phone: `555-${String(index + 1).padStart(5, '0')}`,
      skills: ['TypeScript', 'Node.js', 'MongoDB'],
      experienceYears: (index % 10) + 1,
      resumeText: `Benchmark resume ${index + 1}`,
      job: job._id,
      stage: index % 6 === 0 ? 'HIRED' : 'APPLIED',
      notes: `Benchmark note ${index + 1}`,
      orgId,
      createdBy: createdBy._id,
    }));

    await Candidate.insertMany(candidateRecords);

    const listResult = await measure('list', async () => {
      const response = await request(app)
        .get('/api/candidates')
        .set('Authorization', `Bearer ${token}`)
        .query({ limit: 10 });

      if (response.status !== 200) {
        throw new Error(`List benchmark failed: ${response.status}`);
      }
    });

    const pageOne = await request(app)
      .get('/api/candidates')
      .set('Authorization', `Bearer ${token}`)
      .query({ limit: 10 });

    const cursor = pageOne.body?.nextCursor;

    const secondPageResult = await measure('cursor', async () => {
      const response = await request(app)
        .get('/api/candidates')
        .set('Authorization', `Bearer ${token}`)
        .query({ limit: 10, cursor });

      if (response.status !== 200) {
        throw new Error(`Cursor benchmark failed: ${response.status}`);
      }
    });

    const searchResult = await measure('search', async () => {
      const response = await request(app)
        .get('/api/candidates')
        .set('Authorization', `Bearer ${token}`)
        .query({ limit: 10, search: 'candidate-9999' });

      if (response.status !== 200) {
        throw new Error(`Search benchmark failed: ${response.status}`);
      }
    });

    console.log(`list p50=${listResult.p50}ms p95=${listResult.p95}ms`);
    console.log(`cursor p50=${secondPageResult.p50}ms p95=${secondPageResult.p95}ms`);
    console.log(`search p50=${searchResult.p50}ms p95=${searchResult.p95}ms`);
  } finally {
    await mongoose.disconnect();
    await mongod.stop();
  }
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown benchmark error';
  console.error(message);
  process.exitCode = 1;
});
