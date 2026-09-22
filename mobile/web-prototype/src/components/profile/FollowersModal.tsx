import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  UserPlus,
  UserCheck,
  Users,
  Radio,
  Sparkles,
  Crown,
  Heart,
  MessageCircle,
  Flame,
  Check,
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { FollowerUser } from '../../types/profile';
import {
  countryCodeToFlag,
  formatCompactNumber,
  getWealthLevelGradient,
  getCharmLevelGradient,
} from '../../utils/formatters';

const INITIAL_FOLLOWERS: FollowerUser[] = [
  {
    id: 'flw_1',
    displayName: 'Maya Chen 🌸',
    shortId: 'RY89124',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    bio: 'Singer & acoustic guitarist 🎸 Stream daily 8PM SGT',
    countryCode: 'SG',
    vipLevel: 4,
    wealthLevel: 28,
    charmLevel: 22,
    isFollowing: false,
    isLive: true,
    onlineStatus: 'online',
    followedTime: '12m ago',
    isSuperFan: true,
    fansCount: 42300,
  },
  {
    id: 'flw_2',
    displayName: 'Tariq Al-Mansoor 👑',
    shortId: 'RY55201',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    bio: 'Tech enthusiast & Dragon gift collector 🐉✨',
    countryCode: 'AE',
    vipLevel: 5,
    wealthLevel: 52,
    charmLevel: 14,
    isFollowing: false,
    isLive: false,
    onlineStatus: 'online',
    followedTime: '1h ago',
    isSuperFan: true,
    fansCount: 15800,
  },
  {
    id: 'flw_3',
    displayName: 'Sophia Rodriguez 💃',
    shortId: 'RY31089',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    bio: 'Samba dancer & fitness creator | Vamos!',
    countryCode: 'BR',
    vipLevel: 2,
    wealthLevel: 19,
    charmLevel: 31,
    isFollowing: true,
    isLive: true,
    onlineStatus: 'online',
    followedTime: '3h ago',
    fansCount: 89100,
  },
  {
    id: 'flw_4',
    displayName: 'Amara Okafor ✨',
    shortId: 'RY72911',
    avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=200&q=80',
    bio: 'Lagos vibes 🇳🇬 | Afrobeat DJ & lifestyle vlogger',
    countryCode: 'NG',
    vipLevel: 3,
    wealthLevel: 24,
    charmLevel: 18,
    isFollowing: false,
    isLive: false,
    onlineStatus: 'online',
    followedTime: 'Yesterday',
    isSuperFan: true,
    fansCount: 34200,
  },
  {
    id: 'flw_5',
    displayName: 'Kenji Takahashi 🎮',
    shortId: 'RY64832',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    bio: 'Apex Legend pro & nightly retro stream host',
    countryCode: 'JP',
    vipLevel: 1,
    wealthLevel: 12,
    charmLevel: 16,
    isFollowing: true,
    isLive: false,
    onlineStatus: 'offline',
    followedTime: '2d ago',
    fansCount: 19400,
  },
  {
    id: 'flw_6',
    displayName: 'Chloe Dupont 🥐',
    shortId: 'RY18402',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    bio: 'Parisian fashion curator & dessert reviewer',
    countryCode: 'FR',
    vipLevel: 2,
    wealthLevel: 17,
    charmLevel: 15,
    isFollowing: false,
    isLive: false,
    onlineStatus: 'online',
    followedTime: '3d ago',
    fansCount: 8400,
  },
  {
    id: 'flw_7',
    displayName: 'David Miller 🎙️',
    shortId: 'RY93481',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80',
    bio: 'Midnight Talk Radio | Creator interview podcaster',
    countryCode: 'US',
    vipLevel: 3,
    wealthLevel: 35,
    charmLevel: 27,
    isFollowing: true,
    isLive: true,
    onlineStatus: 'online',
    followedTime: '4d ago',
    isSuperFan: true,
    fansCount: 62000,
  },
  {
    id: 'flw_8',
    displayName: 'Aaliyah Khan 💫',
    shortId: 'RY41289',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    bio: 'Makeup artistry & Henna design 💖 Love PK battles!',
    countryCode: 'PK',
    vipLevel: 1,
    wealthLevel: 14,
    charmLevel: 19,
    isFollowing: false,
    isLive: false,
    onlineStatus: 'online',
    followedTime: '5d ago',
    fansCount: 12100,
  },
  {
    id: 'flw_9',
    displayName: 'Lucas Silva ⚡',
    shortId: 'RY81903',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    bio: 'Portuguese Freestyle Beatboxer & Street Performer',
    countryCode: 'PT',
    vipLevel: 2,
    wealthLevel: 21,
    charmLevel: 29,
    isFollowing: true,
    isLive: true,
    onlineStatus: 'online',
    followedTime: '1w ago',
    fansCount: 45700,
  },
  {
    id: 'flw_10',
    displayName: 'Nina Petrova 💎',
    shortId: 'RY29014',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    bio: 'Electronic violin & ambient DJ sets 🎻',
    countryCode: 'EE',
    vipLevel: 4,
    wealthLevel: 38,
    charmLevel: 24,
    isFollowing: false,
    isLive: false,
    onlineStatus: 'offline',
    followedTime: '1w ago',
    isSuperFan: true,
    fansCount: 28900,
  },
];

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (message: string) => void;
}

