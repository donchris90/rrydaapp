import React from 'react';
import { Coins, Diamond, Plus, ArrowUpRight, Sparkles } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { formatCoins } from '../../utils/formatters';

interface WalletCardProps {
  onOpenTopUp: () => void;
  onOpenWithdraw: () => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({ onOpenTopUp, onOpenWithdraw }) => {
  const { wallet, t } = useProfile();

  return (
    <div id="profile-wallet-section" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Coins Card (Top up / Gift / Games) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-yellow-500/10 dark:from-amber-950/40 dark:via-slate-900 dark:to-yellow-950/20 border border-amber-200/60 dark:border-amber-700/30 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-xs">
              <Coins className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t.myCoins}</span>
              <div className="flex items-center gap-1">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-amber-100">
                  {formatCoins(wallet.coins)}
                </span>
              </div>
            </div>
          </div>

          <button
            id="top-up-coins-btn"
            onClick={onOpenTopUp}
            type="button"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-bold hover:brightness-105 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" /> {t.topUp}
          </button>
        </div>

        {wallet.bonusCoins > 0 && (
          <div className="mt-3 flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-300/90 pt-2 border-t border-amber-200/40 dark:border-amber-800/30">
            <span className="inline-flex items-center gap-1 font-medium">
              <Sparkles className="w-3 h-3 text-amber-500" /> +{formatCoins(wallet.bonusCoins)} {t.bonusCoins}
            </span>
            <span className="text-[10px] text-slate-400">{t.usableInStreams}</span>
          </div>
        )}
      </div>

      {/* Creator Earnings / Points Card (Cashout / Withdraw) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500/10 via-rose-400/5 to-purple-500/10 dark:from-pink-950/40 dark:via-slate-900 dark:to-purple-950/20 border border-pink-200/60 dark:border-pink-700/30 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white shadow-xs">
              <Diamond className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t.creatorEarnings}</span>
              <div className="flex items-center gap-1">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-pink-100">
                  {formatCoins(wallet.creatorEarnings)}
                </span>
              </div>
            </div>
          </div>

          <button
            id="withdraw-earnings-btn"
            onClick={onOpenWithdraw}
            type="button"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-600 to-rose-500 text-white text-xs font-bold hover:brightness-105 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            {t.cashOut} <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-pink-700 dark:text-pink-300/90 pt-2 border-t border-pink-200/40 dark:border-pink-800/30">
          <span className="font-semibold">
            ≈ ${wallet.fiatValueEstimate.toFixed(2)} USD
          </span>
          <span className="text-[10px] text-slate-400">{t.rateSubtext}</span>
        </div>
      </div>
    </div>
  );
};
