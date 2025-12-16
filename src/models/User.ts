import { Schema, model, Document } from "mongoose";

export type UserRole = 'SuperAdmin' | 'sanjvikAdmin' | 'olscAdmin';
export interface IUser extends Document {
  _id: string;
  userName: string;
  fullName: string;
  profilePic?: string;
  password: string;
  employeeId: string;
  role: UserRole;
  refreshToken?: string; 
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    userName: { type: String, required: true },
    fullName: { type: String, required: true, },
    profilePic: { type: String },
    password: { type: String, required: true },
    employeeId: { type: String, required: true },
    role: {
      type: String,
      enum: ['SuperAdmin', 'sanjvikAdmin', 'olscAdmin'],
      default: 'sanjvikAdmin',
      required: true,
    },
    refreshToken: { type: String },
  },
  { timestamps: true }
);


export default model<IUser>("User", userSchema);
