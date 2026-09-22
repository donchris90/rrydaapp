import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

interface PhoneFrameProps {
  children: React.ReactNode;
}

export function PhoneFrame({ children }: PhoneFrameProps) {
  const [timeStr, setTimeStr] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${h}:${m}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="phone-frame-wrapper" className="relative mx-auto flex items-center justify-center">
      {/* Phone Outer Chassis with metallic titanium ring */}
      <div
        id="phone-chassis"
        className="relative w-[390px] h-[810px] max-h-[92vh] rounded-[52px] bg-[#0A0716] p-[10px] shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.15),0_0_40px_rgba(123,77,255,0.2)] ring-1 ring-white/20 select-none overflow-hidden"
      >
        {/* Phone Glass Inner Screen */}
        <div
          id="phone-screen"
          className="relative w-full h-full rounded-[44px] bg-[#0F0A21] overflow-hidden flex flex-col font-sans"
        >
          {/* Status Bar */}
          <div
            id="phone-status-bar"
            className="absolute top-0 left-0 right-0 h-11 z-50 flex items-center justify-between px-7 pointer-events-none text-white text-xs font-semibold"
          >
            <span id="phone-clock" className="tracking-tight">{timeStr}</span>

            {/* Dynamic Island */}
            <div
              id="dynamic-island"
              className="absolute left-1/2 -translate-x-1/2 top-2 h-[26px] w-[110px] bg-black rounded-full flex items-center justify-between px-3.5 shadow-sm"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#1A1A2E] ring-1 ring-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#053F2E] flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-[#00E599] animate-pulse" />
              </div>
            </div>

            {/* Network / Battery Icons */}
            <div id="status-indicators" className="flex items-center gap-1.5 opacity-90 text-[11px]">
              <Signal className="w-3 h-3" />
              <span className="text-[10px] font-bold">5G</span>
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Screen Content */}
          <div id="phone-content-area" className="flex-1 relative overflow-hidden flex flex-col">
            {children}
          </div>

          {/* Home Indicator Bar */}
          <div
            id="home-indicator-bar"
            className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/40 rounded-full pointer-events-none z-50"
          />
        </div>
      </div>
    </div>
  );
}
