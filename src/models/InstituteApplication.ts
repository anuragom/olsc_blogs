import { Schema, model, Document } from "mongoose";

export interface IInstituteApplication extends Document {
  fullName: string;
  fathersName: string;
  currentAddress: string;
  residentialAddress: string;
  city: string;
  state: string;
  contactNo: string;
  email: string;
  gender: string;
  instituteName: string;
  yearOfPassing: string;
  board: string;
  percentageObtained: string;
  officeName?: string;
  officeYearOfPassing?: string;
  officeBoard?: string;
  officePercentageObtained?: string;
  marksheetUrl: string;
  place: string;
  date: string;
  reference?: string;
  status: 'new' | 'reviewed' | 'admitted' | 'rejected';
  createdAt: Date;
  processingStatus: 'pending' | 'completed' | 'failed' | 'stuck';
  processingError?: string;
}

const instituteSchema = new Schema<IInstituteApplication>({
  fullName: { type: String, required: true },
  fathersName: { type: String, required: true },
  currentAddress: { type: String, required: true },
  residentialAddress: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  contactNo: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  gender: { type: String, required: true },
  instituteName: { type: String, required: true },
  yearOfPassing: { type: String, required: true },
  board: { type: String, required: true },
  percentageObtained: { type: String, required: true },
  officeName: { type: String },
  officeYearOfPassing: { type: String },
  officeBoard: { type: String },
  officePercentageObtained: { type: String },
  marksheetUrl: { type: String, required: true },
  place: { type: String, required: true },
  date: { type: String, required: true },
  reference: { type: String },
  status: { type: String, enum: ['new', 'reviewed', 'admitted', 'rejected'], default: 'new' },
  processingStatus: { type: String, enum: ['pending', 'completed', 'failed', 'stuck'], default: 'pending' },
  processingError: { type: String, required: false },
}, { timestamps: true });

export default model<IInstituteApplication>("InstituteApplication", instituteSchema);