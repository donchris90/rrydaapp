import React from 'react';
import {
  Gift,
  Trophy,
  Gamepad2,
  ShoppingBag,
  Mail,
  Shield,
  Radio,
  Building2,
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';

interface FeatureGridProps {
  onOpenDailyReward: () => void;
  onOpenGames: () => void;
  onOpenStore: () => void;
  onOpenInvite: () => void;
  onOpenRank: () => void;
  onOpenCreatorCenter: () => void;
  onOpenAgency: () => void;
  onOpenGuardian: () => void;
}

export const FeatureGrid: React.FC<FeatureGridProps> = ({
  onOpenDailyReward,
  onOpenGames,
  onOpenStore,
  onOpenInvite,
  onOpenRank,
  onOpenCreatorCenter,
  onOpenAgency,
  onOpenGuardian,
}) => {
  const { dailyRewards, user, t } = useProfile();
  
  // Check if today's reward is available to claim
  const hasClaimableReward = dailyRewards.some((d) => d.isCurrent && !d.isClaimed);

  const features = [
    {
      key: 'reward',
      label: t.reward,
      sublabel: `${user.checkInStreak}d ${t.dayStreak}`,
      icon: Gift,
      color: 'bg-rose-500 text-white',
      badge: hasClaimableReward ? 'Claim' : undefined,
      onClick: onOpenDailyReward,
    },
    {
      key: 'rank',
      label: t.rank,
      sublabel: t.leaderboard,
      icon: Trophy,
      color: 'bg-amber-500 text-white',
      onClick: onOpenRank,
    },
    {
      key: 'games',
      label: t.games,
      sublabel: t.gamesSub,
      icon: Gamepad2,
      color: 'bg-indigo-600 text-white',
      badge: 'Hot',
      onClick: onOpenGames,
    },
    {
      key: 'store',
      label: t.store,
      sublabel: t.mountsAndFrames,
      icon: ShoppingBag,
      color: 'bg-teal-500 text-white',
      onClick: onOpenStore,
    },
    {
      key: 'invite',
      label: t.invite,
      sublabel: t.earnCoins,
      icon: Mail,
      color: 'bg-pink-500 text-white',
      badge: 'Rebate',
      onClick: onOpenInvite,
    },
    {
      key: 'guardian',
      label: t.guardian,
      sublabel: t.fanClub,
      icon: Shield,
      color: 'bg-emerald-500 text-white',
      onClick: onOpenGuardian,
    },
    {
      key: 'creator',
      label: t.streamer,
      sublabel: t.targetAndPay,
      icon: Radio,
      color: 'bg-purple-600 text-white',
      badge: user.isKycVerified ? undefined : 'Verify',
      onClick: onOpenCreatorCenter,
    },
    {
      key: 'agency',
      label: t.agency,
      sublabel: user.agency?.name ?? t.joinAgency,
      icon: Building2,
      color: 'bg-blue-600 text-white',
      onClick: onOpenAgency,
    },
  ];

  return (
    <div
      id="profile-feature-grid"
      className="bg-white/90 dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 shadow-xs"
    >
      <div className="grid grid-cols-4 gap-y-4 gap-x-2">
        {features.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              id={`feature-btn-${item.key}`}
              onClick={item.onClick}
              type="button"
              className="group flex flex-col items-center justify-center p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer relative text-center"
            >
              {/* Badge indicator */}
              {item.badge && (
                <span className="absolute top-0 right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white shadow-xs animate-bounce">
                  {item.badge}
                </span>
              )}

              {/* Icon Container with subtle scale on hover */}
              <div
                className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center shadow-sm group-hover:scale-105 group-active:scale-95 transition-transform`}
              >
                <Icon className="w-6 h-6 stroke-[2.2]" />
              </div>

              {/* Label */}
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {item.label}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate max-w-[70px]">
                {item.sublabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
