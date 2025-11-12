import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

function MessageList({ messages }) {
  const messagesEndRef = useRef(null);

  // Auto-scroll function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="message-list">
      {messages.map((msg, index) => (
        <div key={index} className={`message ${msg.role}`}>
          {/* Use ReactMarkdown to render formatted text */}
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
      ))}
      
      {/* This is the empty div that we scroll to */}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;