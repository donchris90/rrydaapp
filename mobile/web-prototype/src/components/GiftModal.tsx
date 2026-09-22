import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, PlusCircle } from 'lucide-react';
import { GIFTS_CATALOG } from '../data';
import { GiftItem } from '../types';

interface GiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCoins: number;
  currentCombo?: number;
  onSendGift: (gift: GiftItem, count: number) => void;
  onRecharge: () => void;
  selectedGift?: GiftItem;
  onSelectGift?: (gift: GiftItem) => void;
}

const COMBO_COUNTS = [1, 10, 66, 99, 520];

export const GiftModal: React.FC<GiftModalProps> = ({
  isOpen,
  onClose,
  userCoins,
  currentCombo = 0,
  onSendGift,
  onRecharge,
  selectedGift: propSelectedGift,
  onSelectGift,
}) => {
  const [activeTab, setActiveTab] = useState<'Popular' | 'PK Buff' | 'Luxury' | 'Effects'>('Popular');
  const [selectedGift, setSelectedGift] = useState<GiftItem>(propSelectedGift || GIFTS_CATALOG[0]);
  const [comboCount, setComboCount] = useState<number>(1);

  // Sync if propSelectedGift updates
  React.useEffect(() => {
    if (propSelectedGift) {
      setSelectedGift(propSelectedGift);
    }
  }, [propSelectedGift]);

  if (!isOpen) return null;

  const filteredGifts = GIFTS_CATALOG.filter((g) => g.category === activeTab);

  const handleSend = () => {
    onSendGift(selectedGift, comboCount);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          id="gift-bottom-sheet"
          className="w-full max-w-md bg-[#130E26]/95 border-t border-white/15 rounded-t-3xl p-4 flex flex-col shadow-2xl"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              {(['Popular', 'PK Buff', 'Luxury', 'Effects'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-[#FF2A6D] to-[#7B4DFF] text-white shadow-md'
                      : 'text-white/60 hover:text-white bg-white/5'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Gift Grid */}
          <div className="grid grid-cols-4 gap-2.5 py-4 max-h-60 overflow-y-auto scrollbar-none">
            {filteredGifts.map((gift) => {
              const isSelected = selectedGift.id === gift.id;
              return (
                <button
                  key={gift.id}
                  onClick={() => {
                    setSelectedGift(gift);
                    onSelectGift?.(gift);
                  }}
                  className={`relative p-2 rounded-xl flex flex-col items-center justify-center transition-all border ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#FF2A6D]/20 to-[#7B4DFF]/20 border-[#FF2A6D] shadow-[0_0_12px_rgba(255,42,109,0.4)] scale-105'
                      : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15'
                  }`}
                >
                  <span className="text-2xl mb-1 filter drop-shadow-sm">{gift.icon}</span>
                  <span className="text-[11px] font-bold text-white truncate max-w-full">
                    {gift.name}
                  </span>
                  <span className="text-[10px] font-extrabold text-amber-400 flex items-center gap-0.5">
                    🪙 {gift.coins.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom Bar: Coins & Send Action */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            {/* Coins Balance */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                🪙 <span>{userCoins.toLocaleString()}</span>
              </span>
              <button
                onClick={onRecharge}
                className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black flex items-center gap-1 hover:bg-amber-500/30"
              >
                <PlusCircle className="w-2.5 h-2.5" />
                <span>Top-up</span>
              </button>
            </div>

            {/* Combo Multiplier & Send */}
            <div className="flex items-center gap-2">
              {/* Combo Pills */}
              <div className="flex items-center bg-black/40 rounded-full p-0.5 border border-white/10">
                {COMBO_COUNTS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setComboCount(c)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-all ${
                      comboCount === c
                        ? 'bg-[#FF2A6D] text-white'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    x{c}
                  </button>
                ))}
              </div>

              {/* Send Button with Combo */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={handleSend}
                id="send-gift-action-btn"
                className="relative px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF2A6D] via-[#FF5722] to-[#FFB800] text-white text-xs font-black tracking-wider uppercase shadow-[0_0_14px_rgba(255,42,109,0.6)] flex items-center gap-1 hover:brightness-110"
              >
                <Sparkles className="w-3 h-3" />
                <span>{currentCombo > 0 ? `Combo x${currentCombo}` : 'Send'}</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
