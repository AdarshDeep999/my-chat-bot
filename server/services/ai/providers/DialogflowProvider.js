import fs from 'fs';
import path from 'path';
import { GoogleAuth } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';

export default class DialogflowProvider {
  constructor() {
    this.projectId = process.env.DIALOGFLOW_PROJECT_ID;
    if (!this.projectId) {
      console.warn("[Dialogflow] Missing DIALOGFLOW_PROJECT_ID");
    }

    const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!keyPath || !fs.existsSync(keyPath)) {
      console.warn("[Dialogflow] Missing GOOGLE_APPLICATION_CREDENTIALS or file not found:", keyPath);
    }

    // Auth client for getting access tokens
    this.auth = new GoogleAuth({
      keyFile: keyPath,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"]
    });
  }

  async getAccessToken() {
    const client = await this.auth.getClient();
    const tokenResponse = await client.getAccessToken();
    return tokenResponse.token;
  }

  async chat(messages, cfg = {}) {
    try {
      const token = await this.getAccessToken();
      const sessionId = uuidv4();

      const lastUserMsg = messages.filter(m => m.role === "user").pop()?.content || "";

      const url = `https://dialogflow.googleapis.com/v2/projects/${this.projectId}/agent/sessions/${sessionId}:detectIntent`;

      const body = {
        queryInput: {
          text: {
            text: lastUserMsg,
            languageCode: cfg.language || "en-US"
          }
        }
      };

      const res = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(body)
});

// ✅ Capture raw response to debug
const raw = await res.text();
console.log("[Dialogflow RAW RESPONSE]:", raw);

let data;
try {
  data = JSON.parse(raw);
} catch (err) {
  throw new Error("Dialogflow returned non-JSON response: " + raw);
}


      const text =
        data?.queryResult?.fulfillmentText ||
        data?.queryResult?.intent?.displayName ||
        "";

      return {
        text,
        usage: { totalTokenCount: 0 } // Dialogflow does NOT give usage
      };
    } catch (err) {
      console.error("[Dialogflow REST] Error:", err);
      return { text: "Dialogflow error: " + err.message, usage: { totalTokenCount: 0 } };
    }
  }

  // Simulated streaming (Dialogflow has no real streaming API)
  async streamChat(messages, cfg = {}, cbs) {
    try {
      const { text } = await this.chat(messages, cfg);

      // simulate token streaming word-by-word
      const words = text.split(" ");
      for (const w of words) {
        cbs.onToken(w + " ");
        await new Promise(r => setTimeout(r, 40));
      }

      cbs.onEnd?.({ provider: "dialogflow" });

    } catch (err) {
      cbs.onError?.(err);
    }
  }
}
