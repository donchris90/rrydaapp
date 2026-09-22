import React, { useState } from 'react';
import type { PlayerBet, RoundStatus } from '../types';
import { Users, User, Trophy, Coins } from 'lucide-react';

interface LiveBetsTableProps {
  status: RoundStatus;
  currentMultiplier: number;
  players: PlayerBet[];
  myBets: PlayerBet[];
}

export function LiveBetsTable({ status, currentMultiplier, players, myBets }: LiveBetsTableProps) {
  const [tab, setTab] = useState<'ALL' | 'MINE'>('ALL');

  const displayList = tab === 'ALL' ? players : myBets;

  const totalWagered = players.reduce((acc, p) => acc + p.amount, 0);
  const totalPaidOut = players
    .filter((p) => p.status === 'CASHED_OUT')
    .reduce((acc, p) => acc + (p.cashedOutProfit || 0), 0);

  return (
    <div className="w-full bg-[#242D3D] rounded-2xl border border-white/10 p-4 flex flex-col gap-3 shadow-xl">
      {/* Table Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <button
            id="tab-all-bets"
            onClick={() => setTab('ALL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === 'ALL'
                ? 'bg-[#333F56] text-[#00E701] border border-white/10'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All Bets ({players.length})</span>
          </button>

          <button
            id="tab-my-bets"
            onClick={() => setTab('MINE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === 'MINE'
                ? 'bg-[#333F56] text-[#00E701] border border-white/10'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>My Bets ({myBets.length})</span>
          </button>
        </div>

        {/* Live Pool Summary */}
        <div className="hidden sm:flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1 text-white/60">
            <span>Pool:</span>
            <span className="text-white font-bold">{totalWagered.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 text-white/60">
            <span>Paid Out:</span>
            <span className="text-[#00E701] font-bold">+{totalPaidOut.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
          </div>
        </div>
      </div>

      {/* Table Headers */}
      <div className="grid grid-cols-12 text-[11px] font-bold uppercase tracking-wider text-white/40 px-2 py-1">
        <div className="col-span-5 sm:col-span-4">Player</div>
        <div className="col-span-3 sm:col-span-2 text-center">Cash Out</div>
        <div className="col-span-2 sm:col-span-3 text-right">Bet</div>
        <div className="col-span-2 sm:col-span-3 text-right">Profit</div>
      </div>

      {/* Rows Container */}
      <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
        {displayList.length === 0 ? (
          <div className="py-8 text-center text-xs text-white/40">
            {tab === 'MINE' ? 'No bets placed by you yet' : 'Waiting for bets...'}
          </div>
        ) : (
          displayList.map((player) => {
            const isCashed = player.status === 'CASHED_OUT';
            const isBust = player.status === 'BUST' || (status === 'CRASHED' && !isCashed);
            const inFlight = status === 'FLYING' && !isCashed && !isBust;

            return (
              <div
                key={player.id}
                className={`grid grid-cols-12 items-center text-xs px-2.5 py-2 rounded-xl transition-all ${
                  player.isUser
                    ? 'bg-[#00E701]/10 border border-[#00E701]/30 font-bold'
                    : isCashed
                    ? 'bg-white/[0.03] hover:bg-white/[0.05]'
                    : 'hover:bg-white/[0.02]'
                }`}
              >
                {/* Player Name + Avatar */}
                <div className="col-span-5 sm:col-span-4 flex items-center gap-2 overflow-hidden">
                  <span className="text-base flex-shrink-0">{player.avatar}</span>
                  <span className={`truncate font-medium ${player.isUser ? 'text-[#00E701] font-bold' : 'text-white/90'}`}>
                    {player.username}
                  </span>
                  {player.isUser && (
                    <span className="text-[10px] px-1 py-0.2 rounded bg-[#00E701] text-black font-extrabold">YOU</span>
                  )}
                </div>

                {/* Cash Out Multiplier */}
                <div className="col-span-3 sm:col-span-2 flex justify-center">
                  {isCashed ? (
                    <span className="px-2 py-0.5 rounded-full bg-[#00E701]/20 border border-[#00E701]/40 text-[#00E701] font-mono font-bold text-[11px]">
                      {player.cashedOutMultiplier?.toFixed(2)}×
                    </span>
                  ) : inFlight ? (
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-mono text-[11px] animate-pulse">
                      In Play
                    </span>
                  ) : isBust ? (
                    <span className="text-white/30 text-[11px] font-mono">—</span>
                  ) : (
                    <span className="text-white/30 text-[11px] font-mono">Ready</span>
                  )}
                </div>

                {/* Bet Amount */}
                <div className="col-span-2 sm:col-span-3 text-right font-mono text-white/80 font-medium">
                  {player.amount.toFixed(2)}
                </div>

                {/* Profit */}
                <div className="col-span-2 sm:col-span-3 text-right font-mono font-bold">
                  {isCashed ? (
                    <span className="text-[#00E701]">
                      +{player.cashedOutProfit?.toFixed(2)}
                    </span>
                  ) : isBust ? (
                    <span className="text-[#FF4757]">
                      -{player.amount.toFixed(2)}
                    </span>
                  ) : inFlight ? (
                    <span className="text-white/40">
                      ~{(player.amount * currentMultiplier).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-white/30">—</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
