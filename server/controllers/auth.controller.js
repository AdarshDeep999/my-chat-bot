import User from '../models/User.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

/**
 * Create a JWT for a user id
 */
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '3d' });
};

/**
 * REGISTER USER
 * Body: { username, email, password }
 */
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email and password are required' });
    }

    // Check duplicates
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      // Your duplicate check is great.
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create and save (assuming your User model hashes in a pre-save hook)
    const user = new User({ username, email, password });
    const saved = await user.save();

    const token = createToken(saved._id);

    return res.status(201).json({
      message: 'User registered successfully!',
      token,
      user: {
        id: saved._id,
        username: saved.username,
        email: saved.email,
        tokensRemaining: user.tokensRemaining,
      },
    });

  } catch (err) {
    
    // Check if it's a Mongoose validation error (like password length)
    if (err.name === 'ValidationError') {
      
      const firstError = Object.values(err.errors)[0];

      // --- THIS IS THE FIX ---
      // Check if the error is on the 'password' field and is a 'minlength' error
      if (firstError.path === 'password' && firstError.kind === 'minlength') {
        // Send our own, professional message instead
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
      }
      // --- END OF FIX ---

      // Fallback for any other validation error (e.g., invalid email)
      return res.status(400).json({ message: firstError.message });
    }

    // For all other unknown errors, send a 500
    console.error('Registration error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * LOGIN USER (email OR username)
 * Body: { email?, username?, password }
 */
export const loginUser = async (req, res) => {
  try {
    const { email, username, password } = req.body || {};

    if (!password || (!email && !username)) {
      return res.status(400).json({ message: 'Email or username and password required' });
    }

    // Find by email if provided, else by username
    const query = email ? { email } : { username };
    // .select('+password') is safe whether or not your schema has select:false
    const user = await User.findOne(query).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = createToken(user._id);

    return res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        tokensRemaining: user.tokensRemaining
      },
    });

  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};