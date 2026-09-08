import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Move, X } from 'lucide-react';

type CoverPhotoProps = {
  coverUrl: string | null;
  offset: number;
  onUpload: (file: File) => Promise<void>;
  onReposition: (offset: number) => void;
  onRemove: () => void;
};

export function CoverPhoto({ coverUrl, offset, onUpload, onReposition, onRemove }: CoverPhotoProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [repositionMode, setRepositionMode] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
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

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('contextmenu', close);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('contextmenu', close);
    };
  }, [menu]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!coverUrl || !repositionMode) return;
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
    const handleUp = () => {
      setDragging(false);
      setRepositionMode(false);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, onReposition]);

  return (
    <>
      <div
        ref={containerRef}
        className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-[#1a1a2e]"
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        style={{ cursor: repositionMode ? (dragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {coverUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${coverUrl})`,
              backgroundPositionY: `${offset}%`,
              height: '150%',
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <Camera className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">Right-click to upload or paste an image</span>
          </div>
        )}
      </div>

      {menu && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 min-w-[160px]"
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {coverUrl ? (
            <>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => { fileRef.current?.click(); setMenu(null); }}
              >
                <Camera className="w-4 h-4" /> Change image
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => { setMenu(null); setRepositionMode(true); }}
              >
                <Move className="w-4 h-4" /> Reposition
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                onClick={() => { onRemove(); setMenu(null); }}
              >
                <X className="w-4 h-4" /> Remove image
              </button>
            </>
          ) : (
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => { fileRef.current?.click(); setMenu(null); }}
            >
              <Camera className="w-4 h-4" /> Upload image
            </button>
          )}
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
    </>
  );
}
