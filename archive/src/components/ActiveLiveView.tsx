import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Trophy,
  Diamond,
  X,
  Send,
  Sparkles,
  Swords,
  Music,
  Grid,
  Gift,
  Mic,
  MicOff,
  Power,
  Flame,
  Shield,
  Crown,
  Eye,
  Plus,
} from 'lucide-react';
import type {
  SimChatMessage,
  SimViewer,
  SimBeautySettings,
  SimGift,
} from '../types';
import { soundEffects } from '../utils/audioEffects';

interface ActiveLiveViewProps {
  title: string;
  category: string;
  useWebcam: boolean;
  beautySettings: SimBeautySettings;
  likesCount: number;
  setLikesCount: React.Dispatch<React.SetStateAction<number>>;
  diamondsEarned: number;
  setDiamondsEarned: React.Dispatch<React.SetStateAction<number>>;
  chatMessages: SimChatMessage[];
  onSendMessage: (text: string) => void;
  isMicMuted: boolean;
  toggleMic: () => void;
  isPkActive: boolean;
  setIsPkActive: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenBeauty: () => void;
  onOpenTools: () => void;
  onOpenGifts: () => void;
  onEndStreamRequest: () => void;
}

interface FloatingHeartItem {
  id: number;
  x: number;
  color: string;
  size: number;
}

const HEART_PALETTE = ['#FF2A6D', '#FF5E7E', '#FFB703', '#8338EC', '#3A86FF', '#05FFA1'];
const QUICK_EMOJIS = ['🔥', '❤️', '👏', '🚀', '💎', '🎉'];

