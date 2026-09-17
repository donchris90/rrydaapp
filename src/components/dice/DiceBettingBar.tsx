import React from 'react';
import { Coins, Plus, Minus } from 'lucide-react';
import { audio } from '../../utils/audio';

interface DiceBettingBarProps {
  stakePerNumber: number;
  onUpdateStake: (amount: number) => void;
  selectedCount: number;
  walletBalance: number;
  isOpen: boolean;
  onPlaceBet: () => void;
  hasPlacedBet: boolean;
}

const CHIP_PRESETS = [50, 100, 250, 500, 1000];

export function DiceBettingBar({
  stakePerNumber,
  onUpdateStake,
  selectedCount,
  walletBalance,
  isOpen,
  onPlaceBet,
  hasPlacedBet,
}: DiceBettingBarProps) {
  const totalStake = selectedCount > 0 ? stakePerNumber * selectedCount : stakePerNumber;
  const canAfford = walletBalance >= totalStake;
  const canPlace = isOpen && selectedCount > 0 && canAfford && totalStake > 0 && !hasPlacedBet;

  const handleHalf = () => {
    audio.playClick();
    onUpdateStake(Math.max(10, Math.floor(stakePerNumber / 2)));
  };

  const handleDouble = () => {
    audio.playClick();
    onUpdateStake(Math.min(walletBalance, stakePerNumber * 2));
  };

  const handleMax = () => {
    audio.playClick();
    const count = Math.max(1, selectedCount);
    onUpdateStake(Math.max(10, Math.floor(walletBalance / count)));
  };

  return (
    <div className="w-full bg-[#242D3D] rounded-2xl border border-white/10 p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Left Column: Stake Input & Steppers (7 cols) */}
        <div className="md:col-span-7 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold text-white/80">
            <span>Stake Per Number</span>
            <div className="flex items-center gap-1.5 text-white/50 text-[11px] font-mono">
              <span>Total Bet:</span>
              <span className="font-bold text-[#FFB800]">
                {totalStake.toLocaleString()} Coins
              </span>
            </div>
          </div>

          <div className="flex items-center rounded-xl bg-[#192230] border border-white/10 p-1 focus-within:border-[#FFB800] transition-colors">
            {/* Minus Button */}
            <button
              id="stake-minus"
              onClick={() => {
                audio.playClick();
                onUpdateStake(Math.max(10, stakePerNumber - 50));
              }}
              className="w-9 h-9 rounded-lg bg-[#2E394E] hover:bg-[#3B4862] flex items-center justify-center text-white cursor-pointer transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>

            {/* Input field */}
            <div className="flex-1 flex items-center px-3">
              <Coins className="w-4 h-4 text-[#FFB800] mr-2 flex-shrink-0" />
              <input
                id="dice-stake-input"
                type="number"
                min="10"
                step="50"
                value={stakePerNumber}
                onChange={(e) => onUpdateStake(Math.max(10, Number(e.target.value)))}
                className="w-full bg-transparent text-white font-mono font-black text-base outline-none"
              />
            </div>

            {/* Plus Button */}
            <button
              id="stake-plus"
              onClick={() => {
                audio.playClick();
                onUpdateStake(stakePerNumber + 50);
              }}
              className="w-9 h-9 rounded-lg bg-[#2E394E] hover:bg-[#3B4862] flex items-center justify-center text-white cursor-pointer transition-colors mr-1"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Quick Actions (1/2, 2x, Max) */}
            <div className="flex items-center gap-1 border-l border-white/10 pl-1">
              <button
                onClick={handleHalf}
                className="px-2 py-1.5 rounded-lg bg-[#2E394E] hover:bg-[#3B4862] text-xs font-bold text-white/90 transition-colors cursor-pointer"
              >
                ½
              </button>
              <button
                onClick={handleDouble}
                className="px-2 py-1.5 rounded-lg bg-[#2E394E] hover:bg-[#3B4862] text-xs font-bold text-white/90 transition-colors cursor-pointer"
              >
                2×
              </button>
              <button
                onClick={handleMax}
                className="px-2 py-1.5 rounded-lg bg-[#2E394E] hover:bg-[#3B4862] text-xs font-bold text-white/90 transition-colors cursor-pointer"
              >
                Max
              </button>
            </div>
          </div>

          {/* Quick Chip Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {CHIP_PRESETS.map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  audio.playChip();
                  onUpdateStake(chip);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer border ${
                  stakePerNumber === chip
                    ? 'bg-[#FFB800]/20 text-[#FFB800] border-[#FFB800]/50'
                    : 'bg-[#192230] hover:bg-[#2E394E] text-white/70 border-white/5'
                }`}
              >
                +{chip}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Prominent Place Bet Button (5 cols) */}
        <div className="md:col-span-5 flex flex-col justify-end">
          <button
            id="btn-place-dice-bet"
            disabled={!canPlace}
            onClick={() => {
              audio.playGrandWin();
              onPlaceBet();
            }}
            className={`w-full py-4 px-6 rounded-xl font-mono font-black text-base sm:text-lg uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg flex flex-col items-center justify-center select-none ${
              hasPlacedBet
                ? 'bg-[#00E701] text-black shadow-[0_0_20px_rgba(0,231,1,0.3)]'
                : canPlace
                ? 'bg-gradient-to-r from-[#FFB800] via-[#FCD34D] to-[#FFB800] hover:brightness-110 text-black shadow-[0_0_20px_rgba(255,184,0,0.35)] scale-[1.01] active:scale-[0.99]'
                : 'bg-[#2E394E] text-white/40 cursor-not-allowed opacity-60'
            }`}
          >
            {hasPlacedBet ? (
              <span className="flex items-center gap-1.5">
                ✓ BET PLACED ({totalStake.toLocaleString()} Coins)
              </span>
            ) : selectedCount === 0 ? (
              <span>PICK NUMBERS FIRST</span>
            ) : !canAfford ? (
              <span>INSUFFICIENT BALANCE</span>
            ) : !isOpen ? (
              <span>ROUND LOCKED</span>
            ) : (
              <>
                <span>BET {totalStake.toLocaleString()} COINS</span>
                <span className="text-[10px] font-normal tracking-normal opacity-80">
                  {selectedCount} number{selectedCount > 1 ? 's' : ''} × {stakePerNumber} coins
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
