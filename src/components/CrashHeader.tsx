import React from 'react';
import { Volume2, VolumeX, ShieldCheck, Sparkles, HelpCircle, Dices, Rocket, LayoutDashboard } from 'lucide-react';
import { audio } from '../utils/audio';
import type { ActiveGame } from '../types';

interface CrashHeaderProps {
  roundNumber?: number;
  walletBalance?: number;
  isMuted: boolean;
  activeGame: ActiveGame;
  onSelectGame: (game: ActiveGame) => void;
  onToggleMute: () => void;
  onResetBalance: () => void;
  onOpenHelp: () => void;
  onOpenFairness: () => void;
  onOpenDashboard?: () => void;
}

export function CrashHeader({
  roundNumber,
  walletBalance,
  isMuted,
  activeGame,
  onSelectGame,
  onToggleMute,
  onResetBalance,
  onOpenHelp,
  onOpenFairness,
  onOpenDashboard,
}: CrashHeaderProps) {
  return (
    <header className="w-full flex flex-col sm:flex-row items-center justify-between px-3 sm:px-6 py-3 bg-[#202938] border-b border-white/10 select-none shadow-md gap-3 sm:gap-0">
      {/* Brand & Game Switcher Tabs */}
      <div className="flex items-center gap-3">
        <div className="flex items-center p-1 rounded-xl bg-[#192230] border border-white/10">
          {/* Rocket Crash Tab */}
          <button
            id="tab-crash"
            onClick={() => {
              audio.playClick();
              onSelectGame('CRASH');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black tracking-wider transition-all cursor-pointer ${
              activeGame === 'CRASH'
                ? 'bg-[#00E701] text-black shadow-[0_0_12px_rgba(0,231,1,0.3)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>CRASH</span>
          </button>

          {/* Sum Dice Tab */}
          <button
            id="tab-sumdice"
            onClick={() => {
              audio.playClick();
              onSelectGame('SUM_DICE');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black tracking-wider transition-all cursor-pointer ${
              activeGame === 'SUM_DICE'
                ? 'bg-gradient-to-r from-[#FFB800] to-[#F59E0B] text-black shadow-[0_0_12px_rgba(255,184,0,0.3)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Dices className="w-3.5 h-3.5" />
            <span>LUCKY DICE</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-black/20 font-bold">27</span>
          </button>
        </div>

        {roundNumber && (
          <span className="hidden md:inline text-[11px] font-mono text-white/50">
            Round #{roundNumber}
          </span>
        )}
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Poppo Live Stats Dashboard Trigger */}
        {onOpenDashboard && (
          <button
            id="btn-open-dashboard"
            onClick={() => {
              audio.playClick();
              onOpenDashboard();
            }}
            title="Win / Loss / Spectator Performance Dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-400/20 hover:from-amber-500/30 hover:to-yellow-400/30 border border-amber-400/40 text-xs font-bold text-amber-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.2)]"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Poppo Hub</span>
            <span className="text-[10px] bg-amber-400 text-black px-1 rounded font-black">PRO</span>
          </button>
        )}

        {/* Reset / Claim Demo Balance */}
        <button
          id="btn-faucet"
          onClick={onResetBalance}
          title="Top up demo coins"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2E374A] hover:bg-[#3B465E] border border-white/10 text-xs font-bold text-[#FFB800] transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>+5,000 Faucet</span>
        </button>

        {/* Fairness Trigger */}
        <button
          id="btn-provably-fair"
          onClick={onOpenFairness}
          title="Provably Fair Verification"
          className="p-2 rounded-xl bg-[#2E374A] hover:bg-[#3B465E] border border-white/10 text-white/80 hover:text-[#00E701] transition-colors cursor-pointer"
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
          className="p-2 rounded-xl bg-[#2E374A] hover:bg-[#3B465E] border border-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-white/40" /> : <Volume2 className="w-4 h-4 text-[#00E701]" />}
        </button>

        {/* Rules / Help */}
        <button
          id="btn-help"
          onClick={onOpenHelp}
          title="Game Rules"
          className="p-2 rounded-xl bg-[#2E374A] hover:bg-[#3B465E] border border-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
