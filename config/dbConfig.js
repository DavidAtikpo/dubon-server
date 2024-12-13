import mongoose from "mongoose";

const dbConnect = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    await mongoose.connect(uri);
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection error:", error);
    if (process.env.NODE_ENV === 'production') {
      console.error('Fatal error: Could not connect to database');
      process.exit(1);
    }
  }
};

export default dbConnect;
