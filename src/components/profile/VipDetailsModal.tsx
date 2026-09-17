import React from 'react';
import { X, Crown, Sparkles, Check, Shield, Star, Zap } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';

interface VipDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VIP_TIERS = [
  { level: 1, name: 'Bronze Knight', coinsReq: '50,000', perk: 'Exclusive Bronze Entry Badge & Custom Chat Color' },
  { level: 2, name: 'Silver Baron', coinsReq: '150,000', perk: 'Stealth Browsing & Special Gift Animation' },
  { level: 3, name: 'Golden Lord', coinsReq: '500,000', perk: 'Phantom Golden Pegasus Ride Mount & Priority Mic' },
  { level: 4, name: 'Platinum Duke', coinsReq: '1,500,000', perk: 'Full Room Banner Announcement on Enter' },
  { level: 5, name: 'Diamond Monarch', coinsReq: '5,000,000', perk: 'Custom 3D Avatar Halo & Dedicated Concierge' },
];

export const VipDetailsModal: React.FC<VipDetailsModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useProfile();

  if (!isOpen) return null;

  const handleToggleVip = (lvl: number) => {
    updateUser({ vipLevel: user.vipLevel === lvl ? 0 : lvl });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-600/20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-950 text-amber-400">
              <Crown className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">VIP Honor Tiers</h2>
              <span className="text-xs text-amber-700 dark:text-amber-400 font-bold">
                Current: {user.vipLevel > 0 ? `VIP ${user.vipLevel}` : 'Standard Member'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3">
          <p className="text-xs text-slate-500">
            Tap a tier below to simulate previewing that VIP status and perks on your profile:
          </p>

          {VIP_TIERS.map((tier) => (
            <div
              key={tier.level}
              onClick={() => handleToggleVip(tier.level)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between ${
                user.vipLevel === tier.level
                  ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-400/40'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl text-xs font-black ${
                  user.vipLevel === tier.level ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  VIP {tier.level}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{tier.name}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{tier.perk}</p>
                  <span className="inline-block text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-1">
                    Req: {tier.coinsReq} Coins spent
                  </span>
                </div>
              </div>

              {user.vipLevel === tier.level && (
                <div className="p-1 rounded-full bg-emerald-500 text-white shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
