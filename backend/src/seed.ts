import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { Organization } from './models/Organization';
import { Candidate, type CandidateStage } from './models/Candidate';
import { Job, type EmploymentType, type JobStatus } from './models/Job';
import { User } from './models/User';

type SeedJob = {
  title: string;
  company: string;
  location: string;
  employmentType: EmploymentType;
  description: string;
  requiredSkills: string[];
  experience: string;
  salaryRange: string;
  status: JobStatus;
};

const JOBS: SeedJob[] = [
  {
    title: 'Frontend Developer',
    company: 'Northstar Digital',
    location: 'Remote',
    employmentType: 'FULL_TIME',
    description: 'Build accessible product experiences with React and TypeScript.',
    requiredSkills: ['React', 'TypeScript', 'CSS'],
    experience: '3+ years',
    salaryRange: '$110,000 - $145,000',
    status: 'OPEN',
  },
  {
    title: 'Backend Engineer',
    company: 'Cedar Systems',
    location: 'New York, NY',
    employmentType: 'FULL_TIME',
    description: 'Build reliable APIs and services for a growing financial platform.',
    requiredSkills: ['Node.js', 'TypeScript', 'MongoDB'],
    experience: '4+ years',
    salaryRange: '$120,000 - $160,000',
    status: 'OPEN',
  },
  {
    title: 'Product Designer',
    company: 'Brightpath Health',
    location: 'Boston, MA',
    employmentType: 'FULL_TIME',
    description: 'Design clear, accessible workflows for patients and care teams.',
    requiredSkills: ['Figma', 'Research', 'Prototyping'],
    experience: '3+ years',
    salaryRange: '$100,000 - $135,000',
    status: 'OPEN',
  },
  {
    title: 'Data Analyst',
    company: 'Orbit Commerce',
    location: 'Chicago, IL',
    employmentType: 'FULL_TIME',
    description: 'Turn product and commerce data into useful business insights.',
    requiredSkills: ['SQL', 'Python', 'Tableau'],
    experience: '2+ years',
    salaryRange: '$85,000 - $115,000',
    status: 'OPEN',
  },
  {
    title: 'DevOps Engineer',
    company: 'Meridian Cloud',
    location: 'Austin, TX',
    employmentType: 'CONTRACT',
    description: 'Improve deployment reliability and observability across cloud services.',
    requiredSkills: ['AWS', 'Docker', 'Kubernetes'],
    experience: '5+ years',
    salaryRange: '$80 - $105 per hour',
    status: 'OPEN',
  },
  {
    title: 'QA Engineer',
    company: 'Pinecone Labs',
    location: 'Remote',
    employmentType: 'FULL_TIME',
    description: 'Expand automated coverage and help the team ship dependable releases.',
    requiredSkills: ['Playwright', 'TypeScript', 'API testing'],
    experience: '2+ years',
    salaryRange: '$90,000 - $120,000',
    status: 'OPEN',
  },
];

type DemoCandidate = {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experienceYears: number;
  resumeText: string;
  stage: CandidateStage;
  notes: string;
  jobIndex: number;
};

