import Conversation from '../models/Conversation.model.js';
import Message from '../models/Message.model.js';
import AIProviderFactory from '../services/ai/AIProviderFactory.js';
import { estimateTokens } from '../utils/tokens.js';
import { summarizeIfNeeded } from '../services/summarizer.js';
import User from '../models/User.model.js';

// Create / switch session
export const createSession = async (req, res) => {
  const userId = req.user.id;
  const { provider = 'google', model = 'gemini-2.5-flash', systemPrompt = '' } = req.body || {};
  const conv = await Conversation.create({
    userId,
    provider,
    model,
    systemPrompt: systemPrompt || undefined
  });
  res.status(201).json({ conversationId: conv._id, provider, model });
};

export const getHistory = async (req, res) => {
  const { conversationId } = req.params;
  const conv = await Conversation.findById(conversationId);
  if (!conv || String(conv.userId) !== req.user.id) return res.status(404).json({ message:'Not found' });
  const msgs = await Message.find({ conversationId }).sort({ createdAt: 1 }).lean();
  res.json({ conversation: conv, messages: msgs });
};

export const clearSession = async (req, res) => {
  const { conversationId } = req.params;
  const conv = await Conversation.findById(conversationId);
  if (!conv || String(conv.userId) !== req.user.id) return res.status(404).json({ message:'Not found' });
  await Message.deleteMany({ conversationId });
  await Conversation.findByIdAndUpdate(conversationId, { summary: undefined });
  res.json({ ok: true });
};

export const summarizeSession = async (req, res) => {
  const { conversationId } = req.params;
  const conv = await Conversation.findById(conversationId);
  if (!conv || String(conv.userId) !== req.user.id) return res.status(404).json({ message:'Not found' });
  const history = await Message.find({ conversationId }).sort({ createdAt:1 }).lean();
  const formatted = history.map(m => ({ role: m.role, content: m.content }));
  const { summary } = await summarizeIfNeeded(conv, formatted, true);
  await Conversation.findByIdAndUpdate(conversationId, { summary });
  res.json({ summary });
};

// Legacy non-streaming
export const postMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { message, conversationId, provider: overrideProvider, model: overrideModel } = req.body;

    let conv = conversationId ? await Conversation.findById(conversationId) : null;
    if (!conv) {
      conv = await Conversation.create({
        userId,
        provider: overrideProvider || 'google',
        model: overrideModel || 'gemini-2.5-flash'
      });
    }
    if (String(conv.userId) !== userId) return res.status(403).json({ message:'Forbidden' });

    // Build history with optional summary + system
    const prior = await Message.find({ conversationId: conv._id }).sort({ createdAt:1 });
    const base = [];
    if (conv.systemPrompt) base.push({ role:'system', content: conv.systemPrompt });
    if (conv.summary) base.push({ role:'system', content: `Summary so far: ${conv.summary}` });
    const formatted = [
      ...base,
      ...prior.map(m => ({ role:m.role, content:m.content })),
      { role:'user', content: message }
    ];

    // Save user message first
    const userMsg = await Message.create({
      conversationId: conv._id,
      role: 'user',
      content: message,
      tokenCount: estimateTokens(message),
      provider: conv.provider,
      model: conv.model
    });

    const provider = overrideProvider || conv.provider;
    const model = overrideModel || conv.model;
    const svc = AIProviderFactory.getProvider(provider);

    const t0 = Date.now();
    const text = await svc.chat(formatted, { model });
    const latencyMs = Date.now() - t0;

    const asstMsg = await Message.create({
      conversationId: conv._id,
      role: 'assistant',
      content: text,
      tokenCount: estimateTokens(text),
      provider, model, latencyMs
    });
    // Deduct tokens from user
    const user = await User.findById(userId);
    if (user) {
      const totalUsed = estimateTokens(message) + estimateTokens(acc || text);
      user.tokensRemaining = Math.max(0, user.tokensRemaining - totalUsed);
      await user.save();
      send && send('tokens', { remaining: user.tokensRemaining }); // for SSE live update
    }


    // maybe summarize
    await summarizeIfNeeded(conv, formatted);

    res.status(201).json({
      conversationId: conv._id,
      userMessage: userMsg,
      assistantMessage: asstMsg
    });
  } catch (e) {
    console.error('postMessage error', e);
    res.status(500).json({ message:'Server error', error: e.message });
  }
};

