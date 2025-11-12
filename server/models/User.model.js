import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// 1. Define the User Schema (the blueprint)
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  tokensRemaining: {
    type: Number,
    default: 200000, // 🟢 every new user starts with 200k tokens
  },
}, { timestamps: true });

// 3. Add a "pre-save" hook (middleware)
// This function will run *before* a new user is saved to the database
userSchema.pre('save', async function (next) {
  // 'this' refers to the user document being saved
  
  // Only hash the password if it's new or has been modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate a "salt" - random characters to make the hash unique
    const salt = await bcrypt.genSalt(10);
    // Hash the password
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 4. Create and export the User model
const User = mongoose.model('User', userSchema);

export default User;