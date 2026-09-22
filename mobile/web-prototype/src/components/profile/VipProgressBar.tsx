import React from 'react';
import { Crown, Sparkles, ChevronRight, Zap, Shield, Star, Flame } from 'lucide-react';
import { UserProfile } from '../../types/profile';

export interface VipLevelConfig {
  level: number;
  name: string;
  badge: string;
  themeGradient: string;
  barGradient: string;
  glowColor: string;
  textColor: string;
  bgTint: string;
  minExp: number;
  maxExp: number;
  nextTierName: string;
  perkSummary: string;
}

export const VIP_TIER_CONFIGS: Record<number, VipLevelConfig> = {
  0: {
    level: 0,
    name: 'Standard Citizen',
    badge: 'MEMBER',
    themeGradient: 'from-slate-600 to-slate-800',
    barGradient: 'from-purple-500 via-amber-400 to-amber-500',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    textColor: 'text-amber-500 dark:text-amber-400',
    bgTint: 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800',
    minExp: 0,
    maxExp: 1000,
    nextTierName: 'Bronze Knight (VIP 1)',
    perkSummary: 'Active days & live gifting boost your tier progress',
  },
  1: {
    level: 1,
    name: 'Bronze Knight',
    badge: 'VIP 1',
    themeGradient: 'from-amber-700 via-amber-600 to-yellow-600',
    barGradient: 'from-amber-600 via-amber-500 to-yellow-400',
    glowColor: 'rgba(217, 119, 6, 0.3)',
    textColor: 'text-amber-600 dark:text-amber-400',
    bgTint: 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/70 dark:border-amber-900/40',
    minExp: 1000,
    maxExp: 3500,
    nextTierName: 'Silver Baron (VIP 2)',
    perkSummary: 'Bronze badge + Custom chat flair active',
  },
  2: {
    level: 2,
    name: 'Silver Baron',
    badge: 'VIP 2',
    themeGradient: 'from-slate-400 via-slate-300 to-indigo-300',
    barGradient: 'from-indigo-400 via-sky-300 to-indigo-200',
    glowColor: 'rgba(148, 163, 184, 0.35)',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    bgTint: 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200/70 dark:border-indigo-900/40',
    minExp: 3500,
    maxExp: 8000,
    nextTierName: 'Golden Lord (VIP 3)',
    perkSummary: 'Stealth live room browsing + Special gift animation',
  },
  3: {
    level: 3,
    name: 'Golden Lord',
    badge: 'VIP 3',
    themeGradient: 'from-amber-500 via-yellow-400 to-amber-300',
    barGradient: 'from-amber-500 via-yellow-300 to-amber-200',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    textColor: 'text-amber-600 dark:text-amber-300',
    bgTint: 'bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-600/10 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-amber-950/30 border-amber-300/80 dark:border-amber-700/60',
    minExp: 8000,
    maxExp: 18000,
    nextTierName: 'Platinum Duke (VIP 4)',
    perkSummary: 'Phantom Pegasus ride mount + Priority room mic',
  },
  4: {
    level: 4,
    name: 'Platinum Duke',
    badge: 'VIP 4',
    themeGradient: 'from-cyan-500 via-teal-400 to-blue-500',
    barGradient: 'from-cyan-400 via-teal-300 to-blue-400',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    textColor: 'text-cyan-600 dark:text-cyan-300',
    bgTint: 'bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-200/70 dark:border-cyan-900/40',
    minExp: 18000,
    maxExp: 40000,
    nextTierName: 'Diamond Monarch (VIP 5)',
    perkSummary: 'Full-screen banner announcement upon broadcast entry',
  },
  5: {
    level: 5,
    name: 'Diamond Monarch',
    badge: 'VIP 5',
    themeGradient: 'from-fuchsia-600 via-purple-500 to-pink-500',
    barGradient: 'from-fuchsia-500 via-pink-400 to-amber-300',
    glowColor: 'rgba(217, 70, 239, 0.45)',
    textColor: 'text-fuchsia-600 dark:text-fuchsia-300',
    bgTint: 'bg-fuchsia-50/70 dark:bg-fuchsia-950/30 border-fuchsia-200/70 dark:border-fuchsia-900/40',
    minExp: 40000,
    maxExp: 100000,
    nextTierName: 'Max Apex Tier Reached',
    perkSummary: 'Custom 3D Avatar Halo + 24/7 Dedicated Concierge',
  },
};

