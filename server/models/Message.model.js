import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref:'Conversation', required: true, index: true },
  role: { type: String, enum: ['user','assistant','system'], required: true },
  content: { type: String, required: true },
  tokenCount: { type: Number },
  provider: { type: String },
  model: { type: String },
  latencyMs: { type: Number },
  meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;
