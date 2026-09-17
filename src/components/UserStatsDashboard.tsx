import React, { useState, useMemo } from 'react';
import type { UserRoundRecord, RoundResultType, UserDashboardStats } from '../types';
import {
  Trophy,
  Flame,
  Eye,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ShieldAlert,
  Award,
  Crown,
  Zap,
  RotateCcw,
  X,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Dices,
  Rocket,
  Layers,
} from 'lucide-react';
import { audio } from '../utils/audio';

interface UserStatsDashboardProps {
  records: UserRoundRecord[];
  walletBalance: number;
  isOpen: boolean;
  onClose: () => void;
  onClearStats: () => void;
}

export function UserStatsDashboard({
  records,
  walletBalance,
  isOpen,
  onClose,
  onClearStats,
}: UserStatsDashboardProps) {
  const [filterType, setFilterType] = useState<'ALL' | RoundResultType>('ALL');
  const [gameFilter, setGameFilter] = useState<'ALL' | 'CRASH' | 'SUM_DICE'>('ALL');

  // Compute filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchType = filterType === 'ALL' || r.resultType === filterType;
      const matchGame = gameFilter === 'ALL' || r.game === gameFilter;
      return matchType && matchGame;
    });
  }, [records, filterType, gameFilter]);

  // Aggregate Stats
  const stats: UserDashboardStats = useMemo(() => {
    const totalRounds = records.length;
    let wins = 0;
    let losses = 0;
    let notPlayed = 0;
    let totalWon = 0;
    let totalLost = 0;
    let bestMultiplier = 1.0;

    let currentStreakType: 'WIN' | 'LOSS' | 'NONE' = 'NONE';
    let currentStreakCount = 0;

    // Evaluate streak from most recent to oldest
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      if (r.resultType === 'NOT_PLAYED') continue;

      if (currentStreakType === 'NONE') {
        currentStreakType = r.resultType;
        currentStreakCount = 1;
      } else if (currentStreakType === r.resultType) {
        currentStreakCount++;
      } else {
        break;
      }
    }

    records.forEach((r) => {
      if (r.resultType === 'WIN') {
        wins++;
        totalWon += r.profit;
        if (r.multiplier && r.multiplier > bestMultiplier) {
          bestMultiplier = r.multiplier;
        }
      } else if (r.resultType === 'LOSS') {
        losses++;
        totalLost += Math.abs(r.profit);
      } else if (r.resultType === 'NOT_PLAYED') {
        notPlayed++;
      }
    });

    const playedRounds = wins + losses;
    const winRate = playedRounds > 0 ? Number(((wins / playedRounds) * 100).toFixed(1)) : 0;
    const netProfit = Number((totalWon - totalLost).toFixed(2));

    return {
      totalRounds,
      wins,
      losses,
      notPlayed,
      winRate,
      totalWon,
      totalLost,
      netProfit,
      bestMultiplier,
      currentStreak: {
        type: currentStreakType,
        count: currentStreakCount,
      },
    };
  }, [records]);

  // Proportions for the visual distribution bar
  const totalCount = stats.totalRounds || 1;
  const winPercent = Math.round((stats.wins / totalCount) * 100);
  const lossPercent = Math.round((stats.losses / totalCount) * 100);
  const notPlayedPercent = Math.max(0, 100 - winPercent - lossPercent);

  // Average and max multipliers seen when NOT playing
  const skippedStats = useMemo(() => {
    const skipped = records.filter((r) => r.resultType === 'NOT_PLAYED' && r.multiplier);
    if (skipped.length === 0) return { avg: 0, max: 0 };
    const max = Math.max(...skipped.map((s) => s.multiplier || 0));
    const avg = Number(
      (skipped.reduce((acc, s) => acc + (s.multiplier || 0), 0) / skipped.length).toFixed(2)
    );
    return { avg, max };
  }, [records]);

  if (!isOpen) return null;

  return (
    <div
      id="popo-stats-dashboard-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-4xl bg-[#181F2A] border border-white/15 rounded-3xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Poppo Live Style Header Banner */}
        <div className="relative p-4 sm:p-6 bg-gradient-to-r from-[#202938] via-[#2A374D] to-[#1E293B] border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-72 h-20 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* User Profile Capsule (Poppo Live VIP Style) */}
          <div className="flex items-center gap-3 z-10">
            <div className="relative">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                <div className="w-full h-full bg-[#181F2A] rounded-[14px] flex items-center justify-center text-2xl">
                  👑
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-[9px] font-black uppercase tracking-wider shadow-sm">
                VIP 5
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  Poppo Live Player Center
                </h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#00E701] border border-emerald-500/30">
                  LIVE
                </span>
              </div>
              <span className="text-xs text-white/60 font-mono">
                Balance: <strong className="text-amber-400">${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              </span>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-center z-10">
            {/* Clear/Reset Stats */}
            <button
              id="btn-clear-stats"
              onClick={() => {
                audio.playClick();
                if (confirm('Reset your session win/loss/not played statistics?')) {
                  onClearStats();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
              title="Reset session stats"
            >
              <RotateCcw className="w-3.5 h-3.5 text-white/50" />
              <span className="hidden sm:inline">Reset Session</span>
            </button>

            {/* Close Modal Button */}
            <button
              id="btn-close-dashboard"
              onClick={() => {
                audio.playClick();
                onClose();
              }}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dashboard Main Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Top Row: 4 Metric Cards (Win, Loss, Not Played, Net P&L) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: WINS */}
            <div
              id="card-stat-win"
              className="relative p-4 rounded-2xl bg-gradient-to-b from-[#182F24] to-[#16241E] border border-emerald-500/30 shadow-lg flex flex-col justify-between overflow-hidden group hover:border-emerald-500/50 transition-all"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400/90 flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  WON
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  {stats.winRate}% Rate
                </span>
              </div>
              <div className="my-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                  {stats.wins}
                </span>
                <span className="text-xs text-white/50 ml-1">rounds</span>
              </div>
              <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400/80">Profit:</span>
                <span className="font-extrabold text-[#00E701]">
                  +${stats.totalWon.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Card 2: LOSSES */}
            <div
              id="card-stat-loss"
              className="relative p-4 rounded-2xl bg-gradient-to-b from-[#2E1B24] to-[#22161D] border border-rose-500/30 shadow-lg flex flex-col justify-between overflow-hidden group hover:border-rose-500/50 transition-all"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-wider text-rose-400/90 flex items-center gap-1">
                  <Flame className="w-4 h-4 text-rose-400" />
                  LOST
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                  {stats.losses} Rounds
                </span>
              </div>
              <div className="my-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                  {stats.losses}
                </span>
                <span className="text-xs text-white/50 ml-1">busts</span>
              </div>
              <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between text-xs font-mono">
                <span className="text-rose-400/80">Total Lost:</span>
                <span className="font-extrabold text-rose-400">
                  -${stats.totalLost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Card 3: NOT PLAYED (SPECTATED) */}
            <div
              id="card-stat-not-played"
              className="relative p-4 rounded-2xl bg-gradient-to-b from-[#1C2638] to-[#17202F] border border-sky-500/30 shadow-lg flex flex-col justify-between overflow-hidden group hover:border-sky-500/50 transition-all"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-wider text-sky-400/90 flex items-center gap-1">
                  <Eye className="w-4 h-4 text-sky-400" />
                  NOT PLAYED
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                  Spectator
                </span>
              </div>
              <div className="my-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                  {stats.notPlayed}
                </span>
                <span className="text-xs text-white/50 ml-1">skipped</span>
              </div>
              <div className="pt-2 border-t border-sky-500/20 flex items-center justify-between text-xs font-mono">
                <span className="text-sky-400/80">Avg Outcome:</span>
                <span className="font-bold text-sky-300">
                  {skippedStats.avg ? `${skippedStats.avg}x` : '—'}
                </span>
              </div>
            </div>

            {/* Card 4: NET PERFORMANCE */}
            <div
              id="card-stat-net"
              className={`relative p-4 rounded-2xl border shadow-lg flex flex-col justify-between overflow-hidden group transition-all ${
                stats.netProfit >= 0
                  ? 'bg-gradient-to-b from-[#1C2D2B] to-[#152321] border-emerald-400/30 hover:border-emerald-400/50'
                  : 'bg-gradient-to-b from-[#2E1D22] to-[#211519] border-rose-400/30 hover:border-rose-400/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-wider text-white/70 flex items-center gap-1">
                  <Zap className="w-4 h-4 text-amber-400" />
                  NET P&L
                </span>
                {stats.currentStreak.count > 1 && (
                  <span
                    className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full ${
                      stats.currentStreak.type === 'WIN'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {stats.currentStreak.count} {stats.currentStreak.type} STREAK
                  </span>
                )}
              </div>
              <div className="my-2 flex items-baseline">
                <span
                  className={`text-2xl sm:text-3xl font-black font-mono ${
                    stats.netProfit > 0
                      ? 'text-[#00E701]'
                      : stats.netProfit < 0
                      ? 'text-rose-400'
                      : 'text-white'
                  }`}
                >
                  {stats.netProfit >= 0 ? `+$${stats.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `-$${Math.abs(stats.netProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                </span>
              </div>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-white/60">Best Win:</span>
                <span className="font-extrabold text-amber-300">
                  {stats.bestMultiplier > 1 ? `${stats.bestMultiplier.toFixed(2)}x` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Poppo Live Visual Ratio Bar: Won / Lost / Not Played */}
          <div className="p-4 rounded-2xl bg-[#202938] border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white tracking-wide flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                Round Distribution Ratio ({stats.totalRounds} total rounds)
              </span>
              <div className="flex items-center gap-4 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-[#00E701]" />
                  Won: {winPercent}%
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Lost: {lossPercent}%
                </span>
                <span className="flex items-center gap-1 text-sky-400">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  Not Played: {notPlayedPercent}%
                </span>
              </div>
            </div>

            {/* Tripartite Progress Bar */}
            <div className="w-full h-3.5 bg-black/40 rounded-full overflow-hidden flex p-0.5 border border-white/10">
              {stats.wins > 0 && (
                <div
                  style={{ width: `${winPercent}%` }}
                  title={`Won: ${stats.wins} (${winPercent}%)`}
                  className="h-full bg-gradient-to-r from-emerald-500 to-[#00E701] rounded-l-full transition-all duration-500"
                />
              )}
              {stats.losses > 0 && (
                <div
                  style={{ width: `${lossPercent}%` }}
                  title={`Lost: ${stats.losses} (${lossPercent}%)`}
                  className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-500"
                />
              )}
              {stats.notPlayed > 0 && (
                <div
                  style={{ width: `${notPlayedPercent}%` }}
                  title={`Not Played: ${stats.notPlayed} (${notPlayedPercent}%)`}
                  className="h-full bg-gradient-to-r from-sky-600 to-sky-400 rounded-r-full transition-all duration-500"
                />
              )}
            </div>

            {skippedStats.max > 0 && (
              <div className="text-[11px] text-white/50 flex items-center justify-between pt-1">
                <span>
                  💡 <em>Spectator Insight:</em> Highest missed multiplier while not playing:{' '}
                  <strong className="text-yellow-400 font-mono">{skippedStats.max.toFixed(2)}x</strong>
                </span>
              </div>
            )}
          </div>

          {/* Interactive Filtering Tabs & Feed */}
          <div className="flex flex-col gap-3">
            {/* Filter Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              {/* Outcome Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#192230] border border-white/10">
                <button
                  id="tab-filter-all"
                  onClick={() => {
                    audio.playClick();
                    setFilterType('ALL');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterType === 'ALL'
                      ? 'bg-[#2E374A] text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  All ({records.length})
                </button>

                <button
                  id="tab-filter-win"
                  onClick={() => {
                    audio.playClick();
                    setFilterType('WIN');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterType === 'WIN'
                      ? 'bg-emerald-500 text-black shadow-sm font-black'
                      : 'text-emerald-400/80 hover:text-emerald-400'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Won ({stats.wins})</span>
                </button>

                <button
                  id="tab-filter-loss"
                  onClick={() => {
                    audio.playClick();
                    setFilterType('LOSS');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterType === 'LOSS'
                      ? 'bg-rose-500 text-white shadow-sm font-black'
                      : 'text-rose-400/80 hover:text-rose-400'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Lost ({stats.losses})</span>
                </button>

                <button
                  id="tab-filter-not-played"
                  onClick={() => {
                    audio.playClick();
                    setFilterType('NOT_PLAYED');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterType === 'NOT_PLAYED'
                      ? 'bg-sky-500 text-black shadow-sm font-black'
                      : 'text-sky-400/80 hover:text-sky-400'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Not Played ({stats.notPlayed})</span>
                </button>
              </div>

              {/* Game Filter */}
              <div className="flex items-center gap-1">
                <button
                  id="game-filter-all"
                  onClick={() => setGameFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    gameFilter === 'ALL'
                      ? 'bg-white/15 text-white'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  All Games
                </button>
                <button
                  id="game-filter-crash"
                  onClick={() => setGameFilter('CRASH')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    gameFilter === 'CRASH'
                      ? 'bg-emerald-500/20 text-[#00E701] border border-emerald-500/30'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <Rocket className="w-3 h-3" />
                  <span>Crash</span>
                </button>
                <button
                  id="game-filter-dice"
                  onClick={() => setGameFilter('SUM_DICE')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    gameFilter === 'SUM_DICE'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <Dices className="w-3 h-3" />
                  <span>Lucky Dice</span>
                </button>
              </div>
            </div>

            {/* Records List */}
            <div className="space-y-2">
              {filteredRecords.length === 0 ? (
                <div className="p-8 text-center bg-[#192230] rounded-2xl border border-white/5 flex flex-col items-center gap-2">
                  <span className="text-3xl">🎯</span>
                  <span className="text-sm font-bold text-white/70">No matching rounds recorded yet</span>
                  <span className="text-xs text-white/40 max-w-sm">
                    Play a round or observe live rounds to see your real-time Won, Lost, and Not Played history populate here!
                  </span>
                </div>
              ) : (
                filteredRecords.slice(0, 30).map((record) => {
                  const isWin = record.resultType === 'WIN';
                  const isLoss = record.resultType === 'LOSS';
                  const isNotPlayed = record.resultType === 'NOT_PLAYED';

                  return (
                    <div
                      key={record.id}
                      id={`record-${record.id}`}
                      className={`p-3 sm:p-4 rounded-xl border flex items-center justify-between transition-all hover:bg-white/5 ${
                        isWin
                          ? 'bg-[#14231E]/70 border-emerald-500/30'
                          : isLoss
                          ? 'bg-[#25151D]/70 border-rose-500/30'
                          : 'bg-[#18212F]/70 border-sky-500/20'
                      }`}
                    >
                      {/* Left: Badge + Round info */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black ${
                            isWin
                              ? 'bg-emerald-500/20 text-[#00E701] border border-emerald-500/40'
                              : isLoss
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                          }`}
                        >
                          {isWin ? (
                            <ArrowUpRight className="w-5 h-5" />
                          ) : isLoss ? (
                            <ArrowDownRight className="w-5 h-5" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </div>

                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              {record.game === 'CRASH' ? '🚀 Crash' : '🎲 Lucky Dice'}
                            </span>
                            <span className="text-[11px] font-mono text-white/50">
                              #{record.roundNumber}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                                isWin
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : isLoss
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-sky-500/20 text-sky-300'
                              }`}
                            >
                              {isWin ? 'WON' : isLoss ? 'LOST' : 'NOT PLAYED'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] font-mono text-white/60">
                            <span>{record.outcomeDisplay}</span>
                            {record.stake > 0 && (
                              <>
                                <span>•</span>
                                <span>Bet: ${record.stake.toFixed(2)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Profit / Delta */}
                      <div className="flex flex-col items-end">
                        <span
                          className={`text-sm sm:text-base font-black font-mono ${
                            isWin
                              ? 'text-[#00E701]'
                              : isLoss
                              ? 'text-rose-400'
                              : 'text-white/50'
                          }`}
                        >
                          {isWin
                            ? `+$${record.profit.toFixed(2)}`
                            : isLoss
                            ? `-$${Math.abs(record.profit).toFixed(2)}`
                            : '$0.00'}
                        </span>
                        <span className="text-[10px] text-white/40 font-mono flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(record.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="p-4 bg-[#192230] border-t border-white/10 flex items-center justify-between text-xs text-white/60">
          <span className="font-mono">
            Tracking {records.length} session events • Instant live sync
          </span>
          <button
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-[#2E374A] hover:bg-[#3B465E] text-white font-bold transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
