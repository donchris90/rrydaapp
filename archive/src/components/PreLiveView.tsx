import React, { useRef, useEffect } from 'react';
import {
  Camera,
  Mic,
  MicOff,
  Sparkles,
  Settings,
  X,
  Radio,
  Globe,
  Users,
  Lock,
  Wifi,
  Video,
  VideoOff,
} from 'lucide-react';
import type { SimBeautySettings } from '../types';

interface PreLiveViewProps {
  title: string;
  setTitle: (t: string) => void;
  category: string;
  setCategory: (c: string) => void;
  privacy: 'public' | 'friends' | 'private';
  setPrivacy: (p: 'public' | 'friends' | 'private') => void;
  isMicMuted: boolean;
  toggleMic: () => void;
  useWebcam: boolean;
  setUseWebcam: (v: boolean) => void;
  beautySettings: SimBeautySettings;
  onOpenBeauty: () => void;
  onOpenTools: () => void;
  onStartLive: () => void;
  onCancel: () => void;
}

const CATEGORIES = [
  { id: 'Chatting', label: 'Chatting', emoji: '💬' },
  { id: 'Singing', label: 'Singing', emoji: '🎤' },
  { id: 'Dancing', label: 'Dancing', emoji: '💃' },
  { id: 'Gaming', label: 'Gaming', emoji: '🎮' },
  { id: 'Just Chill', label: 'Just Chill', emoji: '☕' },
  { id: 'Storytime', label: 'Storytime', emoji: '📖' },
];

const SUGGESTIONS = ['#ChillVibes', '#LiveMusic', '#AskMeAnything', '#RankRush', '#GoodVibes'];

