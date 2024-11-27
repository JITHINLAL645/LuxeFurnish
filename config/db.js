import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
 const connectDB = async () => {
  try {
    // Connect to MongoDB using mongoosh
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("DB connected");
  } catch (error) {
    console.log("DB Connection error", error.message);
    process.exit(1); 
  }
};

export default connectDB;