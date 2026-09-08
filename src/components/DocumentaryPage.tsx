import { useMemo, useState } from 'react';
import { Plus, Trash2, Search, Image as ImageIcon, Table as TableIcon, CalendarDays, GalleryHorizontalEnd, Filter, Download, ClipboardList, TrendingUp, Check, X } from 'lucide-react';
import type { Trade } from '@/lib/supabase';
import type { UseJournalData } from '@/hooks/useJournalData';
import { computeMetrics, getWeekKey, getCurrentWeekKey, RESULT_LABELS } from '@/lib/metrics';
import { TradeForm } from './TradeForm';
import { TradeImage } from './TradeImage';

type DocumentaryPageProps = {
  data: UseJournalData;
};

type ViewTab = 'full_log' | 'full_gallery' | 'weekly_log' | 'weekly_gallery' | 'loss_log' | 'win_log';

const VIEW_TABS: { id: ViewTab; label: string; icon: typeof TableIcon }[] = [
  { id: 'full_log', label: 'Full Log', icon: TableIcon },
  { id: 'full_gallery', label: 'Full Gallery', icon: GalleryHorizontalEnd },
  { id: 'weekly_log', label: 'Weekly Log', icon: CalendarDays },
  { id: 'weekly_gallery', label: 'Weekly Gallery', icon: ImageIcon },
  { id: 'loss_log', label: 'Loss Log', icon: TableIcon },
  { id: 'win_log', label: 'Win Log', icon: TableIcon },
];

const PSYCHOLOGY_COLORS: Record<string, string> = {
  'Calm/Disciplined': '#10b981',
  'FOMO/Impulsive': '#f59e0b',
  'Fearful/Hesitant': '#3b82f6',
  'Revenge/Tilted': '#ef4444',
  'Greedy/Overconfident': '#ef4444',
};

