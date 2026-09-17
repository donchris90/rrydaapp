import React, { useState } from 'react';
import { X, Coins, Sparkles, CheckCircle2 } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { formatCoins } from '../../utils/formatters';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COIN_PACKAGES = [
  { coins: 7000, price: '$0.99', bonus: 0, tag: 'Starter' },
  { coins: 36000, price: '$4.99', bonus: 1500, tag: 'Popular' },
  { coins: 75000, price: '$9.99', bonus: 4000, tag: 'Best Value' },
  { coins: 160000, price: '$19.99', bonus: 12000, tag: 'Top Spender' },
  { coins: 420000, price: '$49.99', bonus: 35000, tag: 'VIP Tier' },
  { coins: 900000, price: '$99.99', bonus: 90000, tag: 'Whale Deal' },
];

export const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose }) => {
  const { wallet, addCoins } = useProfile();
  const [selectedIdx, setSelectedIdx] = useState(1);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchase = () => {
    const pkg = COIN_PACKAGES[selectedIdx];
    const totalAdded = pkg.coins + pkg.bonus;
    addCoins(totalAdded);
    setSuccessNotice(`Successfully purchased +${formatCoins(totalAdded)} coins!`);
    setTimeout(() => {
      setSuccessNotice(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950">
              <Coins className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Coin Store</h2>
              <span className="text-xs text-slate-500">Current balance: {formatCoins(wallet.coins)}</span>
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
        <div className="p-5 overflow-y-auto space-y-4">
          {successNotice ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">{successNotice}</h3>
              <p className="text-xs text-slate-500 mt-1">Your wallet balance updated instantly.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {COIN_PACKAGES.map((pkg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedIdx(idx)}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all ${
                      selectedIdx === idx
                        ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 ring-2 ring-amber-400/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    {pkg.tag && (
                      <span className="absolute -top-2.5 right-2 px-1.5 py-0.2 rounded-md text-[9px] font-black bg-amber-500 text-slate-950 shadow-xs">
                        {pkg.tag}
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <Coins className="w-4 h-4 fill-current" />
                      <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                        {formatCoins(pkg.coins)}
                      </span>
                    </div>

                    {pkg.bonus > 0 && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 mt-1">
                        <Sparkles className="w-3 h-3 text-amber-500" /> +{formatCoins(pkg.bonus)} Bonus
                      </div>
                    )}

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                      {pkg.price}
                    </div>
                  </button>
                ))}
              </div>

              {/* Purchase button */}
              <button
                type="button"
                onClick={handlePurchase}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm hover:brightness-105 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2"
              >
                Top Up {COIN_PACKAGES[selectedIdx].price} (Simulate Payment)
              </button>

              <p className="text-[11px] text-center text-slate-400">
                Supports Paystack, Apple IAP, Google Play & Local Resellers.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
