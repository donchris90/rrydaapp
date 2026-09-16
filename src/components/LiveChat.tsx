import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MessageSquare } from 'lucide-react';
import { ChatMessageItem } from '../types';

interface LiveChatProps {
  messages: ChatMessageItem[];
  onSendMessage: (text: string) => void;
}

export const LiveChat: React.FC<LiveChatProps> = ({ messages, onSendMessage }) => {
  const [inputVal, setInputVal] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    onSendMessage(inputVal.trim());
    setInputVal('');
  };

  return (
    <div id="live-chat-section" className="w-full flex flex-col justify-end pointer-events-auto">
      {/* ── Floating Translucent Chat Stream ── */}
      <div
        ref={scrollRef}
        className="max-h-44 overflow-y-auto px-3 space-y-1.5 scrollbar-none mask-gradient"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isGoldLevel = msg.level >= 20;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xl bg-[#0a0718]/65 backdrop-blur-md border border-white/10 max-w-[92%] shadow-sm text-xs"
              >
                {/* Level Pill */}
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9px] font-black tracking-tight text-white ${
                    isGoldLevel
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                  }`}
                >
                  Lv.{msg.level}
                </span>

                {/* VIP Crown Tag */}
                {msg.isVip && (
                  <span className="text-[10px]" title="VIP Contributor">
                    👑
                  </span>
                )}

                {/* Sender Name */}
                <span
                  className={`font-bold tracking-tight ${
                    msg.isMe
                      ? 'text-amber-300'
                      : msg.isVip
                      ? 'text-amber-400'
                      : 'text-[#00D2FF]'
                  }`}
                >
                  {msg.isMe ? 'You' : msg.sender}:
                </span>

                {/* Content */}
                <span className="text-white/95 font-medium break-words leading-tight">
                  {msg.text}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Input Dock ── */}
      <form onSubmit={handleSubmit} className="px-3 pt-2 flex items-center gap-2">
        <div className="relative flex-1 flex items-center">
          <MessageSquare className="absolute left-3 w-4 h-4 text-white/50 pointer-events-none" />
          <input
            type="text"
            id="chat-input-field"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Say something friendly..."
            className="w-full bg-[#0a0718]/70 backdrop-blur-md border border-white/20 rounded-full pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/50 focus:outline-none focus:border-[#FF2A6D] focus:ring-1 focus:ring-[#FF2A6D] transition-all"
          />
        </div>

        {inputVal.trim().length > 0 && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            type="submit"
            id="chat-send-btn"
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF2A6D] to-[#FF8A00] flex items-center justify-center text-white shadow-md hover:brightness-110 active:scale-90 transition-all"
          >
            <Send className="w-3.5 h-3.5 -ml-0.5" />
          </motion.button>
        )}
      </form>
    </div>
  );
};
