import { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Send, Hash, MessageSquare, Loader2, AlertCircle } from 'lucide-react';

const CHANNELS = [
  { id: 'general', label: 'General', icon: '🌐' },
  { id: 'announcements', label: 'Announcements', icon: '📢' },
  { id: 'engineering', label: 'Engineering', icon: '⚙️' },
  { id: 'hr', label: 'HR', icon: '👥' },
];

function MessageBubble({ msg, isOwn }) {
  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {msg.sender?.name?.[0]?.toUpperCase() || msg.senderName?.[0]?.toUpperCase() || 'U'}
      </div>
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isOwn && (
          <p className="text-xs text-gray-400 mb-1 ml-1">{msg.sender?.name || msg.senderName || 'Unknown'}</p>
        )}
        <div className={`px-4 py-2.5 rounded-2xl text-sm ${
          isOwn ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
        }`}>
          {msg.content || msg.message}
        </div>
        <p className="text-xs text-gray-400 mt-1 mx-1">
          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const [channel, setChannel] = useState('general');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    api.getMessages(channel)
      .then(data => setMessages(Array.isArray(data) ? data : data?.messages || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [channel]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);

    // Optimistic update
    const optimistic = {
      _id: Date.now(),
      content,
      sender: user,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const msg = await api.sendMessage(channel, content);
      setMessages(prev => prev.map(m => m._id === optimistic._id ? (msg.message || msg) : m));
    } catch (e) {
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Channel sidebar */}
      <div className="w-48 flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-col gap-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Channels</p>
        {CHANNELS.map(ch => (
          <button
            key={ch.id}
            onClick={() => setChannel(ch.id)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
              channel === ch.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>{ch.icon}</span>
            <span className="truncate">{ch.label}</span>
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col min-w-0">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <Hash className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900 capitalize">{channel}</h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />{error}
            </div>
          )}
          {!loading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-400 font-medium">No messages yet</p>
              <p className="text-gray-400 text-sm mt-1">Be the first to say something!</p>
            </div>
          )}
          {messages.map((msg, i) => {
            const isOwn = msg.sender?._id === user?._id || msg.sender?.id === user?.id || msg.senderId === user?._id;
            return <MessageBubble key={msg._id || i} msg={msg} isOwn={isOwn} />;
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Message #${channel}...`}
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
            />
            <button type="submit" disabled={!input.trim() || sending}
              className="w-8 h-8 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-200 text-white rounded-lg flex items-center justify-center transition-all flex-shrink-0">
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
