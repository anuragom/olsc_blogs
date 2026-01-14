import { Schema, model, Document } from "mongoose";

export interface ICareerApplication extends Document {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  employeeStatus: 'employed' | 'unemployed';
  position: string;
  currentCTC?: string;
  expectedCTC?: string;
  totalExperience: string;
  immediateStart: 'yes' | 'no';
  relocation: 'yes' | 'no';
  resumeUrl: string;
  status: 'new' | 'reviewed' | 'shortlisted' | 'contacted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  jobId?: Schema.Types.ObjectId | null;
  processingStatus: 'pending' | 'completed' | 'failed' | 'stuck';
  processingError?: string;
}

const careerApplicationSchema = new Schema<ICareerApplication>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    employeeStatus: { type: String, enum: ['employed', 'unemployed'], required: true },
    position: { type: String, required: true },
    currentCTC: { type: String },
    expectedCTC: { type: String },
    totalExperience: { type: String, required: true },
    immediateStart: { type: String, enum: ['yes', 'no'], required: true },
    relocation: { type: String, enum: ['yes', 'no'], required: true },
    resumeUrl: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['new', 'reviewed', 'shortlisted', 'contacted', 'rejected'], 
      default: 'new' 
    },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', default: null },
    processingStatus: { type: String, enum: ['pending', 'completed', 'failed', 'stuck'], default: 'pending' },
    processingError: { type: String, required: false },
  },
  { timestamps: true }
);

// Indexes for faster dashboard searching
careerApplicationSchema.index({ email: 1, position: 1, status: 1 });

export default model<ICareerApplication>("CareerApplication", careerApplicationSchema);