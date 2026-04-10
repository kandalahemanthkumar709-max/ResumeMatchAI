import mongoose from 'mongoose';

/**
 * MongoDB Connection with Mongoose
 * Every request from the frontend will eventually interact 
 * with our database through models like User, Resume, and Job.
 */

const connectDB = async () => {
    try {
        // mongoose.connect takes the MONGO_URI from your .env file
        // It returns a 'connection' object upon success.
        const conn = await mongoose.connect(process.env.MONGO_URI);

        // Useful for debugging - shows you which database you are connected to.
        console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
    } catch (error) {
        // If the connection fails, it will stop the server to prevent data errors.
        console.error(`Error: ${error.message}`.red.bold);
        process.exit(1);
    }
}

export default connectDB;
