export const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

export async function authLogin(email, password){
  const r = await fetch(`${API_BASE}/api/auth/login`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ email, password })
  });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}


export async function createSession(token, { provider, model, systemPrompt }){
  const r = await fetch(`${API_BASE}/api/chat/session`,{
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
    body: JSON.stringify({ provider, model, systemPrompt })
  });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getHistory(token, conversationId){
  const r = await fetch(`${API_BASE}/api/chat/history/${conversationId}`,{
    headers:{ 'Authorization':`Bearer ${token}` }
  });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function clearSession(token, conversationId){
  const r = await fetch(`${API_BASE}/api/chat/clear/${conversationId}`,{
    method:'POST', headers:{ 'Authorization':`Bearer ${token}` }
  });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function summarizeSession(token, conversationId){
  const r = await fetch(`${API_BASE}/api/chat/summarize/${conversationId}`,{
    method:'POST', headers:{ 'Authorization':`Bearer ${token}` }
  });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function exportConversation(token, conversationId){
  const r = await fetch(`${API_BASE}/api/chat/export/${conversationId}`,{
    headers:{ 'Authorization':`Bearer ${token}` }
  });
  if(!r.ok) throw new Error(await r.text());
  return r.blob();
}

export async function streamSSE({ token, conversationId, message, provider, model }){
  const endpoint = conversationId ? `${API_BASE}/api/chat/stream/${conversationId}` : `${API_BASE}/api/chat/stream`;
  const r = await fetch(endpoint, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
    body: JSON.stringify({ message, provider, model })
  });
  if(!r.ok) throw new Error(await r.text());
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  return {
    async *events(){
      let buf='';
      while(true){
        const { value, done } = await reader.read();
        if(done) break;
        buf += decoder.decode(value, { stream:true });
        const chunks = buf.split('\n\n');
        buf = chunks.pop() || '';
        for(const raw of chunks){
          const [evLine, dataLine] = raw.split('\n');
          const event = evLine.replace('event:','').trim();
          const data = JSON.parse(dataLine.replace('data:',''));
          yield { event, data };
        }
      }
    }
  }
}