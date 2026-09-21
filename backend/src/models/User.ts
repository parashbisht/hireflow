import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'ADMIN' | 'RECRUITER';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never return password field by default in queries
    },
    role: {
      type: String,
      enum: ['ADMIN', 'RECRUITER'],
      default: 'RECRUITER',
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// Index on email for fast lookups during login (Phase 3)
userSchema.index({ email: 1 });

export const User = mongoose.model<IUser>('User', userSchema);