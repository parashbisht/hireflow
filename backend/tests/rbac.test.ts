import request from 'supertest';
import app from '../src/app';

describe('Role-Based Access Control (RBAC)', () => {
  let adminToken: string;
  let recruiterToken: string;
  let viewerToken: string;
  let testJobId: string;
  let testCandidateId: string;

  beforeEach(async () => {
    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'Super Admin',
      email: 'admin@rbac-test.com',
      password: 'password123',
      organizationName: 'RBAC Test Org',
    });
    adminToken = adminRes.body.data.token;

    const recUserRes = await request(app)
      .post('/api/auth/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Recruiter User',
        email: 'recruiter@rbac-test.com',
        password: 'password123',
        role: 'RECRUITER',
      });
    expect(recUserRes.status).toBe(201);

    const recLoginRes = await request(app).post('/api/auth/login').send({
      email: 'recruiter@rbac-test.com',
      password: 'password123',
    });
    recruiterToken = recLoginRes.body.data.token;

    const viewUserRes = await request(app)
      .post('/api/auth/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Viewer User',
        email: 'viewer@rbac-test.com',
        password: 'password123',
        role: 'VIEWER',
      });
    expect(viewUserRes.status).toBe(201);

    const viewLoginRes = await request(app).post('/api/auth/login').send({
      email: 'viewer@rbac-test.com',
      password: 'password123',
    });
    viewerToken = viewLoginRes.body.data.token;

    const jobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Platform Engineer',
        company: 'RBAC Corp',
        location: 'Remote',
        employmentType: 'FULL_TIME',
        description: 'Testing RBAC',
      });
    testJobId = jobRes.body.data.id;

    const candRes = await request(app)
      .post('/api/candidates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Jane Candidate',
        email: 'jane@rbac-test.com',
        job: testJobId,
      });
    testCandidateId = candRes.body.data.id;
  });

  it('rejects passwords under 8 characters on registration', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Short Pass',
      email: 'short@example.com',
      password: 'short',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/8.*characters/i);
  });

  it('rejects passwords under 8 characters when creating users in org', async () => {
    const res = await request(app)
      .post('/api/auth/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Short Pass User',
        email: 'shortuser@rbac-test.com',
        password: '12345',
        role: 'RECRUITER',
      });
    expect(res.status).toBe(400);
  });

  it('RECRUITER receives 403 when trying to access admin user management endpoint', async () => {
    const res = await request(app)
      .post('/api/auth/users')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        name: 'Another User',
        email: 'another@rbac-test.com',
        password: 'password123',
        role: 'VIEWER',
      });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/forbidden/i);
  });

  it('VIEWER can read jobs, candidates and dashboard', async () => {
    const jobsRes = await request(app).get('/api/jobs').set('Authorization', `Bearer ${viewerToken}`);
    expect(jobsRes.status).toBe(200);

    const candRes = await request(app).get('/api/candidates').set('Authorization', `Bearer ${viewerToken}`);
    expect(candRes.status).toBe(200);

    const statsRes = await request(app).get('/api/dashboard/stats').set('Authorization', `Bearer ${viewerToken}`);
    expect(statsRes.status).toBe(200);
  });

  it('VIEWER receives 403 on job creation', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        title: 'Hacked Job',
        company: 'RBAC Corp',
        location: 'Remote',
        employmentType: 'FULL_TIME',
        description: 'Should fail',
      });
    expect(res.status).toBe(403);
  });

  it('VIEWER receives 403 on job update', async () => {
    const res = await request(app)
      .patch(`/api/jobs/${testJobId}`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ title: 'Updated Title' });
    expect(res.status).toBe(403);
  });

  it('VIEWER receives 403 on job deletion', async () => {
    const res = await request(app)
      .delete(`/api/jobs/${testJobId}`)
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });

  it('VIEWER receives 403 on candidate creation', async () => {
    const res = await request(app)
      .post('/api/candidates')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        name: 'Blocked Candidate',
        email: 'blocked@rbac-test.com',
        job: testJobId,
      });
    expect(res.status).toBe(403);
  });

  it('VIEWER receives 403 on candidate stage update', async () => {
    const res = await request(app)
      .patch(`/api/candidates/${testCandidateId}/stage`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ stage: 'OFFER' });
    expect(res.status).toBe(403);
  });

  it('VIEWER receives 403 on candidate deletion', async () => {
    const res = await request(app)
      .delete(`/api/candidates/${testCandidateId}`)
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });
});
