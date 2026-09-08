import { useCallback, useEffect, useState } from 'react';
import { supabase, type Trade, type JournalSettings, DEFAULT_LABELS, DEFAULT_CONFLUENCES, STORAGE_BUCKET } from '@/lib/supabase';

export function useJournalData() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [settings, setSettings] = useState<JournalSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTrades = useCallback(async () => {
    const { data, error } = await supabase.from('trades').select('*').order('date', { ascending: true });
    if (error) {
      console.error('fetch trades', error);
      return;
    }
    setTrades((data || []) as Trade[]);
  }, []);

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from('journal_settings')
      .select('*')
      .maybeSingle();
    if (error) {
      console.error('fetch settings', error);
      return;
    }
    if (data) {
      setSettings(data as JournalSettings);
    } else {
      const { data: created, error: createError } = await supabase
        .from('journal_settings')
        .insert({ theme: 'dark', labels: DEFAULT_LABELS, confluences: DEFAULT_CONFLUENCES })
        .select('*')
        .single();
      if (createError) {
        console.error('create settings', createError);
        return;
      }
      setSettings(created as JournalSettings);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTrades(), fetchSettings()]).finally(() => setLoading(false));
  }, [fetchTrades, fetchSettings]);

  const addTrade = useCallback(async (trade: Omit<Trade, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase.from('trades').insert(trade).select('*').single();
    if (error) throw error;
    setTrades((prev) => [...prev, data as Trade].sort((a, b) => a.date.localeCompare(b.date)));
    return data as Trade;
  }, []);

  const updateTrade = useCallback(async (id: string, updates: Partial<Trade>) => {
    const { data, error } = await supabase.from('trades').update(updates).eq('id', id).select('*').single();
    if (error) throw error;
    setTrades((prev) =>
      prev.map((t) => (t.id === id ? (data as Trade) : t)).sort((a, b) => a.date.localeCompare(b.date))
    );
    return data as Trade;
  }, []);

  const deleteTrade = useCallback(async (id: string) => {
    const { error } = await supabase.from('trades').delete().eq('id', id);
    if (error) throw error;
    setTrades((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<JournalSettings>) => {
      if (!settings) return;
      const { data, error } = await supabase
        .from('journal_settings')
        .update(updates)
        .eq('id', settings.id)
        .select('*')
        .single();
      if (error) throw error;
      setSettings(data as JournalSettings);
    },
    [settings]
  );

  const updateConfluences = useCallback(async (confluences: string[]) => {
    await updateSettings({ confluences });
  }, [updateSettings]);

  const updateLabel = useCallback(
    async (key: string, value: string) => {
      if (!settings) return;
      const newLabels = { ...settings.labels, [key]: value };
      await updateSettings({ labels: newLabels });
    },
    [settings, updateSettings]
  );

  const uploadImage = useCallback(async (file: File, folder: string) => {
    const ext = file.name.split('.').pop() || 'png';
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: false });
    if (error) throw error;
    return path;
  }, []);

  const getSignedUrl = useCallback(async (path: string) => {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 3600);
    if (error) throw error;
    return data.signedUrl;
  }, []);

  return {
    trades,
    settings,
    loading,
    addTrade,
    updateTrade,
    deleteTrade,
    updateSettings,
    updateLabel,
    updateConfluences,
    uploadImage,
    getSignedUrl,
    refetch: fetchTrades,
  };
}

export type UseJournalData = ReturnType<typeof useJournalData>;
