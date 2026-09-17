import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, ZoomIn, ZoomOut, RotateCw, Move, Crop, RefreshCw } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isCropping, setIsCropping] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Reset adjustments whenever a new image or modal is opened
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      setIsDragging(false);
      setIsCropping(false);
    }
  }, [isOpen, imageSrc]);

  // Touch and Mouse drag handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging) return;
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Zoom control
  const handleZoomChange = (newZoom: number) => {
    setZoom(Math.min(3, Math.max(0.6, Number(newZoom.toFixed(2)))));
  };

  // Rotate by 90 deg clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Reset adjustments to initial
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // Generate cropped circular result to high-res canvas (400x400)
  const handleConfirmCrop = () => {
    if (!imgRef.current) return;
    setIsCropping(true);

    const canvas = document.createElement('canvas');
    const targetSize = 400; // standard clean profile resolution
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsCropping(false);
      return;
    }

    // High quality smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // We want the cropped output to reflect what's inside the circular crop mask
    // Crop circle diameter in the viewport is 220px
    const maskDiameter = 220;
    const scaleFactor = targetSize / maskDiameter;

    ctx.save();
    // Center point of output canvas
    ctx.translate(targetSize / 2, targetSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom * scaleFactor, zoom * scaleFactor);

    // Apply pan offset (adjusted for scale and rotation)
    // Pan in canvas space:
    const rad = (-rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const unrotatedPanX = pan.x * cos - pan.y * sin;
    const unrotatedPanY = pan.x * sin + pan.y * cos;

    // Draw the image centered
    const img = imgRef.current;
    const naturalWidth = img.naturalWidth || 400;
    const naturalHeight = img.naturalHeight || 400;

    // Calculate display aspect to match the rendered img in 220px box
    const maxDim = Math.max(naturalWidth, naturalHeight);
    const baseW = (naturalWidth / maxDim) * maskDiameter;
    const baseH = (naturalHeight / maxDim) * maskDiameter;

    ctx.drawImage(
      img,
      unrotatedPanX / (zoom * scaleFactor) - baseW / 2,
      unrotatedPanY / (zoom * scaleFactor) - baseH / 2,
      baseW,
      baseH
    );
    ctx.restore();

    try {
      const croppedData = canvas.toDataURL('image/jpeg', 0.92);
      onCropComplete(croppedData);
      onClose();
    } catch {
      // If cross-origin image tainted canvas, fallback to raw url
      onCropComplete(imageSrc);
      onClose();
    } finally {
      setIsCropping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="image-crop-modal-overlay"
      className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none"
    >
      <div className="w-full max-w-sm bg-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Crop Profile Photo</h3>
              <p className="text-[10px] text-slate-400">Drag to reposition, pinch or slider to zoom</p>
            </div>
          </div>
          <button
            type="button"
            id="close-crop-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Cancel Crop"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport / Crop Work Area */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          className="relative w-full h-72 bg-slate-950 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing touch-none"
        >
          {/* Subtle grid background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Transformed Image */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            className="pointer-events-none origin-center flex items-center justify-center"
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop target"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              className="max-w-none w-56 h-56 object-cover select-none pointer-events-none rounded-none shadow-lg"
              draggable={false}
            />
          </div>

          {/* Circular Mask Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Cutout Ring with darkened surround */}
            <div
              className="w-56 h-56 rounded-full border-2 border-purple-500 shadow-[0_0_0_9999px_rgba(10,15,30,0.72)] relative flex items-center justify-center"
            >
              {/* Inner Crosshairs / Guidelines */}
              <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
              <div className="w-full h-px bg-white/15 pointer-events-none" />
              <div className="h-full w-px bg-white/15 absolute inset-y-0 left-1/2 pointer-events-none" />

              {/* Move helper badge */}
              <div className="absolute bottom-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[9px] font-bold text-white/80 flex items-center gap-1 border border-white/10">
                <Move className="w-2.5 h-2.5" /> Drag to adjust
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Miniature & Controls */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3.5">
          {/* Zoom Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-[11px]">
                <ZoomIn className="w-3.5 h-3.5 text-purple-400" /> Zoom
              </span>
              <span className="font-mono text-[11px] text-purple-300">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleZoomChange(zoom - 0.15)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <input
                id="crop-zoom-slider"
                type="range"
                min="0.6"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleZoomChange(zoom + 0.15)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Action Tools: Rotate, Reset, Live Preview */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="crop-rotate-btn"
                onClick={handleRotate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer active:scale-95"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-3.5 h-3.5 text-purple-400" />
                <span>Rotate</span>
              </button>

              <button
                type="button"
                id="crop-reset-btn"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Reset Position"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Circular Thumbnail Preview */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Preview
              </span>
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-purple-500 shadow-md bg-slate-950 relative">
                <div
                  style={{
                    transform: `translate(${(pan.x / 220) * 36}px, ${(pan.y / 220) * 36}px) scale(${zoom}) rotate(${rotation}deg)`,
                  }}
                  className="w-full h-full origin-center flex items-center justify-center"
                >
                  <img
                    src={imageSrc}
                    alt="Preview"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dialog Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              id="crop-cancel-btn"
              onClick={onClose}
              disabled={isCropping}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              id="crop-apply-btn"
              onClick={handleConfirmCrop}
              disabled={isCropping}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Apply Crop</span>
            </button>
          </div>
        </div>

        {/* Hidden canvas element if needed */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