// Streaming SSE
export const streamMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { message, provider: overrideProvider, model: overrideModel } = req.body || {};

    let conv = conversationId ? await Conversation.findById(conversationId) : null;
    if (!conv) {
      const providerFallback = overrideProvider || 'google';
      const modelFallback =
        overrideModel || (providerFallback === 'openai' ? 'gpt-4o-mini' : 'gemini-2.5-flash');
      conv = await Conversation.create({
        userId,
        provider: providerFallback,
        model: modelFallback,
      });
    }

    if (String(conv.userId) !== userId)
      return res.status(403).json({ message: 'Forbidden' });

    // Setup SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });

    const send = (event, data) =>
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    const prior = await Message.find({ conversationId: conv._id }).sort({ createdAt: 1 });
    const base = [];
    if (conv.systemPrompt) base.push({ role: 'system', content: conv.systemPrompt });
    if (conv.summary) base.push({ role: 'system', content: `Summary so far: ${conv.summary}` });
    const history = [
      ...base,
      ...prior.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    // Save user message
    await Message.create({
      conversationId: conv._id,
      role: 'user',
      content: message,
      tokenCount: estimateTokens(message),
      provider: overrideProvider || conv.provider,
      model: overrideModel || conv.model,
    });

    const providerName = overrideProvider || conv.provider;
    const model = overrideModel || conv.model;
    const svc = AIProviderFactory.getProvider(providerName);

    let acc = ''; // ✅ declare BEFORE using
    const t0 = Date.now();
    const hb = setInterval(() => send('ping', { t: Date.now() }), 15000);

    await svc.streamChat(
      history,
      { model, temperature: 0.7 },
      {
        onToken: (t) => {
          acc += t;
          send('token', { t });
        },
        onEnd: async () => {
          clearInterval(hb);
          const latencyMs = Date.now() - t0;

          // Save assistant message
          await Message.create({
            conversationId: conv._id,
            role: 'assistant',
            content: acc,
            tokenCount: estimateTokens(acc),
            provider: providerName,
            model,
            latencyMs,
          });

          // 🟢 Deduct tokens AFTER acc is ready
          const user = await User.findById(userId);
          if (user) {
            const totalUsed = estimateTokens(message) + estimateTokens(acc);
            user.tokensRemaining = Math.max(0, user.tokensRemaining - totalUsed);
            await user.save();
            send('tokens', { remaining: user.tokensRemaining });
          }

          await Conversation.findByIdAndUpdate(conv._id, { lastActiveAt: new Date() });
          await summarizeIfNeeded(conv, history);
          send('end', { ok: true });
          res.end();
        },
        onError: (e) => {
          clearInterval(hb);
          send('error', { message: String(e?.message || e) });
          res.end();
        },
      }
    );
  } catch (e) {
    console.error('streamMessage error', e);
    try {
      res.write(`event: error\ndata: ${JSON.stringify({ message: e.message })}\n\n`);
      res.end();
    } catch {}
  }
};


export const exportConversation = async (req, res) => {
  const { conversationId } = req.params;
  const conv = await Conversation.findById(conversationId);
  if (!conv || String(conv.userId) !== req.user.id) return res.status(404).json({ message:'Not found' });
  const msgs = await Message.find({ conversationId }).sort({ createdAt:1 }).lean();
  const payload = { conversation: conv.toObject(), messages: msgs };
  res.setHeader('Content-Type','application/json');
  res.setHeader('Content-Disposition', `attachment; filename="conversation-${conversationId}.json"`);
  res.status(200).send(JSON.stringify(payload, null, 2));
};

export const summarizeConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conv = await Conversation.findById(conversationId);
    if (!conv || String(conv.userId) !== req.user.id) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const msgs = await Message.find({ conversationId }).sort({ createdAt: 1 });

    // ✅ FIX: If blank, return safe response
    if (!msgs.length) {
      return res.json({ summary: "No messages yet — nothing to summarize." });
    }

    // ✅ Build content
    const historyText = msgs.map(m => `${m.role}: ${m.content}`).join("\n");

    // ✅ Use your AI provider
    const ai = AIProviderFactory.getProvider(conv.provider || 'google');
    const summary = await ai.summarize(historyText);

    res.json({ summary });

  } catch (err) {
    console.error("Summary error:", err);
    res.status(500).json({ message: "Server error" });
  }
};