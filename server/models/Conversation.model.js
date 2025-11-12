import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref:'User', required: true, index: true },
  title: { type: String, default: 'New Conversation' },
  provider: { type: String, enum: ['google','openai','dialogflow','mock'], default: 'google' },
  model: { type: String, default: 'gemini-2.5-flash' },
  systemPrompt: { type: String },
  summary: { type: String },
  lastActiveAt: { type: Date, default: Date.now },
  ttlAt: { type: Date, index: { expireAfterSeconds: 0 }, default: () => new Date(Date.now()+7*86400000) } // 7d TTL
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
