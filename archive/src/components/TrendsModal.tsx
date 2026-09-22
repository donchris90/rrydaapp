import React from 'react';
import type { RoundHistoryItem } from '../types';
import { BarChart2, X, Flame, Award, Zap } from 'lucide-react';

interface TrendsModalProps {
  isOpen: boolean;
  history: RoundHistoryItem[];
  onClose: () => void;
}

export function TrendsModal({ isOpen, history, onClose }: TrendsModalProps) {
  if (!isOpen || history.length === 0) return null;

  const total = history.length;

  const under2 = history.filter((h) => h.crashPoint < 2).length;
  const between2and10 = history.filter((h) => h.crashPoint >= 2 && h.crashPoint < 10).length;
  const over10 = history.filter((h) => h.crashPoint >= 10 && h.crashPoint < 100).length;
  const over100 = history.filter((h) => h.crashPoint >= 100).length;

  const maxMultiplier = Math.max(...history.map((h) => h.crashPoint));
  const medianMultiplier = [...history].sort((a, b) => a.crashPoint - b.crashPoint)[Math.floor(total / 2)]?.crashPoint || 1;

  const under2Pct = Math.round((under2 / total) * 100);
  const between2and10Pct = Math.round((between2and10 / total) * 100);
  const over10Pct = Math.round((over10 / total) * 100);
  const over100Pct = Math.round((over100 / total) * 100);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-[#242D3D] rounded-2xl border border-white/10 p-6 shadow-2xl flex flex-col gap-4 text-white">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00E701]/15 border border-[#00E701]/30 flex items-center justify-center text-[#00E701]">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Crash Trend Statistics</h2>
              <p className="text-xs text-white/60">Analysis over the last {total} rounds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-[#192230] rounded-xl border border-white/10 flex flex-col gap-1 shadow-sm">
            <span className="text-[11px] text-white/60 uppercase font-bold flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#FFB800]" /> Highest Multiplier
            </span>
            <span className="text-xl font-mono font-black text-[#FFB800]">{maxMultiplier.toFixed(2)}×</span>
          </div>

          <div className="p-3 bg-[#192230] rounded-xl border border-white/10 flex flex-col gap-1 shadow-sm">
            <span className="text-[11px] text-white/60 uppercase font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#00E701]" /> Median Multiplier
            </span>
            <span className="text-xl font-mono font-black text-[#00E701]">{medianMultiplier.toFixed(2)}×</span>
          </div>
        </div>

        {/* Distribution Bars */}
        <div className="flex flex-col gap-3 py-2">
          <span className="text-xs font-bold uppercase tracking-wider text-white/70">Multiplier Distribution</span>

          {/* Under 2x */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-white/70">&lt; 2.00× (Low Risk)</span>
              <span className="font-mono text-white/90">{under2} ({under2Pct}%)</span>
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#FF4757] rounded-full" style={{ width: `${under2Pct}%` }} />
            </div>
          </div>

          {/* 2x to 10x */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[#00E701]">2.00× - 9.99× (Target Zone)</span>
              <span className="font-mono text-white/90">{between2and10} ({between2and10Pct}%)</span>
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#00E701] rounded-full" style={{ width: `${between2and10Pct}%` }} />
            </div>
          </div>

          {/* 10x to 100x */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[#FFB800]">10.00× - 99.99× (Moonshot)</span>
              <span className="font-mono text-white/90">{over10} ({over10Pct}%)</span>
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#FFB800] rounded-full" style={{ width: `${over10Pct}%` }} />
            </div>
          </div>

          {/* 100x+ */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[#A855F7]">100.00×+ (Jackpot)</span>
              <span className="font-mono text-white/90">{over100} ({over100Pct}%)</span>
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#A855F7] rounded-full" style={{ width: `${over100Pct}%` }} />
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#2E394E] hover:bg-[#3B4862] font-bold text-sm text-white transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}
