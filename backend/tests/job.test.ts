import request from 'supertest';
import app from '../src/app';

const testUser = { name: 'Recruiter One', email: 'recruiter@example.com', password: 'password123' };

const getAuthToken = async (): Promise<string> => {
  const res = await request(app).post('/api/auth/register').send(testUser);
  return res.body.data.token;
};

const sampleJob = {
  title: 'Frontend Developer',
  company: 'Acme Corp',
  location: 'Remote',
  employmentType: 'FULL_TIME',
  description: 'Build great UIs with React.',
  requiredSkills: ['React', 'TypeScript'],
};

describe('Jobs API', () => {
  it('rejects creating a job without authentication', async () => {
    const res = await request(app).post('/api/jobs').send(sampleJob);
    expect(res.status).toBe(401);
  });

  it('creates a job when authenticated', async () => {
    const token = await getAuthToken();
    const res = await request(app).post('/api/jobs').set('Authorization', `Bearer ${token}`).send(sampleJob);
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe(sampleJob.title);
    expect(res.body.data.status).toBe('OPEN');
  });

  it('fetches the list of jobs', async () => {
    const token = await getAuthToken();
    await request(app).post('/api/jobs').set('Authorization', `Bearer ${token}`).send(sampleJob);
    const res = await request(app).get('/api/jobs').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  it('rejects creating a job with missing required fields', async () => {
    const token = await getAuthToken();
    const res = await request(app).post('/api/jobs').set('Authorization', `Bearer ${token}`).send({ title: 'Incomplete Job' });
    expect(res.status).toBe(400);
  });
});