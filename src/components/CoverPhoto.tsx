import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

type CoverPhotoProps = {
  coverUrl: string | null;
  offset: number;
  onUpload: (file: File) => Promise<void>;
  onReposition: (offset: number) => void;
  onRemove: () => void;
  theme: 'dark' | 'light';
};

export function CoverPhoto({ coverUrl, offset, onUpload, onReposition, onRemove, theme }: CoverPhotoProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ y: 0, offset: 0 });

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      onUpload(file);
    },
    [onUpload]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleFile(file);
            e.preventDefault();
            break;
          }
        }
      }
    },
    [handleFile]
  );

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!coverUrl) return;
    setDragging(true);
    dragStart.current = { y: e.clientY, offset };
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      const dy = e.clientY - dragStart.current.y;
      const container = containerRef.current;
      if (!container) return;
      const containerHeight = container.offsetHeight;
      const bgHeight = containerHeight * 1.5;
      const maxOffset = bgHeight - containerHeight;
      const newOffset = Math.max(0, Math.min(maxOffset, dragStart.current.offset + dy));
      onReposition((newOffset / containerHeight) * 100);
    };
    const handleUp = () => setDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, onReposition]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden group cursor-pointer border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-[#1a1a2e]"
      onMouseDown={handleMouseDown}
      onClick={() => !coverUrl && fileRef.current?.click()}
    >
      {coverUrl ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${coverUrl})`,
              backgroundPositionY: `${offset}%`,
              height: '150%',
              cursor: dragging ? 'grabbing' : 'grab',
            }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                fileRef.current?.click();
              }}
              className="px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-xs rounded-lg backdrop-blur-sm flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" /> Change
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="px-3 py-1.5 bg-black/60 hover:bg-red-600 text-white text-xs rounded-lg backdrop-blur-sm flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Remove
            </button>
          </div>
          <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="px-2.5 py-1 bg-black/60 text-white text-xs rounded-lg backdrop-blur-sm">
              Drag to reposition
            </span>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          <Camera className="w-8 h-8 mb-2" />
          <span className="text-sm font-medium">Click to upload or paste an image</span>
          <span className="text-xs mt-0.5 opacity-70">PNG, JPG, or paste from clipboard</span>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
