const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (error) {
    console.error(`DB Connection Error: ${error.message}`);
    if (process.env.VERCEL === '1') {
      throw error;
    }
    process.exit(1);
  }
};

module.exports = connectDB;
