import { GoogleGenerativeAI } from '@google/generative-ai';

export default class GoogleProvider {
  constructor(apiKey){
    if (!apiKey) console.warn('[GoogleProvider] Missing GOOGLE_API_KEY');
    this.client = new GoogleGenerativeAI(apiKey || 'x');
  }

  modelFor(name){
    const model = name || 'gemini-2.5-flash';
    return this.client.getGenerativeModel({ model });
  }

  async chat(messages, cfg = {}){
    const model = this.modelFor(cfg.model);
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : (m.role === 'system' ? 'user' : m.role),
      parts: [{ text: m.content }]
    }));
    const result = await model.generateContent({ contents });
    return result.response.text();
  }

  async streamChat(messages, cfg = {}, cbs){
    const model = this.modelFor(cfg.model);
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : (m.role === 'system' ? 'user' : m.role),
      parts: [{ text: m.content }]
    }));
    const stream = await model.generateContentStream({ contents });
    try{
      for await (const chunk of stream.stream){
        const t = chunk?.text();
        if (t) cbs.onToken(t);
      }
      cbs.onEnd?.({ provider:'google' });
    }catch(e){
      cbs.onError?.(e);
    }
  }
}
