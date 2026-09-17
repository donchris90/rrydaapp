import React, { useState } from 'react';
import type { RoundHistoryItem } from '../types';
import { ShieldCheck, X, Copy, Check, ExternalLink, Calculator } from 'lucide-react';

interface FairnessModalProps {
  round: RoundHistoryItem | null;
  onClose: () => void;
}

export function FairnessModal({ round, onClose }: FairnessModalProps) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!round) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-[#1E2024] rounded-2xl border border-white/10 p-6 shadow-2xl flex flex-col gap-4 text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00E701]/15 border border-[#00E701]/30 flex items-center justify-center text-[#00E701]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Provably Fair Verification
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#00E701]/20 text-[#00E701] font-mono">
                  Round #{round.roundNumber}
                </span>
              </h2>
              <p className="text-xs text-white/50">Mathematical proof of non-manipulated outcome</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crash Result Highlight */}
        <div className="p-3.5 rounded-xl bg-[#14161A] border border-white/5 flex items-center justify-between">
          <span className="text-xs font-semibold text-white/60">Final Multiplier</span>
          <span className="text-2xl font-mono font-black text-[#00E701]">
            {round.crashPoint.toFixed(2)}×
          </span>
        </div>

        {/* Seeds & Hashes */}
        <div className="flex flex-col gap-3">
          {/* Server Seed Hash */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-white/70">Server Seed (SHA256 Hash)</span>
            <div className="flex items-center justify-between bg-[#14161A] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white/90">
              <span className="truncate pr-2">{round.hash}</span>
              <button
                onClick={() => copyToClipboard(round.hash, 'hash')}
                className="text-white/40 hover:text-[#00E701] transition-colors flex-shrink-0 cursor-pointer"
              >
                {copied === 'hash' ? <Check className="w-4 h-4 text-[#00E701]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Client Seed */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-white/70">Client Seed</span>
            <div className="flex items-center justify-between bg-[#14161A] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white/90">
              <span className="truncate pr-2">{round.clientSeed}</span>
              <button
                onClick={() => copyToClipboard(round.clientSeed, 'client')}
                className="text-white/40 hover:text-[#00E701] transition-colors flex-shrink-0 cursor-pointer"
              >
                {copied === 'client' ? <Check className="w-4 h-4 text-[#00E701]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nonce */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-white/70">Nonce</span>
            <div className="bg-[#14161A] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white/90">
              {round.nonce}
            </div>
          </div>
        </div>

        {/* Verification Logic Note */}
        <div className="p-3 bg-[#00E701]/10 border border-[#00E701]/20 rounded-xl text-[11px] text-white/70 leading-relaxed">
          <span className="font-bold text-[#00E701] block mb-0.5">BC.Game Crash Formula:</span>
          Each outcome is calculated using HMAC_SHA256(server_seed, client_seed:nonce). 1 in 33 rounds crash immediately at 1.00x (~3% casino house edge), and the rest scale with 99% theoretical RTP. The hash was determined before the round began.
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#282B31] hover:bg-[#343840] font-bold text-sm text-white transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}
