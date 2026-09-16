import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Gift,
  Flame,
  Gamepad2,
  Share2,
  Heart,
  Volume2,
  VolumeX,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { LiveStreamData, PkBattleState, ChatMessageItem, GiftItem, FloatingHeart } from './types';
import { GIFTS_CATALOG, INITIAL_MESSAGES } from './data';
import { LiveHeader } from './components/LiveHeader';
import { PkBattleBar } from './components/PkBattleBar';
import { LiveChat } from './components/LiveChat';
import { GiftModal } from './components/GiftModal';

interface GlitterSpark {
  id: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  type: 'star' | 'diamond' | 'dot';
}

export default function App() {
  // ── Mock Streamer State ──
  const [stream, setStream] = useState<LiveStreamData>({
    id: 'stream_101',
    title: '🌟 Friday Party & PK Clash! Top 1 Push!',
    hostName: 'Elena_V',
    hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    hostLevel: 28,
    diamonds: 48920,
    viewers: 1420,
    category: 'Singing & Chat',
    isFollowing: false,
    streamerImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80',
    opponent: {
      name: 'Maya_Flame',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
      level: 31,
      streamerImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1000&q=80',
    },
  });

  // ── PK State ──
  const [pkBattle, setPkBattle] = useState<PkBattleState>({
    isActive: true,
    timeLeft: 164,
    myScore: 18450,
    theirScore: 14200,
    status: 'ACTIVE',
  });

  // ── Chat & Messages ──
  const [messages, setMessages] = useState<ChatMessageItem[]>(INITIAL_MESSAGES);
  const [userCoins, setUserCoins] = useState<number>(5420);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [giftBanner, setGiftBanner] = useState<{ sender: string; gift: string; count: number } | null>(null);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [elapsedSecs, setElapsedSecs] = useState(342);

  // ── Combo counter state for rapid gift sends ──
  const [giftCombo, setGiftCombo] = useState<number>(0);
  const [comboResetKey, setComboResetKey] = useState<number>(0);
  const [isComboGlitching, setIsComboGlitching] = useState<boolean>(false);
  const comboTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const comboGlitchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Helper to start or refresh 3.0s combo window with glitch/freeze alert in the final 0.5s
  const refreshComboStreak = (newCombo: number) => {
    setGiftCombo(newCombo);
    setComboResetKey((k) => k + 1);
    setIsComboGlitching(false);

    if (comboGlitchTimeoutRef.current) clearTimeout(comboGlitchTimeoutRef.current);
    if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);

    // During final 0.5s of the 3.0s combo window (at 2500ms), trigger temporary glitch/freeze alert
    comboGlitchTimeoutRef.current = setTimeout(() => {
      setIsComboGlitching(true);
    }, 2500);

    comboTimeoutRef.current = setTimeout(() => {
      setGiftCombo(0);
      setIsComboGlitching(false);
    }, 3000);
  };

  // ── Recent gift streak tooltip ──
  const [lastSentGift, setLastSentGift] = useState<{ icon: string; name: string } | null>(null);
  const lastGiftTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // ── Visual sound indicator for gift audio-visual sync ──
  const [showGiftSound, setShowGiftSound] = useState<boolean>(false);
  const soundTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // ── Rapid-Fire Mode State & Refs ──
  const [lastGiftItem, setLastGiftItem] = useState<GiftItem>(GIFTS_CATALOG[0]);
  const nextRapidFireCost = (lastGiftItem?.coins || 10) * 5;
  const [rapidFireActive, setRapidFireActive] = useState<boolean>(false);
  const [rapidFireBanner, setRapidFireBanner] = useState<{ icon: string; name: string; count: number } | null>(null);
  const [rapidFireParticles, setRapidFireParticles] = useState<Array<{ id: number; icon: string; x: number; y: number; scale: number; rotate: number }>>([]);
  const lastTapTimeRef = React.useRef<number>(0);
  const singleTapTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // ── Radial ripple state for #hero-gift-trigger-btn ──
  const [heroRipples, setHeroRipples] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);

  // ── Subtle CSS Shake State for #hero-gift-trigger-btn ──
  const heroBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const [isHeroShaking, setIsHeroShaking] = useState<boolean>(false);
  const [shakeIntensity, setShakeIntensity] = useState<number>(1);
  const shakeTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const triggerHeroShake = (combo: number) => {
    // Subtle baseline intensity (1.0), scaling with combo up to ~3.2
    const intensity = Math.min(1 + Math.max(0, combo) * 0.1, 3.2);
    setShakeIntensity(intensity);

    if (heroBtnRef.current) {
      const el = heroBtnRef.current;
      const x = (2.2 * intensity).toFixed(1) + 'px';
      const y = (1.4 * intensity).toFixed(1) + 'px';
      const r = (1.5 * intensity).toFixed(1) + 'deg';
      el.style.setProperty('--shake-x', x);
      el.style.setProperty('--shake-y', y);
      el.style.setProperty('--shake-r', r);
      el.style.setProperty('--mag-x', `${magneticOffset.x.toFixed(1)}px`);
      el.style.setProperty('--mag-y', `${magneticOffset.y.toFixed(1)}px`);
      el.classList.remove('hero-btn-shake');
      void el.offsetWidth; // force DOM reflow to restart CSS animation cleanly
      el.classList.add('hero-btn-shake');
    }

    setIsHeroShaking(true);
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = setTimeout(() => {
      setIsHeroShaking(false);
      if (heroBtnRef.current) {
        heroBtnRef.current.classList.remove('hero-btn-shake');
      }
    }, 360);
  };

  // ── Magnetic Attraction State for #hero-gift-trigger-btn ──
  const [magneticOffset, setMagneticOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isMagneticDragging, setIsMagneticDragging] = useState<boolean>(false);
  const isDraggingRef = React.useRef<boolean>(false);

  const calculateMagneticPull = (clientX: number, clientY: number, isDragging: boolean) => {
    if (!heroBtnRef.current) return;
    const rect = heroBtnRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.hypot(deltaX, deltaY);

    const maxRadius = isDragging ? 150 : 85;
    if (distance < maxRadius || isDragging) {
      // Elastic rubber-band resistance curve: subtle pull towards cursor
      const maxPull = isDragging ? 18 : 12;
      const pullFactor = isDragging ? 0.38 : 0.26;
      const pullX = Math.max(-maxPull, Math.min(maxPull, deltaX * pullFactor));
      const pullY = Math.max(-maxPull, Math.min(maxPull, deltaY * pullFactor));
      setMagneticOffset({ x: pullX, y: pullY });
    } else {
      setMagneticOffset({ x: 0, y: 0 });
    }
  };

  const handleMagneticPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    setIsMagneticDragging(true);
    isDraggingRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    calculateMagneticPull(e.clientX, e.clientY, true);
  };

  const handleMagneticPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    calculateMagneticPull(e.clientX, e.clientY, isDraggingRef.current);
  };

  const handleMagneticPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    setIsMagneticDragging(false);
    isDraggingRef.current = false;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
    setMagneticOffset({ x: 0, y: 0 });
  };

  const handleMagneticPointerCancel = () => {
    setIsMagneticDragging(false);
    isDraggingRef.current = false;
    setMagneticOffset({ x: 0, y: 0 });
  };

  const handleMagneticZonePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) {
      calculateMagneticPull(e.clientX, e.clientY, false);
    }
  };

  const handleMagneticZonePointerLeave = () => {
    if (!isDraggingRef.current) {
      setMagneticOffset({ x: 0, y: 0 });
    }
  };

  // ── Subtle Gold Glitter Particle Sparks System for #hero-gift-trigger-btn ──
  const [glitterSparks, setGlitterSparks] = useState<GlitterSpark[]>([]);
  const glitterIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const emitGlitterSparks = (count: number, originX: number = 0, originY: number = 0, isClick: boolean = false) => {
    const colors = ['#FFF6A3', '#FFD700', '#FFAA00', '#FFFFFF', '#FFE270', '#F3C969'];
    const types: Array<'star' | 'diamond' | 'dot'> = ['star', 'star', 'diamond', 'dot'];
    const newSparks: GlitterSpark[] = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = isClick ? 22 + Math.random() * 42 : 14 + Math.random() * 26;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;
      const size = isClick ? 4 + Math.random() * 6 : 3 + Math.random() * 4;

      newSparks.push({
        id: Date.now() + Math.random() + i,
        originX,
        originY,
        targetX,
        targetY,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        duration: isClick ? 0.65 + Math.random() * 0.35 : 0.5 + Math.random() * 0.3,
        delay: isClick ? Math.random() * 0.08 : Math.random() * 0.12,
        type: types[Math.floor(Math.random() * types.length)],
      });
    }

    setGlitterSparks((prev) => [...prev.slice(-35), ...newSparks]);
  };

  const handleHeroBtnMouseEnter = () => {
    emitGlitterSparks(7, 0, 0, false);
    if (glitterIntervalRef.current) clearInterval(glitterIntervalRef.current);
    glitterIntervalRef.current = setInterval(() => {
      emitGlitterSparks(3, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, false);
    }, 280);
  };

  const handleHeroBtnMouseLeave = () => {
    if (glitterIntervalRef.current) {
      clearInterval(glitterIntervalRef.current);
      glitterIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (glitterIntervalRef.current) clearInterval(glitterIntervalRef.current);
      if (comboGlitchTimeoutRef.current) clearTimeout(comboGlitchTimeoutRef.current);
      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
    };
  }, []);

  // ── Dynamic Glow Intensity based on Gift Combo Multiplier ──
  const { comboOuterGlow, comboInnerGlow, auraScale } = useMemo(() => {
    if (giftCombo <= 1) {
      return {
        comboOuterGlow: '0 0 20px rgba(255, 42, 109, 0.7)',
        comboInnerGlow: 'inset 0 0 4px rgba(255, 255, 255, 0.3)',
        auraScale: 1,
      };
    }
    // Cap factor to prevent layout overflow while giving vibrant scaling up to combo x30
    const factor = Math.min(giftCombo, 30);
    // Base radii expand as combo increases
    const r1 = 20 + factor * 2.5; // 25px -> 95px
    const r2 = 32 + factor * 4.0; // 40px -> 152px
    const r3 = 45 + factor * 5.5; // 56px -> 210px

    const a1 = Math.min(0.75 + factor * 0.015, 1.0);
    const a2 = Math.min(0.45 + factor * 0.02, 0.95);
    const a3 = Math.min(0.25 + factor * 0.025, 0.9);

    const innerRadius = 4 + factor * 0.8; // 5.6px -> 28px
    const innerAlpha = Math.min(0.4 + factor * 0.02, 0.95);

    return {
      comboOuterGlow: `0 0 ${r1}px rgba(255, 42, 109, ${a1}), 0 0 ${r2}px rgba(255, 138, 0, ${a2}), 0 0 ${r3}px rgba(255, 215, 0, ${a3})`,
      comboInnerGlow: `inset 0 0 ${innerRadius}px rgba(255, 255, 255, ${innerAlpha}), 0 0 ${10 + factor * 1.2}px rgba(255, 215, 0, ${Math.min(0.4 + factor * 0.02, 0.95)})`,
      auraScale: 1 + Math.min(factor * 0.012, 0.25),
    };
  }, [giftCombo]);

  // Elapsed timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSecs((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // PK Timer countdown
  useEffect(() => {
    if (!pkBattle.isActive || pkBattle.status !== 'ACTIVE') return;
    const interval = setInterval(() => {
      setPkBattle((prev) => {
        if (prev.timeLeft <= 1) {
          return {
            ...prev,
            timeLeft: 0,
            status: 'SETTLED',
            winner: prev.myScore > prev.theirScore ? 'host' : prev.theirScore > prev.myScore ? 'opponent' : 'draw',
          };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pkBattle.isActive, pkBattle.status]);

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Follow Toggle
  const handleFollowToggle = () => {
    setStream((prev) => ({ ...prev, isFollowing: !prev.isFollowing }));
  };

  // Send message
  const handleSendMessage = (text: string) => {
    const newMsg: ChatMessageItem = {
      id: String(Date.now()),
      sender: 'You',
      level: 15,
      text,
      isMe: true,
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  // Spawn tap hearts
  const handleScreenTap = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only spawn if click was directly on the background area
    const colorsList = ['#FF2A6D', '#FFB800', '#00D2FF', '#E040FB', '#00E676'];
    const randomColor = colorsList[Math.floor(Math.random() * colorsList.length)];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const newHeart: FloatingHeart = {
      id: Date.now() + Math.random(),
      x: Math.max(30, Math.min(rect.width - 50, x)),
      color: randomColor,
    };

    setHearts((prev) => [...prev.slice(-15), newHeart]);

    // Add likes to PK or diamonds
    if (pkBattle.isActive && pkBattle.status === 'ACTIVE') {
      setPkBattle((prev) => ({ ...prev, myScore: prev.myScore + 5 }));
    }
  };

  // Send Gift
  const handleSendGift = (gift: GiftItem, count: number) => {
    const totalCost = gift.coins * count;
    if (userCoins < totalCost) {
      alert(`Not enough coins! You need ${totalCost.toLocaleString()} coins.`);
      return;
    }

    setUserCoins((prev) => prev - totalCost);
    setIsGiftModalOpen(false);

    // Update diamonds & PK score
    setStream((prev) => ({ ...prev, diamonds: prev.diamonds + totalCost }));
    if (pkBattle.isActive && pkBattle.status === 'ACTIVE') {
      setPkBattle((prev) => ({ ...prev, myScore: prev.myScore + totalCost * 2 }));
    }

    // Trigger visual announcement banner
    setGiftBanner({ sender: 'You', gift: `${gift.icon} ${gift.name}`, count });
    setTimeout(() => setGiftBanner(null), 3500);

    // Update floating gift combo counter with 3.0s window & 0.5s glitch/freeze alert
    refreshComboStreak(giftCombo + 1);

    // Update recent gift streak tooltip
    setLastSentGift({ icon: gift.icon, name: gift.name });
    if (lastGiftTimeoutRef.current) {
      clearTimeout(lastGiftTimeoutRef.current);
    }
    lastGiftTimeoutRef.current = setTimeout(() => {
      setLastSentGift(null);
    }, 3500);

    // Trigger visual sound icon overlay & chime synchronization
    setShowGiftSound(true);
    if (soundTimeoutRef.current) {
      clearTimeout(soundTimeoutRef.current);
    }
    soundTimeoutRef.current = setTimeout(() => {
      setShowGiftSound(false);
    }, 2200);

    if (!isMuted) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const now = ctx.currentTime;
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);
            gain.gain.setValueAtTime(0.1, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.28);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.3);
          });
        }
      } catch {
        // AudioContext fallback
      }
    }

    // Track last sent gift item for rapid fire
    setLastGiftItem(gift);

    // Add to chat
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'You',
        level: 15,
        text: `sent ${gift.name} x${count}! ${gift.icon}`,
        isMe: true,
      },
    ]);
  };

  // ── Rapid-Fire Double Tap Trigger ──
  const triggerRapidSound = () => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.045);
          gain.gain.setValueAtTime(0.09, now + idx * 0.045);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.045);
          osc.stop(now + idx * 0.045 + 0.25);
        });
      }
    } catch {
      // AudioContext fallback
    }
  };

  const handleTriggerRapidFire = () => {
    const burstCount = 5;
    const targetGift = lastGiftItem;
    const totalCost = targetGift.coins * burstCount;

    if (userCoins < totalCost) {
      alert(`Rapid-Fire requires ${totalCost.toLocaleString()} coins for ${targetGift.name} x${burstCount}! Please top-up.`);
      return;
    }

    // Deduct coins & update stream stats
    setUserCoins((prev) => prev - totalCost);
    setStream((prev) => ({ ...prev, diamonds: prev.diamonds + totalCost }));
    if (pkBattle.isActive && pkBattle.status === 'ACTIVE') {
      setPkBattle((prev) => ({ ...prev, myScore: prev.myScore + totalCost * 2 }));
    }

    // Boost Combo count by burst amount with 3.0s window & 0.5s glitch/freeze alert
    refreshComboStreak(giftCombo + burstCount);

    // Update recent gift tooltip
    setLastSentGift({ icon: targetGift.icon, name: targetGift.name });
    if (lastGiftTimeoutRef.current) clearTimeout(lastGiftTimeoutRef.current);
    lastGiftTimeoutRef.current = setTimeout(() => {
      setLastSentGift(null);
    }, 3500);

    // Audio-visual sound icon & tone
    setShowGiftSound(true);
    if (soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current);
    soundTimeoutRef.current = setTimeout(() => {
      setShowGiftSound(false);
    }, 2400);
    triggerRapidSound();

    // Trigger rapid fire active flag for button aura
    setRapidFireActive(true);
    setTimeout(() => setRapidFireActive(false), 2000);

    // Trigger massive combined animation banner
    setRapidFireBanner({ icon: targetGift.icon, name: targetGift.name, count: burstCount });
    setTimeout(() => setRapidFireBanner(null), 2500);

    // Generate massive particle fountain across the stream
    const newParticles = Array.from({ length: 14 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      icon: targetGift.icon,
      x: -(40 + Math.random() * 240),
      y: -(100 + Math.random() * 320),
      scale: 0.8 + Math.random() * 0.9,
      rotate: (Math.random() - 0.5) * 80,
    }));
    setRapidFireParticles(newParticles);
    setTimeout(() => setRapidFireParticles([]), 2200);

    // Post to chat
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'You',
        level: 15,
        text: `⚡ RAPID-FIRE: sent ${targetGift.name} x${burstCount}! ${targetGift.icon.repeat(3)}`,
        isMe: true,
      },
    ]);
  };

  // Add radial ripple expanding from tap/click coordinates
  const triggerHeroRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX ? e.clientX - rect.left : rect.width / 2;
    const y = e.clientY ? e.clientY - rect.top : rect.height / 2;
    const size = Math.max(rect.width, rect.height) * 2.8;
    const rippleId = Date.now() + Math.random();

    setHeroRipples((prev) => [...prev.slice(-3), { id: rippleId, x, y, size }]);
    setTimeout(() => {
      setHeroRipples((prev) => prev.filter((r) => r.id !== rippleId));
    }, 650);
  };

  // Button Click Handler with 500ms double-tap window
  const handleHeroButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    triggerHeroRipple(e);
    triggerHeroShake(giftCombo);

    // Emit subtle gold glitter sparks radiating from click point
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX ? e.clientX - rect.left - rect.width / 2 : 0;
    const clickY = e.clientY ? e.clientY - rect.top - rect.height / 2 : 0;
    emitGlitterSparks(12, clickX, clickY, true);

    const now = Date.now();
    const diff = now - lastTapTimeRef.current;

    if (lastTapTimeRef.current > 0 && diff <= 500) {
      // Double tap confirmed within 500ms!
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapTimeRef.current = 0;
      handleTriggerRapidFire();
    } else {
      // First tap of potential double tap
      lastTapTimeRef.current = now;
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
      }
      singleTapTimerRef.current = setTimeout(() => {
        setIsGiftModalOpen(true);
        singleTapTimerRef.current = null;
        lastTapTimeRef.current = 0;
      }, 280);
    }
  };

  const handleHeroButtonDoubleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    triggerHeroRipple(e);
    triggerHeroShake(giftCombo + 5);

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX ? e.clientX - rect.left - rect.width / 2 : 0;
    const clickY = e.clientY ? e.clientY - rect.top - rect.height / 2 : 0;
    emitGlitterSparks(18, clickX, clickY, true);

    if (singleTapTimerRef.current) {
      clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = null;
    }
    lastTapTimeRef.current = 0;
    handleTriggerRapidFire();
  };

  // Quick PK Score boost simulation for opponent (simulates live clash activity)
  const handleSimulateOpponentGift = () => {
    setPkBattle((prev) => ({ ...prev, theirScore: prev.theirScore + 1200 }));
    setGiftBanner({ sender: 'KingKev', gift: '🥊 PK Punch', count: 10 });
    setTimeout(() => setGiftBanner(null), 3500);
  };

  const handleRestartPk = () => {
    setPkBattle({
      isActive: true,
      timeLeft: 180,
      myScore: 5000,
      theirScore: 4800,
      status: 'ACTIVE',
    });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#070510] font-sans antialiased text-white select-none p-0 sm:p-4">
      {/* ── Mobile Phone Frame Container ── */}
      <div
        onClick={handleScreenTap}
        id="rryda-mobile-viewport"
        className="relative w-full sm:max-w-[400px] h-[100dvh] sm:h-[840px] bg-black sm:rounded-[36px] overflow-hidden shadow-[0_0_50px_rgba(123,77,255,0.25)] border sm:border-white/15 flex flex-col justify-between"
      >
        {/* ── 1. Background Video / Split-Screen Viewport ── */}
        <div className="absolute inset-0 z-0 flex">
          {pkBattle.isActive ? (
            /* Dual Split Video for PK */
            <div className="w-full h-full flex">
              {/* Host Left Side */}
              <div className="relative w-1/2 h-full overflow-hidden border-r border-white/10">
                <img
                  src={stream.streamerImage}
                  alt={stream.hostName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                <div className="absolute bottom-28 left-2 px-2 py-0.5 rounded-md bg-blue-600/80 backdrop-blur-xs border border-blue-400/40 text-[10px] font-black text-white">
                  HOST
                </div>
              </div>

              {/* Opponent Right Side */}
              <div className="relative w-1/2 h-full overflow-hidden">
                <img
                  src={stream.opponent?.streamerImage}
                  alt={stream.opponent?.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                <div className="absolute bottom-28 right-2 px-2 py-0.5 rounded-md bg-rose-600/80 backdrop-blur-xs border border-rose-400/40 text-[10px] font-black text-white">
                  RIVAL
                </div>
              </div>
            </div>
          ) : (
            /* Solo Video Stream */
            <div className="relative w-full h-full">
              <img
                src={stream.streamerImage}
                alt={stream.hostName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
            </div>
          )}
        </div>

        {/* ── Floating Tap Hearts Stream ── */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          {hearts.map((h) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 1, y: 0, scale: 0.8 }}
              animate={{ opacity: 0, y: -260, scale: 1.4, x: (Math.random() - 0.5) * 60 }}
              transition={{ duration: 1.8, ease: 'easeOut' }}
              style={{ left: `${h.x}px`, bottom: '120px' }}
              className="absolute text-xl"
            >
              <Heart fill={h.color} color={h.color} className="w-6 h-6 drop-shadow-lg" />
            </motion.div>
          ))}
        </div>

        {/* ── 2. Top Broadcast HUD ── */}
        <div className="relative z-30 flex flex-col pt-3 pointer-events-none">
          <LiveHeader
            stream={stream}
            elapsedTime={formatElapsed(elapsedSecs)}
            onFollowToggle={handleFollowToggle}
            onClose={() => alert('Close Stream')}
          />

          {/* PK Battle Bar */}
          <PkBattleBar
            battle={pkBattle}
            hostName={stream.hostName}
            opponentName={stream.opponent?.name ?? 'Opponent'}
          />

          {/* Real-time Gift Announcement Banner */}
          <AnimatePresence>
            {giftBanner && (
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="mx-3 mt-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#FFB800] via-[#FF2A6D] to-[#7B4DFF] shadow-[0_0_15px_rgba(255,42,109,0.7)] flex items-center gap-2 border border-white/30"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span className="text-xs font-black text-white">
                  {giftBanner.sender} sent {giftBanner.gift} x{giftBanner.count}!
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 3. Bottom Overlay: Chat & Action Dock ── */}
        <div className="relative z-30 pb-4 flex flex-col gap-2 pointer-events-none">
          {/* Ambient Chat Feed */}
          <LiveChat messages={messages} onSendMessage={handleSendMessage} />

          {/* Action Dock */}
          <div className="px-3 pt-1 flex items-center justify-between pointer-events-auto">
            {/* Left Quick Helpers: Sound & PK restart tester */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsMuted(!isMuted)}
                id="live-mute-btn"
                className="w-8 h-8 rounded-full bg-[#0a0718]/70 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/80 hover:text-white"
                title="Mute stream audio"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                onClick={handleRestartPk}
                className="px-2 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-bold text-amber-300 hover:bg-white/20"
                title="Reset PK Battle timer for preview"
              >
                Reset PK
              </button>
            </div>

            {/* Right Buttons: Opponent Gift Sim, PK modal, Games, 3D Hero Gift Button */}
            <div className="flex items-center gap-2">
              {/* Simulate opponent gift (test clash bar animation) */}
              <button
                onClick={handleSimulateOpponentGift}
                className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-[10px] font-bold text-rose-300 hover:bg-rose-500/30"
                title="Test red team points"
              >
                +Red Pts
              </button>

              {/* Mini Games */}
              <button
                onClick={() => alert('Mini Games Center')}
                className="w-8 h-8 rounded-full bg-[#0a0718]/70 backdrop-blur-md border border-white/15 flex items-center justify-center text-amber-400 hover:bg-white/20 shadow-md"
              >
                <Gamepad2 className="w-4 h-4" />
              </button>

              {/* 🧲 Magnetic Attraction Proximity Zone */}
              <div
                id="hero-gift-magnetic-zone"
                onPointerMove={handleMagneticZonePointerMove}
                onPointerLeave={handleMagneticZonePointerLeave}
                className="relative flex items-center justify-center p-3 -m-3 touch-none"
              >
                {/* 🎁 Prominent Hero 3D Gift Box Button with Dynamic Combo Glow, CSS Shake & Magnetic Attraction */}
                <button
                  ref={heroBtnRef}
                  onClick={handleHeroButtonClick}
                  onDoubleClick={handleHeroButtonDoubleClick}
                  onMouseEnter={handleHeroBtnMouseEnter}
                  onMouseLeave={handleHeroBtnMouseLeave}
                  onPointerDown={handleMagneticPointerDown}
                  onPointerMove={handleMagneticPointerMove}
                  onPointerUp={handleMagneticPointerUp}
                  onPointerCancel={handleMagneticPointerCancel}
                  id="hero-gift-trigger-btn"
                  style={{
                    boxShadow: comboOuterGlow,
                    '--shake-x': `${(2.2 * shakeIntensity).toFixed(1)}px`,
                    '--shake-y': `${(1.4 * shakeIntensity).toFixed(1)}px`,
                    '--shake-r': `${(1.5 * shakeIntensity).toFixed(1)}deg`,
                    '--mag-x': `${magneticOffset.x.toFixed(1)}px`,
                    '--mag-y': `${magneticOffset.y.toFixed(1)}px`,
                    transform: isHeroShaking
                      ? undefined
                      : `translate3d(${magneticOffset.x.toFixed(1)}px, ${magneticOffset.y.toFixed(1)}px, 0)`,
                    transition: isMagneticDragging
                      ? 'none'
                      : isHeroShaking
                      ? 'none'
                      : 'transform 0.32s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease',
                  } as React.CSSProperties}
                  className={`relative group p-0.5 rounded-full bg-gradient-to-tr from-[#FF2A6D] via-[#FF8A00] to-[#FFD700] hover:scale-105 active:scale-95 group-hover:brightness-110 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none ${
                    rapidFireActive ? 'ring-4 ring-amber-400 scale-110' : ''
                  } ${isHeroShaking ? 'hero-btn-shake' : ''} ${
                    isComboGlitching ? 'hero-btn-glitch-freeze ring-2 ring-cyan-400 ring-offset-2 ring-offset-black shadow-[0_0_25px_rgba(0,240,255,0.9)]' : ''
                  }`}
                  title={`Tap to open gifts • Double-tap for Rapid-Fire (${lastGiftItem.name} x5 = 🪙 ${nextRapidFireCost.toLocaleString()})`}
                >
                {/* Dynamic Combo Pulsing Aura Ring */}
                {giftCombo > 1 && (
                  <motion.div
                    animate={{
                      scale: [1, auraScale, 1],
                      opacity: isComboGlitching ? [0.8, 1, 0.7, 1] : [0.55, 0.95, 0.55],
                    }}
                    transition={{
                      duration: isComboGlitching ? 0.1 : Math.max(0.4, 1.2 - Math.min(giftCombo * 0.04, 0.75)),
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    style={{
                      boxShadow: isComboGlitching
                        ? '0 0 25px rgba(0, 240, 255, 0.95), 0 0 40px rgba(255, 0, 85, 0.85)'
                        : comboOuterGlow,
                    }}
                    className="absolute inset-0 rounded-full pointer-events-none z-0"
                  />
                )}

                <div
                  style={{
                    boxShadow: comboInnerGlow,
                  }}
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF2A6D] to-[#FF8A00] flex items-center justify-center text-white border-2 border-white group-hover:shadow-[inset_0_0_12px_rgba(255,255,255,0.85)] transition-all duration-300 relative z-10 overflow-hidden"
                >
                  <Gift className="w-5 h-5 animate-bounce group-hover:scale-0 group-hover:opacity-0 transition-all duration-200" />

                  {/* Dynamic Rapid-Fire Cost Label inside the button face on hover */}
                  <div
                    id="hero-gift-rapid-fire-inner-label"
                    className="absolute inset-0 rounded-full bg-[#130E26]/95 backdrop-blur-xs flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-200 pointer-events-none px-0.5 z-20 select-none"
                  >
                    <span className="text-[7px] font-black text-amber-300 uppercase leading-none tracking-tighter">
                      ⚡ 5x
                    </span>
                    <span className="text-[8px] font-extrabold text-amber-200 flex items-center justify-center gap-0.5 leading-tight">
                      🪙{nextRapidFireCost >= 10000 ? `${(nextRapidFireCost / 1000).toFixed(0)}k` : nextRapidFireCost.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Hidden Rapid-Fire Value Tooltip inside #hero-gift-trigger-btn on hover */}
                <div
                  id="hero-gift-rapid-fire-hover-tooltip"
                  className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 scale-90 group-hover:scale-100 z-50 select-none whitespace-nowrap"
                >
                  <div className="relative px-2.5 py-1 rounded-full bg-[#100a22]/95 border border-amber-400/80 shadow-[0_0_15px_rgba(255,184,0,0.65)] flex items-center gap-1.5 backdrop-blur-md">
                    <Zap className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse shrink-0" />
                    <span className="text-[10px] font-medium text-white/90">
                      Rapid-Fire <span className="font-bold text-amber-300">{lastGiftItem.icon} x5:</span>
                    </span>
                    <span className="text-[10px] font-black text-amber-300 flex items-center gap-0.5 drop-shadow">
                      🪙 {nextRapidFireCost.toLocaleString()}
                    </span>
                    {/* Downward pointing arrow indicator */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#100a22] border-r border-b border-amber-400/80 rotate-45" />
                  </div>
                </div>

                {/* Radial ripple animation layer expanding from click point */}
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-20">
                  {heroRipples.map((ripple) => (
                    <motion.span
                      key={ripple.id}
                      initial={{ scale: 0, opacity: 0.9 }}
                      animate={{ scale: 1, opacity: 0 }}
                      transition={{ duration: 0.6, ease: [0.1, 0.9, 0.2, 1] }}
                      style={{
                        left: ripple.x,
                        top: ripple.y,
                        width: ripple.size,
                        height: ripple.size,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="absolute rounded-full bg-radial from-white via-amber-200/60 to-transparent border-2 border-white/90 shadow-[0_0_16px_rgba(255,255,255,0.9)] pointer-events-none"
                    />
                  ))}
                </div>

                {/* Tiny Recent Gifts Tooltip */}
                <AnimatePresence>
                  {lastSentGift && !rapidFireActive && (
                    <motion.div
                      id="hero-gift-recent-tooltip"
                      initial={{ opacity: 0, y: 6, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.8 }}
                      transition={{ type: 'spring', damping: 16, stiffness: 300 }}
                      className="absolute -top-8 right-0 pointer-events-none select-none z-40 whitespace-nowrap group-hover:opacity-0 transition-opacity duration-150"
                    >
                      <div className="relative px-2 py-0.5 rounded-full bg-[#130E26]/95 border border-amber-400/60 shadow-[0_0_12px_rgba(255,184,0,0.5)] flex items-center gap-1 text-[10px] font-bold text-amber-300 backdrop-blur-md">
                        <span className="text-xs filter drop-shadow-xs">{lastSentGift.icon}</span>
                        <span className="text-white/95 max-w-[64px] truncate">{lastSentGift.name}</span>
                        <span className="text-[8px] uppercase font-black text-[#FF2A6D] tracking-wider ml-0.5">Streak</span>
                        {/* Downward pointing arrow */}
                        <div className="absolute -bottom-1 right-3.5 w-1.5 h-1.5 bg-[#130E26] border-r border-b border-amber-400/60 rotate-45" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Visual Sound Icon Overlay */}
                <AnimatePresence>
                  {showGiftSound && (
                    <motion.div
                      id="hero-gift-sound-overlay"
                      initial={{ scale: 0, opacity: 0, rotate: -25 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0.2, opacity: 0, y: 4 }}
                      transition={{ type: 'spring', damping: 14, stiffness: 380 }}
                      className="absolute -bottom-1 -left-1.5 z-30 pointer-events-none select-none"
                    >
                      <div className="relative w-5 h-5 rounded-full bg-gradient-to-tr from-[#00D2FF] to-[#7B4DFF] border-2 border-white flex items-center justify-center text-white shadow-[0_0_12px_rgba(0,210,255,0.9)]">
                        <Volume2 className="w-2.5 h-2.5 animate-pulse" />
                        <span className="absolute -inset-0.5 rounded-full border border-[#00D2FF] animate-ping opacity-60 pointer-events-none" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Rapid-Fire Active Badge on Button */}
                <AnimatePresence>
                  {rapidFireActive && (
                    <motion.div
                      initial={{ scale: 0, y: 10, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      exit={{ scale: 0.2, opacity: 0 }}
                      transition={{ type: 'spring', damping: 12, stiffness: 350 }}
                      className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-400 text-[9px] font-black text-white shadow-[0_0_15px_rgba(255,184,0,0.9)] z-40 border border-white flex items-center gap-0.5 select-none pointer-events-none"
                    >
                      <Zap className="w-2.5 h-2.5 fill-white animate-pulse" />
                      <span>RAPID-FIRE!</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Circular Progress Arc Counting Down 3-Second Combo Streak Window */}
                <AnimatePresence>
                  {giftCombo > 0 && (
                    <motion.svg
                      id="hero-gift-combo-arc"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute -top-1.5 -left-1.5 w-14 h-14 -rotate-90 pointer-events-none z-30 overflow-visible select-none"
                      viewBox="0 0 56 56"
                    >
                      <defs>
                        <linearGradient id="heroGiftComboGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FFE066" />
                          <stop offset="50%" stopColor="#FF8A00" />
                          <stop offset="100%" stopColor="#FF2A6D" />
                        </linearGradient>
                        <filter id="heroGiftComboGlow" x="-30%" y="-30%" width="160%" height="160%">
                          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#FFD700" floodOpacity="0.9" />
                          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#FF2A6D" floodOpacity="0.6" />
                        </filter>
                        <filter id="heroGiftGlitchGlow" x="-30%" y="-30%" width="160%" height="160%">
                          <feDropShadow dx="-1.5" dy="0" stdDeviation="3.5" floodColor="#00F0FF" floodOpacity="1" />
                          <feDropShadow dx="1.5" dy="0" stdDeviation="4.5" floodColor="#FF0055" floodOpacity="0.9" />
                        </filter>
                      </defs>

                      {/* Subtle track outline representing full 3-second boundary */}
                      <circle
                        cx="28"
                        cy="28"
                        r="25"
                        fill="none"
                        stroke={isComboGlitching ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)'}
                        strokeWidth="2.5"
                      />

                      {/* Countdown progress arc: sweeps down from 100% to 0% over 3.0 seconds */}
                      <motion.circle
                        key={comboResetKey}
                        cx="28"
                        cy="28"
                        r="25"
                        fill="none"
                        stroke={isComboGlitching ? '#00F0FF' : 'url(#heroGiftComboGradient)'}
                        strokeWidth={isComboGlitching ? '4.0' : '3.2'}
                        strokeLinecap="round"
                        strokeDasharray={157.08}
                        initial={{ strokeDashoffset: 0 }}
                        animate={{ strokeDashoffset: 157.08 }}
                        transition={{ duration: 3.0, ease: 'linear' }}
                        filter={isComboGlitching ? 'url(#heroGiftGlitchGlow)' : 'url(#heroGiftComboGlow)'}
                        className={isComboGlitching ? 'animate-pulse' : ''}
                      />
                    </motion.svg>
                  )}
                </AnimatePresence>

                {/* ❄️/⚡ Temporary 'Glitch' or 'Freeze' Alert Overlay (Final 0.5s of Combo Window) */}
                <AnimatePresence>
                  {isComboGlitching && (
                    <motion.div
                      id="hero-gift-glitch-freeze-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.85, 1, 0.7, 1] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1, repeat: Infinity }}
                      className="absolute inset-0 rounded-full pointer-events-none z-25 overflow-hidden flex items-center justify-center select-none"
                    >
                      {/* Icy crystalline frost shimmer & cyan/magenta chromatic strobe */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400/30 via-rose-500/20 to-blue-400/30 mix-blend-screen animate-pulse" />
                      <div className="absolute inset-0 rounded-full border-2 border-cyan-300 shadow-[inset_0_0_14px_rgba(0,240,255,0.95),0_0_18px_rgba(0,240,255,0.85)]" />

                      {/* Fast horizontal glitch scanlines */}
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,240,255,0.4)_3px,transparent_4px)] opacity-60" />

                      {/* Alert Tag on the button: 0.5s freeze alert */}
                      <div className="absolute -bottom-2.5 px-1.5 py-0.5 rounded-full bg-black/95 border border-cyan-400 text-cyan-300 text-[8px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(0,240,255,0.95)] flex items-center gap-0.5 z-40">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                        <span>0.5s!</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Floating Combo Badge */}
                <AnimatePresence>
                  {giftCombo > 1 && (
                    <motion.div
                      key={giftCombo}
                      initial={{ scale: 0.4, y: 4, opacity: 0 }}
                      animate={{ scale: [1, 1.28, 1], y: -10, opacity: 1 }}
                      exit={{ scale: 0.5, y: -18, opacity: 0 }}
                      transition={{ type: 'spring', damping: 14, stiffness: 340 }}
                      className="absolute -top-2 -right-3 z-30 pointer-events-none select-none"
                    >
                      <div
                        className={`px-2 py-0.5 rounded-full border-2 border-white text-white font-black text-[11px] leading-tight flex items-center gap-0.5 tracking-tight italic transition-all duration-150 ${
                          isComboGlitching
                            ? 'bg-gradient-to-r from-cyan-400 via-rose-500 to-amber-300 animate-pulse shadow-[0_0_16px_rgba(0,240,255,1)] ring-2 ring-cyan-300'
                            : 'bg-gradient-to-r from-[#FF2A6D] via-[#FF8A00] to-[#FFD700] shadow-[0_0_12px_rgba(255,42,109,0.9)]'
                        }`}
                      >
                        <span>{isComboGlitching ? '⚡ FREEZE' : 'COMBO'}</span>
                        <span className={`${isComboGlitching ? 'text-white' : 'text-amber-200'} drop-shadow`}>
                          x{giftCombo}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ✨ Gold Glitter Sparks Particle System on Hover & Click */}
                <div
                  id="hero-gift-glitter-sparks"
                  className="absolute inset-0 pointer-events-none z-30 overflow-visible select-none"
                >
                  {glitterSparks.map((spark) => (
                    <motion.div
                      key={spark.id}
                      initial={{
                        x: spark.originX,
                        y: spark.originY,
                        scale: 0,
                        opacity: 0,
                        rotate: 0,
                      }}
                      animate={{
                        x: spark.originX + spark.targetX,
                        y: spark.originY + spark.targetY,
                        scale: [0, 1.4, 0],
                        opacity: [0, 1, 0],
                        rotate: (Math.random() > 0.5 ? 1 : -1) * (60 + Math.random() * 120),
                      }}
                      transition={{
                        duration: spark.duration,
                        delay: spark.delay,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      onAnimationComplete={() => {
                        setGlitterSparks((prev) => prev.filter((s) => s.id !== spark.id));
                      }}
                      style={{
                        width: spark.size,
                        height: spark.size,
                        color: spark.color,
                        filter: `drop-shadow(0 0 3px ${spark.color}) drop-shadow(0 0 6px #FFD700)`,
                      }}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    >
                      {spark.type === 'star' ? (
                        <svg viewBox="0 0 24 24" className="w-full h-full fill-current overflow-visible">
                          <path d="M12 0C12 7.2 16.8 12 24 12C16.8 12 12 16.8 12 24C12 16.8 7.2 12 0 12C7.2 12 12 7.2 12 0Z" />
                        </svg>
                      ) : spark.type === 'diamond' ? (
                        <div
                          style={{ backgroundColor: spark.color }}
                          className="w-full h-full rotate-45 rounded-xs"
                        />
                      ) : (
                        <div
                          style={{ backgroundColor: spark.color }}
                          className="w-full h-full rounded-full shadow-[0_0_6px_#FFD700]"
                        />
                      )}
                    </motion.div>
                  ))}
                </div>
              </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Rapid-Fire Massive Combined Animation: Erupting Particles ── */}
        <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
          {rapidFireParticles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, x: 0, y: 0, scale: 0.4 }}
              animate={{
                opacity: [1, 1, 0],
                x: p.x,
                y: p.y,
                scale: [0.5, p.scale * 1.5, 0.2],
                rotate: p.rotate,
              }}
              transition={{ duration: 1.8, ease: 'easeOut' }}
              style={{ right: '28px', bottom: '30px' }}
              className="absolute text-3xl filter drop-shadow-[0_0_12px_rgba(255,184,0,0.9)] select-none pointer-events-none"
            >
              {p.icon}
            </motion.div>
          ))}
        </div>

        {/* ── Rapid-Fire Massive Combined Animation: Center Banner ── */}
        <AnimatePresence>
          {rapidFireBanner && (
            <motion.div
              initial={{ scale: 0.2, y: 35, opacity: 0 }}
              animate={{ scale: [0.75, 1.15, 1], y: 0, opacity: 1 }}
              exit={{ scale: 1.35, opacity: 0, filter: 'blur(8px)' }}
              transition={{ type: 'spring', damping: 14, stiffness: 280 }}
              className="absolute inset-x-3 top-1/3 flex flex-col items-center justify-center pointer-events-none z-50 select-none"
            >
              <div className="relative w-full max-w-[340px] rounded-3xl bg-gradient-to-r from-[#FF0055] via-[#FF8A00] to-[#FFD700] p-[3px] shadow-[0_0_50px_rgba(255,42,109,0.95)] animate-pulse">
                <div className="bg-[#0e0720]/95 backdrop-blur-md rounded-3xl p-4 flex items-center gap-3 border border-white/25">
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 via-orange-500 to-amber-400 flex items-center justify-center text-3xl shadow-xl border-2 border-white animate-bounce shrink-0">
                    {rapidFireBanner.icon}
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-[10px] font-black text-black flex items-center justify-center border border-white shadow">
                      x{rapidFireBanner.count}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
                      <span className="text-[11px] font-black tracking-wider text-amber-300 uppercase drop-shadow">
                        ⚡ RAPID-FIRE COMBO!
                      </span>
                    </div>
                    <span className="text-base font-black text-white drop-shadow-md tracking-tight truncate">
                      {rapidFireBanner.name} x{rapidFireBanner.count} BARRAGE!
                    </span>
                    <span className="text-[11px] font-bold text-amber-400/90">
                      +{((lastGiftItem.coins * rapidFireBanner.count) * 2).toLocaleString()} PK Clash Power!
                    </span>
                  </div>
                  <span className="text-3xl animate-bounce shrink-0">🔥</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 4. Interactive Gift Modal Sheet ── */}
        <GiftModal
          isOpen={isGiftModalOpen}
          onClose={() => setIsGiftModalOpen(false)}
          userCoins={userCoins}
          currentCombo={giftCombo}
          selectedGift={lastGiftItem}
          onSelectGift={(gift) => setLastGiftItem(gift)}
          onSendGift={handleSendGift}
          onRecharge={() => setUserCoins((prev) => prev + 5000)}
        />
      </div>
    </div>
  );
}
