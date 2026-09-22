import React from 'react';
import {
  Sparkles,
  Sliders,
  X,
  Volume2,
  Mic,
  MicOff,
  Wifi,
  Shield,
  Gift,
  Trophy,
  Diamond,
  Heart,
  Users,
  Clock,
  Flame,
  Radio,
  Share2,
} from 'lucide-react';
import type { SimBeautySettings, SimGift, SimStreamStats } from '../types';
import { soundEffects } from '../utils/audioEffects';

// ============================================================================
// 1. BEAUTY SHEET MODAL
// ============================================================================
interface BeautyModalProps {
  visible: boolean;
  onClose: () => void;
  settings: SimBeautySettings;
  onChangeSettings: React.Dispatch<React.SetStateAction<SimBeautySettings>>;
}

export function BeautyModal({
  visible,
  onClose,
  settings,
  onChangeSettings,
}: BeautyModalProps) {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center select-none">
      <div className="w-full bg-[#181033] rounded-t-3xl border-t border-white/15 p-4 flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span className="text-white text-sm font-bold">AR Beauty Retouch & Filters</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sliders */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-white/80 font-medium mb-1">
              <span>Smooth Skin</span>
              <span className="text-pink-400 font-bold">{settings.smoothing}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.smoothing}
              onChange={(e) =>
                onChangeSettings((prev) => ({ ...prev, smoothing: Number(e.target.value) }))
              }
              className="w-full accent-pink-500 bg-[#251A4D] h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-white/80 font-medium mb-1">
              <span>Skin Whitening</span>
              <span className="text-pink-400 font-bold">{settings.whitening}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.whitening}
              onChange={(e) =>
                onChangeSettings((prev) => ({ ...prev, whitening: Number(e.target.value) }))
              }
              className="w-full accent-pink-500 bg-[#251A4D] h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-white/80 font-medium mb-1">
              <span>Slim Face</span>
              <span className="text-pink-400 font-bold">{settings.slimFace}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.slimFace}
              onChange={(e) =>
                onChangeSettings((prev) => ({ ...prev, slimFace: Number(e.target.value) }))
              }
              className="w-full accent-pink-500 bg-[#251A4D] h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Preset Color Filters */}
        <div>
          <div className="text-xs text-white/70 font-semibold mb-2">Atmosphere Filters</div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'none', label: 'Natural', color: 'from-gray-500 to-gray-700' },
              { id: 'rosy', label: 'Rosy Peach', color: 'from-pink-500 to-rose-400' },
              { id: 'warm', label: 'Sunset Warm', color: 'from-amber-500 to-orange-600' },
              { id: 'cyber', label: 'Cyber Neon', color: 'from-purple-500 to-cyan-500' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() =>
                  onChangeSettings((prev) => ({
                    ...prev,
                    filterPreset: f.id as any,
                  }))
                }
                className={`py-2 px-1 rounded-xl text-center flex flex-col items-center gap-1.5 border transition ${
                  settings.filterPreset === f.id
                    ? 'border-pink-500 bg-pink-500/20 text-white'
                    : 'border-white/10 bg-[#201542] text-white/60 hover:text-white'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-gradient-to-tr ${f.color} shadow`} />
                <span className="text-[10px] font-semibold">{f.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. LIVE TOOLS MODAL
// ============================================================================
interface ToolsModalProps {
  visible: boolean;
  onClose: () => void;
  isMicMuted: boolean;
  toggleMic: () => void;
  onTriggerSound: (sound: string) => void;
}

export function ToolsModal({
  visible,
  onClose,
  isMicMuted,
  toggleMic,
  onTriggerSound,
}: ToolsModalProps) {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center select-none">
      <div className="w-full bg-[#181033] rounded-t-3xl border-t border-white/15 p-4 flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between">
          <span className="text-white text-sm font-bold">Host Studio Tools</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Toggles */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={toggleMic}
            className={`p-3 rounded-xl border flex items-center gap-2.5 transition ${
              isMicMuted
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : 'bg-[#221747] border-white/10 text-white'
            }`}
          >
            {isMicMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
            <div className="text-left">
              <div className="text-xs font-bold">{isMicMuted ? 'Mic Muted' : 'Mic Active'}</div>
              <div className="text-[10px] text-white/50">Host audio</div>
            </div>
          </button>

          <div className="p-3 rounded-xl border bg-[#221747] border-white/10 text-white flex items-center gap-2.5">
            <Wifi className="w-4 h-4 text-emerald-400" />
            <div className="text-left">
              <div className="text-xs font-bold">1080p 60fps</div>
              <div className="text-[10px] text-emerald-400">Optimal Bitrate</div>
            </div>
          </div>
        </div>

        {/* Studio Soundboard FX */}
        <div>
          <div className="text-xs text-white/70 font-semibold mb-2 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Soundboard FX</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'applause', label: 'Applause', icon: '👏', fn: () => soundEffects.playApplause() },
              { id: 'fanfare', label: 'Fanfare', icon: '🎺', fn: () => soundEffects.playFanfare() },
              { id: 'airhorn', label: 'Airhorn', icon: '📢', fn: () => soundEffects.playAirhorn() },
              { id: 'drumroll', label: 'Drumroll', icon: '🥁', fn: () => soundEffects.playDrumroll() },
            ].map((snd) => (
              <button
                key={snd.id}
                onClick={() => {
                  snd.fn();
                  onTriggerSound(snd.label);
                }}
                className="py-2.5 px-1 bg-[#221747] hover:bg-[#2F2160] active:scale-95 border border-white/10 rounded-xl flex flex-col items-center gap-1 transition"
              >
                <span className="text-xl">{snd.icon}</span>
                <span className="text-[10px] text-white font-semibold">{snd.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. GIFTS MODAL
// ============================================================================
interface GiftsModalProps {
  visible: boolean;
  onClose: () => void;
  onSendGift: (gift: SimGift) => void;
}

const GIFTS_CATALOG: SimGift[] = [
  { id: 'car', name: 'Supercar', icon: '🏎️', cost: 1000, sound: 'airhorn' },
  { id: 'dragon', name: 'Golden Dragon', icon: '🐉', cost: 5000, sound: 'fanfare' },
  { id: 'rocket', name: 'Galaxy Rocket', icon: '🚀', cost: 10000, sound: 'cheer' },
  { id: 'crown', name: 'Royal Crown', icon: '👑', cost: 500, sound: 'drumroll' },
  { id: 'diamond', name: 'Huge Diamond', icon: '💎', cost: 200, sound: 'pop' },
  { id: 'heart', name: 'Love Heart', icon: '💖', cost: 50, sound: 'pop' },
];

export function GiftsModal({ visible, onClose, onSendGift }: GiftsModalProps) {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center select-none">
      <div className="w-full bg-[#181033] rounded-t-3xl border-t border-white/15 p-4 flex flex-col gap-3 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-pink-400" />
            <span className="text-white text-sm font-bold">Send Gift to Streamer</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gift Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {GIFTS_CATALOG.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                onSendGift(g);
              }}
              className="bg-[#221747] hover:bg-gradient-to-b hover:from-pink-600/30 hover:to-purple-700/30 border border-white/10 hover:border-pink-500/50 p-2.5 rounded-2xl flex flex-col items-center gap-1 transition active:scale-95 group shadow-sm"
            >
              <span className="text-3xl group-hover:scale-110 transition">{g.icon}</span>
              <span className="text-xs text-white font-bold">{g.name}</span>
              <span className="text-[10px] text-amber-400 font-semibold">{g.cost} 💎</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. STREAM SUMMARY RECAP MODAL
// ============================================================================
interface StreamSummaryModalWebProps {
  visible: boolean;
  onClose: () => void;
  stats: SimStreamStats;
}

export function StreamSummaryModalWeb({
  visible,
  onClose,
  stats,
}: StreamSummaryModalWebProps) {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xs bg-gradient-to-b from-[#2A1D54] to-[#120B26] rounded-3xl border border-white/20 p-5 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Host Avatar with Trophy */}
        <div className="relative mb-2">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            alt="Host"
            className="w-16 h-16 rounded-full object-cover ring-2 ring-purple-400"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow">
            <Trophy className="w-3.5 h-3.5 text-slate-950" />
          </div>
        </div>

        <h3 className="text-white text-lg font-extrabold">Broadcast Ended</h3>
        <p className="text-[#B0A6D6] text-xs mb-4">Great live show, Host!</p>

        {/* 2x3 Metrics Grid */}
        <div className="w-full grid grid-cols-3 gap-2 mb-4">
          <div className="bg-black/30 rounded-xl p-2 border border-white/5 flex flex-col items-center">
            <Clock className="w-3.5 h-3.5 text-amber-400 mb-1" />
            <span className="text-white text-xs font-black">
              {Math.max(1, Math.floor(stats.durationSeconds / 60))}m
            </span>
            <span className="text-[9px] text-[#9490A6]">Duration</span>
          </div>

          <div className="bg-black/30 rounded-xl p-2 border border-white/5 flex flex-col items-center">
            <Users className="w-3.5 h-3.5 text-cyan-400 mb-1" />
            <span className="text-white text-xs font-black">
              {stats.totalViewers.toLocaleString()}
            </span>
            <span className="text-[9px] text-[#9490A6]">Viewers</span>
          </div>

          <div className="bg-black/30 rounded-xl p-2 border border-white/5 flex flex-col items-center">
            <Flame className="w-3.5 h-3.5 text-pink-500 mb-1" />
            <span className="text-white text-xs font-black">
              {stats.peakViewers.toLocaleString()}
            </span>
            <span className="text-[9px] text-[#9490A6]">Peak</span>
          </div>

          <div className="bg-black/30 rounded-xl p-2 border border-white/5 flex flex-col items-center">
            <Diamond className="w-3.5 h-3.5 text-amber-300 mb-1" />
            <span className="text-white text-xs font-black">
              {stats.diamondsEarned.toLocaleString()}
            </span>
            <span className="text-[9px] text-[#9490A6]">Diamonds</span>
          </div>

          <div className="bg-black/30 rounded-xl p-2 border border-white/5 flex flex-col items-center">
            <Heart className="w-3.5 h-3.5 text-rose-500 mb-1" />
            <span className="text-white text-xs font-black">
              {stats.likesCount > 999
                ? `${(stats.likesCount / 1000).toFixed(1)}k`
                : stats.likesCount}
            </span>
            <span className="text-[9px] text-[#9490A6]">Likes</span>
          </div>

          <div className="bg-black/30 rounded-xl p-2 border border-white/5 flex flex-col items-center">
            <Users className="w-3.5 h-3.5 text-emerald-400 mb-1" />
            <span className="text-white text-xs font-black">+{stats.newFollowers}</span>
            <span className="text-[9px] text-[#9490A6]">Followers</span>
          </div>
        </div>

        {/* Back to Home Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition"
        >
          Return to Studio
        </button>
      </div>
    </div>
  );
}
