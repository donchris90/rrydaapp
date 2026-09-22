import React from 'react';
import { Check, Flame } from 'lucide-react';
import { getTheoreticalMultiplier } from '../../utils/diceFairness';
import { audio } from '../../utils/audio';

interface DiceBoardProps {
  selectedNumbers: Set<number>;
  onToggleNumber: (n: number) => void;
  onApplyCategory: (category: 'S' | 'B' | 'E' | 'O') => void;
  onClear: () => void;
  winningSum: number | null;
  isOpen: boolean;
  poolDistribution: Record<number, number>;
}

const ALL_NUMBERS = Array.from({ length: 28 }, (_, i) => i);
const SMALL_NUMBERS = ALL_NUMBERS.filter((n) => n < 14);
const BIG_NUMBERS = ALL_NUMBERS.filter((n) => n >= 14);
const EVEN_NUMBERS = ALL_NUMBERS.filter((n) => n % 2 === 0);
const ODD_NUMBERS = ALL_NUMBERS.filter((n) => n % 2 !== 0);

export function DiceBoard({
  selectedNumbers,
  onToggleNumber,
  onApplyCategory,
  onClear,
  winningSum,
  isOpen,
  poolDistribution,
}: DiceBoardProps) {
  const isSmallActive =
    selectedNumbers.size === SMALL_NUMBERS.length &&
    SMALL_NUMBERS.every((n) => selectedNumbers.has(n));
  const isBigActive =
    selectedNumbers.size === BIG_NUMBERS.length &&
    BIG_NUMBERS.every((n) => selectedNumbers.has(n));
  const isEvenActive =
    selectedNumbers.size === EVEN_NUMBERS.length &&
    EVEN_NUMBERS.every((n) => selectedNumbers.has(n));
  const isOddActive =
    selectedNumbers.size === ODD_NUMBERS.length &&
    ODD_NUMBERS.every((n) => selectedNumbers.has(n));

  // Find maximum pool on any single number for proportional bar
  const maxPool = Math.max(100, ...Object.values(poolDistribution));

  return (
    <div className="w-full bg-[#242D3D] rounded-2xl border border-white/10 p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
      {/* Category Shortcut Chips Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-3 border-b border-white/10">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Small 0-13 */}
          <button
            id="cat-small"
            disabled={!isOpen}
            onClick={() => {
              audio.playClick();
              onApplyCategory('S');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              isSmallActive
                ? 'bg-gradient-to-r from-[#FFB800] to-[#F59E0B] text-black border-transparent shadow-[0_0_15px_rgba(255,184,0,0.4)]'
                : 'bg-[#2E394E] hover:bg-[#3B4862] text-white/90 border-white/10'
            }`}
          >
            <span>SMALL (0–13)</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-black ${isSmallActive ? 'bg-black/20 text-black' : 'bg-black/30 text-[#00E701]'}`}>
              1.96×
            </span>
          </button>

          {/* Big 14-27 */}
          <button
            id="cat-big"
            disabled={!isOpen}
            onClick={() => {
              audio.playClick();
              onApplyCategory('B');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              isBigActive
                ? 'bg-gradient-to-r from-[#FFB800] to-[#F59E0B] text-black border-transparent shadow-[0_0_15px_rgba(255,184,0,0.4)]'
                : 'bg-[#2E394E] hover:bg-[#3B4862] text-white/90 border-white/10'
            }`}
          >
            <span>BIG (14–27)</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-black ${isBigActive ? 'bg-black/20 text-black' : 'bg-black/30 text-[#00E701]'}`}>
              1.96×
            </span>
          </button>

          {/* Even */}
          <button
            id="cat-even"
            disabled={!isOpen}
            onClick={() => {
              audio.playClick();
              onApplyCategory('E');
            }}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              isEvenActive
                ? 'bg-gradient-to-r from-[#FFB800] to-[#F59E0B] text-black border-transparent shadow-[0_0_15px_rgba(255,184,0,0.4)]'
                : 'bg-[#2E394E] hover:bg-[#3B4862] text-white/90 border-white/10'
            }`}
          >
            <span>EVEN</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-black ${isEvenActive ? 'bg-black/20 text-black' : 'bg-black/30 text-[#00E701]'}`}>
              1.96×
            </span>
          </button>

          {/* Odd */}
          <button
            id="cat-odd"
            disabled={!isOpen}
            onClick={() => {
              audio.playClick();
              onApplyCategory('O');
            }}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              isOddActive
                ? 'bg-gradient-to-r from-[#FFB800] to-[#F59E0B] text-black border-transparent shadow-[0_0_15px_rgba(255,184,0,0.4)]'
                : 'bg-[#2E394E] hover:bg-[#3B4862] text-white/90 border-white/10'
            }`}
          >
            <span>ODD</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-black ${isOddActive ? 'bg-black/20 text-black' : 'bg-black/30 text-[#00E701]'}`}>
              1.96×
            </span>
          </button>
        </div>

        {/* Clear Button & Selection Counter */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {selectedNumbers.size > 0 && (
            <span className="text-xs font-mono font-bold text-[#FFB800]">
              {selectedNumbers.size} Picked
            </span>
          )}
          <button
            id="cat-clear"
            disabled={selectedNumbers.size === 0}
            onClick={() => {
              audio.playClick();
              onClear();
            }}
            className="px-3 py-1.5 rounded-lg bg-[#192230] hover:bg-[#202938] border border-white/10 text-xs font-bold text-white/60 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
          >
            Clear
          </button>
        </div>
      </div>

      {/* 28-Number Betting Grid (0 to 27) */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-2.5">
        {ALL_NUMBERS.map((n) => {
          const isSelected = selectedNumbers.has(n);
          const isWinner = winningSum === n;
          const poolAmount = poolDistribution[n] || 0;
          const poolRatio = Math.min(1, poolAmount / maxPool);
          const mult = getTheoreticalMultiplier(n);

          return (
            <button
              key={n}
              id={`dice-tile-${n}`}
              disabled={!isOpen}
              onClick={() => {
                audio.playChip();
                onToggleNumber(n);
              }}
              className={`group relative flex flex-col items-center justify-between p-2 rounded-xl transition-all duration-200 cursor-pointer overflow-hidden border select-none ${
                isWinner
                  ? 'bg-[#00E701] border-white text-black shadow-[0_0_25px_#00E701] scale-105 z-10 animate-pulse'
                  : isSelected
                  ? 'bg-gradient-to-b from-[#FFB800] to-[#E59800] border-white text-black shadow-[0_0_15px_rgba(255,184,0,0.4)] scale-102 z-10'
                  : 'bg-[#192230] hover:bg-[#202938] border-white/10 text-white hover:border-white/20'
              } ${!isOpen && !isWinner ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {/* Glass reflection highlight on tile */}
              <div className="absolute top-0 inset-x-0 h-2/5 bg-white/10 pointer-events-none rounded-t-xl" />

              {/* Number Digit */}
              <div className="w-full flex items-center justify-between z-10">
                <span className="font-mono font-black text-lg sm:text-xl leading-none">
                  {n}
                </span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 stroke-[3] text-black" />
                )}
                {isWinner && (
                  <Flame className="w-4 h-4 fill-current text-black animate-bounce" />
                )}
              </div>

              {/* Multiplier Tag */}
              <div className="w-full flex items-center justify-between text-[10px] font-mono mt-1 z-10">
                <span
                  className={`font-extrabold ${
                    isWinner || isSelected ? 'text-black/80 font-black' : 'text-[#00E701]'
                  }`}
                >
                  {mult}×
                </span>
                {poolAmount > 0 && (
                  <span
                    className={`font-semibold truncate max-w-[40px] text-right ${
                      isWinner || isSelected ? 'text-black/70' : 'text-white/40'
                    }`}
                  >
                    {poolAmount}
                  </span>
                )}
              </div>

              {/* Heatmap Bar at bottom */}
              <div className="absolute bottom-0 inset-x-0 h-1 bg-black/20">
                <div
                  className={`h-full transition-all duration-300 ${
                    isWinner || isSelected ? 'bg-black' : 'bg-[#FFB800]'
                  }`}
                  style={{ width: `${Math.max(6, poolRatio * 100)}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
