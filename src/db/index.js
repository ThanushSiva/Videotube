const mongoose = require("mongoose");
const DB_NAME = require("../constants.js");

const connectDB = async () => {
  try {
    const connecttionInstance = await mongoose.connect(
      `${process.env.DB_URL}/${DB_NAME}`
    );
    console.log(`MongoDB connected`);
  } catch (error) {
    console.log("MongoDB connection error : ", error);
    process.exit(1);
  }
};

module.exports = { connectDB };
