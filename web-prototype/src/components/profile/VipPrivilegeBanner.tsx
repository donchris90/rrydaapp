import React from 'react';
import { Crown, Sparkles, ChevronRight, Shield, Zap } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';

interface VipBannerProps {
  onOpenVipModal: () => void;
}

export const VipPrivilegeBanner: React.FC<VipBannerProps> = ({ onOpenVipModal }) => {
  const { user, t } = useProfile();

  return (
    <div
      id="vip-privilege-banner"
      onClick={onOpenVipModal}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 p-4 shadow-sm text-slate-950 cursor-pointer group hover:shadow-md transition-all active:scale-[0.99]"
    >
      {/* Decorative luxury textures */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-white/30 to-transparent pointer-events-none" />
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/25 blur-xl pointer-events-none" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shadow-md shrink-0">
            <Crown className="w-5 h-5 fill-current" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-slate-950">
                {user.vipLevel > 0 ? `${t.vipLevel} ${user.vipLevel} ${t.vipActive}` : t.vipJoin}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-slate-950 text-amber-300 uppercase tracking-wider">
                {t.vipBadge}
              </span>
            </div>
            <p className="text-[11px] text-slate-900/80 font-medium mt-0.5">
              {t.vipDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-950 font-bold text-xs shrink-0 pl-2">
          <span>{t.details}</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
