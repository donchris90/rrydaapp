import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface SofaIconProps {
  width: number;
  height: number;
  color?: string;
  locked?: boolean;
}

/**
 * Premium 3D Plush Sofa Icon for Party Audio Live empty seat representation.
 * 100% vector SVG rendering without pixel distortion or DOM dependencies.
 */
export function SofaIcon({ width, height, color = '#A399C6', locked = false }: SofaIconProps) {
  const armWidth = width * 0.18;
  const backHeight = height * 0.38;
  const seatHeight = height - backHeight;
  const seatY = backHeight;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Backrest Cushion */}
      <Path
        d={`M ${armWidth * 0.45} ${backHeight}
            L ${armWidth * 0.45} ${backHeight * 0.4}
            Q ${armWidth * 0.45} 0 ${armWidth * 0.45 + backHeight * 0.4} 0
            L ${width - armWidth * 0.45 - backHeight * 0.4} 0
            Q ${width - armWidth * 0.45} 0 ${width - armWidth * 0.45} ${backHeight * 0.4}
            L ${width - armWidth * 0.45} ${backHeight}
            Z`}
        fill={color}
        opacity={locked ? 0.4 : 0.85}
      />

      {/* Seat Cushion Base */}
      <Rect
        x={0}
        y={seatY}
        width={width}
        height={seatHeight}
        rx={seatHeight * 0.32}
        fill={color}
        opacity={locked ? 0.35 : 0.95}
      />

      {/* Left Armrest */}
      <Path
        d={`M 0 ${armWidth * 0.55}
            Q 0 0 ${armWidth * 0.55} 0
            L ${armWidth} 0
            L ${armWidth} ${height}
            L ${seatHeight * 0.3} ${height}
            Q 0 ${height} 0 ${height - seatHeight * 0.3}
            Z`}
        fill={color}
        opacity={locked ? 0.4 : 1}
      />

      {/* Right Armrest */}
      <Path
        d={`M ${width - armWidth} 0
            L ${width - armWidth * 0.55} 0
            Q ${width} 0 ${width} ${armWidth * 0.55}
            L ${width} ${height - seatHeight * 0.3}
            Q ${width} ${height} ${width - seatHeight * 0.3} ${height}
            L ${width - armWidth} ${height}
            Z`}
        fill={color}
        opacity={locked ? 0.4 : 1}
      />
    </Svg>
  );
}
