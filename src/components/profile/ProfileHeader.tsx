import React, { useState, useRef, useEffect } from 'react';
import {
  Copy,
  Check,
  ShieldCheck,
  Crown,
  Flame,
  Gem,
  Edit3,
  ChevronRight,
  Share2,
  ChevronDown,
  Moon,
  BellOff,
  Circle,
  Flag,
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { countryCodeToFlag, getWealthLevelGradient, getCharmLevelGradient } from '../../utils/formatters';
import { OnlineStatus } from '../../types/profile';
import { VipProgressBar } from './VipProgressBar';

interface ProfileHeaderProps {
  onOpenEdit: () => void;
  onOpenKyc: () => void;
  onOpenReport?: () => void;
  onOpenVip?: () => void;
  onShowToast?: (message: string) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ onOpenEdit, onOpenKyc, onOpenReport, onOpenVip, onShowToast }) => {
  const { user, updateUser, t } = useProfile();
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const handleCopyId = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(user.shortId);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = user.shortId;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      onShowToast?.(`${t.copiedId}: ${user.shortId}`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      onShowToast?.(`${t.copiedId}: ${user.shortId}`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareProfile = async () => {
    const profileUrl = typeof window !== 'undefined'
      ? `${window.location.origin}?profile=${encodeURIComponent(user.shortId)}`
      : `https://rryda.app/u/${user.shortId}`;

    const shareData = {
      title: `${user.displayName} - RrydaApp Live Profile`,
      text: `Connect with ${user.displayName} on RrydaApp! Live streams, PK battles & creator rewards (ID: ${user.shortId})`,
      url: profileUrl,
    };

    // Use Web Share API if supported and allowed
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        setShared(true);
        onShowToast?.('Profile link shared successfully!');
        setTimeout(() => setShared(false), 2000);
        return;
      } catch (err: unknown) {
        // If user cancelled, silently ignore
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        // Fallback to clipboard if share encountered an error
      }
    }

    // Clipboard fallback for environments without Web Share API
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(profileUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = profileUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setShared(true);
      onShowToast?.('Profile link copied to clipboard!');
      setTimeout(() => setShared(false), 2000);
    } catch {
      setShared(true);
      onShowToast?.('Profile link copied to clipboard!');
      setTimeout(() => setShared(false), 2000);
    }
  };

  // Close status menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setStatusMenuOpen(false);
      }
    };
    if (statusMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [statusMenuOpen]);

  const currentStatus: OnlineStatus = user.onlineStatus || 'online';

  const statusOptions: {
    status: OnlineStatus;
    label: string;
    description: string;
    badgeClass: string;
    dotClass: string;
    icon: typeof Circle;
  }[] = [
    {
      status: 'online',
      label: 'Online',
      description: 'Visible to fans & live hosts',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      dotClass: 'bg-emerald-500',
      icon: Circle,
    },
    {
      status: 'offline',
      label: 'Appear Offline',
      description: 'Browse quietly, hide active dot',
      badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
      dotClass: 'bg-slate-400',
      icon: Moon,
    },
    {
      status: 'dnd',
      label: 'Do Not Disturb',
      description: 'Mute alerts & PK duel invites',
      badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      dotClass: 'bg-rose-500',
      icon: BellOff,
    },
  ];

  const activeStatusOption = statusOptions.find((opt) => opt.status === currentStatus) || statusOptions[0];

  const completionPercentage = Math.min(
    100,
    (user.displayName ? 20 : 0) +
      (user.bio ? 20 : 0) +
      (user.avatarUrl ? 20 : 0) +
      (user.isKycVerified ? 20 : 0) +
      (user.phone ? 20 : 0)
  );

  return (
    <div id="profile-header-card" className="relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-md p-5 shadow-sm border border-purple-100/60 dark:bg-slate-900/90 dark:border-purple-900/40 transition-all">
      {/* Subtle decorative background glow */}
      <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-gradient-to-br from-purple-400/15 via-pink-400/15 to-transparent blur-2xl pointer-events-none" />

      <div className="flex items-start gap-4">
        {/* Avatar with dynamic frame, edit trigger, and online status badge */}
        <div className="flex flex-col items-center shrink-0">
          <div className="relative group cursor-pointer" onClick={onOpenEdit}>
            <div className="relative p-1 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 shadow-md">
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                referrerPolicy="no-referrer"
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white dark:border-slate-900"
              />
              {user.vipLevel > 0 && (
                <div className="absolute -top-1 -left-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 p-1 rounded-full shadow-md border-2 border-white dark:border-slate-900">
                  <Crown className="w-3.5 h-3.5 fill-current" />
                </div>
              )}
            </div>

            {/* Status indicator dot on avatar */}
            <span
              id="avatar-online-status-dot"
              className={`absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-xs flex items-center justify-center transition-colors ${
                currentStatus === 'online'
                  ? 'bg-emerald-500'
                  : currentStatus === 'dnd'
                  ? 'bg-rose-500'
                  : 'bg-slate-400'
              }`}
              title={`Status: ${activeStatusOption.label}`}
            >
              {currentStatus === 'dnd' && (
                <span className="w-1.5 h-0.5 bg-white rounded-full block" />
              )}
              {currentStatus === 'offline' && (
                <span className="w-1 h-1 bg-slate-200 rounded-full block" />
              )}
            </span>

            <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Edit3 className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Online Status Toggle Trigger under Avatar */}
          <div className="mt-1.5 relative" ref={statusMenuRef}>
            <button
              id="online-status-toggle-btn"
              type="button"
              onClick={() => setStatusMenuOpen(!statusMenuOpen)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer shadow-2xs hover:opacity-90 ${activeStatusOption.badgeClass}`}
              title="Change online visibility status"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeStatusOption.dotClass}`} />
              <span className="max-w-[70px] truncate">{activeStatusOption.label}</span>
              <ChevronDown className={`w-2.5 h-2.5 transition-transform ${statusMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Status Dropdown Popover */}
            {statusMenuOpen && (
              <div
                id="online-status-dropdown-menu"
                className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-2 py-1 border-b border-slate-100 dark:border-slate-800 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Visibility Status
                </div>
                <div className="space-y-0.5 mt-1">
                  {statusOptions.map((opt) => {
                    const IconComponent = opt.icon;
                    const isSelected = opt.status === currentStatus;
                    return (
                      <button
                        key={opt.status}
                        type="button"
                        onClick={() => {
                          updateUser({ onlineStatus: opt.status });
                          setStatusMenuOpen(false);
                          onShowToast?.(`Visibility set to: ${opt.label}`);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-950 dark:text-purple-200 font-bold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${opt.dotClass} shrink-0`} />
                        <span className="flex-1 text-xs">{opt.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-purple-600 dark:text-purple-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
              {user.displayName}
            </h1>
            
            {/* VIP Tier Badge */}
            {user.vipLevel > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-xs">
                VIP {user.vipLevel}
              </span>
            )}

            {/* Gender & Age Pill */}
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${
              user.gender === 'female' 
                ? 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300' 
                : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
            }`}>
              {user.gender === 'female' ? '♀' : '♂'} {user.age}
            </span>

            {/* Country flag */}
            <span className="text-sm cursor-default" title={user.countryName}>
              {countryCodeToFlag(user.countryCode)}
            </span>
          </div>

          {/* User ID with one-tap copy */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <button
              id="copy-id-btn"
              onClick={handleCopyId}
              type="button"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 font-medium transition-colors group cursor-pointer"
            >
              <span>ID: <strong className="text-slate-800 dark:text-slate-200 tracking-wide font-mono">{user.shortId}</strong></span>
              {copied ? (
                <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold animate-pulse">
                  <Check className="w-3 h-3 mr-0.5" /> {t.copiedId}
                </span>
              ) : (
                <Copy className="w-3 h-3 text-slate-400 group-hover:text-purple-600 transition-colors" />
              )}
            </button>

            {/* KYC Status Badge */}
            <button
              id="kyc-status-badge"
              onClick={onOpenKyc}
              type="button"
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer"
            >
              {user.isKycVerified ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 px-1.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> {t.verified}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 px-1.5 py-0.5 rounded-full">
                  {t.verifyRealName}
                </span>
              )}
            </button>
          </div>

          {/* Level Badges Row (Wealth & Charm) */}
          <div className="flex items-center gap-2 mt-2.5">
            {/* Wealth Level */}
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r ${getWealthLevelGradient(user.wealthLevel)} text-white shadow-xs`}>
              <Gem className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase tracking-wider">{t.wealthLevel}</span>
              <span className="text-[11px] font-black">Lv.{user.wealthLevel}</span>
            </div>

            {/* Charm Level */}
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r ${getCharmLevelGradient(user.charmLevel)} text-white shadow-xs`}>
              <Flame className="w-3 h-3 fill-current" />
              <span className="text-[10px] font-black uppercase tracking-wider">{t.charmLevel}</span>
              <span className="text-[11px] font-black">Lv.{user.charmLevel}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Share Profile & Edit Profile */}
        <div className="flex items-center gap-1.5 shrink-0 self-start">
          <button
            id="share-profile-btn"
            onClick={handleShareProfile}
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 border ${
              shared
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                : 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60'
            }`}
            title="Share Profile with friends via Web Share"
            aria-label="Share Profile"
          >
            {shared ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Shared!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-semibold">Share</span>
              </>
            )}
          </button>

          {onOpenReport && (
            <button
              id="header-report-btn"
              onClick={onOpenReport}
              type="button"
              className="p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60"
              title="Report User for Community Violations"
              aria-label="Report User"
            >
              <Flag className="w-4 h-4" />
            </button>
          )}

          <button
            id="open-edit-profile-btn"
            onClick={onOpenEdit}
            type="button"
            className="p-1.5 rounded-full hover:bg-purple-50 text-slate-400 hover:text-purple-600 dark:hover:bg-slate-800 dark:hover:text-purple-400 transition-colors cursor-pointer"
            title={t.editProfile}
            aria-label={t.editProfile}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bio excerpt */}
      <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
        {user.bio || 'Add a bio to let others discover your interests and stream schedule.'}
      </p>

      {/* VIP Loyalty Tier & Engagement Progress Bar */}
      <div className="mt-3">
        <VipProgressBar user={user} onOpenVipModal={onOpenVip} />
      </div>

      {/* Profile Completion Prompt if < 100 */}
      {completionPercentage < 100 && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 flex-1 mr-3">
            <span className="text-slate-500 dark:text-slate-400 font-medium">{t.profileCompletion}: {completionPercentage}%</span>
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
          <button
            onClick={onOpenEdit}
            className="text-purple-600 dark:text-purple-400 font-bold hover:underline shrink-0 cursor-pointer"
          >
            {t.completeNow}
          </button>
        </div>
      )}
    </div>
  );
};
