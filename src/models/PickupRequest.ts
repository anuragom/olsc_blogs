import { Schema, model, Document } from "mongoose";

export interface IPickupRequest extends Document {
  // Consignor Details
  consignor_fullName: string;
  consignor_contactNo: string;
  consignor_alternateContactNo?: string;
  consignor_companyName?: string;
  consignor_email?: string;
  consignor_address: string;
  consignor_pinCode: string;

  // Consignee Details
  consignee_fullName: string;
  consignee_contactNo: string;
  consignee_alternateContactNo?: string;
  consignee_address: string;
  consignee_pinCode: string;

  // Pickup Details
  pickup_expectedDate: Date;
  pickup_pickupTime?: string;
  pickup_pickupMode: 'Surface' | 'Express' | 'Train' | 'Air';
  pickup_loadType: 'PTL' | 'FTL';

  // Product Details
  product_totalWeight: number;
  product_numberOfBoxes: number;
  product_boxLength?: number;
  product_boxBreadth?: number;
  product_boxHeight?: number;
  product_packagingType: string;
  product_materialType?: string;
  product_additionalNotes?: string;
  remarks?: string;

  // Freight Mode
  freight_mode: 'Paid' | 'To-Pay';

  // Internal Tracking
  status: 'new' | 'assigned' | 'picked' | 'cancelled';
  processingStatus: 'pending' | 'completed' | 'failed' | 'stuck';
  processingError?: string;
  createdAt: Date;
}

const pickupRequestSchema = new Schema<IPickupRequest>(
  {
    // Consignor
    consignor_fullName: { type: String, required: true, trim: true },
    consignor_contactNo: { type: String, required: true },
    consignor_alternateContactNo: { type: String },
    consignor_companyName: { type: String },
    consignor_email: { type: String, lowercase: true, trim: true },
    consignor_address: { type: String, required: true },
    consignor_pinCode: { type: String, required: true },

    // Consignee
    consignee_fullName: { type: String, required: true, trim: true },
    consignee_contactNo: { type: String, required: true },
    consignee_alternateContactNo: { type: String },
    consignee_address: { type: String, required: true },
    consignee_pinCode: { type: String, required: true },

    // Pickup
    pickup_expectedDate: { type: Date, required: true },
    pickup_pickupTime: { type: String },
    pickup_pickupMode: { 
      type: String, 
      enum: ['Surface', 'Express', 'Train', 'Air'], 
      required: true 
    },
    pickup_loadType: { 
      type: String, 
      enum: ['PTL', 'FTL'], 
      required: true 
    },

    // Product
    product_totalWeight: { 
      type: Number, 
      required: true,
      min: [20, 'Weight must be at least 20kg'] 
    },
    product_numberOfBoxes: { type: Number, required: true },
    product_boxLength: { type: Number },
    product_boxBreadth: { type: Number },
    product_boxHeight: { type: Number },
    product_packagingType: { type: String, required: true },
    product_materialType: { type: String },
    product_additionalNotes: { type: String },

    // Freight
    freight_mode: { 
      type: String, 
      enum: ['Paid', 'To-Pay'], 
      default: 'Paid' 
    },

    // System Fields
    status: { 
      type: String, 
      enum: ['new', 'assigned', 'picked', 'cancelled'], 
      default: 'new' 
    },
    processingStatus: { 
      type: String, 
      enum: ['pending', 'completed', 'failed', 'stuck'], 
      default: 'pending' 
    },
    processingError: { type: String },
    remarks: { type: String }
  },
  { timestamps: true }
);

// Indexing for faster admin searching by Pincodes or Pickup Dates
pickupRequestSchema.index({ pickup_expectedDate: 1, consignor_pinCode: 1 });

export default model<IPickupRequest>("PickupRequest", pickupRequestSchema);