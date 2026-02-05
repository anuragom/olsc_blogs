import { Schema, model, Document } from "mongoose";

export const JobProfileEnum = [
  'Sales_and_Marketing', 'Human_Resource', 'Corporate_Communications',
  'Credit_Control', 'Purchase', 'Audit', 'Finance', 'Operations',
  'Administration', 'Key_Operation_Manager', 'Civil_Procurement'
];

export interface IJob extends Document {
  title: string;
  location: string;
  jobType: 'Full-time' | 'Internship' | 'Part-time' | 'Contractual';
  company: string;
  profile: string;
  experienceRequired: string;
  ctc: string;
  vacancies: number;
  qualification: string;
  description: string;
  responsibilities: string[];
  isActive: boolean;
}

const jobSchema = new Schema<IJob>({
  title: { type: String, required: true },
  location: { type: String, required: true },
  jobType: { type: String, enum: ['Full-time', 'Internship', 'Part-time', 'Contractual'], default: 'Full-time' },
  company: { type: String, default: 'OM Logistics Supply Chain Pvt Ltd' },
  profile: { type: String, enum: JobProfileEnum, required: true },
  experienceRequired: { type: String, required: true },
  ctc: { type: String, required: true },
  vacancies: { type: Number, default: 1 },
  qualification: { type: String, required: true },
  description: { type: String, required: true },
  responsibilities: [{ type: String }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default model<IJob>("Job", jobSchema);