const CANDIDATES: DemoCandidate[] = [
  { name: 'Maya Chen', email: 'maya.chen@example.com', phone: '212-555-0142', skills: ['React', 'TypeScript', 'CSS'], experienceYears: 4, resumeText: 'Frontend engineer building accessible React applications.', stage: 'APPLIED', notes: '', jobIndex: 0 },
  { name: 'Ethan Brooks', email: 'ethan.brooks@example.com', phone: '646-555-0183', skills: ['React', 'JavaScript', 'Testing Library'], experienceYears: 3, resumeText: 'Frontend developer focused on testing and component systems.', stage: 'SCREENING', notes: '', jobIndex: 0 },
  { name: 'Sofia Ramirez', email: 'sofia.ramirez@example.com', phone: '917-555-0126', skills: ['TypeScript', 'React', 'Design systems'], experienceYears: 5, resumeText: 'Senior engineer with extensive design system experience.', stage: 'INTERVIEW', notes: '', jobIndex: 0 },
  { name: 'Noah Patel', email: 'noah.patel@example.com', phone: '415-555-0197', skills: ['Node.js', 'TypeScript', 'MongoDB'], experienceYears: 6, resumeText: 'Backend engineer designing APIs and data services.', stage: 'OFFER', notes: '', jobIndex: 1 },
  { name: 'Ava Thompson', email: 'ava.thompson@example.com', phone: '206-555-0114', skills: ['Node.js', 'PostgreSQL', 'REST APIs'], experienceYears: 4, resumeText: 'Built production APIs for customer-facing applications.', stage: 'HIRED', notes: '', jobIndex: 1 },
  { name: 'Lucas Morgan', email: 'lucas.morgan@example.com', phone: '312-555-0168', skills: ['TypeScript', 'Node.js', 'Redis'], experienceYears: 7, resumeText: 'Backend specialist with cloud infrastructure experience.', stage: 'REJECTED', notes: '', jobIndex: 1 },
  { name: 'Isabella Nguyen', email: 'isabella.nguyen@example.com', phone: '617-555-0135', skills: ['Figma', 'Research', 'Prototyping'], experienceYears: 5, resumeText: 'Product designer with strong research and prototyping skills.', stage: 'APPLIED', notes: '', jobIndex: 2 },
  { name: 'Oliver James', email: 'oliver.james@example.com', phone: '857-555-0171', skills: ['Figma', 'Accessibility', 'UX'], experienceYears: 4, resumeText: 'Designed accessible healthcare and consumer experiences.', stage: 'SCREENING', notes: '', jobIndex: 2 },
  { name: 'Amara Johnson', email: 'amara.johnson@example.com', phone: '781-555-0108', skills: ['SQL', 'Python', 'Tableau'], experienceYears: 3, resumeText: 'Data analyst experienced in reporting and product insights.', stage: 'INTERVIEW', notes: '', jobIndex: 3 },
  { name: 'Daniel Foster', email: 'daniel.foster@example.com', phone: '773-555-0149', skills: ['SQL', 'Python', 'Looker'], experienceYears: 2, resumeText: 'Analyst focused on clear reporting and reliable data pipelines.', stage: 'OFFER', notes: '', jobIndex: 3 },
  { name: 'Layla Hassan', email: 'layla.hassan@example.com', phone: '630-555-0127', skills: ['AWS', 'Docker', 'Kubernetes'], experienceYears: 6, resumeText: 'DevOps engineer building observable cloud infrastructure.', stage: 'HIRED', notes: '', jobIndex: 4 },
  { name: 'James Wilson', email: 'james.wilson@example.com', phone: '512-555-0153', skills: ['AWS', 'Terraform', 'CI/CD'], experienceYears: 8, resumeText: 'Platform engineer with extensive infrastructure automation experience.', stage: 'REJECTED', notes: '', jobIndex: 4 },
  { name: 'Priya Shah', email: 'priya.shah@example.com', phone: '415-555-0191', skills: ['Playwright', 'TypeScript', 'API testing'], experienceYears: 3, resumeText: 'QA engineer who built end-to-end test automation.', stage: 'APPLIED', notes: '', jobIndex: 5 },
  { name: 'Mateo Silva', email: 'mateo.silva@example.com', phone: '206-555-0138', skills: ['Cypress', 'JavaScript', 'Postman'], experienceYears: 2, resumeText: 'Quality engineer with UI and API testing experience.', stage: 'SCREENING', notes: '', jobIndex: 5 },
  { name: 'Grace Kim', email: 'grace.kim@example.com', phone: '312-555-0174', skills: ['Playwright', 'CI/CD', 'Accessibility'], experienceYears: 4, resumeText: 'Senior QA specialist focused on accessible release quality.', stage: 'INTERVIEW', notes: '', jobIndex: 5 },
];

