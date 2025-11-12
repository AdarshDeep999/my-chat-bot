import React, { useState } from 'react';

// 1. ACCEPT 'isLoading' PROP in the function arguments
function ChatInput({ onSend, isLoading }) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // 2. Check for isLoading before sending
    if (message.trim() && !isLoading) { 
      onSend(message);
      setMessage('');
    }
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        // 3. Change placeholder and disable input based on isLoading
        placeholder={isLoading ? "Waiting for response..." : "Type your message..."}
        disabled={isLoading} 
      />
      <button type="submit" disabled={isLoading}>
        {/* 4. Change button text and disable it */}
        {isLoading ? '...' : 'Send'} 
      </button>
    </form>
  );
}

export default ChatInput;