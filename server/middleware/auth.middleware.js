import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

export const protect = async (req, res, next) => {
  let token;

  // 1. Check if the 'Authorization' header exists and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 2. Get the token from the header (splitting 'Bearer <token>')
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify the token using our secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Find the user from the token's ID and attach it to the request
      // We exclude the password from being attached to the request object
      req.user = await User.findById(decoded.id).select('-password');

      // 5. Call 'next()' to pass control to the next function (the controller)
      next();

    } catch (error) {
      // If verification fails (e.g., expired token, invalid signature)
      console.error('Token verification failed:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // 6. If no token at all
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};