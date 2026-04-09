import { memo, useState } from 'react';

export const Chat = memo(function Chat() {
  const [messages, setMessages] = useState([
    { role: 'system', content: 'Swarm session started.' },
    { role: 'agent', content: 'Ready to assist with the V6 Meta-Layer.' },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');
    // Mock response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'agent', content: 'Acknowledged. Processing your request...' },
      ]);
    }, 1000);
  };

  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '8px' }}>Chat</h3>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: '8px', fontSize: '14px' }}>
            <span
              style={{ fontWeight: 'bold', color: msg.role === 'agent' ? '#a855f7' : '#94a3b8' }}
            >
              {msg.role === 'agent' ? 'Agent: ' : msg.role === 'user' ? 'You: ' : ''}
            </span>
            <span>{msg.content}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask anything..."
          style={{
            flex: 1,
            background: '#1e293b',
            border: '1px solid #334155',
            color: '#fff',
            padding: '8px',
            borderRadius: '4px',
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            background: '#a855f7',
            border: 'none',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
});
