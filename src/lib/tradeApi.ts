import { supabase } from '@/lib/supabase';
import type { Trade } from '@/types';
import { realTrades } from '@/trades';

function toDbTrade(t: Trade) {
  return {
    id: t.id,
    name: t.name,
    date_time: t.dateTime,
    type: t.type,
    result: t.result,
    pnl: t.pnl,
    plan_compliance: t.planCompliance,
    psychology: t.psychology,
    setup_type: t.setupType,
    confluences: t.confluences,
    direction: t.direction,
    sl: t.sl,
    tp: t.tp,
    rr: t.rr,
    notes: t.notes,
    image_url: t.imageUrl,
  };
}

function fromDbTrade(row: Record<string, unknown>): Trade {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    dateTime: String(row.date_time ?? ''),
    type: String(row.type ?? 'NQ'),
    result: (row.result as Trade['result']) ?? 'Win',
    pnl: Number(row.pnl ?? 0),
    planCompliance: (row.plan_compliance as Trade['planCompliance']) ?? 'Yes',
    psychology: (row.psychology as Trade['psychology']) ?? 'Calm / Disciplined',
    setupType: String(row.setup_type ?? ''),
    confluences: Array.isArray(row.confluences) ? row.confluences as string[] : [],
    direction: (row.direction as Trade['direction']) ?? 'Long',
    sl: Number(row.sl ?? 0),
    tp: Number(row.tp ?? 0),
    rr: Number(row.rr ?? 0),
    notes: String(row.notes ?? ''),
    imageUrl: String(row.image_url ?? ''),
  };
}

export async function fetchTrades(): Promise<Trade[]> {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .order('date_time', { ascending: false });
  if (error) throw error;
  if (!data || data.length === 0) return [];
  return data.map((row) => fromDbTrade(row as Record<string, unknown>));
}

export async function insertTradeDb(t: Trade): Promise<void> {
  const { error } = await supabase.from('trades').insert(toDbTrade(t));
  if (error) throw error;
}

export async function updateTradeDb(t: Trade): Promise<void> {
  const { error } = await supabase.from('trades').update(toDbTrade(t)).eq('id', t.id);
  if (error) throw error;
}

export async function deleteTradeDb(id: string): Promise<void> {
  const { error } = await supabase.from('trades').delete().eq('id', id);
  if (error) throw error;
}

export async function clearAllTradesDb(): Promise<void> {
  const { error } = await supabase.from('trades').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}

export async function restoreDemoTradesDb(): Promise<void> {
  await clearAllTradesDb();
  const rows = realTrades.map(toDbTrade);
  const { error } = await supabase.from('trades').insert(rows);
  if (error) throw error;
}
