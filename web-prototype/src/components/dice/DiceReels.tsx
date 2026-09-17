import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Trophy, Timer, TrendingUp } from 'lucide-react';
import type { DiceRoundStatus } from '../../types';
import { audio } from '../../utils/audio';

interface DiceReelsProps {
  status: DiceRoundStatus;
  countdownSeconds: number;
  dice: [number, number, number];
  lockedReels: [boolean, boolean, boolean];
  totalPool: number;
  recentStreak: string;
}

// Single Reel Slot with rolling digit animation
function ReelSlot({
  value,
  rolling,
  isLocked,
  index,
}: {
  value: number;
  rolling: boolean;
  isLocked: boolean;
  index: number;
  key?: React.Key;
}) {
  const [displayDigit, setDisplayDigit] = useState<number>(value);

  useEffect(() => {
    if (!rolling) {
      setDisplayDigit(value);
      return;
    }
    const interval = setInterval(() => {
      setDisplayDigit(Math.floor(Math.random() * 10));
      if (Math.random() < 0.25) {
        audio.playReelTick();
      }
    }, 60 + index * 10);

    return () => clearInterval(interval);
  }, [rolling, value, index]);

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* 3D Capsule Slot Container */}
      <div
        className={`relative w-20 sm:w-28 h-24 sm:h-32 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300 border-2 ${
          isLocked && !rolling
            ? 'bg-gradient-to-b from-[#2E394E] via-[#202938] to-[#181F2A] border-[#00E701] shadow-[0_0_25px_rgba(0,231,1,0.25)]'
            : rolling
            ? 'bg-[#192230] border-[#FFB800] shadow-[0_0_20px_rgba(255,184,0,0.3)] animate-pulse'
            : 'bg-[#202838] border-white/10 shadow-inner'
        }`}
      >
        {/* Glass reflection top highlight */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-xl" />

        {/* Center alignment guide lines */}
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/5 pointer-events-none" />

        {/* Reel Number Display */}
        <span
          className={`font-mono font-black select-none text-4xl sm:text-6xl transition-transform duration-150 ${
            isLocked && !rolling
              ? 'text-white scale-105 drop-shadow-[0_0_12px_rgba(0,231,1,0.6)]'
              : rolling
              ? 'text-[#FFB800] blur-[0.6px]'
              : 'text-white/80'
          }`}
        >
          {rolling ? displayDigit : value}
        </span>

        {/* Locked status indicator light */}
        <div
          className={`absolute bottom-2 w-2 h-2 rounded-full transition-colors duration-200 ${
            isLocked && !rolling
              ? 'bg-[#00E701] shadow-[0_0_8px_#00E701]'
              : rolling
              ? 'bg-[#FFB800] animate-ping'
              : 'bg-white/20'
          }`}
        />
      </div>

      <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 mt-1.5">
        Reel {index + 1}
      </span>
    </div>
  );
}

export function DiceReels({
  status,
  countdownSeconds,
  dice,
  lockedReels,
  totalPool,
  recentStreak,
}: DiceReelsProps) {
  const isRolling = status === 'RESOLVING' || status === 'LOCKED';
  const isSettled = status === 'SETTLED';
  const allLocked = lockedReels.every(Boolean);
  const currentSum = dice[0] + dice[1] + dice[2];

  return (
    <div className="w-full bg-[#202838] rounded-2xl border border-white/10 p-5 sm:p-7 flex flex-col items-center gap-6 shadow-xl relative overflow-hidden">
      {/* Background ambient neon glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00E701]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row of Capsule: Round Phase & Pool */}
      <div className="w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#242D3D] border border-white/10">
          <Trophy className="w-4 h-4 text-[#FFB800]" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-white/50 tracking-wider">Round Pool</span>
            <span className="text-xs sm:text-sm font-mono font-black text-[#FFB800]">
              {totalPool.toLocaleString()} Coins
            </span>
          </div>
        </div>

        {/* Phase / Countdown Pill */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-md ${
            status === 'OPEN'
              ? 'bg-[#00E701]/15 text-[#00E701] border-[#00E701]/40 shadow-[0_0_12px_rgba(0,231,1,0.2)]'
              : isRolling
              ? 'bg-[#FFB800]/15 text-[#FFB800] border-[#FFB800]/40 shadow-[0_0_12px_rgba(255,184,0,0.2)] animate-pulse'
              : 'bg-[#3B82F6]/15 text-[#60A5FA] border-[#3B82F6]/40'
          }`}
        >
          <Timer className="w-3.5 h-3.5" />
          {status === 'OPEN' ? (
            <span>CLOSES IN {countdownSeconds}s</span>
          ) : isRolling ? (
            <span>ROLLING REELS...</span>
          ) : (
            <span>ROUND SETTLED</span>
          )}
        </div>
      </div>

      {/* 3 Mechanical Reels Display */}
      <div className="flex items-center justify-center gap-3 sm:gap-6 my-2 z-10">
        {[0, 1, 2].map((i) => {
          const slotRolling = isRolling || (isSettled && !lockedReels[i]);
          return (
            <ReelSlot
              key={i}
              index={i}
              value={dice[i]}
              rolling={slotRolling}
              isLocked={lockedReels[i]}
            />
          );
        })}
      </div>

      {/* Revealed Sum Display Pill */}
      {isSettled && allLocked && (
        <div className="animate-in zoom-in-90 fade-in duration-300 z-10 flex flex-col items-center gap-1">
          <div className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FFB800] via-[#FCD34D] to-[#FFB800] text-black shadow-[0_0_30px_rgba(255,184,0,0.4)] border border-white">
            <Sparkles className="w-4 h-4 fill-current" />
            <span className="font-mono font-black text-lg sm:text-xl tracking-wider">
              TOTAL SUM = {currentSum}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-black/20 text-xs font-black uppercase">
              {currentSum < 14 ? 'SMALL' : 'BIG'} · {currentSum % 2 === 0 ? 'EVEN' : 'ODD'}
            </span>
          </div>
        </div>
      )}

      {/* Rolling state indicator */}
      {isRolling && (
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FFB800] animate-bounce z-10">
          <Zap className="w-3.5 h-3.5" />
          <span>DETERMINING OUTCOME VIA PROVABLY FAIR SEED</span>
        </div>
      )}

      {/* Bottom recent streak bar */}
      <div className="w-full flex items-center justify-between pt-3 border-t border-white/10 text-xs font-mono z-10">
        <div className="flex items-center gap-1.5 text-white/60">
          <TrendingUp className="w-3.5 h-3.5 text-[#00E701]" />
          <span className="text-[11px] uppercase font-bold tracking-wider text-white/50">Recent:</span>
          <span className="text-white/90 font-bold">{recentStreak || '14B/E · 08S/E · 21B/O'}</span>
        </div>
        <div className="text-[11px] text-white/50">
          RTP: <span className="text-[#00E701] font-bold">98.5%</span>
        </div>
      </div>
    </div>
  );
}
