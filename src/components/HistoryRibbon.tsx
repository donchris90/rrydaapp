import React from 'react';
import type { RoundHistoryItem } from '../types';
import { BarChart3, ShieldCheck } from 'lucide-react';

interface HistoryRibbonProps {
  history: RoundHistoryItem[];
  onSelectRound: (item: RoundHistoryItem) => void;
  onOpenTrends: () => void;
}

export function HistoryRibbon({ history, onSelectRound, onOpenTrends }: HistoryRibbonProps) {
  const getPillStyle = (multiplier: number) => {
    if (multiplier >= 100) {
      return 'bg-[#A855F7]/20 border-[#A855F7] text-[#C084FC] hover:bg-[#A855F7]/30 shadow-[0_0_12px_rgba(168,85,247,0.35)]';
    }
    if (multiplier >= 10) {
      return 'bg-[#FFB800]/20 border-[#FFB800] text-[#FCD34D] hover:bg-[#FFB800]/30 shadow-[0_0_10px_rgba(255,184,0,0.3)]';
    }
    if (multiplier >= 2) {
      return 'bg-[#00E701]/15 border-[#00E701]/60 text-[#4ADE80] hover:bg-[#00E701]/25';
    }
    return 'bg-[#24272C] border-white/10 text-white/70 hover:bg-white/10';
  };

  return (
    <div className="w-full flex items-center justify-between gap-2 p-2 bg-[#1E2024] rounded-xl border border-white/10">
      {/* Scrollable Ribbon */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth flex-1 py-0.5">
        {history.slice(0, 18).map((item) => (
          <button
            key={item.id}
            id={`history-pill-${item.id}`}
            onClick={() => onSelectRound(item)}
            className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all duration-150 cursor-pointer ${getPillStyle(
              item.crashPoint
            )}`}
            title={`Round #${item.roundNumber} - Click for Provably Fair details`}
          >
            {item.crashPoint.toFixed(2)}×
          </button>
        ))}
      </div>

      {/* Action buttons on the right: Trends and Provably Fair */}
      <div className="flex items-center gap-1 flex-shrink-0 pl-1 border-l border-white/10">
        <button
          id="trends-button"
          onClick={onOpenTrends}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#282B30] hover:bg-[#32363D] border border-white/10 text-xs font-semibold text-white/80 transition-colors cursor-pointer"
          title="Game Trends & Multiplier Analytics"
        >
          <BarChart3 className="w-3.5 h-3.5 text-[#00E701]" />
          <span className="hidden sm:inline">Trends</span>
        </button>
      </div>
    </div>
  );
}
