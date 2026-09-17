import React from 'react';
import { Volume2, VolumeX, ShieldCheck, Sparkles, RefreshCw, HelpCircle } from 'lucide-react';
import { audio } from '../utils/audio';

interface CrashHeaderProps {
  roundNumber: number;
  walletBalance: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onResetBalance: () => void;
  onOpenHelp: () => void;
  onOpenFairness: () => void;
}

export function CrashHeader({
  roundNumber,
  walletBalance,
  isMuted,
  onToggleMute,
  onResetBalance,
  onOpenHelp,
  onOpenFairness,
}: CrashHeaderProps) {
  return (
    <header className="w-full flex items-center justify-between px-3 sm:px-6 py-3 bg-[#17191E] border-b border-white/10 select-none">
      {/* Brand & Game title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#00E701] to-[#22D3A5] shadow-[0_0_15px_rgba(0,231,1,0.4)]">
          <span className="text-xl">🚀</span>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black tracking-wider text-white">
              CRASH
            </h1>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#00E701]/20 text-[#00E701] border border-[#00E701]/40">
              ORIGINAL
            </span>
          </div>
          <span className="text-[11px] font-mono text-white/50">Round #{roundNumber}</span>
        </div>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Reset / Claim Demo Balance */}
        <button
          id="btn-faucet"
          onClick={onResetBalance}
          title="Top up demo coins"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#24272C] hover:bg-[#2F343B] border border-white/10 text-xs font-bold text-[#FFB800] transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Free Faucet</span>
        </button>

        {/* Fairness Trigger */}
        <button
          id="btn-provably-fair"
          onClick={onOpenFairness}
          title="Provably Fair Verification"
          className="p-2 rounded-xl bg-[#24272C] hover:bg-[#2F343B] border border-white/10 text-white/70 hover:text-[#00E701] transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4" />
        </button>

        {/* Audio Mute/Unmute */}
        <button
          id="btn-toggle-sound"
          onClick={() => {
            onToggleMute();
            audio.playClick();
          }}
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          className="p-2 rounded-xl bg-[#24272C] hover:bg-[#2F343B] border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-white/40" /> : <Volume2 className="w-4 h-4 text-[#00E701]" />}
        </button>

        {/* Rules / Help */}
        <button
          id="btn-help"
          onClick={onOpenHelp}
          title="Game Rules"
          className="p-2 rounded-xl bg-[#24272C] hover:bg-[#2F343B] border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
