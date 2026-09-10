import { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import type { UseJournalData } from '@/hooks/useJournalData';
import { computeMetrics, RESULT_LABELS, WEEKDAY_NAMES, MONTH_NAMES } from '@/lib/metrics';
import { DEFAULT_LABELS } from '@/lib/supabase';

type StatisticsPageProps = {
  data: UseJournalData;
};

export function StatisticsPage({ data }: StatisticsPageProps) {
  const { trades, settings, updateConfluences } = data;
  const metrics = computeMetrics(trades);
  const labels = { ...DEFAULT_LABELS, ...(settings?.labels || {}) };
  const [newConfluence, setNewConfluence] = useState('');
  const [editingConfluence, setEditingConfluence] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const confluenceOptions = settings?.confluences || [];

  const getLabel = (key: string) => labels[key] || key;

  const addConfluence = async () => {
    const trimmed = newConfluence.trim();
    if (!trimmed || confluenceOptions.includes(trimmed)) return;
    await updateConfluences([...confluenceOptions, trimmed]);
    setNewConfluence('');
  };

  const deleteConfluence = async (c: string) => {
    await updateConfluences(confluenceOptions.filter((x) => x !== c));
  };

  const startEdit = (c: string) => {
    setEditingConfluence(c);
    setEditValue(c);
  };

  const saveEdit = async () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === editingConfluence) {
      setEditingConfluence(null);
      return;
    }
    const updated = confluenceOptions.map((c) => (c === editingConfluence ? trimmed : c));
    await updateConfluences(updated);
    setEditingConfluence(null);
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Cumulative PnL | Result */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatCard title={getLabel('section.cumulative_pnl')}>
          <CumulativeChart data={metrics.cumulativePnL} totalPnL={metrics.totalPnL} />
        </StatCard>
        <StatCard title={getLabel('section.result')}>
          <BreakdownTable data={metrics.byResult} labelHeader={getLabel('label.result')} />
        </StatCard>
      </div>

      {/* Row 2: Psychology | Plan Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatCard title={getLabel('section.psychology')}>
          <BreakdownTable data={metrics.byPsychology} labelHeader={getLabel('label.psychology')} />
        </StatCard>
        <StatCard title={getLabel('section.plan_compliance')}>
          <BreakdownTable data={metrics.byPlanCompliance} labelHeader={getLabel('label.plan_compliance')} />
        </StatCard>
      </div>

      {/* Row 3: Profit Factor (donut) | Avg RR (donut by result) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatCard title={getLabel('section.profit_factor')}>
          <DonutMetric
            centerValue={metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
            centerLabel="PF"
            segments={[
              { label: getLabel('label.gross_profit'), value: metrics.grossProfit, color: '#10b981' },
              { label: getLabel('label.gross_loss'), value: metrics.grossLoss, color: '#ef4444' },
            ]}
          />
        </StatCard>
        <StatCard title={getLabel('section.avg_rr')}>
          <DonutMetric
            centerValue={metrics.avgRR.toFixed(2)}
            centerLabel="Avg RR"
            segments={metrics.avgRRByResult.map((r, i) => ({
              label: r.result,
              value: r.avgRR * r.trades,
              color: ['#10b981', '#ef4444', '#6b7280', '#f59e0b'][i % 4],
            }))}
          />
        </StatCard>
      </div>

      {/* Row 4: Expectancy (donut, win/loss) | Max Consecutive Loss + Max Drawdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatCard title={getLabel('section.expectancy')}>
          <DonutMetric
            centerValue={`$${metrics.expectancy.toFixed(2)}`}
            centerLabel="Expectancy"
            segments={[
              { label: 'Win Avg', value: metrics.wins > 0 ? metrics.grossProfit / metrics.wins : 0, color: '#10b981' },
              { label: 'Loss Avg', value: metrics.losses > 0 ? metrics.grossLoss / metrics.losses : 0, color: '#ef4444' },
            ]}
          />
        </StatCard>
        <StatCard title="Max Consecutive Loss & Max Drawdown">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Max Consecutive Loss</div>
              <div className="text-2xl font-bold text-red-500 dark:text-red-400">{metrics.maxConsecutiveLoss}</div>
              <div className="text-xs text-gray-400 mt-1">losses in a row</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Max Drawdown</div>
              <div className="text-2xl font-bold text-red-500 dark:text-red-400">${metrics.maxDrawdown.toFixed(2)}</div>
              <div className="text-xs text-gray-400 mt-1">peak to trough</div>
            </div>
          </div>
        </StatCard>
      </div>

      {/* Row 5: Best Daily & Weekly PnL | Worst Daily & Weekly PnL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatCard title="Best Daily & Weekly PnL">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Best Daily</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${metrics.bestDailyPnL.toFixed(2)}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Best Weekly</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${metrics.bestWeeklyPnL.toFixed(2)}</div>
            </div>
          </div>
        </StatCard>
        <StatCard title="Worst Daily & Weekly PnL">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Worst Daily</div>
              <div className="text-2xl font-bold text-red-500 dark:text-red-400">${metrics.worstDailyPnL.toFixed(2)}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Worst Weekly</div>
              <div className="text-2xl font-bold text-red-500 dark:text-red-400">${metrics.worstWeeklyPnL.toFixed(2)}</div>
            </div>
          </div>
        </StatCard>
      </div>

      {/* Row 6: Trades by Time | Win Rate by Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatCard title={getLabel('section.trades_by_time')}>
          <BarChart data={metrics.tradesByTime.map((d) => ({ label: d.hour, value: d.count }))} color="#6b7280" valueLabel="Trades" />
        </StatCard>
        <StatCard title={getLabel('section.win_rate_by_time')}>
          <BarChart data={metrics.winRateByTime.map((d) => ({ label: d.hour, value: d.winRate }))} color="#10b981" valueLabel="Win Rate %" maxOverride={100} />
        </StatCard>
      </div>

      {/* Row 7: Total PnL by Time | Avg PnL by Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatCard title={getLabel('section.total_pnl_by_time')}>
          <BarChart data={metrics.totalPnLByTime.map((d) => ({ label: d.hour, value: d.pnl }))} color="#8b5cf6" valueLabel="PnL" signed />
        </StatCard>
        <StatCard title={getLabel('section.avg_pnl_by_time')}>
          <BarChart data={metrics.avgPnLByTime.map((d) => ({ label: d.hour, value: d.avgPnL }))} color="#f59e0b" valueLabel="Avg PnL / Trade" signed />
        </StatCard>
      </div>

      {/* Row 8: Confluences | Direction (Long/Short) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatCard title={getLabel('section.confluences')}>
          <BreakdownTable data={metrics.byConfluence} labelHeader="Confluence" />
        </StatCard>
        <StatCard title={getLabel('section.setup_type')}>
          <BreakdownTable data={metrics.byDirection} labelHeader="Direction" />
        </StatCard>
      </div>

      {/* Row 9: Weekdays | Months */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatCard title={getLabel('section.weekdays')}>
          <BreakdownTable data={metrics.byWeekday} labelHeader="Weekday" />
        </StatCard>
        <StatCard title={getLabel('section.months')}>
          <BreakdownTable data={metrics.byMonth} labelHeader="Month" />
        </StatCard>
      </div>

      {/* Confluence Management */}
      <StatCard title="Manage Confluences">
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newConfluence}
              onChange={(e) => setNewConfluence(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addConfluence(); } }}
              placeholder="Add new confluence..."
              className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gray-500"
            />
            <button onClick={addConfluence} className="px-4 py-2 bg-gray-900 dark:bg-white hover:opacity-90 text-white dark:text-gray-900 rounded-lg text-sm font-medium flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {confluenceOptions.map((c) => (
              <span key={c} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-300">
                {editingConfluence === c ? (
                  <>
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingConfluence(null); }}
                      className="px-1.5 py-0.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white focus:outline-none focus:border-gray-500 w-32"
                      autoFocus
                    />
                    <button onClick={saveEdit} className="text-emerald-500 hover:text-emerald-600"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingConfluence(null)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                  </>
                ) : (
                  <>
                    {c}
                    <button onClick={() => startEdit(c)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><Pencil className="w-3 h-3" /></button>
                    <button onClick={() => deleteConfluence(c)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                  </>
                )}
              </span>
            ))}
            {confluenceOptions.length === 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">No confluences configured. Add one above.</span>
            )}
          </div>
        </div>
      </StatCard>
    </div>
  );
}

function StatCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#252527] border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}

function BreakdownTable({ data, labelHeader }: { data: Array<{ key: string; trades: number; pnl: number; avgEarning: number; avgLosing: number; winRate: number; proportion: number }>; labelHeader: string }) {
  if (data.length === 0) return <EmptyState />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-xs">
            <th className="text-left px-2 py-2 font-medium">{labelHeader}</th>
            <th className="text-right px-2 py-2 font-medium">Trades</th>
            <th className="text-right px-2 py-2 font-medium">Total PnL</th>
            <th className="text-right px-2 py-2 font-medium">Avg Earning</th>
            <th className="text-right px-2 py-2 font-medium">Avg Losing</th>
            <th className="text-right px-2 py-2 font-medium">Proportion</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
              <td className="px-2 py-2 text-gray-700 dark:text-gray-300 font-medium">{row.key}</td>
              <td className="px-2 py-2 text-right text-gray-500 dark:text-gray-400">{row.trades}</td>
              <td className={`px-2 py-2 text-right font-medium ${row.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {row.pnl >= 0 ? '+' : ''}${row.pnl.toFixed(2)}
              </td>
              <td className="px-2 py-2 text-right text-emerald-600 dark:text-emerald-400">${row.avgEarning.toFixed(2)}</td>
              <td className="px-2 py-2 text-right text-red-500 dark:text-red-400">${row.avgLosing.toFixed(2)}</td>
              <td className="px-2 py-2 text-right text-gray-500 dark:text-gray-400">{row.proportion.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CumulativeChart({ data, totalPnL }: { data: { date: string; value: number }[]; totalPnL: number }) {
  if (data.length === 0) return <EmptyState />;
  const width = 800;
  const height = 200;
  const padding = 40;
  const values = data.map((d) => d.value);
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(0, ...values);
  const range = maxVal - minVal || 1;
  const stepX = (width - padding * 2) / Math.max(1, data.length - 1);
  const y = (v: number) => height - padding - ((v - minVal) / range) * (height - padding * 2);
  const x = (i: number) => padding + i * stepX;
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)},${y(d.value)}`).join(' ');
  const areaPath = `${path} L ${x(data.length - 1)},${y(0)} L ${x(0)},${y(0)} Z`;
  const isPositive = totalPnL >= 0;
  const lineColor = isPositive ? '#10b981' : '#ef4444';

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48">
        <defs>
          <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={padding} y1={y(0)} x2={width - padding} y2={y(0)} stroke="currentColor" className="text-gray-300 dark:text-gray-700" strokeWidth="1" strokeDasharray="4 4" />
        <path d={areaPath} fill="url(#cumGrad)" />
        <path d={path} fill="none" stroke={lineColor} strokeWidth="2" />
        {data.length <= 30 && data.map((d, i) => (
          <circle key={i} cx={x(i)} cy={y(d.value)} r="3" fill={lineColor} />
        ))}
      </svg>
    </div>
  );
}