export function PreLiveView({
  title,
  setTitle,
  category,
  setCategory,
  privacy,
  setPrivacy,
  isMicMuted,
  toggleMic,
  useWebcam,
  setUseWebcam,
  beautySettings,
  onOpenBeauty,
  onOpenTools,
  onStartLive,
  onCancel,
}: PreLiveViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (useWebcam) {
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: false })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(() => {
          setUseWebcam(false);
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [useWebcam, setUseWebcam]);

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
    <div id="pre-live-view-container" className="relative w-full h-full flex flex-col justify-between overflow-hidden select-none">
      {/* Background Camera Feed */}
      <div className="absolute inset-0 z-0 bg-black overflow-hidden">
        {useWebcam ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover -scale-x-100 transition-all duration-300"
            style={{ filter: getFilterStyle() }}
          />
        ) : (
          <div className="relative w-full h-full">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&auto=format&fit=crop&q=80"
              alt="Streamer Preview"
              className="w-full h-full object-cover transition-all duration-300"
              style={{ filter: getFilterStyle() }}
            />
            {/* Live Camera Simulation Badge */}
            <div className="absolute bottom-28 left-4 bg-black/50 backdrop-blur-md rounded-lg px-2.5 py-1 text-[10px] text-purple-200 border border-white/10 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
              Studio Camera 1 • 60 FPS HD
            </div>
          </div>
        )}

        {/* Ambient Dark Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/85 pointer-events-none" />
      </div>

      {/* Top Pre-Live Action Bar */}
      <div className="relative z-10 pt-12 px-4 flex items-center justify-between">
        <button
          id="pre-live-close-btn"
          onClick={onCancel}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white hover:bg-black/60 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Stream Quality Pill */}
        <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md border border-emerald-500/30 px-3 py-1 rounded-full text-white text-[11px] font-semibold shadow-sm">
          <Wifi className="w-3 h-3 text-emerald-400" />
          <span>1080p 60fps</span>
        </div>

        {/* Right Quick Controls */}
        <div className="flex items-center gap-2">
          {/* Webcam Toggle */}
          <button
            id="webcam-toggle-btn"
            onClick={() => setUseWebcam(!useWebcam)}
            className={`w-9 h-9 rounded-full backdrop-blur-md border border-white/15 flex items-center justify-center transition ${
              useWebcam ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40' : 'bg-black/40 text-white/80 hover:bg-black/60'
            }`}
            title={useWebcam ? 'Switch to Virtual Camera' : 'Use Real Webcam'}
          >
            {useWebcam ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>

          {/* Mic Toggle */}
          <button
            id="pre-live-mic-btn"
            onClick={toggleMic}
            className={`w-9 h-9 rounded-full backdrop-blur-md border border-white/15 flex items-center justify-center transition ${
              isMicMuted ? 'bg-red-500/80 text-white' : 'bg-black/40 text-white hover:bg-black/60'
            }`}
          >
            {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Floating Setup Card */}
      <div className="relative z-10 px-4 my-auto">
        <div className="bg-[#150F2C]/80 backdrop-blur-xl rounded-2xl p-3.5 border border-white/15 shadow-2xl">
          {/* Cover Photo & Title Input */}
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden ring-2 ring-purple-500/60 shrink-0">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                alt="Cover preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <Camera className="w-4 h-4 text-white drop-shadow" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <input
                id="stream-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
                placeholder="Enter an engaging stream title..."
                className="w-full bg-transparent text-white placeholder-white/50 text-sm font-semibold focus:outline-none"
              />
              <div className="flex items-center justify-between text-[10px] text-white/50 mt-1">
                <span>Add tags to get discovered</span>
                <span>{title.length}/60</span>
              </div>
            </div>
          </div>

          {/* Suggested Tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none no-scrollbar">
            {SUGGESTIONS.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  if (!title.includes(tag)) {
                    setTitle(`${title} ${tag}`.trim().slice(0, 60));
                  }
                }}
                className="shrink-0 text-[11px] font-medium bg-white/10 hover:bg-white/20 text-purple-200 px-2.5 py-0.5 rounded-lg transition"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Category Carousel */}
          <div className="mt-1">
            <div className="text-[11px] font-bold text-white/80 mb-1.5 uppercase tracking-wider">
              Category
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
              {CATEGORIES.map((cat) => {
                const active = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition ${
                      active
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                        : 'bg-white/10 text-purple-200 hover:bg-white/15'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Room Privacy Segment */}
          <div className="mt-2.5 flex items-center bg-[#0F0A21] rounded-xl p-1 border border-white/5">
            <button
              onClick={() => setPrivacy('public')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded-lg text-xs font-medium transition ${
                privacy === 'public'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-300/70 hover:text-white'
              }`}
            >
              <Globe className="w-3 h-3 text-emerald-400" />
              <span>Public</span>
            </button>
            <button
              onClick={() => setPrivacy('friends')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded-lg text-xs font-medium transition ${
                privacy === 'friends'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-300/70 hover:text-white'
              }`}
            >
              <Users className="w-3 h-3 text-amber-400" />
              <span>Followers</span>
            </button>
            <button
              onClick={() => setPrivacy('private')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded-lg text-xs font-medium transition ${
                privacy === 'private'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-300/70 hover:text-white'
              }`}
            >
              <Lock className="w-3 h-3 text-rose-400" />
              <span>Private</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pre-Live Bottom Actions Bar */}
      <div className="relative z-10 pb-7 px-4 flex items-center justify-between gap-3">
        {/* Beauty Retouch Button */}
        <button
          id="pre-live-beauty-btn"
          onClick={onOpenBeauty}
          className="flex flex-col items-center gap-1 text-white/90 hover:text-white transition w-14"
        >
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-pink-400 shadow-md hover:bg-black/60">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-semibold">Beauty</span>
        </button>

        {/* Big Gradient "GO LIVE NOW" CTA */}
        <button
          id="go-live-cta-btn"
          onClick={onStartLive}
          className="flex-1 h-12 rounded-full bg-gradient-to-r from-[#7B4DFF] via-[#FF3D8A] to-[#FF8A00] flex items-center justify-center gap-2 text-white font-black text-sm uppercase tracking-wider shadow-[0_4px_20px_rgba(255,61,138,0.5)] hover:brightness-110 active:scale-95 transition"
        >
          <Radio className="w-4 h-4 animate-pulse" />
          <span>Go Live Now</span>
        </button>

        {/* Tools / Settings Button */}
        <button
          id="pre-live-settings-btn"
          onClick={onOpenTools}
          className="flex flex-col items-center gap-1 text-white/90 hover:text-white transition w-14"
        >
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white shadow-md hover:bg-black/60">
            <Settings className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-semibold">Tools</span>
        </button>
      </div>
    </div>
  );
}
