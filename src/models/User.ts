import { Schema, model, Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  userName: string;
  fullName: string;
  password: string;
  employeeId: string;
  role: Schema.Types.ObjectId;
  reportingManagerId?: Schema.Types.ObjectId;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    userName: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    password: { type: String, required: true },
    employeeId: { type: String, required: true },
    role: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    reportingManagerId: { type: Schema.Types.ObjectId, ref: "User" },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

export default model<IUser>("User", userSchema);
