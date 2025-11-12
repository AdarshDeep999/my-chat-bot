import React from 'react';
export default function ConversationList({ conversations, activeId, onSelect }){
  return (
    <div style={{ width:280, borderRight:'1px solid #eee', padding:12, overflow:'auto' }}>
      <h3>Conversations</h3>
      {conversations.map(c=> (
        <div key={c._id}
             onClick={()=>onSelect(c)}
             style={{ padding:8, marginBottom:6, borderRadius:8, cursor:'pointer', background: c._id===activeId? '#e6f0ff':'#f8f8f8' }}>
          <div style={{ fontWeight:600 }}>{c.title || 'New Conversation'}</div>
          <div style={{ fontSize:12, color:'#666' }}>{c.provider} • {c.model}</div>
        </div>
      ))}
    </div>
  );
}
