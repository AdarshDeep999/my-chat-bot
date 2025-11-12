import Message from '../models/Message.model.js';

// naive monthly cap in tokens (sum of assistant+user tokenCount)
export default function budgetCap(cap = Number(process.env.USER_BUDGET_MONTHLY_TOKENS || 200000)){
  return async (req, res, next) => {
    try{
      const userId = req.user?.id;
      if(!userId) return next();
      const since = new Date(); since.setDate(1); // start of month
      const msgs = await Message.aggregate([
        { $match: { createdAt: { $gte: since }, provider: { $exists: true } } },
        { $lookup: { from:'conversations', localField:'conversationId', foreignField:'_id', as:'conv' } },
        { $unwind: '$conv' },
        { $match: { 'conv.userId': req.user._id } },
        { $group: { _id:null, total: { $sum: { $ifNull: ['$tokenCount', 0] } } } }
      ]);
      const used = msgs[0]?.total || 0;
      if(used >= cap) return res.status(402).json({ message:'Monthly token budget exceeded' });
      next();
    }catch(e){ next(); }
  }
}