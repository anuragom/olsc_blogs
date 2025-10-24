import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  _id: string;
  userName: string;
  fullName: string;
  profilePic?: string;
  password: string;
  employeeId: string;
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
    refreshToken: { type: String },
  },
  { timestamps: true }
);


export default model<IUser>("User", userSchema);
