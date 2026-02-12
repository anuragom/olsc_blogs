import { Schema, model, Document, Types } from "mongoose";
import { IUser } from "./User";

export type WebsiteOptions = 'omlogistics' | 'sanjvik';
export interface Block {
  type: "paragraph" | "heading" | "list" | "image" | "video" | "quote" | "code" | "table";
  data: {
    text?: string;
    level?: number;
    items?: string[];
    style?: "ordered" | "unordered";
    image?: {
      data: Buffer;
      contentType: string;
      alt?: string;
    };
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
  images?: {
    data: Buffer;
    contentType: string;
    alt?: string;
  }[];
  faqs?: FAQ[];
  author?: Types.ObjectId | IUser;
  coverImage?: {
    data: Buffer;
    contentType: string;
    alt?: string;
  };
  website: WebsiteOptions;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema(
  {
    data: Buffer,
    contentType: String,
    alt: { type: String, default: "" },
  },
  { _id: false }
);

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
    metaTitle: String,
    metaDescription: String,
    summary: String,
    tags: { type: [String], default: [] },
    categories: { type: [String], default: [] },
    estimatedReadTime: Number,
    blocks: { type: [blockSchema], required: true },
    images: { type: [imageSchema], default: [] },
    faqs: { type: [faqSchema], default: [] },
    website: { 
      type: String, 
      enum: ['omlogistics', 'sanjvik'],
      required: true, 
    },
    isPublished: {
      type: Boolean,
      default: false,
      required: true,
    },
    author: { type: Schema.Types.ObjectId, ref: "User" },
    coverImage: imageSchema,
  },
  { timestamps: true }
);

blogSchema.index({ title: "text", tags: 1, categories: 1 });

export default model<IBlog>("Blog", blogSchema);