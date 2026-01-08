import { Schema, model, Document } from "mongoose";

export type AppType = 'retail_partner' | 'franchise';

export interface IApplication extends Document {
  type: AppType;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  contactNumber: string;
  email: string;
  desiredLocation: string;
  pincode: string;
  vehiclesOwned: number;
  hasOwnSpace: boolean;
  areaSqFt: number;
  applicationFileUrl: string; 
  status: 'new' | 'reviewed' | 'contacted' | 'rejected';
}

const applicationSchema = new Schema<IApplication>(
  {
    type: { type: String, enum: ['retail_partner', 'franchise'], required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    contactNumber: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    desiredLocation: { type: String, required: true },
    pincode: { type: String, required: true },
    vehiclesOwned: { type: Number, default: 0 },
    hasOwnSpace: { type: Boolean, default: false },
    areaSqFt: { type: Number, required: true },
    applicationFileUrl: { type: String, required: true },
    status: { type: String, enum: ['new', 'reviewed', 'contacted', 'rejected'], default: 'new' }
  },
  { timestamps: true }
);

export default model<IApplication>("Application", applicationSchema);