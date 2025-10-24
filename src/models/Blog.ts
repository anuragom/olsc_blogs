import { Schema, model, Document, Types } from "mongoose";
import { IUser } from "./User";

export interface Block {
  type: "paragraph" | "heading" | "list" | "image" | "video" | "quote" | "code" | "table";
  data: {
    text?: string;
    level?: number;
    items?: string[];
    style?: "ordered" | "unordered";
    url?: string;
    caption?: string;
    language?: string;
    content?: string[][];
  };
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface IBlog extends Document {
  title: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  summary?: string;
  tags?: string[];
  categories?: string[];
  estimatedReadTime?: number;
  blocks: Block[];
  images?: string[];
  faqs?: FAQ[];
  author?: Types.ObjectId | IUser;
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const blockSchema = new Schema<Block>(
  {
    type: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const faqSchema = new Schema<FAQ>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    metaTitle: { type: String },
    metaDescription: { type: String },
    summary: { type: String },
    tags: { type: [String], default: [] },
    categories: { type: [String], default: [] },
    estimatedReadTime: { type: Number },
    blocks: { type: [blockSchema], required: true },
    images: { type: [String], default: [] },
    faqs: { type: [faqSchema], default: [] },
    author: { type: Schema.Types.ObjectId, ref: "User" },
    coverImage: { type: String },
  },
  { timestamps: true }
);

blogSchema.index({ title: "text", tags: 1, categories: 1 });

export default model<IBlog>("Blog", blogSchema);

