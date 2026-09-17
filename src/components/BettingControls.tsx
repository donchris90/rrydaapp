import React, { useState } from 'react';
import type { BetMode, RoundStatus, PlayerBet, AutoConfig } from '../types';
import { Coins, Zap, Shield, Play, Square, TrendingUp, AlertTriangle } from 'lucide-react';
import { audio } from '../utils/audio';

interface BettingControlsProps {
  status: RoundStatus;
  currentMultiplier: number;
  walletBalance: number;
  userBet: PlayerBet | null;
  queuedBet: boolean;
  onPlaceBet: (amount: number, autoCashOut?: number) => void;
  onCancelQueuedBet: () => void;
  onCashOut: () => void;
  autoConfig: AutoConfig;
  onUpdateAutoConfig: (config: Partial<AutoConfig>) => void;
  onToggleAutoRun: () => void;
}

export function BettingControls({
  status,
  currentMultiplier,
  walletBalance,
  userBet,
  queuedBet,
  onPlaceBet,
  onCancelQueuedBet,
  onCashOut,
  autoConfig,
  onUpdateAutoConfig,
  onToggleAutoRun,
}: BettingControlsProps) {
  const [mode, setMode] = useState<BetMode>('MANUAL');
  const [betAmount, setBetAmount] = useState<number>(100);
  const [autoCashOutMultiplier, setAutoCashOutMultiplier] = useState<number>(2.0);
  const [autoCashOutEnabled, setAutoCashOutEnabled] = useState<boolean>(true);

  // Quick Bet Modifiers
  const handleHalf = () => {
    audio.playClick();
    setBetAmount((prev) => Math.max(10, Math.floor(prev / 2)));
  };

  const handleDouble = () => {
    audio.playClick();
    setBetAmount((prev) => Math.min(walletBalance, prev * 2));
  };

  const handleMin = () => {
    audio.playClick();
    setBetAmount(10);
  };

  const handleMax = () => {
    audio.playClick();
    setBetAmount(Math.max(10, Math.floor(walletBalance)));
  };

  const handleSetQuickMultiplier = (m: number) => {
    audio.playClick();
    setAutoCashOutMultiplier(m);
    setAutoCashOutEnabled(true);
  };

  const handleManualBetSubmit = () => {
    audio.playClick();
    if (queuedBet) {
      onCancelQueuedBet();
      return;
    }
    const targetCashout = autoCashOutEnabled && autoCashOutMultiplier > 1.01 ? autoCashOutMultiplier : undefined;
    onPlaceBet(betAmount, targetCashout);
  };

  // Potential win calculation during flight
  const potentialWin = userBet && userBet.status === 'IN_PLAY'
    ? Math.floor(userBet.amount * currentMultiplier * 100) / 100
    : 0;

  return (
    <div className="w-full bg-[#242D3D] rounded-2xl border border-white/10 p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
      {/* Tab Switch: Manual vs Auto (BC.Game signature) */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center p-1 bg-[#192230] rounded-xl border border-white/5">
          <button
            id="tab-manual"
            onClick={() => {
              audio.playClick();
              setMode('MANUAL');
            }}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'MANUAL'
                ? 'bg-[#333F56] text-[#00E701] shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Manual
          </button>
          <button
            id="tab-auto"
            onClick={() => {
              audio.playClick();
              setMode('AUTO');
            }}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'AUTO'
                ? 'bg-[#333F56] text-[#00E701] shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Auto
          </button>
        </div>

        {/* User Balance Chip */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#192230] border border-white/10">
          <Coins className="w-4 h-4 text-[#FFB800]" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Balance</span>
            <span className="text-sm font-mono font-bold text-white">
              {walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {mode === 'MANUAL' ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bet Amount Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-white/80">
                <span>Amount</span>
                <span className="text-white/50 text-[11px]">Min: 10.00</span>
              </div>
              <div className="flex items-center rounded-xl bg-[#192230] border border-white/10 p-1 focus-within:border-[#00E701] transition-colors">
                <div className="px-2.5 flex items-center gap-1 text-[#FFB800] font-bold text-sm">
                  <Coins className="w-4 h-4" />
                </div>
                <input
                  id="bet-amount-input"
                  type="number"
                  min="10"
                  max={walletBalance}
                  step="10"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-transparent text-white font-mono font-bold text-sm sm:text-base outline-none px-1"
                />
                <div className="flex items-center gap-1 pr-1">
                  <button
                    id="btn-half"
                    onClick={handleHalf}
                    className="px-2 py-1 rounded-lg bg-[#2E394E] hover:bg-[#3B4862] text-[11px] font-bold text-white/90 transition-colors cursor-pointer"
                  >
                    ½
                  </button>
                  <button
                    id="btn-double"
                    onClick={handleDouble}
                    className="px-2 py-1 rounded-lg bg-[#2E394E] hover:bg-[#3B4862] text-[11px] font-bold text-white/90 transition-colors cursor-pointer"
                  >
                    2×
                  </button>
                  <button
                    id="btn-max"
                    onClick={handleMax}
                    className="px-2 py-1 rounded-lg bg-[#2E394E] hover:bg-[#3B4862] text-[11px] font-bold text-white/90 transition-colors cursor-pointer"
                  >
                    Max
                  </button>
                </div>
              </div>
            </div>

            {/* Auto Cash Out Multiplier */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-white/80">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoCashOutEnabled}
                    onChange={(e) => setAutoCashOutEnabled(e.target.checked)}
                    className="w-3.5 h-3.5 accent-[#00E701] rounded cursor-pointer"
                  />
                  <span>Auto Cash Out</span>
                </label>
                <span className="text-white/50 text-[11px]">Multiplier</span>
              </div>
              <div
                className={`flex items-center rounded-xl bg-[#192230] border p-1 transition-colors ${
                  autoCashOutEnabled ? 'border-white/10 focus-within:border-[#00E701]' : 'border-white/5 opacity-50'
                }`}
              >
                <input
                  id="auto-cashout-input"
                  type="number"
                  min="1.01"
                  step="0.05"
                  disabled={!autoCashOutEnabled}
                  value={autoCashOutMultiplier}
                  onChange={(e) => setAutoCashOutMultiplier(Math.max(1.01, Number(e.target.value)))}
                  className="w-full bg-transparent text-white font-mono font-bold text-sm sm:text-base outline-none px-3"
                />
                <div className="flex items-center gap-1 pr-1">
                  {[1.5, 2, 5, 10].map((m) => (
                    <button
                      key={m}
                      id={`quick-mult-${m}`}
                      onClick={() => handleSetQuickMultiplier(m)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                        autoCashOutMultiplier === m && autoCashOutEnabled
                          ? 'bg-[#00E701]/20 text-[#00E701] border border-[#00E701]/50'
                          : 'bg-[#2E394E] hover:bg-[#3B4862] text-white/80'
                      }`}
                    >
                      {m}×
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Big Action Button */}
          <div>
            {status === 'FLYING' && userBet && userBet.status === 'IN_PLAY' ? (
              // ACTIVE BET IN FLIGHT: Pulsating high-energy Cash Out Button
              <button
                id="btn-cashout"
                onClick={() => {
                  audio.playClick();
                  onCashOut();
                }}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#FFB800] via-[#00E701] to-[#22D3A5] hover:brightness-110 active:scale-[0.99] text-black font-black text-lg sm:text-xl uppercase tracking-wider flex items-center justify-between shadow-[0_0_30px_rgba(0,231,1,0.45)] transition-all cursor-pointer animate-pulse"
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-6 h-6 fill-black" />
                  CASH OUT
                </span>
                <span className="font-mono text-xl sm:text-2xl font-black">
                  +{potentialWin.toFixed(2)} COINS ({currentMultiplier.toFixed(2)}×)
                </span>
              </button>
            ) : status === 'FLYING' && userBet && userBet.status === 'CASHED_OUT' ? (
              // Already cashed out this round
              <button
                disabled
                className="w-full py-4 px-6 rounded-xl bg-[#00E701]/15 border border-[#00E701]/40 text-[#00E701] font-bold text-base uppercase tracking-wider flex items-center justify-center gap-2"
              >
                ✓ Cashed out at {userBet.cashedOutMultiplier?.toFixed(2)}× (+{userBet.cashedOutProfit?.toFixed(2)})
              </button>
            ) : status === 'FLYING' && !userBet ? (
              // Flying but player didn't bet: Allow queueing for next round
              <button
                id="btn-queue-bet"
                onClick={handleManualBetSubmit}
                className={`w-full py-4 px-6 rounded-xl font-black text-base sm:text-lg uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  queuedBet
                    ? 'bg-[#FF4757]/20 border border-[#FF4757] text-[#FF4757] hover:bg-[#FF4757]/30'
                    : 'bg-[#24272C] hover:bg-[#2F343B] text-white/90 border border-white/10'
                }`}
              >
                {queuedBet ? (
                  <>Cancel Next Round Bet ({betAmount.toFixed(2)})</>
                ) : (
                  <>Bet For Next Round ({betAmount.toFixed(2)} Coins)</>
                )}
              </button>
            ) : (
              // COUNTDOWN or CRASHED state: Normal Bet button
              <button
                id="btn-bet"
                disabled={betAmount > walletBalance || betAmount <= 0}
                onClick={handleManualBetSubmit}
                className={`w-full py-4 px-6 rounded-xl font-black text-lg sm:text-xl uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
                  queuedBet
                    ? 'bg-[#FF4757] hover:bg-[#FF6348] text-white'
                    : betAmount > walletBalance
                    ? 'bg-[#24272C] text-white/30 cursor-not-allowed border border-white/5'
                    : 'bg-[#00E701] hover:bg-[#2ECC71] text-black shadow-[0_0_20px_rgba(0,231,1,0.35)]'
                }`}
              >
                {queuedBet ? (
                  <>Cancel Bet ({betAmount.toFixed(2)})</>
                ) : betAmount > walletBalance ? (
                  <>Insufficient Coins</>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    BET {betAmount.toFixed(2)} COINS
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* AUTO MODE CONSOLE */
        <div className="flex flex-col gap-4 animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Base Bet */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-white/80">Base Bet</span>
              <input
                type="number"
                min="10"
                value={autoConfig.baseBet}
                onChange={(e) => onUpdateAutoConfig({ baseBet: Math.max(10, Number(e.target.value)) })}
                className="w-full bg-[#192230] border border-white/10 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm outline-none focus:border-[#00E701]"
              />
            </div>

            {/* Target Multiplier */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-white/80">Cash Out At</span>
              <input
                type="number"
                min="1.05"
                step="0.1"
                value={autoConfig.autoCashOut}
                onChange={(e) => onUpdateAutoConfig({ autoCashOut: Math.max(1.05, Number(e.target.value)) })}
                className="w-full bg-[#192230] border border-white/10 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm outline-none focus:border-[#00E701]"
              />
            </div>

            {/* Number of bets */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-white/80">Total Rounds</span>
              <input
                type="number"
                min="1"
                value={autoConfig.totalBets}
                onChange={(e) => onUpdateAutoConfig({ totalBets: Math.max(1, Number(e.target.value)), remainingBets: Math.max(1, Number(e.target.value)) })}
                className="w-full bg-[#192230] border border-white/10 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm outline-none focus:border-[#00E701]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#192230] rounded-xl border border-white/10">
            {/* On Win Strategy */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-[#00E701] flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> On Win
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateAutoConfig({ onWinAction: 'RESET' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    autoConfig.onWinAction === 'RESET' ? 'bg-[#00E701]/20 text-[#00E701] border border-[#00E701]' : 'bg-[#2E394E] hover:bg-[#3B4862] text-white/80'
                  }`}
                >
                  Reset
                </button>
                <button
                  onClick={() => onUpdateAutoConfig({ onWinAction: 'INCREASE' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    autoConfig.onWinAction === 'INCREASE' ? 'bg-[#00E701]/20 text-[#00E701] border border-[#00E701]' : 'bg-[#2E394E] hover:bg-[#3B4862] text-white/80'
                  }`}
                >
                  Increase %
                </button>
                {autoConfig.onWinAction === 'INCREASE' && (
                  <input
                    type="number"
                    value={autoConfig.onWinPercent}
                    onChange={(e) => onUpdateAutoConfig({ onWinPercent: Number(e.target.value) })}
                    className="w-16 bg-[#222C3E] border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono"
                  />
                )}
              </div>
            </div>

            {/* On Loss Strategy (e.g. Martingale) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-[#FF4757] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> On Loss
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateAutoConfig({ onLossAction: 'RESET' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    autoConfig.onLossAction === 'RESET' ? 'bg-[#FF4757]/20 text-[#FF4757] border border-[#FF4757]' : 'bg-[#2E394E] hover:bg-[#3B4862] text-white/80'
                  }`}
                >
                  Reset
                </button>
                <button
                  onClick={() => onUpdateAutoConfig({ onLossAction: 'INCREASE' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    autoConfig.onLossAction === 'INCREASE' ? 'bg-[#FF4757]/20 text-[#FF4757] border border-[#FF4757]' : 'bg-[#2E394E] hover:bg-[#3B4862] text-white/80'
                  }`}
                >
                  Increase %
                </button>
                {autoConfig.onLossAction === 'INCREASE' && (
                  <input
                    type="number"
                    value={autoConfig.onLossPercent}
                    onChange={(e) => onUpdateAutoConfig({ onLossPercent: Number(e.target.value) })}
                    className="w-16 bg-[#222C3E] border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Auto Bet Start/Stop Action */}
          <button
            id="btn-auto-toggle"
            onClick={onToggleAutoRun}
            className={`w-full py-4 px-6 rounded-xl font-black text-lg uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
              autoConfig.running
                ? 'bg-[#FF4757] hover:bg-[#FF6348] text-white'
                : 'bg-[#00E701] hover:bg-[#2ECC71] text-black shadow-[0_0_20px_rgba(0,231,1,0.35)]'
            }`}
          >
            {autoConfig.running ? (
              <>
                <Square className="w-5 h-5 fill-current" />
                STOP AUTO BETTING ({autoConfig.remainingBets} left)
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                START AUTO BET
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
