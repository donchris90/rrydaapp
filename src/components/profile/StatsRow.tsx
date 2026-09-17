import React from 'react';
import { Swords, Users, UserCheck, Eye } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { formatCompactNumber } from '../../utils/formatters';

interface StatsRowProps {
  onSelectStat?: (statKey: string) => void;
}

export const StatsRow: React.FC<StatsRowProps> = ({ onSelectStat }) => {
  const { stats, t } = useProfile();

  const winRate =
    stats.pkWins + stats.pkLosses > 0
      ? Math.round((stats.pkWins / (stats.pkWins + stats.pkLosses)) * 100)
      : 0;

  const statItems = [
    {
      key: 'pkWins',
      label: t.pkWins,
      value: formatCompactNumber(stats.pkWins),
      subtext: `${winRate}% ${t.pkWinRate}`,
      icon: Swords,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
    {
      key: 'following',
      label: t.following,
      value: formatCompactNumber(stats.followingCount),
      subtext: t.creators,
      icon: UserCheck,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
    },
    {
      key: 'followers',
      label: t.followers,
      value: formatCompactNumber(stats.followersCount),
      subtext: t.globalFans,
      icon: Users,
      color: 'text-pink-600',
      bg: 'bg-pink-50 dark:bg-pink-950/40',
    },
    {
      key: 'visitors',
      label: t.visitors,
      value: formatCompactNumber(stats.visitorsToday),
      subtext: t.today,
      icon: Eye,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
    },
  ];

  return (
    <div id="profile-stats-container" className="grid grid-cols-4 gap-2 py-3 px-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            id={`stat-${item.key}`}
            onClick={() => onSelectStat?.(item.key)}
            className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer text-center"
          >
            <div className="flex items-center gap-1">
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {item.value}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              {item.label}
            </span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
              {item.subtext}
            </span>
          </button>
        );
      })}
    </div>
  );
};
