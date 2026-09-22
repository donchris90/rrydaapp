import React, { useState, useMemo } from 'react';
import type { PlayerBet, RoundStatus } from '../types';
import { Trophy, Crown, Medal, TrendingUp, ChevronDown, ChevronUp, Sparkles, User, X } from 'lucide-react';

interface RoundLeaderboardProps {
  players: PlayerBet[];
  status: RoundStatus;
  currentMultiplier: number;
  roundNumber?: number;
  onDismiss?: () => void;
}

interface RankedPlayer {
  player: PlayerBet;
  profit: number;
  isLive: boolean;
  multiplier: number;
}

export function RoundLeaderboard({
  players,
  status,
  currentMultiplier,
  roundNumber,
  onDismiss,
}: RoundLeaderboardProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // Calculate profit and rank top 3 players for the current round
  const topThree: RankedPlayer[] = useMemo(() => {
    if (!players || players.length === 0) return [];

    const computed: RankedPlayer[] = players.map((player) => {
      let profit = 0;
      let isLive = false;
      let multiplier = 1.0;

      if (player.status === 'CASHED_OUT') {
        multiplier = player.cashedOutMultiplier ?? 1.0;
        profit = player.cashedOutProfit ?? Number((player.amount * multiplier - player.amount).toFixed(2));
      } else if (player.status === 'IN_PLAY' && status === 'FLYING') {
        isLive = true;
        multiplier = currentMultiplier;
        profit = Number((player.amount * currentMultiplier - player.amount).toFixed(2));
      } else if (player.status === 'BUST' || (player.status === 'IN_PLAY' && status === 'CRASHED')) {
        profit = -player.amount;
        multiplier = 0;
      } else {
        // COUNTDOWN or waiting: potential profit based on autoCashOut or 2x
        multiplier = player.autoCashOut ?? 2.0;
        profit = 0;
      }

      return {
        player,
        profit,
        isLive,
        multiplier,
      };
    });

    // Sort by profit descending; if profits are equal, sort by bet amount descending
    computed.sort((a, b) => {
      if (b.profit !== a.profit) {
        return b.profit - a.profit;
      }
      return b.player.amount - a.player.amount;
    });

    return computed.slice(0, 3);
  }, [players, status, currentMultiplier]);

  if (!isVisible) return null;

  // Podium styling configurations
  const rankStyles = [
    {
      badge: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black',
      border: 'border-yellow-500/30 bg-yellow-500/5',
      icon: <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400/30" />,
      tag: '#1',
      title: 'Top Earner',
    },
    {
      badge: 'bg-gradient-to-r from-slate-300 to-slate-100 text-slate-900 font-bold',
      border: 'border-slate-300/20 bg-slate-300/5',
      icon: <Medal className="w-4 h-4 text-slate-300" />,
      tag: '#2',
      title: 'Runner Up',
    },
    {
      badge: 'bg-gradient-to-r from-amber-700 to-amber-600 text-amber-100 font-bold',
      border: 'border-amber-700/20 bg-amber-700/5',
      icon: <Medal className="w-4 h-4 text-amber-600" />,
      tag: '#3',
      title: '3rd Place',
    },
  ];

  const totalRoundProfit = topThree.reduce(
    (sum, item) => sum + (item.profit > 0 ? item.profit : 0),
    0
  );

  return (
    <div
      id="temporary-round-leaderboard"
      className="w-full bg-[#242D3D] rounded-2xl border border-white/10 p-3.5 sm:p-4 flex flex-col gap-3 shadow-xl transition-all"
    >
      {/* Header with Title, Round Info & Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border border-yellow-500/30 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Round Leaderboard
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                Top 3
              </span>
            </div>
            {roundNumber && (
              <span className="text-[10px] text-white/50 font-mono">
                Round #{roundNumber} • Total Pool: ${totalRoundProfit.toFixed(2)} won
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Status Indicator Pill */}
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
              status === 'FLYING'
                ? 'bg-[#00E701]/15 text-[#00E701] border border-[#00E701]/30 animate-pulse'
                : status === 'CRASHED'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
            }`}
          >
            {status === 'FLYING' && <Sparkles className="w-2.5 h-2.5" />}
            {status === 'FLYING' ? `${currentMultiplier.toFixed(2)}x Live` : status}
          </span>

          {/* Minimize / Expand Button */}
          <button
            id="toggle-leaderboard-collapse"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Leaderboard' : 'Collapse Leaderboard'}
            aria-label="Toggle leaderboard collapse"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {/* Dismiss Button */}
          <button
            id="dismiss-round-leaderboard"
            onClick={() => {
              setIsVisible(false);
              if (onDismiss) onDismiss();
            }}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Dismiss temporary leaderboard"
            aria-label="Dismiss leaderboard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Leaderboard Body */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {topThree.length === 0 ? (
            <div className="col-span-3 py-6 text-center text-xs text-white/50 font-mono">
              Waiting for players to place bets this round...
            </div>
          ) : (
            topThree.map((item, idx) => {
              const rank = rankStyles[idx] || rankStyles[2];
              const isProfitPositive = item.profit > 0;
              const hasCashedOut = item.player.status === 'CASHED_OUT';

              return (
                <div
                  key={item.player.id || idx}
                  id={`round-leader-rank-${idx + 1}`}
                  className={`relative p-3 rounded-xl border ${rank.border} flex flex-col justify-between gap-2 overflow-hidden transition-all hover:border-white/20`}
                >
                  {/* Top Bar: Rank Tag & Cashout/Status Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${rank.badge}`}>
                        {rank.tag}
                      </span>
                      <span className="text-[11px] font-bold text-white/80">{rank.title}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {rank.icon}
                      {hasCashedOut ? (
                        <span className="text-[10px] font-mono font-bold text-[#00E701] bg-[#00E701]/10 px-1.5 py-0.5 rounded border border-[#00E701]/20">
                          @{item.multiplier.toFixed(2)}x
                        </span>
                      ) : item.isLive ? (
                        <span className="text-[10px] font-mono font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20 animate-pulse">
                          Live
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-white/40">In Play</span>
                      )}
                    </div>
                  </div>

                  {/* Player Info */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl select-none" role="img" aria-label="avatar">
                      {item.player.avatar || '🎲'}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-xs font-bold truncate ${
                            item.player.isUser ? 'text-[#00E701]' : 'text-white'
                          }`}
                        >
                          {item.player.username}
                        </span>
                        {item.player.isUser && (
                          <span className="text-[9px] px-1 rounded bg-[#00E701]/20 text-[#00E701] font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-white/50 font-mono">
                        Bet: ${item.player.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Profit Calculation */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-white/50 font-medium">Profit:</span>
                    <span
                      className={`text-xs font-mono font-black ${
                        isProfitPositive
                          ? 'text-[#00E701]'
                          : item.profit < 0
                          ? 'text-rose-400'
                          : 'text-white/60'
                      }`}
                    >
                      {isProfitPositive
                        ? `+$${item.profit.toFixed(2)}`
                        : item.profit < 0
                        ? `-$${Math.abs(item.profit).toFixed(2)}`
                        : '$0.00'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
