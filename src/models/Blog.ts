import { Schema, model, Document } from "mongoose";

export interface Block {
  type: "paragraph" | "image" | "video" | "heading" | "list" | "quote" | "code";
  data: any;
  children?: Block[];
}

export interface IBlog extends Document {
  title: string;
  summary?: string;
  tags?: string[];
  estimatedReadTime?: number;
  blocks: Block[];
  author?: string;
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const blockSchema = new Schema<Block>(
  {
    type: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },
    children: { type: [Schema.Types.Mixed], default: [] },
  },
  { _id: false }
);

const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true },
    summary: { type: String },
    tags: { type: [String], default: [] },
    estimatedReadTime: { type: Number },
    blocks: { type: [blockSchema], required: true },
    author: { type: String },
    coverImage: { type: String },
  },
  { timestamps: true }
);

blogSchema.index({ title: "text", tags: 1 });

export default model<IBlog>("Blog", blogSchema);
