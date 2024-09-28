import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_DB_URL!);
    console.log(`MongoDb connected ${conn.connection.host}`);

  } catch (e: any) {
    console.log("Error connecting to MONGODB", e.message);
    process.exit(1);
  }
};
