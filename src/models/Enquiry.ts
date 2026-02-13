import { Schema, model, Document } from "mongoose";

export type ServiceType = 'rail_logistics'| 'air_logistics'| 'warehousing'| '3PL'| 'speed_trucking'|'FTL'|'PTL'|'contact_us'|'automotive-engineering'|'retail-fashion'|'it-consumer-electronics'|'healthcare-pharmaceuticals'|'books-publishing'|'fmcg'|'projects'|'bike-logistics'|'campus-logistics';

// Define the Query Type based on your provided list
export type QueryType = 
  | 'BILL_COPY' | 'CORPORATE_COMMUNICATION' | 'DAMAGE' 
  | 'DELIVERY_TRACKING' | 'EMPLOYEE_HR_RELATED' | 'FRANCHISE_QUERY' 
  | 'LEGAL' | 'NEW_BUSINESS_QUERY' | 'OPERATION_RELATED' 
  | 'OTHER' | 'PAYMENTS' | 'PICK_UP_RELATED' | 'POD_RELATED' 
  | 'TAX_RELATED' | 'UNDELIVERED_SHIPMENTS' | 'VEHICLE_ATTACHMENT_RELATED';

export interface IRemark {
  _id: Schema.Types.ObjectId;
  text: string;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  fullName: string;
}

export interface IEnquiry extends Document {
  fullName: string;
  email: string;
  phone: string;
  query?: string;
  message: string;
  serviceName: ServiceType;
  type_of_query?: QueryType; // New Field
  assigned_to?: string;      // New Field
  status: 'new' | 'contacted' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
  remarks: IRemark[];
}

const enquirySchema = new Schema<IEnquiry>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    query: { type: String },
    message: { type: String, required: true },
    serviceName: { 
      type: String, 
      enum: [
        'rail_logistics', 'air_logistics', 'warehousing', '3PL', 
        'speed_trucking', 'FTL', 'PTL', 'contact_us', 
        'automotive-engineering', 'retail-fashion', 'it-consumer-electronics', 
        'healthcare-pharmaceuticals', 'books-publishing', 'fmcg', 
        'projects', 'bike-logistics', 'campus-logistics'
      ],
      required: true 
    },
    // Implementation of type_of_query enum
    type_of_query: {
      type: String,
      enum: ['EMPTY', 'BILL_COPY', 'CORPORATE_COMMUNICATION', 'DAMAGE',
        'DELIVERY_TRACKING', 'EMPLOYEE_HR_RELATED', 'FRANCHISE_QUERY', 
        'LEGAL', 'NEW_BUSINESS_QUERY', 'OPERATION_RELATED', 
        'OTHER', 'PAYMENTS', 'PICK_UP_RELATED', 'POD_RELATED', 
        'TAX_RELATED', 'UNDELIVERED_SHIPMENTS', 'VEHICLE_ATTACHMENT_RELATED'
      ]
    },
    // Implementation of assigned_to string
    assigned_to: { type: String, trim: true },
    status: {
      type: String,
      enum: ['new', 'contacted', 'resolved'],
      default: 'new'
    },
    remarks: [
      {
        text: { type: String, required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        createdAt: { type: Date, default: Date.now },
        fullName: { type: String, required: true }
      }
    ]
  },
  { timestamps: true }
);

enquirySchema.index({ email: 1, serviceName: 1, createdAt: -1 });

export default model<IEnquiry>("Enquiry", enquirySchema);