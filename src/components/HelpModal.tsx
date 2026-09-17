import React from 'react';
import { HelpCircle, X, CheckCircle2, Zap, ShieldAlert, Coins } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-[#1E2024] rounded-2xl border border-white/10 p-6 shadow-2xl flex flex-col gap-4 text-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00E701]/15 border border-[#00E701]/30 flex items-center justify-center text-[#00E701]">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">How to Play Crash</h2>
              <p className="text-xs text-white/50">Rules, mechanics & auto-cashout strategy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 text-xs text-white/80 leading-relaxed">
          <div className="flex gap-3 p-3 bg-[#14161A] rounded-xl border border-white/5">
            <Coins className="w-5 h-5 text-[#FFB800] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">1. Set Your Wager</span>
              Choose how many coins you want to bet before the round starts, or set an optional Auto Cash Out multiplier (e.g. 2.00×).
            </div>
          </div>

          <div className="flex gap-3 p-3 bg-[#14161A] rounded-xl border border-white/5">
            <Zap className="w-5 h-5 text-[#00E701] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">2. Watch the Multiplier Climb</span>
              The rocket launches from 1.00× and ascends exponentially into the stratosphere. As it climbs, your potential payout multiplies every millisecond!
            </div>
          </div>

          <div className="flex gap-3 p-3 bg-[#14161A] rounded-xl border border-white/5">
            <ShieldAlert className="w-5 h-5 text-[#FF4757] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">3. Cash Out Before the Crash</span>
              Hit "Cash Out" at any moment to lock in your profit! But beware: the rocket can crash at any instant. If it crashes before you cash out, your wager is lost.
            </div>
          </div>

          <div className="p-3 bg-[#00E701]/10 border border-[#00E701]/20 rounded-xl">
            <span className="font-bold text-[#00E701] block mb-1">99% Return to Player (RTP)</span>
            BC.Game Crash offers an industry-leading 99% theoretical RTP. Outcomes are cryptographically generated before each round starts and verified via the Provably Fair dialogue.
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#00E701] hover:bg-[#2ECC71] text-black font-bold text-sm transition-colors cursor-pointer"
        >
          Got It, Let's Play!
        </button>
      </div>
    </div>
  );
}