const seed = async () => {
  try {
    await connectDB();

    // 1. Seed primary Demo Organization
    let demoOrg = await Organization.findOne({ name: 'HireFlow Demo' });
    if (!demoOrg) {
      demoOrg = await Organization.create({ name: 'HireFlow Demo' });
    }

    // Demo Admin
    const adminEmail = 'admin@hireflow.com';
    let admin = await User.findOne({ email: adminEmail });
    if (admin) {
      admin.name = 'Demo Admin';
      admin.password = 'demo1234';
      admin.role = 'ADMIN';
      admin.orgId = demoOrg._id as mongoose.Types.ObjectId;
      await admin.save();
    } else {
      admin = await User.create({
        name: 'Demo Admin',
        email: adminEmail,
        password: 'demo1234',
        role: 'ADMIN',
        orgId: demoOrg._id,
      });
    }

    // Demo Recruiter
    const recruiterEmail = 'demo@hireflow.com';
    let recruiter = await User.findOne({ email: recruiterEmail });
    if (recruiter) {
      recruiter.name = 'Demo Recruiter';
      recruiter.password = 'demo1234';
      recruiter.role = 'RECRUITER';
      recruiter.orgId = demoOrg._id as mongoose.Types.ObjectId;
      await recruiter.save();
    } else {
      recruiter = await User.create({
        name: 'Demo Recruiter',
        email: recruiterEmail,
        password: 'demo1234',
        role: 'RECRUITER',
        orgId: demoOrg._id,
      });
    }

    // Clear existing Demo Org records
    await Candidate.deleteMany({ orgId: demoOrg._id });
    await Job.deleteMany({ orgId: demoOrg._id });

    const jobs = await Job.create(
      JOBS.map((job) => ({
        ...job,
        orgId: demoOrg._id,
        createdBy: recruiter._id,
      }))
    );

    await Candidate.create(
      CANDIDATES.map(({ jobIndex, ...candidate }) => ({
        ...candidate,
        job: jobs[jobIndex]._id,
        orgId: demoOrg._id,
        createdBy: recruiter._id,
      }))
    );

    // 2. Seed second Organization for multi-tenancy isolation verification
    let acmeOrg = await Organization.findOne({ name: 'Acme Corporation' });
    if (!acmeOrg) {
      acmeOrg = await Organization.create({ name: 'Acme Corporation' });
    }

    const acmeAdminEmail = 'admin@acme.com';
    let acmeAdmin = await User.findOne({ email: acmeAdminEmail });
    if (acmeAdmin) {
      acmeAdmin.password = 'demo1234';
      acmeAdmin.orgId = acmeOrg._id as mongoose.Types.ObjectId;
      await acmeAdmin.save();
    } else {
      acmeAdmin = await User.create({
        name: 'Acme Admin',
        email: acmeAdminEmail,
        password: 'demo1234',
        role: 'ADMIN',
        orgId: acmeOrg._id,
      });
    }

    const acmeViewerEmail = 'viewer@acme.com';
    let acmeViewer = await User.findOne({ email: acmeViewerEmail });
    if (acmeViewer) {
      acmeViewer.password = 'demo1234';
      acmeViewer.orgId = acmeOrg._id as mongoose.Types.ObjectId;
      await acmeViewer.save();
    } else {
      acmeViewer = await User.create({
        name: 'Acme Viewer',
        email: acmeViewerEmail,
        password: 'demo1234',
        role: 'VIEWER',
        orgId: acmeOrg._id,
      });
    }

    await Candidate.deleteMany({ orgId: acmeOrg._id });
    await Job.deleteMany({ orgId: acmeOrg._id });

    const acmeJob = await Job.create({
      title: 'Principal Architect',
      company: 'Acme Corporation',
      location: 'San Francisco, CA',
      employmentType: 'FULL_TIME',
      description: 'Lead distributed system design at Acme Corporation.',
      requiredSkills: ['Distributed Systems', 'Architecture', 'Go'],
      experience: '8+ years',
      salaryRange: '$180,000 - $220,000',
      status: 'OPEN',
      orgId: acmeOrg._id,
      createdBy: acmeAdmin._id,
    });

    await Candidate.create([
      {
        name: 'Samir Kassam',
        email: 'samir.kassam@acme-sample.com',
        phone: '415-555-9090',
        skills: ['Go', 'Kubernetes', 'Architecture'],
        experienceYears: 9,
        resumeText: 'Enterprise systems architect with extensive Go experience.',
        stage: 'APPLIED',
        notes: 'Acme candidate only.',
        job: acmeJob._id,
        orgId: acmeOrg._id,
        createdBy: acmeAdmin._id,
      },
    ]);

    console.log(
      'Seeded HireFlow Demo Org (admin@hireflow.com, demo@hireflow.com), 6 jobs, 15 candidates; and Acme Corporation (admin@acme.com, viewer@acme.com), 1 job, 1 candidate.'
    );
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

void seed();
