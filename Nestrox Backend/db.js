const mongoose = require('mongoose');

// MongoDB Connection String (Standard non-SRV format to avoid DNS issues)
const MONGO_URI = 'mongodb://sanjayvarmaa2604_db_user:7yxPxSCL2Icdamtl@ac-yuf30yr-shard-00-00.nd0idr1.mongodb.net:27017,ac-yuf30yr-shard-00-01.nd0idr1.mongodb.net:27017,ac-yuf30yr-shard-00-02.nd0idr1.mongodb.net:27017/nestrox?ssl=true&replicaSet=atlas-astoad-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
.then(() => console.log('✅ Connected to MongoDB Atlas Cloud Database!'))
.catch(err => console.error('❌ Error connecting to MongoDB:', err));

// Define User Schema
const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  full_name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  created_date: {
    type: String,
    required: true
  }
});

const User = mongoose.model('User', userSchema);

module.exports = { User };