export function ActiveLiveView({
  title,
  category,
  useWebcam,
  beautySettings,
  likesCount,
  setLikesCount,
  diamondsEarned,
  setDiamondsEarned,
  chatMessages,
  onSendMessage,
  isMicMuted,
  toggleMic,
  isPkActive,
  setIsPkActive,
  onOpenBeauty,
  onOpenTools,
  onOpenGifts,
  onEndStreamRequest,
}: ActiveLiveViewProps) {
  // Live Duration Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(148);
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Chat Input State
  const [inputText, setInputText] = useState('');
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Floating Hearts Particle System
  const [hearts, setHearts] = useState<FloatingHeartItem[]>([]);
  const nextHeartId = useRef(0);

  const spawnFloatingHeart = (xOffset = 0) => {
    const id = nextHeartId.current++;
    const color = HEART_PALETTE[Math.floor(Math.random() * HEART_PALETTE.length)];
    const size = 20 + Math.floor(Math.random() * 14);
    const x = (Math.random() * 40 - 20) + xOffset;

    setHearts((prev) => [...prev.slice(-20), { id, x, color, size }]);
    setLikesCount((prev) => prev + 1);
    soundEffects.playPop();

    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1800);
  };

  // PK Battle Tug-of-war State
  const [pkHostScore, setPkHostScore] = useState(48200);
  const [pkOpponentScore, setPkOpponentScore] = useState(36400);
  const [pkTimeLeft, setPkTimeLeft] = useState(165);

  useEffect(() => {
    if (!isPkActive) return;
    const interval = setInterval(() => {
      setPkTimeLeft((t) => (t > 0 ? t - 1 : 180));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPkActive]);

  const totalScore = pkHostScore + pkOpponentScore;
  const hostScoreRatio = totalScore === 0 ? 0.5 : Math.max(0.15, Math.min(0.85, pkHostScore / totalScore));

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
    setIsInputExpanded(false);
  };

  const getFilterStyle = () => {
    if (!beautySettings.enabled) return '';
    let filter = '';
    if (beautySettings.smoothing > 0) {
      filter += `blur(${beautySettings.smoothing * 0.008}px) `;
    }
    if (beautySettings.whitening > 0) {
      filter += `brightness(${1 + beautySettings.whitening * 0.002}) contrast(${1 + beautySettings.whitening * 0.001}) `;
    }
    if (beautySettings.filterPreset === 'rosy') {
      filter += `sepia(0.12) saturate(1.2) hue-rotate(-10deg) `;
    } else if (beautySettings.filterPreset === 'warm') {
      filter += `sepia(0.2) saturate(1.15) `;
    } else if (beautySettings.filterPreset === 'cyber') {
      filter += `saturate(1.4) hue-rotate(25deg) `;
    }
    return filter;
  };

  return (
    <div
      id="active-live-container"
      className="relative w-full h-full flex flex-col justify-between select-none overflow-hidden"
      onClick={(e) => {
        // Tap on screen to spawn hearts
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left - rect.width / 2;
        spawnFloatingHeart(clickX * 0.2);
      }}
    >
      {/* Background Video Stream Canvas */}
      <div className="absolute inset-0 z-0 bg-black overflow-hidden pointer-events-none">
        {isPkActive ? (
          /* PK Battle 50/50 Split Screen */
          <div className="w-full h-full flex">
            {/* Host Side (Left) */}
            <div className="relative flex-1 h-full border-r border-[#2575FC]/60 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80"
                alt="Host"
                className="w-full h-full object-cover"
                style={{ filter: getFilterStyle() }}
              />
              <div className="absolute top-28 left-2 bg-[#2575FC] text-white text-[9px] font-black px-2 py-0.5 rounded shadow">
                HOST
              </div>
            </div>

            {/* Rival Side (Right) */}
            <div className="relative flex-1 h-full border-l border-[#FF0844]/60 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80"
                alt="Opponent"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-28 right-2 bg-[#FF0844] text-white text-[9px] font-black px-2 py-0.5 rounded shadow">
                RIVAL
              </div>
              <div className="absolute bottom-32 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-medium">
                DJ Spark 🎙️
              </div>
            </div>
          </div>
        ) : (
          /* Solo Broadcast */
          <div className="relative w-full h-full">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&auto=format&fit=crop&q=80"
              alt="Live Streamer"
              className="w-full h-full object-cover"
              style={{ filter: getFilterStyle() }}
            />
          </div>
        )}

        {/* Ambient Dark Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/85 pointer-events-none" />
      </div>

      {/* Floating Hearts Particle Layer */}
      <div className="absolute bottom-20 right-4 w-20 h-80 pointer-events-none z-30 overflow-visible">
        {hearts.map((h) => (
          <div
            key={h.id}
            className="absolute bottom-0 animate-[floatUp_1.8s_cubic-bezier(0.25,1,0.5,1)_forwards]"
            style={{
              left: `${30 + h.x}px`,
              color: h.color,
            }}
          >
            <Heart className="fill-current drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" style={{ width: h.size, height: h.size }} />
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP HEADER (Glassmorphism Pill, Viewers, Diamonds, Exit) */}
      {/* ========================================================================= */}
      <div
        className="relative z-20 pt-11 px-3 flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          {/* Host Info Pill */}
          <div className="flex items-center bg-[#140E2A]/75 backdrop-blur-md rounded-full py-1 pl-1 pr-2.5 border border-white/15 shadow-lg max-w-[190px]">
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-purple-500 shrink-0">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Host avatar"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border border-black ring-1 ring-white/50" />
            </div>

            <div className="ml-2 min-w-0">
              <div className="text-white text-xs font-bold truncate max-w-[85px]">
                {title || 'Rryda Live'}
              </div>
              <div className="flex items-center gap-1 text-[10px]">
                <Heart className="w-2.5 h-2.5 text-pink-500 fill-pink-500" />
                <span className="text-white/90 font-semibold">
                  {likesCount > 999 ? `${(likesCount / 1000).toFixed(1)}k` : likesCount}
                </span>
                <span className="text-white/40">•</span>
                <span className="text-yellow-400 font-semibold">{formatTimer(elapsedSeconds)}</span>
              </div>
            </div>

            <div className="ml-auto w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center text-white shadow-sm shrink-0">
              <Plus className="w-3 h-3" />
            </div>
          </div>

          {/* Right Section: Viewers Stack & Exit Button */}
          <div className="flex items-center gap-2">
            {/* Viewers Avatar Stack */}
            <div className="flex items-center bg-[#140E2A]/75 backdrop-blur-md rounded-full py-1 px-2 border border-white/15 shadow-sm">
              <div className="flex -space-x-2">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                  alt="Viewer 1"
                  className="w-6 h-6 rounded-full object-cover border border-amber-400"
                />
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                  alt="Viewer 2"
                  className="w-6 h-6 rounded-full object-cover border border-slate-300"
                />
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80"
                  alt="Viewer 3"
                  className="w-6 h-6 rounded-full object-cover border border-amber-700"
                />
              </div>
              <div className="flex items-center gap-1 ml-1.5 text-white text-[11px] font-bold">
                <Eye className="w-3 h-3 text-white/70" />
                <span>2.4k</span>
              </div>
            </div>

            {/* Exit Stream Button */}
            <button
              id="end-live-trigger-btn"
              onClick={onEndStreamRequest}
              className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-rose-500 transition shadow-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub Header: Daily Rank & Diamonds Ticker */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/25 to-orange-500/10 backdrop-blur-md rounded-full px-2.5 py-0.5 border border-amber-400/40 text-amber-300 font-bold text-[10px]">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span>Hourly Star #1</span>
          </div>

          <div className="flex items-center gap-1.5 bg-gradient-to-r from-pink-500/25 to-purple-500/15 backdrop-blur-md rounded-full px-2.5 py-0.5 border border-pink-500/30 text-white font-bold text-[11px]">
            <Diamond className="w-3 h-3 text-yellow-300 fill-yellow-300" />
            <span>{diamondsEarned.toLocaleString()}</span>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 2. PK BATTLE BAR (When PK Active) */}
        {/* ======================================================================= */}
        {isPkActive && (
          <div className="mt-1 bg-[#120B26]/85 backdrop-blur-md rounded-xl p-2 border border-white/15 shadow-xl">
            {/* Top Score Row */}
            <div className="flex items-center justify-between">
              {/* Host MVP & Score */}
              <div className="flex items-center gap-2">
                <div className="relative w-7 h-7 rounded-full overflow-hidden ring-2 ring-yellow-400">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                    alt="Host MVP"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute -top-1 -left-1 text-[9px]">👑</div>
                </div>
                <div>
                  <div className="text-blue-400 font-black text-xs">
                    {pkHostScore.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-white/60 font-semibold">Host</div>
                </div>
              </div>

              {/* Center VS & Timer */}
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 flex items-center justify-center text-white font-black text-[10px] italic shadow ring-1 ring-white/50 animate-pulse">
                  VS
                </div>
                <div className="flex items-center gap-0.5 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white font-bold mt-0.5">
                  <Flame className="w-2.5 h-2.5 text-rose-500" />
                  <span>{formatTimer(pkTimeLeft)}</span>
                </div>
              </div>

              {/* Opponent MVP & Score */}
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-rose-400 font-black text-xs">
                    {pkOpponentScore.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-white/60 font-semibold">DJ Spark</div>
                </div>
                <div className="relative w-7 h-7 rounded-full overflow-hidden ring-2 ring-yellow-400">
                  <img
                    src="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80"
                    alt="Rival MVP"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute -top-1 -right-1 text-[9px]">👑</div>
                </div>
              </div>
            </div>

            {/* Tug-of-war Progress Track */}
            <div className="relative h-2 w-full bg-purple-950/80 rounded-full overflow-hidden mt-1.5 flex shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                style={{ width: `${hostScoreRatio * 100}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-pink-500 flex-1 transition-all duration-300"
              />
              {/* Divider Glow */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_#FFF] -translate-x-1/2"
                style={{ left: `${hostScoreRatio * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. CHAT OVERLAY & BOTTOM DOCK */}
      {/* ========================================================================= */}
      <div
        className="relative z-20 px-3 pb-6 flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrollable Live Chat Feed */}
        <div
          ref={chatScrollRef}
          className="h-44 overflow-y-auto flex flex-col gap-1.5 scrollbar-none no-scrollbar mask-gradient-b text-xs"
        >
          {chatMessages.map((msg) => {
            if (msg.badgeType === 'system') {
              return (
                <div
                  key={msg.id}
                  className="self-start flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-500/30 text-white text-[11px] max-w-[92%]"
                >
                  <span className="bg-rose-500 text-[9px] font-black px-1 rounded text-white shrink-0">
                    SYS
                  </span>
                  <span className="leading-tight">{msg.content}</span>
                </div>
              );
            }

            if (msg.giftInfo) {
              return (
                <div
                  key={msg.id}
                  className="self-start flex items-center bg-gradient-to-r from-pink-500/40 via-purple-500/30 to-transparent backdrop-blur-md px-2.5 py-1 rounded-xl border border-pink-500/30 text-white text-[11px]"
                >
                  <span className="text-yellow-400 font-extrabold">{msg.senderName}</span>
                  <span className="text-white/90 ml-1">sent {msg.giftInfo.name}</span>
                  <span className="text-sm ml-1">{msg.giftInfo.icon}</span>
                  <span className="text-pink-400 font-black italic ml-1.5">
                    x{msg.giftInfo.count}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className="self-start bg-[#120B26]/75 backdrop-blur-md rounded-xl px-2.5 py-1 border border-white/10 text-white max-w-[88%] leading-relaxed shadow-sm"
              >
                <div className="flex items-center gap-1 flex-wrap">
                  {msg.level && (
                    <span className="bg-[#382B66] text-yellow-400 text-[9px] font-black px-1.5 py-0.2 rounded-md">
                      Lv.{msg.level}
                    </span>
                  )}
                  {msg.badgeType === 'vip' && (
                    <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-400/40 text-[9px] font-black px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                      <Crown className="w-2.5 h-2.5 text-yellow-400" />
                      VIP
                    </span>
                  )}
                  {msg.badgeType === 'mod' && (
                    <span className="bg-emerald-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                      <Shield className="w-2.5 h-2.5" />
                      MOD
                    </span>
                  )}
                  <span className="text-[#B0A6D6] font-bold text-xs">{msg.senderName}:</span>
                  <span className="text-white text-xs font-normal">{msg.content}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Bar or Collapsed Bar with Emojis */}
        <div>
          {isInputExpanded ? (
            <form onSubmit={handleSendChat} className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Say something to your room..."
                autoFocus
                className="flex-1 bg-[#1A1332]/95 border border-purple-500 rounded-full px-3.5 py-1.5 text-white text-xs placeholder-white/50 focus:outline-none shadow-lg"
              />
              <button
                type="submit"
                className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsInputExpanded(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsInputExpanded(true)}
                className="flex-1 bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10 text-white/60 text-xs flex items-center gap-1.5 hover:bg-black/70 transition"
              >
                <span className="text-purple-300">💬</span>
                <span>Send a comment...</span>
              </button>

              <div className="flex items-center gap-1">
                {QUICK_EMOJIS.slice(0, 5).map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => onSendMessage(emoji)}
                    className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-xs hover:scale-110 active:scale-95 transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Host Ergonomic Bottom Action Dock */}
        <div className="flex items-center justify-around bg-[#0E0A1A]/80 backdrop-blur-xl rounded-2xl py-1 px-1 border border-white/10 shadow-2xl mt-1">
          {/* PK Battle Quick Launcher */}
          <button
            id="dock-pk-btn"
            onClick={() => setIsPkActive(!isPkActive)}
            className={`flex flex-col items-center justify-center w-11 h-11 rounded-xl transition ${
              isPkActive
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                : 'text-amber-400 hover:bg-white/10'
            }`}
          >
            <Swords className="w-5 h-5" />
            <span className="text-[9px] font-black">PK</span>
          </button>

          {/* Beauty Retouch Drawer */}
          <button
            id="dock-beauty-btn"
            onClick={onOpenBeauty}
            className="flex flex-col items-center justify-center w-11 h-11 rounded-xl text-pink-400 hover:bg-white/10 transition"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[9px] font-semibold">Beauty</span>
          </button>

          {/* Soundboard FX */}
          <button
            id="dock-sounds-btn"
            onClick={() => {
              soundEffects.playAirhorn();
              onSendMessage('📢 [Sound FX: Airhorn]');
            }}
            className="flex flex-col items-center justify-center w-11 h-11 rounded-xl text-cyan-400 hover:bg-white/10 transition"
          >
            <Music className="w-5 h-5" />
            <span className="text-[9px] font-semibold">Sounds</span>
          </button>

          {/* Host Tools */}
          <button
            id="dock-tools-btn"
            onClick={onOpenTools}
            className="flex flex-col items-center justify-center w-11 h-11 rounded-xl text-white hover:bg-white/10 transition"
          >
            <Grid className="w-5 h-5" />
            <span className="text-[9px] font-semibold">Tools</span>
          </button>

          {/* Viewer Gifts */}
          <button
            id="dock-gifts-btn"
            onClick={onOpenGifts}
            className="flex flex-col items-center justify-center w-11 h-11 rounded-xl text-yellow-300 hover:bg-white/10 transition"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center shadow-md">
              <Gift className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[9px] font-semibold">Gifts</span>
          </button>

          {/* Mic Toggle */}
          <button
            id="dock-mic-btn"
            onClick={toggleMic}
            className={`flex flex-col items-center justify-center w-11 h-11 rounded-xl transition ${
              isMicMuted ? 'text-rose-400' : 'text-emerald-400'
            } hover:bg-white/10`}
          >
            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span className="text-[9px] font-semibold">{isMicMuted ? 'Muted' : 'Mic'}</span>
          </button>

          {/* End Stream */}
          <button
            id="dock-end-btn"
            onClick={onEndStreamRequest}
            className="flex flex-col items-center justify-center w-11 h-11 rounded-xl text-rose-400 hover:bg-rose-500/20 transition"
          >
            <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center shadow-md">
              <Power className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[9px] font-semibold">End</span>
          </button>
        </div>
      </div>
    </div>
  );
}
