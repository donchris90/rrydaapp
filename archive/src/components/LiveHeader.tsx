import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Eye, X, Check, Plus } from 'lucide-react';
import { LiveStreamData } from '../types';

interface LiveHeaderProps {
  stream: LiveStreamData;
  elapsedTime: string;
  onFollowToggle: () => void;
  onClose: () => void;
}

export const LiveHeader: React.FC<LiveHeaderProps> = ({
  stream,
  elapsedTime,
  onFollowToggle,
  onClose,
}) => {
  return (
    <div id="live-header-bar" className="w-full px-3 py-2 flex items-center justify-between z-30 pointer-events-auto">
      {/* ── Poppo/Bigo Host Capsule ── */}
      <div className="flex items-center bg-[#0a0718]/70 backdrop-blur-md rounded-full border border-white/15 p-1 pr-1.5 max-w-[62%] shadow-lg">
        {/* Host Avatar with animated gradient pulse */}
        <div className="relative">
          <div className="w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-tr from-[#FF2A6D] to-[#FFB800]">
            <img
              src={stream.hostAvatar}
              alt={stream.hostName}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          {/* Pulsing Live Dot */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-black/80 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-[#FF2D55] animate-pulse" />
          </span>
        </div>

        {/* Info Column */}
        <div className="ml-2 mr-2 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-white truncate leading-tight">
              {stream.hostName}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
            <Sparkles className="w-2.5 h-2.5" />
            <span>{elapsedTime}</span>
            <span className="text-white/40">·</span>
            <span className="text-white/80">{stream.diamonds.toLocaleString()} 💎</span>
          </div>
        </div>

        {/* Embedded Follow Button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onFollowToggle}
          id="host-follow-btn"
          className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide flex items-center gap-1 shadow-md transition-all ${
            stream.isFollowing
              ? 'bg-white/15 text-white/80 hover:bg-white/25'
              : 'bg-gradient-to-r from-[#FF2A6D] to-[#D8004C] text-white hover:brightness-110'
          }`}
        >
          {stream.isFollowing ? (
            <>
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </>
          ) : (
            <>
              <Plus className="w-2.5 h-2.5 stroke-[3]" />
              <span>Follow</span>
            </>
          )}
        </motion.button>
      </div>

      {/* ── Audience Ribbon & Controls ── */}
      <div className="flex items-center gap-1.5">
        {/* Top 3 Gifters Mini Ribbon */}
        <div className="flex items-center -space-x-2">
          <div className="w-6 h-6 rounded-full border border-[#FFD700] bg-black/50 flex items-center justify-center text-[10px] shadow-sm">
            👑
          </div>
          <div className="w-6 h-6 rounded-full border border-[#C0C0C0] bg-black/50 flex items-center justify-center text-[10px] shadow-sm">
            🥈
          </div>
          <div className="w-6 h-6 rounded-full border border-[#CD7F32] bg-black/50 flex items-center justify-center text-[10px] shadow-sm">
            🥉
          </div>
        </div>

        {/* Viewers Pill */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#0a0718]/70 backdrop-blur-md border border-white/15 text-white text-[11px] font-bold">
          <Eye className="w-3 h-3 text-white/80" />
          <span>{stream.viewers.toLocaleString()}</span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          id="live-close-btn"
          className="w-7 h-7 rounded-full bg-[#0a0718]/70 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/90 hover:text-white hover:bg-white/20 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
