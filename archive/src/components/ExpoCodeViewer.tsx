import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  FileCode,
  BookOpen,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { EXPO_FILES } from '../expoCodeExport';

export function ExpoCodeViewer() {
  const fileKeys = Object.keys(EXPO_FILES);
  const [activeFile, setActiveFile] = useState<string>(fileKeys[0] || 'GoLiveScreen.tsx');
  const [copied, setCopied] = useState(false);

  const activeContent = EXPO_FILES[activeFile] || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    const blob = new Blob([activeContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.split('/').pop() || 'file.tsx';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    // Generate an all-in-one bundle file or individual files
    let fullBundle = `/**\n * RRYDA LIVE REDESIGN - EXPO REACT NATIVE CODE ARCHIVE\n * Source repository: https://github.com/donchris90/rrydaapp\n */\n\n`;
    for (const [filename, content] of Object.entries(EXPO_FILES)) {
      fullBundle += `\n/* ========================================================\n * FILE: ${filename}\n * ======================================================== */\n\n`;
      fullBundle += content;
      fullBundle += `\n\n`;
    }
    const blob = new Blob([fullBundle], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rryda-expo-golivescreen-redesign.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="expo-code-viewer" className="w-full h-full flex flex-col bg-[#120B26] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#1A1332] border-b border-white/10 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7B4DFF] to-[#FF3D8A] flex items-center justify-center text-white shadow-md">
            <FileCode className="w-4 h-4" />
          </div>
          <div>
            <div className="text-white text-sm font-bold flex items-center gap-1.5">
              <span>React Native (Expo) Source Code</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-medium">
                rrydaapp Target
              </span>
            </div>
            <div className="text-[11px] text-[#B0A6D6]">
              Target: <code className="text-purple-300 font-mono">src/screens/live/GoLiveScreen.tsx</code>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md transition active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy File Code'}</span>
          </button>

          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/15 transition active:scale-95"
            title="Download full Expo package"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All ({fileKeys.length})</span>
          </button>
        </div>
      </div>

      {/* File Navigation Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 bg-[#160E2E] border-b border-white/5 overflow-x-auto scrollbar-none no-scrollbar">
        {fileKeys.map((key) => {
          const isSelected = activeFile === key;
          const label = key.split('/').pop() || key;
          return (
            <button
              key={key}
              onClick={() => setActiveFile(key)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                isSelected
                  ? 'bg-purple-600/30 text-white border border-purple-500/50 shadow-sm'
                  : 'text-[#B0A6D6] hover:bg-white/5 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-purple-400" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Code Display Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
        {/* Code View */}
        <div className="flex-1 overflow-auto p-4 bg-[#0D071D] text-xs font-mono text-purple-100 leading-relaxed scrollbar-thin">
          <pre className="select-text whitespace-pre">
            <code>{activeContent}</code>
          </pre>
        </div>

        {/* Integration Instructions Sidebar */}
        <div className="w-full md:w-80 bg-[#160E2E] border-t md:border-t-0 md:border-l border-white/10 p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-pink-400" />
            <span>Expo Integration Guide</span>
          </div>

          {/* Key Improvements Checklist */}
          <div className="bg-[#1D143D] rounded-xl p-3 border border-white/5 flex flex-col gap-2">
            <span className="text-white text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Redesign Highlights
            </span>
            <ul className="text-[11px] text-[#B0A6D6] space-y-1.5">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400">✓</span>
                <span><strong>Glassmorphism Top Header:</strong> Clean host info pill, duration counter, and viewer avatars without clipping.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400">✓</span>
                <span><strong>PK Battle Split Screen:</strong> Side-by-side video feeds with dynamic score tug-of-war and MVP badges.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400">✓</span>
                <span><strong>Interactive Floating Hearts:</strong> Double-tap physics particle emitter using React Native Animated.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400">✓</span>
                <span><strong>Pre-Live Studio Setup:</strong> Cover photo picker, category chips, stream tags, and studio beauty sliders.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400">✓</span>
                <span><strong>Post-Stream Summary:</strong> Full analytics modal with duration, viewers, diamonds, and top gifters.</span>
              </li>
            </ul>
          </div>

          {/* Quick Drop-in Path */}
          <div className="bg-[#1D143D] rounded-xl p-3 border border-white/5 flex flex-col gap-1.5">
            <div className="text-[11px] text-white font-semibold">Destination in rrydaapp:</div>
            <code className="text-[10px] text-purple-300 font-mono bg-black/40 p-1.5 rounded border border-white/5 break-all">
              rrydaapp/src/screens/live/GoLiveScreen.tsx
            </code>
            <div className="text-[10px] text-[#9490A6]">
              Copy the code above and replace your existing screen. Supporting components can be placed in <code className="text-purple-300 font-mono">src/components/live/</code>.
            </div>
          </div>

          <div className="text-[11px] text-purple-300/80 bg-purple-900/20 p-2.5 rounded-xl border border-purple-500/20 flex items-center gap-2">
            <span>🚀 Fully compatible with Expo Go & EAS builds on iOS and Android.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
