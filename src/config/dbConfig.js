import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const DB_URL = process.env.DB_URL || "mongodb://localhost:27017/test"
console.log(DB_URL)
mongoose.connect( DB_URL);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
export default db;

// console.log("hi")