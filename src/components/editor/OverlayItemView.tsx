import React, { useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import type { OverlayItem } from '../../video/editorConfig';

interface Props {
  item: OverlayItem;
  canvasWidth: number;
  canvasHeight: number;
  selected: boolean;
  // While the picture of the text and stickers is being taken, no outlines are drawn.
  capturing: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
}

// One piece of text or one sticker on the video: drag it anywhere, tap it to select.
// Its position is kept as a share of the canvas (0..1), so it lands in the same
// place in the finished video however big the screen is.
export function OverlayItemView({ item, canvasWidth, canvasHeight, selected, capturing, onSelect, onMove }: Props) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const live = useRef({ item, canvasWidth, canvasHeight, onMove, onSelect });
  live.current = { item, canvasWidth, canvasHeight, onMove, onSelect };
  const start = useRef({ x: 0, y: 0 });

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        start.current = { x: live.current.item.x, y: live.current.item.y };
        live.current.onSelect();
      },
      onPanResponderMove: (_e, g) => {
        const { canvasWidth: w, canvasHeight: h } = live.current;
        const nx = Math.min(1, Math.max(0, start.current.x + g.dx / w));
        const ny = Math.min(1, Math.max(0, start.current.y + g.dy / h));
        live.current.onMove(nx, ny);
      },
    }),
  ).current;

  const fontSize = item.size * (canvasWidth / 360);
  return (
    <View
      {...pan.panHandlers}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={[
        styles.item,
        { left: item.x * canvasWidth - box.w / 2, top: item.y * canvasHeight - box.h / 2 },
        selected && !capturing && styles.selected,
      ]}
    >
      <Text
        style={[
          styles.text,
          { fontSize, color: item.color },
          item.kind === 'text' && { textShadowColor: item.color === '#000000' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },
        ]}
      >
        {item.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { position: 'absolute', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, maxWidth: '92%' },
  selected: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)', borderStyle: 'dashed' },
  text: { fontWeight: '900', textAlign: 'center' },
});
