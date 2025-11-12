import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import chatRoutes from './routes/chat.routes.js';
import { protect } from './middleware/auth.middleware.js';
import rateLimiter from './middleware/rateLimit.middleware.js';
import metricsRouter from './routes/metrics.routes.js';

dotenv.config();
connectDB();

const app = express();

app.use('/metrics', metricsRouter);

// CORS (adjust origins as needed)
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

// Global basic rate limit (per IP)
app.use(rateLimiter.global);

app.get('/api/health', (_req,res)=> res.json({ ok:true }));

// Public
app.use('/api/auth', authRoutes);

// Protected test
app.get('/api/test/protected', protect, (_req,res)=> {
  res.json({ ok:true });
});

// Chat routes (internal middlewares handle auth where needed)
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`API running http://localhost:${PORT}`));
