import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PkBattleState } from '../types';

interface PkBattleBarProps {
  battle: PkBattleState;
  hostName: string;
  opponentName: string;
  onSendBuff?: (side: 'host' | 'opponent') => void;
}

export const PkBattleBar: React.FC<PkBattleBarProps> = ({
  battle,
  hostName,
  opponentName,
}) => {
  if (!battle.isActive && battle.status === 'IDLE') return null;

  const totalScore = battle.myScore + battle.theirScore;
  const bluePercent = totalScore === 0 ? 50 : Math.max(15, Math.min(85, (battle.myScore / totalScore) * 100));
  const redPercent = 100 - bluePercent;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div id="pk-battle-bar-wrapper" className="w-full px-3 py-1 flex flex-col items-center select-none z-30 pointer-events-auto">
      {/* ── Dynamic Clash Bar ── */}
      <div className="relative w-full h-8 rounded-full flex items-center overflow-hidden border-2 border-white/20 bg-black/80 shadow-[0_0_20px_rgba(255,42,109,0.4)]">
        {/* Blue Side (Host) */}
        <motion.div
          animate={{ width: `${bluePercent}%` }}
          transition={{ type: 'spring', damping: 20, stiffness: 120 }}
          className="h-full bg-gradient-to-r from-[#00D2FF] to-[#0066FF] flex items-center px-3 justify-between"
        >
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black uppercase text-white/90 tracking-wider">Blue</span>
          </div>
          <span className="text-xs font-black text-white drop-shadow-md">
            {battle.myScore.toLocaleString()}
          </span>
        </motion.div>

        {/* Red Side (Opponent) */}
        <motion.div
          animate={{ width: `${redPercent}%` }}
          transition={{ type: 'spring', damping: 20, stiffness: 120 }}
          className="h-full bg-gradient-to-r from-[#FF2A6D] to-[#D8004C] flex items-center px-3 justify-between"
        >
          <span className="text-xs font-black text-white drop-shadow-md">
            {battle.theirScore.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black uppercase text-white/90 tracking-wider">Red</span>
          </div>
        </motion.div>

        {/* Center Clash Badge */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#FFB800] to-[#FF3B30] border-2 border-white flex items-center gap-1 shadow-[0_0_12px_rgba(255,184,0,0.8)]"
          >
            <span className="text-[10px]">⚔️</span>
            <span className="text-[10px] font-black text-white tracking-tight">
              {battle.status === 'SETTLED' ? 'FINAL' : formatTimer(battle.timeLeft)}
            </span>
          </motion.div>
        </div>
      </div>

      {/* ── Sub-bar: MVP Contributors + Clashing Labels ── */}
      <div className="w-full flex justify-between items-center px-1 mt-1 text-[11px] font-bold">
        <div className="flex items-center gap-1 text-[#00D2FF]">
          <span className="w-4 h-4 rounded-full bg-blue-500/20 border border-[#00D2FF] flex items-center justify-center text-[8px]">👑</span>
          <span className="truncate max-w-[90px]">{hostName}</span>
        </div>

        <div className="text-[10px] text-amber-300 font-extrabold tracking-wide uppercase px-2 py-0.5 rounded bg-black/40 border border-amber-400/20">
          {battle.status === 'ACTIVE' ? 'Live PK Duel' : 'Settle Phase'}
        </div>

        <div className="flex items-center gap-1 text-[#FF2A6D]">
          <span className="truncate max-w-[90px]">{opponentName}</span>
          <span className="w-4 h-4 rounded-full bg-pink-500/20 border border-[#FF2A6D] flex items-center justify-center text-[8px]">👑</span>
        </div>
      </div>

      {/* ── Settle Celebration Overlay ── */}
      <AnimatePresence>
        {battle.status === 'SETTLED' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mt-1.5 px-4 py-1 rounded-full bg-black/90 border border-amber-400 text-amber-300 text-xs font-black shadow-[0_0_15px_rgba(255,184,0,0.6)] flex items-center gap-1.5"
          >
            <span>🏆</span>
            <span>
              {battle.myScore > battle.theirScore
                ? `${hostName.toUpperCase()} VICTORY! 🎉`
                : battle.theirScore > battle.myScore
                ? `${opponentName.toUpperCase()} WON! 🔥`
                : 'EPIC DRAW! 🤝'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
