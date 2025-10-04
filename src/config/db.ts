import mongoose from "mongoose";

export const connectDB = async (uri: string) => {
  try {
    await mongoose.connect(uri, {
      autoIndex: false,          
      maxPoolSize: 10,           
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,    
      family: 4,                  // Use IPv4, skip IPv6 issues
    });

    console.log("✅ MongoDB connected");

    mongoose.connection.on("connected", () => {
      console.log("📡 Mongoose connected to DB");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ Mongoose connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ Mongoose disconnected");
    });

    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("🛑 Mongoose connection closed due to app termination");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};
