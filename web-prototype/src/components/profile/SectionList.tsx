import React from 'react';
import {
  Package,
  TrendingUp,
  ShieldCheck,
  History,
  Ban,
  Flag,
  Headphones,
  FileText,
  ChevronRight,
  LogOut,
  Sparkles,
  Users,
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { formatCompactNumber } from '../../utils/formatters';

interface SectionListProps {
  onOpenBackpack: () => void;
  onOpenFollowers?: () => void;
  onOpenKyc: () => void;
  onOpenHistory: () => void;
  onOpenBlocked: () => void;
  onOpenReport?: () => void;
  onOpenHelp: () => void;
  onOpenRules: () => void;
  onLogout: () => void;
}

interface SectionItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge?: string;
  badgeColor?: string;
  onClick: () => void;
}

interface SectionGroup {
  groupTitle: string;
  items: SectionItem[];
}

export const SectionList: React.FC<SectionListProps> = ({
  onOpenBackpack,
  onOpenFollowers,
  onOpenKyc,
  onOpenHistory,
  onOpenBlocked,
  onOpenReport,
  onOpenHelp,
  onOpenRules,
  onLogout,
}) => {
  const { user, inventory, stats, t } = useProfile();

  const equippedCount = inventory.filter((i) => i.equipped).length;

  const sections: SectionGroup[] = [
    {
      groupTitle: t.personalAssets,
      items: [
        {
          key: 'followers',
          label: 'Fans & Follower List',
          icon: Users,
          color: 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
          badge: `${formatCompactNumber(stats.followersCount)} Fans`,
          badgeColor: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 font-bold',
          onClick: onOpenFollowers || (() => {}),
        },
        {
          key: 'backpack',
          label: t.myBackpack,
          icon: Package,
          color: 'bg-pink-100 text-pink-600 dark:bg-pink-950/60 dark:text-pink-400',
          badge: `${equippedCount} ${t.equipped}`,
          onClick: onOpenBackpack,
        },
        {
          key: 'level',
          label: t.levelPrivileges,
          icon: TrendingUp,
          color: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
          badge: `Lv.${user.wealthLevel} / Lv.${user.charmLevel}`,
          onClick: onOpenHelp,
        },
      ],
    },
    {
      groupTitle: t.safetyVerification,
      items: [
        {
          key: 'auth',
          label: t.realNameAuth,
          icon: ShieldCheck,
          color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
          badge: user.isKycVerified ? t.approved : t.pendingReview,
          badgeColor: user.isKycVerified ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
          onClick: onOpenKyc,
        },
        {
          key: 'history',
          label: t.watchHistory,
          icon: History,
          color: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
          onClick: onOpenHistory,
        },
        {
          key: 'blocked',
          label: t.blockedUsers,
          icon: Ban,
          color: 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
          onClick: onOpenBlocked,
        },
        {
          key: 'report',
          label: 'Report Violation & Safety',
          icon: Flag,
          color: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
          badge: '24/7 Review',
          badgeColor: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40',
          onClick: onOpenReport ? onOpenReport : onOpenRules,
        },
      ],
    },
    {
      groupTitle: t.supportAndTerms,
      items: [
        {
          key: 'help',
          label: t.helpCenter,
          icon: Headphones,
          color: 'bg-teal-100 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400',
          onClick: onOpenHelp,
        },
        {
          key: 'conduct',
          label: t.communityStandards,
          icon: FileText,
          color: 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
          onClick: onOpenRules,
        },
      ],
    },
  ];

  return (
    <div id="profile-sections-container" className="space-y-4">
      {sections.map((section, idx) => (
        <div
          key={idx}
          className="bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden shadow-xs"
        >
          <div className="px-4 pt-3 pb-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            {section.groupTitle}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  id={`section-item-${item.key}`}
                  onClick={item.onClick}
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {item.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          item.badgeColor ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Logout button */}
      <button
        id="profile-logout-btn"
        onClick={onLogout}
        type="button"
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50 font-bold text-sm border border-rose-200/60 dark:border-rose-900/40 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
      >
        <LogOut className="w-4 h-4" /> {t.logout}
      </button>
    </div>
  );
};
