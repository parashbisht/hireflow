import request from 'supertest';
import app from '../src/app';

const testUser = { name: 'Recruiter Two', email: 'recruiter2@example.com', password: 'password123' };

const sampleJob = {
  title: 'Backend Developer',
  company: 'Acme Corp',
  location: 'Remote',
  employmentType: 'FULL_TIME',
  description: 'Build APIs with Node.js.',
  requiredSkills: ['Node.js', 'MongoDB'],
};

const setupAuthAndJob = async () => {
  const registerRes = await request(app).post('/api/auth/register').send(testUser);
  const token = registerRes.body.data.token;
  const jobRes = await request(app).post('/api/jobs').set('Authorization', `Bearer ${token}`).send(sampleJob);
  const jobId = jobRes.body.data._id;
  return { token, jobId };
};

describe('Candidates API', () => {
  it('creates a candidate linked to a job', async () => {
    const { token, jobId } = await setupAuthAndJob();
    const res = await request(app)
      .post('/api/candidates')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Jane Doe', email: 'jane@example.com', job: jobId, skills: ['Node.js'] });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Jane Doe');
    expect(res.body.data.stage).toBe('APPLIED');
  });

  it('rejects a candidate with an invalid email', async () => {
    const { token, jobId } = await setupAuthAndJob();
    const res = await request(app)
      .post('/api/candidates')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bad Email', email: 'not-an-email', job: jobId });
    expect(res.status).toBe(400);
  });

  it('updates a candidate status through the pipeline endpoint', async () => {
    const { token, jobId } = await setupAuthAndJob();
    const createRes = await request(app)
      .post('/api/candidates')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'John Smith', email: 'john@example.com', job: jobId });
    const candidateId = createRes.body.data._id;
    const statusRes = await request(app)
      .patch(`/api/candidates/${candidateId}/stage`)
      .set('Authorization', `Bearer ${token}`)
      .send({ stage: 'INTERVIEW' });
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.stage).toBe('INTERVIEW');
  });

  it('rejects an invalid status value', async () => {
    const { token, jobId } = await setupAuthAndJob();
    const createRes = await request(app)
      .post('/api/candidates')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Candidate', email: 'test.candidate@example.com', job: jobId });
    const candidateId = createRes.body.data._id;
    const statusRes = await request(app)
      .patch(`/api/candidates/${candidateId}/stage`)
      .set('Authorization', `Bearer ${token}`)
      .send({ stage: 'NOT_A_REAL_STAGE' });
    expect(statusRes.status).toBe(400);
  });
});