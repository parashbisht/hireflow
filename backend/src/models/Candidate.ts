import mongoose, { Schema, Document } from 'mongoose';

export type CandidateStage = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';

export interface ICandidate extends Document {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experienceYears: number;
  resumeText: string;
  job: mongoose.Types.ObjectId;
  stage: CandidateStage;
  notes: string;
  createdBy: mongoose.Types.ObjectId;
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
    phone: { type: String, default: '', trim: true },
    skills: { type: [String], default: [] },
    experienceYears: { type: Number, default: 0, min: 0 },
    resumeText: { type: String, default: '' },
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: [true, 'Job is required'] },
    stage: {
      type: String,
      enum: ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'],
      default: 'APPLIED',
    },
    notes: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

candidateSchema.index({ job: 1 });
candidateSchema.index({ stage: 1 });

export const Candidate = mongoose.model<ICandidate>('Candidate', candidateSchema);
