import rateLimit from 'express-rate-limit';

const keyGen = (req) => (req.user?.id ? `u:${req.user.id}` : req.ip);

const user = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  max: Number(process.env.RATE_LIMIT_MAX || 60),
  keyGenerator: keyGen,
  standardHeaders: true,
  legacyHeaders: false
});

const globalLimit = rateLimit({
  windowMs: 60000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
});

export default { user, global: globalLimit };
