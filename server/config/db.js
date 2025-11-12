import mongoose from 'mongoose';
import 'dotenv/config'; // This loads the .env variables for this file

const connectDB = async () => {
  try {
    // Try to connect to the database using the string from .env
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // If successful, print a success message
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If it fails, print the error and stop the server
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;