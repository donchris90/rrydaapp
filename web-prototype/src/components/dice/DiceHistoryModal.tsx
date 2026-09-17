import React, { useState } from 'react';
import { X, History, ShieldCheck, Copy, Check } from 'lucide-react';
import type { DiceRoundHistory } from '../../types';

interface DiceHistoryModalProps {
  isOpen: boolean;
  history: DiceRoundHistory[];
  onClose: () => void;
}

export function DiceHistoryModal({ isOpen, history, onClose }: DiceHistoryModalProps) {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-[#242D3D] rounded-2xl border border-white/10 p-6 shadow-2xl flex flex-col gap-4 text-white max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFB800]/15 border border-[#FFB800]/30 flex items-center justify-center text-[#FFB800]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Lucky Number Round History</h2>
              <p className="text-xs text-white/60">Cryptographic audit & outcomes of past rounds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Table Content */}
        <div className="flex flex-col gap-2 overflow-y-auto pr-1 no-scrollbar flex-1">
          <div className="grid grid-cols-12 text-[11px] font-bold text-white/40 uppercase tracking-wider px-3 py-1">
            <span className="col-span-3">Round / Time</span>
            <span className="col-span-3 text-center">3 Digits</span>
            <span className="col-span-2 text-center">Sum</span>
            <span className="col-span-2 text-center">Category</span>
            <span className="col-span-2 text-right">Pool</span>
          </div>

          {history.length === 0 ? (
            <div className="py-8 text-center text-xs text-white/40">No settled rounds yet.</div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 items-center px-3 py-2.5 rounded-xl bg-[#192230] border border-white/5 hover:border-white/10 text-xs font-mono transition-all"
              >
                {/* Round Number */}
                <div className="col-span-3 flex flex-col">
                  <span className="font-bold text-white">#{item.roundNumber}</span>
                  <span className="text-[10px] text-white/40">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* 3 Digits */}
                <div className="col-span-3 flex items-center justify-center gap-1">
                  {item.dice.map((d, idx) => (
                    <span
                      key={idx}
                      className="w-6 h-6 rounded-md bg-[#242D3D] border border-white/10 flex items-center justify-center font-bold text-white"
                    >
                      {d}
                    </span>
                  ))}
                </div>

                {/* Sum */}
                <div className="col-span-2 flex justify-center">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FFB800]/20 text-[#FFB800] font-black">
                    {item.sum}
                  </span>
                </div>

                {/* Category */}
                <div className="col-span-2 flex justify-center gap-1 text-[11px]">
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">
                    {item.size}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">
                    {item.parity}
                  </span>
                </div>

                {/* Pool & Copy Hash */}
                <div className="col-span-2 flex items-center justify-end gap-1.5">
                  <span className="font-bold text-white/90">
                    {item.totalPool.toLocaleString()}
                  </span>
                  <button
                    onClick={() => copyHash(item.hash)}
                    className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-[#00E701] transition-colors cursor-pointer"
                    title={`Copy SHA-256 Hash: ${item.hash}`}
                  >
                    {copiedHash === item.hash ? (
                      <Check className="w-3.5 h-3.5 text-[#00E701]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info note */}
        <div className="p-3 bg-[#192230] rounded-xl border border-white/10 text-[11px] text-white/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#00E701]" />
            <span>All rounds cryptographically verifiable with HMAC-SHA256</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#2E394E] hover:bg-[#3B4862] text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
