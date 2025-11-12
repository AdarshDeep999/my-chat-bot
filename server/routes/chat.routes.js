import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { postMessage, streamMessage, getHistory, createSession, clearSession, summarizeSession } from '../controllers/chat.controller.js';
import safety from '../middleware/safety.middleware.js';
import rateLimiter from '../middleware/rateLimit.middleware.js';
import { exportConversation } from '../controllers/chat.controller.js';
import budgetCap from '../middleware/budget.middleware.js';

const router = express.Router();

router.get('/export/:conversationId', protect, exportConversation);
router.post('/stream', protect, budgetCap(), rateLimiter.user, safety, streamMessage);
router.post('/stream/:conversationId', protect, budgetCap(), rateLimiter.user, safety, streamMessage);
router.post('/', protect, budgetCap(), rateLimiter.user, safety, postMessage);

// Create a new conversation/session (optionally set provider/model/systemPrompt)
router.post('/session', protect, rateLimiter.user, createSession);

// Get message history
router.get('/history/:conversationId', protect, getHistory);

// Clear history
router.post('/clear/:conversationId', protect, clearSession);

// Summarize (manual trigger)
router.post('/summarize/:conversationId', protect, summarizeSession);

// Non-streaming legacy endpoint (kept)
router.post('/', protect, rateLimiter.user, safety, postMessage);

// Stream with conversation ID
router.post('/stream/:conversationId', protect, rateLimiter.user, safety, streamMessage);

// Stream without conversation ID
router.post('/stream', protect, rateLimiter.user, safety, streamMessage);

export default router;
