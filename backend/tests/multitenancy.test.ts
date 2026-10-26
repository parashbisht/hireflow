import request from 'supertest';
import app from '../src/app';

describe('Multi-Tenancy Isolation', () => {
  let orgAToken: string;
  let orgBToken: string;
  let orgAJobId: string;
  let orgBJobId: string;
  let orgACandidateId: string;
  let orgBCandidateId: string;

  beforeEach(async () => {
    const resA = await request(app).post('/api/auth/register').send({
      name: 'Alice Admin',
      email: 'alice@orga.com',
      password: 'password123',
      organizationName: 'Org Alpha',
    });
    orgAToken = resA.body.data.token;

    const resB = await request(app).post('/api/auth/register').send({
      name: 'Bob Admin',
      email: 'bob@orgb.com',
      password: 'password123',
      organizationName: 'Org Beta',
    });
    orgBToken = resB.body.data.token;

    const jobARes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        title: 'Alpha Developer',
        company: 'Org Alpha Inc',
        location: 'Remote',
        employmentType: 'FULL_TIME',
        description: 'Alpha job description',
        requiredSkills: ['TypeScript'],
      });
    orgAJobId = jobARes.body.data.id;

    const jobBRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${orgBToken}`)
      .send({
        title: 'Beta Developer',
        company: 'Org Beta Inc',
        location: 'New York',
        employmentType: 'FULL_TIME',
        description: 'Beta job description',
        requiredSkills: ['Go'],
      });
    orgBJobId = jobBRes.body.data.id;

    const candARes = await request(app)
      .post('/api/candidates')
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        name: 'Charlie Alpha',
        email: 'charlie@alpha.com',
        job: orgAJobId,
        skills: ['TypeScript'],
      });
    orgACandidateId = candARes.body.data.id;

    const candBRes = await request(app)
      .post('/api/candidates')
      .set('Authorization', `Bearer ${orgBToken}`)
      .send({
        name: 'David Beta',
        email: 'david@beta.com',
        job: orgBJobId,
        skills: ['Go'],
      });
    orgBCandidateId = candBRes.body.data.id;
  });

  it('Org A user cannot read Org B job and receives 404', async () => {
    const res = await request(app)
      .get(`/api/jobs/${orgBJobId}`)
      .set('Authorization', `Bearer ${orgAToken}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('Org A user cannot update Org B job and receives 404', async () => {
    const res = await request(app)
      .patch(`/api/jobs/${orgBJobId}`)
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({ title: 'Hacked Title' });
    expect(res.status).toBe(404);
  });

  it('Org A user cannot delete Org B job and receives 404', async () => {
    const res = await request(app)
      .delete(`/api/jobs/${orgBJobId}`)
      .set('Authorization', `Bearer ${orgAToken}`);
    expect(res.status).toBe(404);
  });

  it('Org A list jobs only returns Org A jobs', async () => {
    const res = await request(app)
      .get('/api/jobs')
      .set('Authorization', `Bearer ${orgAToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(orgAJobId);
  });

  it('Org A can read its own candidate', async () => {
    const res = await request(app)
      .get(`/api/candidates/${orgACandidateId}`)
      .set('Authorization', `Bearer ${orgAToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Charlie Alpha');
  });

  it('Org A user cannot read Org B candidate and receives 404', async () => {
    const res = await request(app)
      .get(`/api/candidates/${orgBCandidateId}`)
      .set('Authorization', `Bearer ${orgAToken}`);
    expect(res.status).toBe(404);
  });

  it('Org A user cannot update Org B candidate and receives 404', async () => {
    const res = await request(app)
      .patch(`/api/candidates/${orgBCandidateId}`)
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({ name: 'Tampered Name' });
    expect(res.status).toBe(404);
  });

  it('Org A user cannot update stage of Org B candidate and receives 404', async () => {
    const res = await request(app)
      .patch(`/api/candidates/${orgBCandidateId}/stage`)
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({ stage: 'OFFER' });
    expect(res.status).toBe(404);
  });

  it('Org A user cannot delete Org B candidate and receives 404', async () => {
    const res = await request(app)
      .delete(`/api/candidates/${orgBCandidateId}`)
      .set('Authorization', `Bearer ${orgAToken}`);
    expect(res.status).toBe(404);
  });

  it('rejects candidate creation with a job from another organization with 400', async () => {
    const res = await request(app)
      .post('/api/candidates')
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        name: 'Sneaky Candidate',
        email: 'sneaky@alpha.com',
        job: orgBJobId,
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid job for this organization/i);
  });

  it('admin can create users inside their organization', async () => {
    const res = await request(app)
      .post('/api/auth/users')
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        name: 'Recruiter Ray',
        email: 'ray@orga.com',
        password: 'password123',
        role: 'RECRUITER',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('RECRUITER');

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'ray@orga.com',
      password: 'password123',
    });
    expect(loginRes.status).toBe(200);
    const rayToken = loginRes.body.data.token;

    const jobsRes = await request(app)
      .get('/api/jobs')
      .set('Authorization', `Bearer ${rayToken}`);
    expect(jobsRes.body.data).toHaveLength(1);
    expect(jobsRes.body.data[0].id).toBe(orgAJobId);
  });
});
