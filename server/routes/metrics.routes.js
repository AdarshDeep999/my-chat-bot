import express from 'express';
import client from 'prom-client';

const router = express.Router();
const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const tokensCounter = new client.Counter({
  name: 'tokens_total', help:'Estimated tokens', labelNames:['role'], registers:[register]
});

router.get('/', async (_req,res)=>{
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

export default router;