type TabType = 'all' | 'need_follow' | 'mutual' | 'live';

export const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const { stats, updateStats } = useProfile();
  const [followers, setFollowers] = useState<FollowerUser[]>(INITIAL_FOLLOWERS);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [animatingUserId, setAnimatingUserId] = useState<string | null>(null);

  // Filter followers based on tab and search
  const filteredFollowers = useMemo(() => {
    return followers.filter((user) => {
      // Tab filter
      if (activeTab === 'need_follow' && user.isFollowing) return false;
      if (activeTab === 'mutual' && !user.isFollowing) return false;
      if (activeTab === 'live' && !user.isLive) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = user.displayName.toLowerCase().includes(q);
        const matchesId = user.shortId.toLowerCase().includes(q);
        const matchesBio = (user.bio || '').toLowerCase().includes(q);
        return matchesName || matchesId || matchesBio;
      }

      return true;
    });
  }, [followers, activeTab, searchQuery]);

  // Counts for tabs
  const countNeedFollow = followers.filter((f) => !f.isFollowing).length;
  const countMutual = followers.filter((f) => f.isFollowing).length;
  const countLive = followers.filter((f) => f.isLive).length;

  // Toggle Follow Back state
  const handleToggleFollow = (targetUser: FollowerUser) => {
    const isNowFollowing = !targetUser.isFollowing;
    setAnimatingUserId(targetUser.id);

    setFollowers((prev) =>
      prev.map((u) => (u.id === targetUser.id ? { ...u, isFollowing: isNowFollowing } : u))
    );

    // Update global following count in stats
    const updatedCount = Math.max(
      0,
      stats.followingCount + (isNowFollowing ? 1 : -1)
    );
    updateStats({ followingCount: updatedCount });

    if (isNowFollowing) {
      onShowToast?.(`🤝 Followed back ${targetUser.displayName}! You are now mutual friends.`);
    } else {
      onShowToast?.(`Unfollowed ${targetUser.displayName}`);
    }

    setTimeout(() => {
      setAnimatingUserId(null);
    }, 600);
  };

  // Follow all visible unfollowed users
  const handleFollowAllVisible = () => {
    const unfollowedInView = filteredFollowers.filter((f) => !f.isFollowing);
    if (unfollowedInView.length === 0) return;

    setFollowers((prev) =>
      prev.map((u) =>
        unfollowedInView.some((target) => target.id === u.id)
          ? { ...u, isFollowing: true }
          : u
      )
    );

    const newFollowingCount = stats.followingCount + unfollowedInView.length;
    updateStats({ followingCount: newFollowingCount });

    onShowToast?.(
      `✨ Followed back all ${unfollowedInView.length} creators! Connections established.`
    );
  };

  if (!isOpen) return null;

  return (
    <div
      id="followers-modal-overlay"
      className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 select-none"
    >
      <div
        id="followers-modal-card"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-pink-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                  Followers & Fans
                </h2>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-950/70 dark:text-pink-300">
                  {formatCompactNumber(stats.followersCount)} Fans
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Supporters who follow your broadcast room and daily posts
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-followers-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Close Followers"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Quick Filter Controls */}
        <div className="p-4 pb-2 space-y-3 border-b border-slate-100 dark:border-slate-800">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="search-followers-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, or bio..."
              className="w-full pl-9.5 pr-8 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-pink-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              id="filter-all-followers-btn"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700'
              }`}
            >
              All ({followers.length})
            </button>

            <button
              type="button"
              id="filter-need-follow-btn"
              onClick={() => setActiveTab('need_follow')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'need_follow'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs'
                  : 'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 hover:bg-pink-100/80 dark:hover:bg-pink-900/60'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Follow Back ({countNeedFollow})</span>
            </button>

            <button
              type="button"
              id="filter-mutual-btn"
              onClick={() => setActiveTab('mutual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'mutual'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100/80 dark:hover:bg-purple-900/60'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Mutual ({countMutual})</span>
            </button>

            <button
              type="button"
              id="filter-live-followers-btn"
              onClick={() => setActiveTab('live')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'live'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100/80 dark:hover:bg-rose-900/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
              <span>Live Now ({countLive})</span>
            </button>
          </div>
        </div>

        {/* Quick Bulk Action Bar if viewing 'Need Follow' */}
        {activeTab === 'need_follow' && countNeedFollow > 0 && (
          <div className="px-5 py-2.5 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-rose-500/10 border-b border-pink-200/50 dark:border-pink-900/30 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {countNeedFollow} fans waiting for your follow back
            </span>
            <button
              type="button"
              id="bulk-follow-all-btn"
              onClick={handleFollowAllVisible}
              className="text-[11px] font-black text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Follow All</span>
            </button>
          </div>
        )}

        {/* Followers List Body */}
        <div
          id="followers-list-container"
          className="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100 dark:divide-slate-800/60"
        >
          {filteredFollowers.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No followers found
              </div>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {searchQuery
                  ? `No results matching "${searchQuery}". Try a different term or clear search.`
                  : 'No followers in this category yet.'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filteredFollowers.map((user) => {
              const isAnimating = animatingUserId === user.id;

              return (
                <div
                  key={user.id}
                  id={`follower-item-${user.shortId}`}
                  className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 group"
                >
                  {/* Left: Avatar + Details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Avatar Container with Online/Live Ring */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full p-0.5 transition-all ${
                          user.isLive
                            ? 'bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-500 ring-2 ring-rose-500/30 shadow-md'
                            : user.vipLevel >= 4
                            ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 p-0.5'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      >
                        <img
                          src={user.avatarUrl}
                          alt={user.displayName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full rounded-full object-cover bg-slate-200 dark:bg-slate-800"
                        />
                      </div>

                      {/* Online dot or LIVE badge */}
                      {user.isLive ? (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs flex items-center gap-0.5">
                          <Radio className="w-2 h-2 animate-pulse" />
                          LIVE
                        </span>
                      ) : user.onlineStatus === 'online' ? (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                      ) : null}
                    </div>

                    {/* Name, Bio, Badges */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {user.displayName}
                        </span>

                        {/* Country Flag */}
                        <span className="text-xs" title={user.countryCode}>
                          {countryCodeToFlag(user.countryCode)}
                        </span>

                        {/* Super Fan Badge */}
                        {user.isSuperFan && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                            <Flame className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                            FAN
                          </span>
                        )}

                        {/* VIP Badge */}
                        {user.vipLevel > 0 && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-slate-900 dark:bg-amber-400 text-amber-300 dark:text-slate-950">
                            VIP{user.vipLevel}
                          </span>
                        )}
                      </div>

                      {/* Sub row: Levels & Short ID */}
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 flex-wrap">
                        {/* Wealth Level */}
                        <span
                          className={`px-1 py-0.2 rounded text-[9px] font-bold text-white bg-gradient-to-r ${getWealthLevelGradient(
                            user.wealthLevel
                          )}`}
                        >
                          Lv.{user.wealthLevel}
                        </span>

                        {/* Charm Level */}
                        <span
                          className={`px-1 py-0.2 rounded text-[9px] font-bold text-white bg-gradient-to-r ${getCharmLevelGradient(
                            user.charmLevel
                          )}`}
                        >
                          Charm.{user.charmLevel}
                        </span>

                        <span className="font-mono text-slate-400">ID: {user.shortId}</span>
                        <span>• {user.followedTime}</span>
                      </div>

                      {/* Bio snippet if available */}
                      {user.bio && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-xs">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Actions: Quick Chat & 'Follow Back' button */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      id={`chat-user-${user.shortId}`}
                      onClick={() => onShowToast?.(`Opening direct chat with ${user.displayName}...`)}
                      className="p-2 rounded-xl text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
                      title="Send Message"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>

                    {/* Follow Back Button */}
                    <button
                      type="button"
                      id={`follow-back-btn-${user.shortId}`}
                      onClick={() => handleToggleFollow(user)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer select-none flex items-center gap-1 shadow-xs active:scale-95 ${
                        user.isFollowing
                          ? 'bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-200'
                          : 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white shadow-pink-500/20 hover:shadow-md'
                      } ${isAnimating ? 'scale-105' : ''}`}
                    >
                      {user.isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Friends</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Follow Back</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer with quick stats */}
        <div className="p-3.5 px-5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
            <span>Mutual friends can send unlimited direct messages</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
