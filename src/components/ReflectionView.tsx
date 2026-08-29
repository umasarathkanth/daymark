import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Quote, 
  BookOpen, 
  Calendar, 
  RotateCcw, 
  CheckCircle2,
  Lock,
  ChevronDown
} from 'lucide-react';
import { 
  JournalEntry, 
  Memory, 
  ChatMessage, 
  Conversation, 
  UserProfile 
} from '../types';
import { multiTurnReflectionApi } from '../services/api';
import { db, doc, setDoc, getDoc, sanitizeFirestorePayload } from '../lib/firebase';

interface ReflectionViewProps {
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
  entries: JournalEntry[];
  memories: Memory[];
  activeEntry: JournalEntry | null;
  onSelectActiveEntry: (entry: JournalEntry) => void;
}

const DEFAULT_PROMPTS = [
  "How did taking a small action help me unblock my project in the past?",
  "What recurring pattern do you notice in my thoughts when I hit friction?",
  "Can you help me define a low-friction 2-minute step for today?",
  "Help me reflect on what emotional resistance is really about."
];

export const ReflectionView: React.FC<ReflectionViewProps> = ({
  userProfile,
  onOpenAuth,
  entries,
  memories,
  activeEntry,
  onSelectActiveEntry
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string>(`conv_${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load existing conversation or initialize greeting
  useEffect(() => {
    if (!userProfile) return;

    const loadConversation = async () => {
      const convRef = doc(db, 'users', userProfile.uid, 'conversations', activeEntry ? `conv_${activeEntry.id}` : 'conv_general');
      try {
        const snap = await getDoc(convRef);
        if (snap.exists()) {
          const data = snap.data() as Conversation;
          setMessages(data.messages || []);
          setConversationId(data.id);
        } else {
          // Initialize fresh greeting
          const initialGreeting: ChatMessage = {
            id: `msg_${Date.now()}`,
            sender: 'gemini',
            text: activeEntry
              ? `I'm holding your reflection on "${activeEntry.content.slice(0, 60)}...". How would you like to explore what you're feeling right now?`
              : "Welcome to your reflection space. I have access to your personal memory timeline to help you notice patterns, overcome avoidance, and reflect deeply. What's on your mind?",
            timestamp: new Date().toISOString()
          };
          setMessages([initialGreeting]);
        }
      } catch (err) {
        console.warn('Could not load conversation:', err);
      }
    };

    loadConversation();
  }, [userProfile, activeEntry?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    if (!userProfile) {
      onOpenAuth();
      return;
    }

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsSending(true);
    setError(null);

    try {
      // Find relevant memories
      const relevantMemories = memories.slice(0, 5);

      const { responseMessage } = await multiTurnReflectionApi({
        userId: userProfile.uid,
        currentEntry: activeEntry,
        relevantMemories,
        messages: updatedMessages.map((m) => ({ sender: m.sender, text: m.text }))
      });

      const finalMessages = [...updatedMessages, responseMessage];
      setMessages(finalMessages);

      // Persist conversation to Firestore
      const convKey = activeEntry ? `conv_${activeEntry.id}` : 'conv_general';
      const convRef = doc(db, 'users', userProfile.uid, 'conversations', convKey);
      const conversationToSave: Conversation = {
        id: convKey,
        userId: userProfile.uid,
        journalEntryId: activeEntry?.id,
        title: activeEntry ? `Reflection: ${activeEntry.content.slice(0, 30)}...` : 'General Reflection',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: finalMessages
      };

      await setDoc(convRef, sanitizeFirestorePayload(conversationToSave));
    } catch (err: any) {
      console.error('Failed to send reflection message:', err);
      setError(err.message || 'Failed to receive reflection from Gemini.');
    } finally {
      setIsSending(false);
    }
  };

  const handleClearConversation = async () => {
    if (!userProfile) return;
    const initialGreeting: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'gemini',
      text: "Starting a fresh reflection session. What would you like to explore?",
      timestamp: new Date().toISOString()
    };
    setMessages([initialGreeting]);
    const convKey = activeEntry ? `conv_${activeEntry.id}` : 'conv_general';
    const convRef = doc(db, 'users', userProfile.uid, 'conversations', convKey);
    await setDoc(convRef, sanitizeFirestorePayload({
      id: convKey,
      userId: userProfile.uid,
      title: 'Fresh Reflection',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [initialGreeting]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fadeIn">
      {/* Top Banner / Active Entry Context Selector */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold mb-1">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>Multi-turn Gemini Companion</span>
          </div>
          <h1 className="text-xl font-serif font-bold text-stone-900">
            Conversational Reflection
          </h1>
          <p className="text-xs text-stone-500">
            Grounds each turn in your journal entries and personal memory patterns.
          </p>
        </div>

        {/* Active Entry Selector */}
        {entries.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-stone-400 font-medium whitespace-nowrap">Focus Entry:</span>
            <div className="relative">
              <select
                value={activeEntry?.id || ''}
                onChange={(e) => {
                  const selected = entries.find((en) => en.id === e.target.value);
                  if (selected) onSelectActiveEntry(selected);
                }}
                className="appearance-none bg-[#FAF9F6] border border-stone-200 text-xs text-stone-800 rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-amber-500/20 max-w-[200px] truncate"
              >
                <option value="">All Memories & History</option>
                {entries.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {new Date(entry.createdAt).toLocaleDateString()} — {entry.content.slice(0, 30)}...
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Active Focus Card (If chosen) */}
      {activeEntry && (
        <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-200/80 flex items-start space-x-3 text-xs text-stone-800">
          <BookOpen className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-900">Active Reflection Context:</span>
              <span className="text-stone-400 text-[11px]">{new Date(activeEntry.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="italic text-stone-700">"{activeEntry.content}"</p>
          </div>
        </div>
      )}

      {/* Conversation Thread Container */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm flex flex-col h-[520px]">
        {/* Chat Messages Scrollable Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
            >
              <div className="flex items-center space-x-1.5 text-[10px] text-stone-400 px-1">
                <span>{msg.sender === 'user' ? 'You' : 'Gemini Reflection'}</span>
                <span>•</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-stone-900 text-white rounded-tr-xs shadow-2xs'
                    : 'bg-[#FAF9F6] text-stone-800 border border-stone-200/80 rounded-tl-xs shadow-2xs font-sans'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Grounded Memory References */}
                {msg.groundedMemoryReferences && msg.groundedMemoryReferences.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-stone-200/60 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center space-x-1">
                      <Quote className="w-3 h-3" />
                      <span>Grounded in Memory:</span>
                    </div>
                    {msg.groundedMemoryReferences.map((refText, i) => (
                      <div key={i} className="text-[11px] text-stone-600 bg-white/80 p-2 rounded-lg border border-stone-200/50 italic">
                        "{refText}"
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex flex-col items-start space-y-1 animate-fadeIn">
              <div className="text-[10px] text-stone-400 px-1">Gemini Reflection</div>
              <div className="bg-[#FAF9F6] border border-stone-200/80 p-4 rounded-2xl rounded-tl-xs flex items-center space-x-2 text-xs text-stone-500">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                <span>Reflecting with stored memories and historical patterns...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Suggestions Bar */}
        <div className="p-3 bg-[#FAF9F6] border-t border-stone-200/80 flex items-center space-x-2 overflow-x-auto text-xs">
          <span className="text-stone-400 font-semibold whitespace-nowrap pl-1">Suggested:</span>
          {DEFAULT_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isSending}
              className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white hover:bg-amber-50 hover:text-amber-900 border border-stone-200 text-stone-700 transition-colors font-medium text-[11px]"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-stone-200 bg-white rounded-b-2xl">
          {error && (
            <div className="mb-2 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
              {error}
            </div>
          )}
          <div className="flex items-center space-x-2">
            <input
              id="reflection-chat-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Ask Gemini to explore patterns, unpack feelings, or suggest micro-steps..."
              disabled={isSending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#FAF9F6] border border-stone-200 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
            <button
              id="send-reflection-btn"
              onClick={() => handleSendMessage()}
              disabled={isSending || !inputText.trim()}
              className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white transition-all shadow-2xs"
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              id="reset-reflection-btn"
              onClick={handleClearConversation}
              title="Reset Conversation"
              className="p-2.5 rounded-xl border border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
