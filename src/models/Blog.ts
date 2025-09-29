import {Schema, model, Document} from "mongoose";
import { title } from "process";

export interface IBlog extends Document{
    title: string;
    content: string;
    author?: string;
    coverImage?:string;
    images?: string[];
    videoUrls?:string[];
    createdAt: Date;
    updatedAt:Date;
}

const blogSchema = new Schema<IBlog>({
    title:{type: String,required:true,index:"text"},
    content: { type: String, required: true },
    author: { type: String },
    coverImage: { type: String },
    images: [{ type: String }],
    videoUrls: [{ type: String }]
},{timestamps:true});

blogSchema.index({title: "text"});

export default model<IBlog>("Blog",blogSchema);