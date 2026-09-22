import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

export interface ActiveGiftAlert {
  id: string;
  senderName: string;
  senderAvatar: string;
  giftName: string;
  giftIcon: string;
  comboCount: number;
}

interface GiftAnimationOverlayProps {
  giftAlert: ActiveGiftAlert | null;
}

export function GiftAnimationOverlay({ giftAlert }: GiftAnimationOverlayProps) {
  return (
    <div id="gift-animation-layer" className="absolute top-28 left-3 z-40 pointer-events-none">
      <AnimatePresence>
        {giftAlert && (
          <motion.div
            key={giftAlert.id}
            initial={{ opacity: 0, x: -100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 18, stiffness: 220 }}
            className="flex items-center"
          >
            {/* Glossy Pill Container */}
            <div className="relative flex items-center bg-gradient-to-r from-[#FF1493]/90 via-[#7B4DFF]/90 to-purple-900/85 backdrop-blur-md rounded-full py-1.5 pl-1.5 pr-14 border border-white/30 shadow-[0_8px_24px_rgba(255,61,138,0.5)]">
              {/* Sender Avatar */}
              <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-yellow-400 shrink-0">
                <img
                  src={giftAlert.senderAvatar}
                  alt={giftAlert.senderName}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Text Info */}
              <div className="ml-2.5 mr-2">
                <div className="flex items-center gap-1">
                  <span className="text-white text-xs font-bold truncate max-w-[90px]">
                    {giftAlert.senderName}
                  </span>
                  <Sparkles className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                </div>
                <div className="text-[10px] text-yellow-200 font-medium">
                  Sent {giftAlert.giftName}
                </div>
              </div>

              {/* Floating Gift Icon */}
              <div className="absolute -right-3 -top-2 w-14 h-14 flex items-center justify-center filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] animate-bounce">
                <span className="text-3xl">{giftAlert.giftIcon}</span>
              </div>
            </div>

            {/* Combo Multiplier Counter */}
            <motion.div
              initial={{ scale: 0.5, rotate: -15 }}
              animate={{ scale: [1.3, 1], rotate: 0 }}
              className="ml-5 flex items-baseline font-black italic tracking-tighter"
            >
              <span className="text-sm text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">x</span>
              <span className="text-2xl text-transparent bg-clip-text bg-gradient-to-t from-yellow-400 via-pink-400 to-white drop-shadow-[0_4px_8px_rgba(255,20,147,0.8)]">
                {giftAlert.comboCount}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
