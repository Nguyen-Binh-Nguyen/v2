import { useEffect, useState } from 'react';
import { supabase, STORAGE_BUCKET } from '@/lib/supabase';

type TradeImageProps = {
  path: string;
  alt: string;
  className?: string;
};

export function TradeImage({ path, alt, className }: TradeImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 3600).then(({ data, error }) => {
      if (mounted && !error) {
        setUrl(data.signedUrl);
      }
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [path]);

  if (loading) return <div className={`animate-pulse bg-gray-200 dark:bg-gray-800 ${className || ''}`} />;
  if (!url) return <div className={`bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-600 text-xs ${className || ''}`}>No image</div>;
  return <img src={url} alt={alt} className={className || 'w-full h-full object-cover'} />;
}
