import mongoose, { Schema, Document, Types } from 'mongoose';

export type CandidateStatus = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'SELECTED' | 'REJECTED';

export interface ICandidate extends Document {
  name: string;
  email: string;
  phone: string;
  location: string;
  skills: string[];
  experience: string;
  resumeUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  appliedJob: Types.ObjectId;
  status: CandidateStatus;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const candidateSchema = new Schema<ICandidate>(
  {
    name: { type: String, required: [true, 'Candidate name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    skills: { type: [String], default: [] },
    experience: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },
    linkedinUrl: { type: String, default: '' },
    githubUrl: { type: String, default: '' },
    appliedJob: { type: Schema.Types.ObjectId, ref: 'Job', required: [true, 'Applied job is required'] },
    status: {
      type: String,
      enum: ['APPLIED', 'SCREENING', 'INTERVIEW', 'SELECTED', 'REJECTED'],
      default: 'APPLIED',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

candidateSchema.index({ name: 'text', email: 'text', skills: 'text' });
candidateSchema.index({ status: 1 });
candidateSchema.index({ appliedJob: 1 });

export const Candidate = mongoose.model<ICandidate>('Candidate', candidateSchema);