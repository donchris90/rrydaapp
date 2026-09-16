import React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';

// Real SVG now that react-native-svg is confirmed installed
// (npx expo install react-native-svg) — same visual design as the
// plain-View version this replaces (backrest, base, two armrests), but
// as an actual vector shape: crisp at any size, no rounding artifacts
// from stacking positioned Views. This is a new native module, so it
// needs a fresh EAS dev-client build before it'll actually render on
// device — a JS-only reload isn't enough for a change like this one.
export function SofaIcon({ width, height, color }: { width: number; height: number; color: string }) {
  const armWidth = width * 0.18;
  const backHeight = height * 0.35;
  const seatHeight = height - backHeight;
  const seatY = backHeight;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Backrest */}
      <Path
        d={`M ${armWidth * 0.5} ${backHeight}
            L ${armWidth * 0.5} ${backHeight * 0.4}
            Q ${armWidth * 0.5} 0 ${armWidth * 0.5 + backHeight * 0.4} 0
            L ${width - armWidth * 0.5 - backHeight * 0.4} 0
            Q ${width - armWidth * 0.5} 0 ${width - armWidth * 0.5} ${backHeight * 0.4}
            L ${width - armWidth * 0.5} ${backHeight}
            Z`}
        fill={color}
      />
      {/* Seat base */}
      <Rect x={0} y={seatY} width={width} height={seatHeight} rx={seatHeight * 0.3} fill={color} />
      {/* Left armrest */}
      <Path
        d={`M 0 ${armWidth * 0.5}
            Q 0 0 ${armWidth * 0.5} 0
            L ${armWidth} 0
            L ${armWidth} ${height}
            L ${seatHeight * 0.3} ${height}
            Q 0 ${height} 0 ${height - seatHeight * 0.3}
            Z`}
        fill={color}
      />
      {/* Right armrest */}
      <Path
        d={`M ${width - armWidth} 0
            L ${width - armWidth * 0.5} 0
            Q ${width} 0 ${width} ${armWidth * 0.5}
            L ${width} ${height - seatHeight * 0.3}
            Q ${width} ${height} ${width - seatHeight * 0.3} ${height}
            L ${width - armWidth} ${height}
            Z`}
        fill={color}
      />
    </Svg>
  );
}

