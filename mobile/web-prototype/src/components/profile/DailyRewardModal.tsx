import React, { useState } from 'react';
import {
  X,
  Gift,
  Sparkles,
  Check,
  Flame,
  Crown,
  ShieldCheck,
  Zap,
  Award,
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { formatCoins } from '../../utils/formatters';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimCelebration?: (day: number, coins: number) => void;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
  isOpen,
  onClose,
  onClaimCelebration,
}) => {
  const { dailyRewards, claimDailyReward, user } = useProfile();
  const [justClaimed, setJustClaimed] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentReward = dailyRewards.find((d) => d.isCurrent);

  const handleClaim = (day: number) => {
    const reward = dailyRewards.find((d) => d.day === day);
    claimDailyReward(day);
    setJustClaimed(day);
    onClaimCelebration?.(day, reward?.coins || 500);

    setTimeout(() => {
      setJustClaimed(null);
    }, 2500);
  };

  return (
    <div
      id="daily-reward-modal-overlay"
      className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 select-none"
    >
      <div
        id="daily-reward-modal-card"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100"
      >
        {/* Header with Streak Flame */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-600/15">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-md">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">Daily Check-in</h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-current text-rose-500" />
                  {user.checkInStreak} Days Streak
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Check in daily to build retention streaks and unlock rare rewards!
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-daily-reward-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Close daily reward"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Day 7 Grand Prize Teaser Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/80 via-indigo-900/80 to-purple-900/80 border border-purple-500/40 text-white flex items-center justify-between shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-purple-500/20 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-lg">
                <Crown className="w-6 h-6 fill-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-amber-300">DAY 7 GRAND REWARD</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200">
                    VIP 3D Mount
                  </span>
                </div>
                <div className="text-[11px] text-slate-200 font-medium">
                  +2,000 Coins + 500 Diamonds + Golden Dragon Entry
                </div>
              </div>
            </div>
            <Award className="w-6 h-6 text-amber-400 shrink-0 relative z-10 opacity-80" />
          </div>

          {/* 7-Day Matrix */}
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5">
            {dailyRewards.map((reward) => {
              const isClaimed = reward.isClaimed;
              const isToday = reward.isCurrent;
              const isDay7 = reward.day === 7;

              return (
                <div
                  key={reward.day}
                  className={`p-2.5 rounded-2xl border text-center relative flex flex-col items-center justify-between min-h-[96px] transition-all ${
                    isDay7 ? 'col-span-2' : ''
                  } ${
                    isClaimed
                      ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 opacity-60'
                      : isToday
                      ? 'bg-gradient-to-b from-amber-50 to-rose-50 dark:from-amber-950/40 dark:to-rose-950/30 border-2 border-amber-400 ring-2 ring-amber-400/40 shadow-sm'
                      : isDay7
                      ? 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/30 border border-purple-300 dark:border-purple-800'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full px-0.5">
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">
                      Day {reward.day}
                    </span>
                    {isDay7 && (
                      <span className="text-[9px] font-black text-amber-600 dark:text-amber-400">
                        BIG PRIZE
                      </span>
                    )}
                  </div>

                  <div className="my-1 flex flex-col items-center">
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      +{formatCoins(reward.coins)}
                    </span>
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">
                      Coins
                    </span>
                    {reward.points && (
                      <span className="text-[8px] text-purple-600 dark:text-purple-300 font-medium">
                        +{reward.points} Diam.
                      </span>
                    )}
                  </div>

                  {isClaimed ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : isToday ? (
                    <button
                      type="button"
                      onClick={() => handleClaim(reward.day)}
                      className="w-full py-1 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] font-black hover:brightness-105 transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      Claim
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Locked</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Current reward primary button */}
          {currentReward && !currentReward.isClaimed && (
            <button
              type="button"
              id="claim-current-reward-btn"
              onClick={() => handleClaim(currentReward.day)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 hover:from-amber-400 hover:to-pink-500 text-white font-black text-sm shadow-lg hover:shadow-rose-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                Claim Day {currentReward.day} (+{currentReward.coins} Coins
                {currentReward.points ? ` & +${currentReward.points} Diamonds` : ''})
              </span>
            </button>
          )}

          {justClaimed && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold text-center animate-in zoom-in-95 duration-200 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Bonus coins and streak credited to your profile wallet!</span>
            </div>
          )}

          {/* Retention Perks & Policy Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Retention Streak Rules & Benefits</span>
            </div>
            <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside leading-relaxed">
              <li>
                Checking in daily builds your <strong>Live Broadcaster Streak</strong>.
              </li>
              <li>Streaks give up to <strong>+20% bonus battle EXP</strong> in PK matches.</li>
              <li>Reaching Day 7 unlocks exclusive <strong>3D Entry Effects and Mounts</strong>.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
