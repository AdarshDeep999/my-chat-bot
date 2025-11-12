import AIProviderFactory from './ai/AIProviderFactory.js';

// Summarize only when needed OR force = true
export async function summarizeIfNeeded(conversation, history, force = false) {
  try {
    // If no messages, skip
    if (!history || history.length === 0) {
      return { summary: conversation.summary || "No messages yet." };
    }

    // Total text length
    const length = history.reduce((sum, m) => sum + (m.content?.length || 0), 0);

    // Only summarize when long OR forced
    if (!force && length < 4000) {
      return { summary: conversation.summary || null };
    }

    // AI Provider (Google/OpenAI/etc)
    const svc = AIProviderFactory.getProvider(conversation.provider || 'google');

    // ✅ MUCH SAFER, CONTROLLED SYSTEM PROMPT
    const sys = {
      role: "system",
      content: `
You are a safe summarization engine.
Summarize the conversation factually using ONLY details that appear in the text.
Do NOT invent names, tasks, projects, motivations, or events.
Do NOT add fictional characters or assumptions.
The summary must be concise, neutral, and strictly accurate.
If the conversation is short or casual, summarize it simply.
      `.trim()
    };

    // ✅ Convert full message history into readable format for model
    const user = {
      role: 'user',
      content: history
        .map(m => `[${m.role}] ${m.content}`)
        .join('\n')
    };

    // ✅ Call provider with explicit model fallback
    const text = await svc.chat([sys, user], {
      model: conversation.model || 'gemini-2.5-flash'
    });

    // ✅ Save back to DB
    await conversation.updateOne({
      summary: text,
      lastActiveAt: new Date()
    });

    return { summary: text };

  } catch (err) {
    console.error("Summarize error:", err.message);

    // ✅ fallback so app does NOT break
    return { summary: conversation.summary || "Summary unavailable due to an error." };
  }
}
