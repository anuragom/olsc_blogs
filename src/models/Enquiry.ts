import { Schema, model, Document } from "mongoose";

export type ServiceType = 'rail_logistics' | 'air_logistics' | 'warehousing' | 'road_transport' | 'supply_chain';

export interface IEnquiry extends Document {
  fullName: string;
  email: string;
  phone: string;
  query?: string;
  message: string;
  serviceName: ServiceType;
  status: 'new' | 'contacted' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}
//  , 'automotive-engineering', 'retail-fashion', 'it-consumer-electronics', 'healthcare-pharmaceuticals', 'books-publishing', 'fmcg', 'projects', 'bike-logistics', 'campus-logistics'
const enquirySchema = new Schema<IEnquiry>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    query: { type: String },
    message: { type: String, required: true },
    serviceName: { 
      type: String, 
      enum: ['rail_logistics', 'air_logistics', 'warehousing', '3PL', 'speed_trucking','FTL','PTL','contact_us','automotive-engineering','retail-fashion','it-consumer-electronics','healthcare-pharmaceuticals','books-publishing','fmcg','projects','bike-logistics','campus-logistics'],
      required: true 
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'resolved'],
      default: 'new'
    }
  },
  { timestamps: true }
);

// Index for faster searching in admin panel
enquirySchema.index({ email: 1, serviceName: 1, createdAt: -1 });

export default model<IEnquiry>("Enquiry", enquirySchema);