function DonutMetric({ centerValue, centerLabel, segments }: { centerValue: string; centerLabel: string; segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <EmptyState />;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={radius} fill="none" className="stroke-gray-200 dark:stroke-gray-800" strokeWidth="20" />
        {segments.map((seg, i) => {
          const fraction = seg.value / total;
          const dash = fraction * circumference;
          const circle = (
            <circle
              key={i}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="20"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 90 90)"
            />
          );
          offset += dash;
          return circle;
        })}
        <text x="90" y="85" textAnchor="middle" className="fill-gray-900 dark:fill-white text-lg font-bold">{centerValue}</text>
        <text x="90" y="105" textAnchor="middle" className="fill-gray-400 dark:fill-gray-500 text-xs">{centerLabel}</text>
      </svg>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-gray-700 dark:text-gray-300">{seg.label}</span>
            <span className="text-gray-400 dark:text-gray-500 text-xs">({((seg.value / total) * 100).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, color, valueLabel, signed, maxOverride }: {
  data: { label: string; value: number }[];
  color: string;
  valueLabel: string;
  signed?: boolean;
  maxOverride?: number;
}) {
  if (data.length === 0) return <EmptyState />;
  const maxVal = maxOverride || Math.max(...data.map((d) => Math.abs(d.value))) || 1;
  const chartHeight = 160;

  return (
    <div>
      <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
        {data.map((d, i) => {
          const h = (Math.abs(d.value) / maxVal) * chartHeight;
          const isNeg = signed && d.value < 0;
          return (
            <div key={i} className="flex flex-col items-center gap-1 min-w-[40px] flex-1">
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{d.value.toFixed(signed ? 0 : 0)}</span>
              <div className="w-full flex-1 flex items-end relative">
                {isNeg ? (
                  <div className="w-full bg-red-500/60 rounded-t" style={{ height: `${h}px`, marginTop: 'auto' }} />
                ) : (
                  <div className="w-full rounded-t" style={{ height: `${h}px`, backgroundColor: color }} />
                )}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">{d.label}</span>
            </div>
          );
        })}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">{valueLabel}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center py-12 text-gray-400 dark:text-gray-600 text-sm">
      No data available. Add trades to see statistics.
    </div>
  );
}
