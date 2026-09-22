import React from 'react';
import Svg, { G, Path, Rect } from 'react-native-svg';

type SofaIconProps = {
  width: number;
  height: number;
  color: string;
};

export function SofaIcon({
  width,
  height,
  color,
}: SofaIconProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 120 80"
      fill="none"
    >
      <G
        transform="translate(18 12) scale(0.7)"
      >
        {/* Back of sofa */}
        <Path
          d="M20 36V21C20 13.3 26.3 7 34 7H86C93.7 7 100 13.3 100 21V36"
          fill={color}
        />

        {/* Left arm */}
        <Path
          d="M10 38C10 33.6 13.6 30 18 30H25V62H15C12.2 62 10 59.8 10 57V38Z"
          fill={color}
        />

        {/* Right arm */}
        <Path
          d="M110 38C110 33.6 106.4 30 102 30H95V62H105C107.8 62 110 59.8 110 57V38Z"
          fill={color}
        />

        {/* Main sofa body */}
        <Rect
          x="20"
          y="34"
          width="80"
          height="29"
          rx="8"
          fill={color}
        />

        {/* Left seat cushion */}
        <Rect
          x="25"
          y="37"
          width="32"
          height="20"
          rx="6"
          fill="#FFFFFF"
          fillOpacity={0.13}
        />

        {/* Right seat cushion */}
        <Rect
          x="63"
          y="37"
          width="32"
          height="20"
          rx="6"
          fill="#FFFFFF"
          fillOpacity={0.13}
        />

        {/* Cushion separation */}
        <Path
          d="M60 39V55"
          stroke={color}
          strokeOpacity={0.45}
          strokeWidth="2"
        />

        {/* Bottom edge */}
        <Path
          d="M18 62H102"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Legs */}
        <Path
          d="M27 63V70M93 63V70"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}
