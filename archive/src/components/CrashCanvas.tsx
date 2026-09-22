import React, { useEffect, useRef } from 'react';
import type { RoundStatus } from '../types';

interface CrashCanvasProps {
  status: RoundStatus;
  currentMultiplier: number;
  crashPoint: number;
  countdownSeconds: number;
  flightDurationMs: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
}

export function CrashCanvas({
  status,
  currentMultiplier,
  crashPoint,
  countdownSeconds,
  flightDurationMs,
}: CrashCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const explosionParticlesRef = useRef<Particle[]>([]);
  const shockwaveRef = useRef<{ x: number; y: number; radius: number; alpha: number } | null>(null);
  const shakeRef = useRef<number>(0);

  // Initialize background starfield
  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * 1000,
        y: Math.random() * 600,
        size: Math.random() * 1.8 + 0.6,
        speed: Math.random() * 0.8 + 0.4,
        alpha: Math.random() * 0.6 + 0.2,
      });
    }
    starsRef.current = stars;
  }, []);

  // Trigger explosion on crash
  useEffect(() => {
    if (status === 'CRASHED' && canvasRef.current) {
      shakeRef.current = 12; // Screen shake magnitude

      // Find the last rocket position
      const canvas = canvasRef.current;
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      const padLeft = 45;
      const padBottom = 40;
      const padTop = 30;
      const padRight = 45;

      const progress = Math.min(1, flightDurationMs / 10000);
      const rocketX = padLeft + (width - padLeft - padRight) * Math.min(0.92, 0.15 + progress * 0.8);
      const multFactor = Math.min(1, (crashPoint - 1) / Math.max(crashPoint - 1, 4));
      const rocketY = height - padBottom - (height - padBottom - padTop) * Math.min(0.85, multFactor * 0.8 + 0.05);

      shockwaveRef.current = { x: rocketX, y: rocketY, radius: 10, alpha: 1 };

      const explosion: Particle[] = [];
      const colors = ['#FF4757', '#FFA502', '#FF6348', '#FFD32A', '#FFFFFF'];
      for (let i = 0; i < 70; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 9 + 2;
        explosion.push({
          x: rocketX,
          y: rocketY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          size: Math.random() * 5 + 2,
          alpha: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 0,
          maxLife: Math.random() * 40 + 25,
        });
      }
      explosionParticlesRef.current = explosion;
    }
  }, [status, crashPoint, flightDurationMs]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min(32, time - lastTime);
      lastTime = time;

      // Handle High DPI displays
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const displayWidth = Math.floor(rect.width);
      const displayHeight = Math.floor(rect.height);

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Handle screen shake
      if (shakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * shakeRef.current;
        const shakeY = (Math.random() - 0.5) * shakeRef.current;
        ctx.translate(shakeX, shakeY);
        shakeRef.current = Math.max(0, shakeRef.current - dt * 0.04);
      }

      // 1. Background Fill - Lighter modern gaming slate canvas
      ctx.fillStyle = '#202838';
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      // Subtle radial glow from center
      const bgGrad = ctx.createRadialGradient(
        displayWidth * 0.45,
        displayHeight * 0.5,
        20,
        displayWidth * 0.45,
        displayHeight * 0.5,
        displayWidth * 0.7
      );
      bgGrad.addColorStop(0, 'rgba(48, 62, 86, 0.55)');
      bgGrad.addColorStop(1, 'rgba(26, 33, 46, 0.95)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      // 2. Animate Starfield / Speed Dust
      const starSpeedMultiplier = status === 'FLYING' ? Math.min(5, 1 + currentMultiplier * 0.4) : 0.6;
      ctx.fillStyle = '#FFFFFF';
      starsRef.current.forEach((star) => {
        star.x -= star.speed * starSpeedMultiplier * 1.5;
        star.y += star.speed * starSpeedMultiplier * 0.5;
        if (star.x < 0) star.x = displayWidth + 20;
        if (star.y > displayHeight) star.y = -10;

        ctx.globalAlpha = star.alpha * (status === 'FLYING' ? 0.85 : 0.35);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // 3. Grid Lines & Axes Layout
      const padLeft = 45;
      const padBottom = 38;
      const padTop = 30;
      const padRight = 55;
      const graphW = displayWidth - padLeft - padRight;
      const graphH = displayHeight - padBottom - padTop;

      // Grid Style
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillStyle = '#6E7687';
      ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Horizontal lines (Multiplier levels)
      const maxDisplayMult = Math.max(2.0, status === 'FLYING' ? currentMultiplier * 1.25 : Math.max(crashPoint * 1.1, 2.5));
      const ySteps = 5;
      for (let i = 0; i <= ySteps; i++) {
        const fraction = i / ySteps;
        const y = padTop + graphH * (1 - fraction);
        const multLabel = (1.0 + (maxDisplayMult - 1.0) * fraction).toFixed(1) + 'x';

        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(displayWidth - padRight + 8, y);
        ctx.stroke();

        ctx.fillText(multLabel, displayWidth - 10, y);
      }

      // Vertical lines (Time in seconds)
      const maxSeconds = Math.max(10, Math.ceil(flightDurationMs / 1000) + 4);
      const xSteps = 5;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let j = 0; j <= xSteps; j++) {
        const fraction = j / xSteps;
        const x = padLeft + graphW * fraction;
        const timeLabel = Math.round(fraction * maxSeconds) + 's';

        ctx.beginPath();
        ctx.moveTo(x, padTop);
        ctx.lineTo(x, displayHeight - padBottom);
        ctx.stroke();

        ctx.fillText(timeLabel, x, displayHeight - padBottom + 10);
      }

      // Baseline Axes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padLeft, padTop - 5);
      ctx.lineTo(padLeft, displayHeight - padBottom);
      ctx.lineTo(displayWidth - padRight + 12, displayHeight - padBottom);
      ctx.stroke();

      // 4. Draw Curve & Rocket
      if (status === 'FLYING' || status === 'CRASHED') {
        const displayMult = status === 'CRASHED' ? crashPoint : currentMultiplier;
        const flightSec = flightDurationMs / 1000;

        // Generate points along exponential trajectory
        const numPoints = 65;
        const points: { x: number; y: number }[] = [];

        for (let k = 0; k <= numPoints; k++) {
          const tRatio = k / numPoints;
          const currentT = tRatio * flightSec;

          // x mapped along timeline
          const x = padLeft + graphW * Math.min(1, currentT / maxSeconds);

          // Simulated multiplier at this point
          const mAtT = 1.0 + (displayMult - 1.0) * Math.pow(tRatio, 1.45);
          const yRatio = (mAtT - 1.0) / (maxDisplayMult - 1.0);
          const y = displayHeight - padBottom - graphH * Math.min(1, Math.max(0, yRatio));

          points.push({ x, y });
        }

        if (points.length > 1) {
          const tip = points[points.length - 1];
          const prev = points[points.length - 2];
          const angle = Math.atan2(tip.y - prev.y, tip.x - prev.x);

          // Gradient fill under the curve
          const areaGrad = ctx.createLinearGradient(padLeft, padTop, padLeft, displayHeight - padBottom);
          if (status === 'CRASHED') {
            areaGrad.addColorStop(0, 'rgba(255, 71, 87, 0.35)');
            areaGrad.addColorStop(0.6, 'rgba(255, 71, 87, 0.1)');
            areaGrad.addColorStop(1, 'rgba(255, 71, 87, 0.0)');
          } else {
            areaGrad.addColorStop(0, 'rgba(0, 231, 1, 0.35)');
            areaGrad.addColorStop(0.6, 'rgba(0, 231, 1, 0.1)');
            areaGrad.addColorStop(1, 'rgba(0, 231, 1, 0.0)');
          }

          ctx.beginPath();
          ctx.moveTo(points[0].x, displayHeight - padBottom);
          for (let p = 0; p < points.length; p++) {
            ctx.lineTo(points[p].x, points[p].y);
          }
          ctx.lineTo(tip.x, displayHeight - padBottom);
          ctx.closePath();
          ctx.fillStyle = areaGrad;
          ctx.fill();

          // Outer Glow Line
          ctx.shadowBlur = status === 'CRASHED' ? 14 : 18;
          ctx.shadowColor = status === 'CRASHED' ? '#FF4757' : '#00E701';
          ctx.strokeStyle = status === 'CRASHED' ? '#FF4757' : '#00E701';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let p = 1; p < points.length; p++) {
            ctx.lineTo(points[p].x, points[p].y);
          }
          ctx.stroke();

          // Reset shadow
          ctx.shadowBlur = 0;

          // Inner Crisp Stroke
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // If still flying: spawn jet particles and draw Rocket Ship
          if (status === 'FLYING') {
            // Spawn engine thruster particles
            const exhaustX = tip.x - Math.cos(angle) * 12;
            const exhaustY = tip.y - Math.sin(angle) * 12;

            for (let e = 0; e < 4; e++) {
              const spread = (Math.random() - 0.5) * 0.6;
              const pSpeed = Math.random() * 4 + 3;
              particlesRef.current.push({
                x: exhaustX,
                y: exhaustY,
                vx: -Math.cos(angle + spread) * pSpeed + (Math.random() - 0.5) * 1.5,
                vy: -Math.sin(angle + spread) * pSpeed + (Math.random() - 0.5) * 1.5,
                size: Math.random() * 4 + 2,
                alpha: 1,
                color: Math.random() > 0.4 ? '#00E701' : Math.random() > 0.5 ? '#FFD32A' : '#FFA502',
                life: 0,
                maxLife: Math.random() * 22 + 10,
              });
            }

            // Draw modern stylized Rocket at tip
            ctx.save();
            ctx.translate(tip.x, tip.y);
            ctx.rotate(angle);

            // Rocket Body
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(16, 0); // Nose tip
            ctx.quadraticCurveTo(8, -8, -12, -7); // Top hull
            ctx.lineTo(-15, -4); // Thruster top
            ctx.lineTo(-15, 4); // Thruster bottom
            ctx.lineTo(-12, 7); // Bottom hull
            ctx.quadraticCurveTo(8, 8, 16, 0);
            ctx.closePath();
            ctx.fill();

            // Wings / Fins
            ctx.fillStyle = '#00E701';
            ctx.beginPath();
            ctx.moveTo(-4, -6);
            ctx.lineTo(-14, -14);
            ctx.lineTo(-11, -4);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(-4, 6);
            ctx.lineTo(-14, 14);
            ctx.lineTo(-11, 4);
            ctx.closePath();
            ctx.fill();

            // Cockpit glass
            ctx.fillStyle = '#17191E';
            ctx.beginPath();
            ctx.ellipse(3, 0, 4, 2.5, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#00E701';
            ctx.beginPath();
            ctx.arc(2, -0.8, 1, 0, Math.PI * 2);
            ctx.fill();

            // Thruster fire glow
            ctx.fillStyle = '#FFA502';
            ctx.beginPath();
            ctx.moveTo(-15, -3);
            ctx.lineTo(-24 - Math.random() * 6, 0);
            ctx.lineTo(-15, 3);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
          }
        }
      }

      // 5. Update & Draw Jet Thruster Particles
      ctx.globalCompositeOperation = 'lighter';
      for (let p = particlesRef.current.length - 1; p >= 0; p--) {
        const pt = particlesRef.current[p];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life++;
        pt.alpha = Math.max(0, 1 - pt.life / pt.maxLife);
        pt.size = Math.max(0.2, pt.size * 0.96);

        if (pt.alpha <= 0 || pt.life >= pt.maxLife) {
          particlesRef.current.splice(p, 1);
          continue;
        }

        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. Update & Draw Explosion & Shockwave
      if (shockwaveRef.current) {
        const sw = shockwaveRef.current;
        sw.radius += 3.5;
        sw.alpha = Math.max(0, sw.alpha - 0.035);

        ctx.strokeStyle = `rgba(255, 71, 87, ${sw.alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();

        if (sw.alpha <= 0) {
          shockwaveRef.current = null;
        }
      }

      for (let ex = explosionParticlesRef.current.length - 1; ex >= 0; ex--) {
        const ep = explosionParticlesRef.current[ex];
        ep.x += ep.vx;
        ep.y += ep.vy;
        ep.vy += 0.12; // gravity
        ep.life++;
        ep.alpha = Math.max(0, 1 - ep.life / ep.maxLife);

        if (ep.alpha <= 0 || ep.life >= ep.maxLife) {
          explosionParticlesRef.current.splice(ex, 1);
          continue;
        }

        ctx.fillStyle = ep.color;
        ctx.globalAlpha = ep.alpha;
        ctx.beginPath();
        ctx.arc(ep.x, ep.y, ep.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [status, currentMultiplier, crashPoint, flightDurationMs]);

  // Determine text color based on multiplier tiers (BC.Game style)
  const getMultiplierColor = (mult: number) => {
    if (status === 'CRASHED') return 'text-[#FF4757] drop-shadow-[0_0_24px_rgba(255,71,87,0.7)]';
    if (mult >= 100) return 'text-[#A855F7] drop-shadow-[0_0_30px_rgba(168,85,247,0.8)]';
    if (mult >= 10) return 'text-[#FFB800] drop-shadow-[0_0_25px_rgba(255,184,0,0.8)]';
    if (mult >= 2) return 'text-[#00E701] drop-shadow-[0_0_20px_rgba(0,231,1,0.7)]';
    return 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]';
  };

  return (
    <div className="relative w-full h-[340px] sm:h-[400px] md:h-[460px] rounded-2xl overflow-hidden bg-[#202838] border border-white/10 shadow-2xl flex flex-col justify-center items-center select-none">
      {/* HTML5 2D Interactive High-FPS Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Top Left Watermark / Network indicator */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-medium text-white/70">
        <span className="w-2 h-2 rounded-full bg-[#00E701] animate-pulse" />
        <span className="tracking-wide">99.0% RTP · Provably Fair</span>
      </div>

      {/* Top Right Live Flight Time */}
      {(status === 'FLYING' || status === 'CRASHED') && (
        <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-mono font-medium text-white/60">
          {(flightDurationMs / 1000).toFixed(1)}s elapsed
        </div>
      )}

      {/* Center HUD: Countdown vs Active Multiplier vs Crashed Alert */}
      <div className="relative z-10 pointer-events-none flex flex-col items-center justify-center text-center px-4">
        {status === 'COUNTDOWN' && (
          <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
            <div className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28">
              {/* Circular progress track */}
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="6" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#00E701"
                  strokeWidth="6"
                  strokeDasharray="264"
                  strokeDashoffset={264 * (1 - Math.max(0, countdownSeconds) / 5)}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-100 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tighter text-white">
                  {Math.max(0, countdownSeconds).toFixed(1)}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#00E701]">SEC</span>
              </div>
            </div>
            <div className="text-sm sm:text-base font-semibold text-white/80 tracking-wide flex items-center gap-1.5">
              <span>Next round starts in</span>
              <span className="text-[#00E701] font-bold">{countdownSeconds.toFixed(1)}s</span>
            </div>
            <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-[#00E701] to-[#22D3A5] transition-all duration-100 ease-linear rounded-full"
                style={{ width: `${(Math.max(0, countdownSeconds) / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        {status === 'FLYING' && (
          <div className="flex flex-col items-center">
            <span className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-white/50 mb-1">
              Current Multiplier
            </span>
            <div
              className={`text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-tight transition-colors duration-150 ${getMultiplierColor(
                currentMultiplier
              )}`}
            >
              {currentMultiplier.toFixed(2)}
              <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold ml-1">×</span>
            </div>
            <div className="mt-2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-xs text-white/80 font-medium">
              Flying high... Cash out before crash!
            </div>
          </div>
        )}

        {status === 'CRASHED' && (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="px-4 py-1.5 rounded-full bg-[#FF4757]/20 border border-[#FF4757]/50 text-xs sm:text-sm font-black uppercase tracking-widest text-[#FF4757] mb-2 flex items-center gap-2 shadow-lg shadow-[#FF4757]/20">
              <span className="w-2 h-2 rounded-full bg-[#FF4757] animate-ping" />
              CRASHED
            </div>
            <div
              className={`text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-tight ${getMultiplierColor(
                crashPoint
              )}`}
            >
              @{crashPoint.toFixed(2)}
              <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold ml-1">×</span>
            </div>
            <div className="mt-2 text-xs sm:text-sm font-semibold text-white/60">
              Round closed · Preparing next round
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
