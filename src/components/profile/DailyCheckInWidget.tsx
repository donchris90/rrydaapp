import React, { useState, useEffect } from 'react';
import {
  Gift,
  Flame,
  Check,
  Sparkles,
  ChevronRight,
  Clock,
  ShieldCheck,
  Crown,
  Zap,
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { formatCoins } from '../../utils/formatters';

interface DailyCheckInWidgetProps {
  onOpenFullModal: () => void;
  onShowToast?: (message: string) => void;
}

export const DailyCheckInWidget: React.FC<DailyCheckInWidgetProps> = ({
  onOpenFullModal,
  onShowToast,
}) => {
  const { dailyRewards, claimDailyReward, user } = useProfile();
  const [animatingClaim, setAnimatingClaim] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 28, seconds: 45 });

  // Today's current reward item
  const currentReward = dailyRewards.find((d) => d.isCurrent);
  const hasUnclaimedToday = Boolean(currentReward && !currentReward.isClaimed);

  // Countdown timer simulation for next day's unlock
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClaimToday = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentReward || currentReward.isClaimed) return;

    const day = currentReward.day;
    setAnimatingClaim(day);
    setShowCelebration(true);
    claimDailyReward(day);

    onShowToast?.(
      `🎉 Day ${day} Claimed! +${currentReward.coins} Coins added to wallet. Streak: ${user.checkInStreak + 1} Days!`
    );

    setTimeout(() => {
      setAnimatingClaim(null);
    }, 1800);

    setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
  };

  return (
    <div
      id="daily-checkin-retention-widget"
      className={`relative overflow-hidden rounded-3xl border transition-all duration-300 shadow-sm ${
        hasUnclaimedToday
          ? 'bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-purple-600/10 dark:from-amber-950/40 dark:via-rose-950/30 dark:to-purple-950/30 border-amber-300/80 dark:border-amber-700/60 shadow-amber-500/10 ring-2 ring-amber-400/20'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
      }`}
    >
      {/* Celebration floating particles effect */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-300">
          <div className="text-center space-y-1 animate-bounce">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 text-white shadow-xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="text-lg font-black text-amber-300 drop-shadow-md">
              +{currentReward?.coins || 500} COINS!
            </div>
            <div className="text-xs font-bold text-white drop-shadow">
              🔥 Streak: {user.checkInStreak} Days!
            </div>
          </div>
        </div>
      )}

      {/* Top Bar: Streak & Action Prompt */}
      <div className="p-4 pb-3 flex items-center justify-between border-b border-slate-200/40 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${
              hasUnclaimedToday
                ? 'bg-gradient-to-tr from-amber-500 to-rose-500 text-white animate-pulse'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
            }`}
          >
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                Daily Check-in
              </h3>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                <Flame className="w-3 h-3 fill-current text-rose-500" />
                {user.checkInStreak}d Streak
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {hasUnclaimedToday
                ? `Day ${currentReward?.day} reward is ready to claim!`
                : 'Reward claimed! Streak protected today'}
            </p>
          </div>
        </div>

        <button
          type="button"
          id="open-checkin-calendar-btn"
          onClick={onOpenFullModal}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer"
        >
          <span>Calendar</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 7-Day Visual Progress Track */}
      <div className="p-3.5 pt-3">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {dailyRewards.map((reward) => {
            const isClaimed = reward.isClaimed;
            const isToday = reward.isCurrent;
            const isDay7 = reward.day === 7;

            return (
              <div
                key={reward.day}
                onClick={() => {
                  if (isToday && !isClaimed) {
                    handleClaimToday();
                  } else {
                    onOpenFullModal();
                  }
                }}
                className={`relative rounded-xl p-1.5 text-center flex flex-col items-center justify-between min-h-[64px] transition-all cursor-pointer select-none ${
                  isClaimed
                    ? 'bg-slate-100/90 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 opacity-70'
                    : isToday
                    ? 'bg-gradient-to-b from-amber-100 to-rose-100 dark:from-amber-950/60 dark:to-rose-950/50 border-2 border-amber-400 dark:border-amber-500 shadow-md scale-102 ring-2 ring-amber-400/30 animate-pulse'
                    : isDay7
                    ? 'bg-gradient-to-b from-purple-100/60 to-pink-100/60 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-300 dark:border-purple-800/80'
                    : 'bg-slate-50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Day Header */}
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                  D{reward.day}
                </span>

                {/* Reward icon / amount */}
                <div className="my-0.5">
                  {isClaimed ? (
                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-2xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  ) : isDay7 ? (
                    <div className="flex flex-col items-center">
                      <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      <span className="text-[9px] font-black text-purple-700 dark:text-purple-300">
                        +2K
                      </span>
                    </div>
                  ) : (
                    <span
                      className={`text-[10px] font-black block leading-none ${
                        isToday
                          ? 'text-amber-700 dark:text-amber-300 font-extrabold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      +{reward.coins}
                    </span>
                  )}
                </div>

                {/* Bottom status badge */}
                {isClaimed ? (
                  <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400">
                    Done
                  </span>
                ) : isToday ? (
                  <span className="text-[8px] font-black uppercase tracking-tight px-1 rounded bg-rose-500 text-white shadow-2xs">
                    Claim
                  </span>
                ) : isDay7 ? (
                  <span className="text-[8px] font-bold text-purple-600 dark:text-purple-400">
                    VIP 👑
                  </span>
                ) : (
                  <span className="text-[8px] text-slate-400 font-medium">Locked</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Call to Action Bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-200/40 dark:border-slate-800/60 flex items-center justify-between gap-3">
          {hasUnclaimedToday ? (
            <>
              <div className="flex items-center gap-1.5 text-xs">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                  Reward: <strong className="text-amber-600 dark:text-amber-400">+{currentReward?.coins} Coins</strong>
                  {currentReward?.points ? ` & +${currentReward.points} Diamonds` : ''}
                </span>
              </div>
              <button
                type="button"
                id="claim-daily-btn"
                onClick={handleClaimToday}
                disabled={Boolean(animatingClaim)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 hover:from-amber-400 hover:to-pink-500 shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Claim Now</span>
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Streak Protected</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>
                    Next:{' '}
                    {String(timeLeft.hours).padStart(2, '0')}:
                    {String(timeLeft.minutes).padStart(2, '0')}:
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                id="view-rewards-roadmap-btn"
                onClick={onOpenFullModal}
                className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Milestones
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