interface VipProgressBarProps {
  user: UserProfile;
  onOpenVipModal?: () => void;
  className?: string;
}

export const VipProgressBar: React.FC<VipProgressBarProps> = ({
  user,
  onOpenVipModal,
  className = '',
}) => {
  const currentTier = VIP_TIER_CONFIGS[user.vipLevel] || VIP_TIER_CONFIGS[0];
  const isMaxTier = user.vipLevel >= 5;

  // Engagement points calculated from active days (streak), wealth level, and charm level
  // This simulates the live-streaming loyalty algorithm (Retention days * 80 + Wealth * 120 + Charm * 60)
  const baseStreakExp = Math.max(user.checkInStreak || 1, 4) * 115;
  const wealthExp = (user.wealthLevel || 12) * 160;
  const charmExp = (user.charmLevel || 8) * 85;
  const rawEngagementExp = baseStreakExp + wealthExp + charmExp;

  // Calculate percentage within the tier bracket
  const tierMin = currentTier.minExp;
  const tierMax = currentTier.maxExp;
  const clampedExp = Math.max(tierMin, Math.min(rawEngagementExp, tierMax));
  const currentTierProgress = clampedExp - tierMin;
  const tierRange = tierMax - tierMin;
  const progressPercent = isMaxTier
    ? 100
    : Math.min(100, Math.max(12, Math.round((currentTierProgress / tierRange) * 100)));

  const pointsToNext = Math.max(0, tierMax - clampedExp);

  return (
    <div
      id="vip-loyalty-progress-container"
      onClick={onOpenVipModal}
      className={`group relative overflow-hidden rounded-2xl p-2.5 transition-all cursor-pointer border select-none ${currentTier.bgTint} ${className}`}
      title="Click to view VIP privileges & unlock requirements"
    >
      {/* Top Header: Badge, Loyalty Tier, & Engagement Stats */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${currentTier.themeGradient} text-white flex items-center justify-center shadow-xs shrink-0`}
          >
            <Crown className="w-3.5 h-3.5 fill-current" />
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight truncate">
              {currentTier.name}
            </span>
            <span
              className={`text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase tracking-wider bg-slate-950 text-amber-300 shadow-2xs shrink-0`}
            >
              {currentTier.badge}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 text-[10px] font-bold text-slate-500 dark:text-slate-400">
          {isMaxTier ? (
            <span className="text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-0.5">
              <Sparkles className="w-3 h-3" /> Max Tier
            </span>
          ) : (
            <>
              <span className="text-slate-700 dark:text-slate-300 font-extrabold font-mono">
                {progressPercent}%
              </span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-slate-400 group-hover:text-amber-500" />
            </>
          )}
        </div>
      </div>

      {/* Visual Loyalty Progress Bar */}
      <div className="mt-2 relative">
        <div className="h-2 w-full rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden p-[1px] shadow-inner">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${currentTier.barGradient} transition-all duration-700 relative overflow-hidden shadow-xs`}
            style={{ width: `${progressPercent}%` }}
          >
            {/* Shimmer light reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Bottom Subtext: Active days loyalty & points to next tier */}
      <div className="mt-1.5 flex items-center justify-between text-[10px] leading-tight">
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <Flame className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" />
          <span className="truncate">
            <strong className="text-slate-700 dark:text-slate-200">{user.checkInStreak || 4}d</strong> active streak
            <span className="hidden sm:inline"> • Lv.{user.wealthLevel || 12} Spender</span>
          </span>
        </div>

        <div className="text-right font-medium text-slate-500 dark:text-slate-400 shrink-0 pl-2">
          {isMaxTier ? (
            <span className="text-fuchsia-600 dark:text-fuchsia-400 font-bold">Monarch Privileges</span>
          ) : (
            <span>
              <strong className="text-amber-600 dark:text-amber-400 font-bold font-mono">
                {pointsToNext.toLocaleString()}
              </strong>{' '}
              EXP to {currentTier.nextTierName.split(' ')[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