export function DocumentaryPage({ data }: DocumentaryPageProps) {
  const { trades, addTrade, updateTrade, deleteTrade } = data;
  const [view, setView] = useState<ViewTab>('full_log');
  const [showForm, setShowForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [search, setSearch] = useState('');
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  const metrics = useMemo(() => computeMetrics(trades), [trades]);

  const filteredTrades = useMemo(() => {
    let result = [...trades].sort((a, b) => {
      const da = new Date(`${a.date}T${a.time || '00:00'}`);
      const db = new Date(`${b.date}T${b.time || '00:00'}`);
      return db.getTime() - da.getTime();
    });

    if (view === 'loss_log') {
      result = result.filter((t) => t.result === 'loss' || t.result === 'be_loss' || t.result === 'breakeven');
    } else if (view === 'win_log') {
      result = result.filter((t) => t.result === 'win' || t.result === 'be_win');
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.setup_type.toLowerCase().includes(q) ||
          t.psychology.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q) ||
          t.confluences.some((c) => c.toLowerCase().includes(q))
      );
    }

    return result;
  }, [trades, view, search]);

  const weeklyGroups = useMemo(() => {
    const currentWeek = getCurrentWeekKey();
    const weekMap = new Map<string, Trade[]>();
    for (const t of filteredTrades) {
      const wk = getWeekKey(t.date);
      if (!weekMap.has(wk)) weekMap.set(wk, []);
      weekMap.get(wk)!.push(t);
    }
    return Array.from(weekMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, ts]) => ({ key, trades: ts, isCurrent: key === currentWeek }));
  }, [filteredTrades]);

  const activeWeek = selectedWeek || weeklyGroups[0]?.key || null;
  const activeWeekGroup = weeklyGroups.find((g) => g.key === activeWeek) || null;

  const handleSave = async (trade: Omit<Trade, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editingTrade) {
      await updateTrade(editingTrade.id, trade);
    } else {
      await addTrade(trade);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTrade(id);
  };

  const summaryCards = [
    { label: 'Total PnL', value: `${metrics.totalPnL.toFixed(2)}`, color: metrics.totalPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400' },
    { label: 'Trades Logged', value: metrics.totalTrades, color: 'text-gray-900 dark:text-white' },
    { label: 'Avg Win Points', value: metrics.avgWinPoints.toFixed(2), color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Avg Loss Points', value: metrics.avgLossPoints.toFixed(2), color: 'text-red-500 dark:text-red-400' },
  ];

  const exportTrades = () => {
    const header = ['#', 'Date & Time', 'Plan', 'Psychology', 'Confluences', 'L/S', 'SL', 'TP', 'Result', 'PnL'];
    const rows = filteredTrades.map((t, i) => [i + 1, `${t.date} ${t.time || ''}`, t.plan_compliance ? 'Yes' : 'No', t.psychology, t.confluences.join('; '), t.direction === 'long' ? 'L' : 'S', t.sl_points ?? '', t.tp_points ?? '', RESULT_LABELS[t.result] || t.result, t.pnl]);
    const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).split('"').join('""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'journal-trades.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300">
            <ClipboardList className="w-5 h-5" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white uppercase">Documentary</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportTrades} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => { setEditingTrade(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> New trade
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-[#252527] border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center"><TrendingUp className="w-4 h-4" /></div>
            <div><div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{card.label}</div><div className={`text-xl font-bold ${card.color}`}>{card.value}</div></div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#252527] overflow-hidden shadow-sm">
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
            <ClipboardList className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            Documentary log
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your execution history · {metrics.totalTrades} records</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap gap-1 p-1 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
            {VIEW_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setView(tab.id); setSelectedWeek(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    view === tab.id ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trades..."
              className="pl-8 pr-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-500 w-full sm:w-56"
            />
          </div>
        </div>

        <div className="p-5">
          {(view === 'full_log' || view === 'loss_log' || view === 'win_log') && (
            <TradeTable trades={filteredTrades} onEdit={(t) => { setEditingTrade(t); setShowForm(true); }} onDelete={handleDelete} />
          )}

          {view === 'full_gallery' && <TradeGallery trades={filteredTrades} onEdit={(t) => { setEditingTrade(t); setShowForm(true); }} />}

          {(view === 'weekly_log' || view === 'weekly_gallery') && (
            <div className="flex gap-4">
              <div className="w-48 shrink-0 space-y-1">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 pb-2">Weeks</div>
                <div className="space-y-1 max-h-[600px] overflow-y-auto">
                  {weeklyGroups.map((group) => (
                    <button
                      key={group.key}
                      onClick={() => setSelectedWeek(group.key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        activeWeek === group.key
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                          : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="w-3 h-3 shrink-0" />
                        {group.key}
                      </div>
                      <div className={`text-[10px] mt-0.5 ${activeWeek === group.key ? 'text-gray-300 dark:text-gray-700' : 'text-gray-400 dark:text-gray-500'}`}>
                        {group.trades.length} trade{group.trades.length !== 1 ? 's' : ''}
                      </div>
                    </button>
                  ))}
                  {weeklyGroups.length === 0 && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 px-2 py-4">No weeks found.</div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                {activeWeekGroup ? (
                  <div className={`rounded-xl border ${activeWeekGroup.isCurrent ? 'border-gray-400 dark:border-gray-500' : 'border-gray-200 dark:border-gray-800'} bg-white/50 dark:bg-gray-900/50 overflow-hidden`}>
                    <div className={`px-4 py-2.5 text-sm font-medium ${activeWeekGroup.isCurrent ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300'} flex items-center gap-2`}>
                      <CalendarDays className="w-4 h-4" />
                      {activeWeekGroup.key}
                      {activeWeekGroup.isCurrent && <span className="text-xs px-1.5 py-0.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded">Current</span>}
                    </div>
                    {view === 'weekly_log' ? (
                      <TradeTable trades={activeWeekGroup.trades} onEdit={(t) => { setEditingTrade(t); setShowForm(true); }} onDelete={handleDelete} />
                    ) : (
                      <div className="p-3">
                        <TradeGallery trades={activeWeekGroup.trades} onEdit={(t) => { setEditingTrade(t); setShowForm(true); }} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
                    <Filter className="w-10 h-10 mb-3 opacity-50" />
                    <p className="text-sm">No trades found.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {filteredTrades.length === 0 && view !== 'weekly_log' && view !== 'weekly_gallery' && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
              <Filter className="w-10 h-10 mb-3 opacity-50" />
              <p className="text-sm">No trades found. {view === 'full_log' && 'Add your first trade to get started.'}</p>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <TradeForm trade={editingTrade} onClose={() => setShowForm(false)} onSave={handleSave} data={data} />
      )}
    </div>
  );
}

function TradeTable({ trades, onEdit, onDelete }: { trades: Trade[]; onEdit: (t: Trade) => void; onDelete: (id: string) => Promise<void> }) {
  if (trades.length === 0) return <div className="p-8 text-center text-sm text-gray-400 dark:text-gray-500">No trades in this view.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-xs">
            <th className="text-left px-3 py-2.5 font-medium">#</th>
            <th className="text-left px-3 py-2.5 font-medium">Date & Time</th>
            <th className="text-left px-3 py-2.5 font-medium">Plan</th>
            <th className="text-left px-3 py-2.5 font-medium">Psychology</th>
            <th className="text-left px-3 py-2.5 font-medium">Confluences</th>
            <th className="text-center px-3 py-2.5 font-medium">L/S</th>
            <th className="text-right px-3 py-2.5 font-medium">SL</th>
            <th className="text-right px-3 py-2.5 font-medium">TP</th>
            <th className="text-left px-3 py-2.5 font-medium">Result</th>
            <th className="text-right px-3 py-2.5 font-medium">PnL</th>
            <th className="text-center px-3 py-2.5 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t, i) => (
            <tr key={t.id} onClick={() => onEdit(t)} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer">
              <td className="px-3 py-2 text-gray-400 dark:text-gray-500">{i + 1}</td>
              <td className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {t.date}{t.time && <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">{t.time}</span>}
              </td>
              <td className="px-3 py-2">
                {t.plan_compliance ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Yes</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
                    <X className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">No</span>
                  </span>
                )}
              </td>
              <td className="px-3 py-2 text-gray-700 dark:text-gray-300 text-xs">
                {t.psychology ? (
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: PSYCHOLOGY_COLORS[t.psychology] || '#6b7280' }}
                    />
                    {t.psychology}
                  </span>
                ) : '-'}
              </td>
              <td className="px-3 py-2 text-gray-600 dark:text-gray-400 text-xs max-w-[200px] truncate">{t.confluences.join(', ') || '-'}</td>
              <td className="px-3 py-2 text-center">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold text-white ${
                    t.direction === 'long' ? 'bg-teal-600' : 'bg-red-600'
                  }`}
                >
                  {t.direction === 'long' ? 'L' : 'S'}
                </span>
              </td>
              <td className="px-3 py-2 text-right text-gray-500 dark:text-gray-400">{t.sl_points != null ? t.sl_points.toFixed(2) : '-'}</td>
              <td className="px-3 py-2 text-right text-gray-500 dark:text-gray-400">{t.tp_points != null ? t.tp_points.toFixed(2) : '-'}</td>
              <td className="px-3 py-2">
                <span className="flex items-center gap-1.5 text-xs">
                  {t.result === 'win' && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                  {(t.result === 'be_win' || t.result === 'be_loss') && <span className="w-2 h-2 rounded-full bg-gray-400" />}
                  {t.result === 'loss' && <span className="w-2 h-2 rounded-full bg-red-500" />}
                  {t.result === 'breakeven' && <span className="w-2 h-2 rounded-full bg-gray-400" />}
                  <span className={
                    t.result === 'win' ? 'text-emerald-600 dark:text-emerald-400' :
                    t.result === 'loss' ? 'text-red-500 dark:text-red-400' :
                    'text-gray-500 dark:text-gray-400'
                  }>
                    {RESULT_LABELS[t.result] || t.result}
                  </span>
                </span>
              </td>
              <td className={`px-3 py-2 text-right font-medium ${t.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
              </td>
              <td className="px-3 py-2 text-center">
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                  className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  title="Delete trade"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TradeGallery({ trades, onEdit }: { trades: Trade[]; onEdit: (t: Trade) => void }) {
  if (trades.length === 0) return <div className="p-8 text-center text-sm text-gray-400 dark:text-gray-500">No trades in this view.</div>;

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {trades.map((t) => (
        <div key={t.id} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden group cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 transition-colors" onClick={() => onEdit(t)}>
          <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
            {t.image_path ? (
              <TradeImage path={t.image_path} alt={t.symbol} />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            )}
          </div>
          <div className="p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-white">{t.date}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${t.result === 'win' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : t.result === 'loss' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                {RESULT_LABELS[t.result] || t.result}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{t.direction === 'long' ? 'Long' : 'Short'}</span>
              <span className={t.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}>{t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
