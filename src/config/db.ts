import mongoose from "mongoose";

export const  connectDB = async(uri:string)=>{
    try {
        await mongoose.connect(uri);
        console.log("MongoDB connected ✅")
    } catch (error) {
        console.log("❌MongoDB connection error❌ ",error);
        process.exit(1);
    }
}