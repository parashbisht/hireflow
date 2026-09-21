import mongoose, { Schema, Document } from 'mongoose';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP' | 'CONTRACT';
export type JobStatus = 'OPEN' | 'CLOSED';

export interface IJob extends Document {
  title: string;
  company: string;
  location: string;
  employmentType: EmploymentType;
  description: string;
  requiredSkills: string[];
  experience: string;
  salaryRange: string;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    title: { type: String, required: [true, 'Job title is required'], trim: true },
    company: { type: String, required: [true, 'Company name is required'], trim: true },
    location: { type: String, required: [true, 'Location is required'], trim: true },
    employmentType: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT'],
      required: [true, 'Employment type is required'],
    },
    description: { type: String, required: [true, 'Job description is required'] },
    requiredSkills: { type: [String], default: [] },
    experience: { type: String, default: '' },
    salaryRange: { type: String, default: '' },
    status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
  },
  { timestamps: true }
);

jobSchema.index({ title: 'text', company: 'text', requiredSkills: 'text' });
jobSchema.index({ status: 1 });

export const Job = mongoose.model<IJob>('Job', jobSchema);