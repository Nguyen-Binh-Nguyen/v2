import { useEffect, useRef, useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import type { UseJournalData } from '@/hooks/useJournalData';
import { computeMetrics } from '@/lib/metrics';
import { DEFAULT_LABELS } from '@/lib/supabase';

type StatisticsPageProps = {
  data: UseJournalData;
};

type SectionId =
  | 'cumulative_pnl' | 'result' | 'psychology' | 'plan_compliance' | 'profit_factor'
  | 'avg_rr' | 'expectancy' | 'max_consecutive_loss' | 'max_drawdown' | 'worst_pnl'
  | 'best_pnl' | 'trades_by_time' | 'win_rate_by_time' | 'total_pnl_by_time' | 'avg_pnl_by_time'
  | 'confluences' | 'weekdays' | 'months' | 'setup_type';

const SECTIONS: SectionId[] = [
  'cumulative_pnl', 'result', 'psychology', 'plan_compliance', 'profit_factor',
  'avg_rr', 'expectancy', 'max_consecutive_loss', 'max_drawdown', 'worst_pnl',
  'best_pnl', 'trades_by_time', 'win_rate_by_time', 'total_pnl_by_time', 'avg_pnl_by_time',
  'confluences', 'weekdays', 'months', 'setup_type',
];

export function StatisticsPage({ data }: StatisticsPageProps) {
  const { trades, settings, updateLabel } = data;
  const metrics = computeMetrics(trades);
  const labels = { ...DEFAULT_LABELS, ...(settings?.labels || {}) };
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    for (const id of SECTIONS) {
      const el = document.getElementById(`stat-${id}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(`stat-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getLabel = (key: string) => labels[key] || key;
  const L = (id: SectionId) => getLabel(`section.${id}`);
  const D = (id: SectionId) => getLabel(`desc.${id}`);

  return (
    <div className="space-y-6">
      {/* TOC */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {SECTIONS.map((id) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeSection === `stat-${id}`
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {getLabel(`toc.${id}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Cumulative PnL */}
      <StatSection id="cumulative_pnl" title={L('cumulative_pnl')} desc={D('cumulative_pnl')} onEditLabel={updateLabel} labelKey="section.cumulative_pnl" descKey="desc.cumulative_pnl">
        <CumulativeChart data={metrics.cumulativePnL} totalPnL={metrics.totalPnL} />
      </StatSection>

      {/* Result */}
      <StatSection id="result" title={L('result')} desc={D('result')} onEditLabel={updateLabel} labelKey="section.result" descKey="desc.result">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <ResultCard label={getLabel('label.wins')} value={metrics.wins} pnl={metrics.byResult[0].pnl} color="gray" />
          <ResultCard label={getLabel('label.losses')} value={metrics.losses} pnl={metrics.byResult[1].pnl} color="red" />
          <ResultCard label={getLabel('label.breakeven')} value={metrics.breakeven} pnl={metrics.byResult[2].pnl} color="gray" />
        </div>
        <DonutChart segments={[
          { label: getLabel('label.wins'), value: metrics.wins, color: '#10b981' },
          { label: getLabel('label.losses'), value: metrics.losses, color: '#ef4444' },
          { label: getLabel('label.breakeven'), value: metrics.breakeven, color: '#6b7280' },
        ]} />
      </StatSection>

      {/* Psychology */}
      <StatSection id="psychology" title={L('psychology')} desc={D('psychology')} onEditLabel={updateLabel} labelKey="section.psychology" descKey="desc.psychology">
        <BreakdownTable
          data={metrics.byPsychology}
          keyField="psychology"
          labelKey="label.confluence"
          labels={labels}
          showWinRate
        />
      </StatSection>

      {/* Plan Compliance */}
      <StatSection id="plan_compliance" title={L('plan_compliance')} desc={D('plan_compliance')} onEditLabel={updateLabel} labelKey="section.plan_compliance" descKey="desc.plan_compliance">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <ResultCard label={getLabel('label.compliant')} value={metrics.compliant} pnl={metrics.byPlanCompliance[0].pnl} color="gray" />
          <ResultCard label={getLabel('label.non_compliant')} value={metrics.nonCompliant} pnl={metrics.byPlanCompliance[1].pnl} color="red" />
        </div>
        <ProgressBar
          segments={[
            { label: getLabel('label.compliant'), value: metrics.compliant, color: '#10b981' },
            { label: getLabel('label.non_compliant'), value: metrics.nonCompliant, color: '#ef4444' },
          ]}
          total={metrics.totalTrades}
        />
      </StatSection>

      {/* Profit Factor */}
      <StatSection id="profit_factor" title={L('profit_factor')} desc={D('profit_factor')} onEditLabel={updateLabel} labelKey="section.profit_factor" descKey="desc.profit_factor">
        <MetricCard
          label={getLabel('label.profit_factor')}
          value={metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
          subValues={[
            { label: getLabel('label.gross_profit'), value: `$${metrics.grossProfit.toFixed(2)}` },
            { label: getLabel('label.gross_loss'), value: `$${metrics.grossLoss.toFixed(2)}` },
          ]}
        />
      </StatSection>

      {/* Avg RR */}
      <StatSection id="avg_rr" title={L('avg_rr')} desc={D('avg_rr')} onEditLabel={updateLabel} labelKey="section.avg_rr" descKey="desc.avg_rr">
        <MetricCard label={getLabel('label.avg_rr_short')} value={metrics.avgRR.toFixed(2)} />
      </StatSection>

      {/* Expectancy */}
      <StatSection id="expectancy" title={L('expectancy')} desc={D('expectancy')} onEditLabel={updateLabel} labelKey="section.expectancy" descKey="desc.expectancy">
        <MetricCard
          label={getLabel('label.expectancy')}
          value={`$${metrics.expectancy.toFixed(2)}`}
          subValues={[
            { label: getLabel('label.total_pnl'), value: `$${metrics.totalPnL.toFixed(2)}` },
            { label: getLabel('label.total_trades'), value: String(metrics.totalTrades) },
          ]}
        />
      </StatSection>

      {/* Max Consecutive Loss */}
      <StatSection id="max_consecutive_loss" title={L('max_consecutive_loss')} desc={D('max_consecutive_loss')} onEditLabel={updateLabel} labelKey="section.max_consecutive_loss" descKey="desc.max_consecutive_loss">
        <MetricCard label={getLabel('label.streak')} value={`${metrics.maxConsecutiveLoss} losses`} />
      </StatSection>

      {/* Max Drawdown */}
      <StatSection id="max_drawdown" title={L('max_drawdown')} desc={D('max_drawdown')} onEditLabel={updateLabel} labelKey="section.max_drawdown" descKey="desc.max_drawdown">
        <MetricCard
          label={getLabel('label.drawdown')}
          value={`$${metrics.maxDrawdown.toFixed(2)}`}
          subValues={[
            { label: getLabel('label.peak'), value: `$${metrics.peakPnL.toFixed(2)}` },
            { label: getLabel('label.trough'), value: `$${metrics.troughPnL.toFixed(2)}` },
          ]}
        />
      </StatSection>

      {/* Worst PnL */}
      <StatSection id="worst_pnl" title={L('worst_pnl')} desc={D('worst_pnl')} onEditLabel={updateLabel} labelKey="section.worst_pnl" descKey="desc.worst_pnl">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label={getLabel('label.worst_daily')} value={`$${metrics.worstDailyPnL.toFixed(2)}`} color="red" />
          <MetricCard label={getLabel('label.worst_weekly')} value={`$${metrics.worstWeeklyPnL.toFixed(2)}`} color="red" />
        </div>
      </StatSection>

      {/* Best PnL */}
      <StatSection id="best_pnl" title={L('best_pnl')} desc={D('best_pnl')} onEditLabel={updateLabel} labelKey="section.best_pnl" descKey="desc.best_pnl">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label={getLabel('label.best_daily')} value={`${metrics.bestDailyPnL.toFixed(2)}`} color="default" />
          <MetricCard label={getLabel('label.best_weekly')} value={`${metrics.bestWeeklyPnL.toFixed(2)}`} color="default" />
        </div>
      </StatSection>

      {/* Trades by Time */}
      <StatSection id="trades_by_time" title={L('trades_by_time')} desc={D('trades_by_time')} onEditLabel={updateLabel} labelKey="section.trades_by_time" descKey="desc.trades_by_time">
        <BarChart data={metrics.tradesByTime.map((d) => ({ label: d.hour, value: d.count }))} color="#6b7280" valueLabel={getLabel('label.trades')} />
      </StatSection>

      {/* Win Rate by Time */}
      <StatSection id="win_rate_by_time" title={L('win_rate_by_time')} desc={D('win_rate_by_time')} onEditLabel={updateLabel} labelKey="section.win_rate_by_time" descKey="desc.win_rate_by_time">
        <BarChart data={metrics.winRateByTime.map((d) => ({ label: d.hour, value: d.winRate }))} color="#10b981" valueLabel={getLabel('label.win_rate_pct')} maxOverride={100} />
      </StatSection>

      {/* Total PnL by Time */}
      <StatSection id="total_pnl_by_time" title={L('total_pnl_by_time')} desc={D('total_pnl_by_time')} onEditLabel={updateLabel} labelKey="section.total_pnl_by_time" descKey="desc.total_pnl_by_time">
        <BarChart data={metrics.totalPnLByTime.map((d) => ({ label: d.hour, value: d.pnl }))} color="#8b5cf6" valueLabel={getLabel('label.pnl')} signed />
      </StatSection>

      {/* Avg PnL by Time */}
      <StatSection id="avg_pnl_by_time" title={L('avg_pnl_by_time')} desc={D('avg_pnl_by_time')} onEditLabel={updateLabel} labelKey="section.avg_pnl_by_time" descKey="desc.avg_pnl_by_time">
        <BarChart data={metrics.avgPnLByTime.map((d) => ({ label: d.hour, value: d.avgPnL }))} color="#f59e0b" valueLabel={getLabel('label.avg_pnl_per_trade')} signed />
      </StatSection>

      {/* Confluences */}
      <StatSection id="confluences" title={L('confluences')} desc={D('confluences')} onEditLabel={updateLabel} labelKey="section.confluences" descKey="desc.confluences">
        <BreakdownTable data={metrics.byConfluence} keyField="confluence" labelKey="label.confluence" labels={labels} showWinRate />
      </StatSection>

      {/* Weekdays */}
      <StatSection id="weekdays" title={L('weekdays')} desc={D('weekdays')} onEditLabel={updateLabel} labelKey="section.weekdays" descKey="desc.weekdays">
        <BreakdownTable data={metrics.byWeekday} keyField="day" labelKey="label.weekday" labels={labels} showWinRate />
      </StatSection>

      {/* Months */}
      <StatSection id="months" title={L('months')} desc={D('months')} onEditLabel={updateLabel} labelKey="section.months" descKey="desc.months">
        <BreakdownTable data={metrics.byMonth} keyField="month" labelKey="label.month" labels={labels} showWinRate />
      </StatSection>

      {/* Setup Type */}
      <StatSection id="setup_type" title={L('setup_type')} desc={D('setup_type')} onEditLabel={updateLabel} labelKey="section.setup_type" descKey="desc.setup_type">
        <BreakdownTable data={metrics.bySetup} keyField="type" labelKey="label.setup" labels={labels} showWinRate />
      </StatSection>
    </div>
  );
}

function StatSection({ id, title, desc, onEditLabel, labelKey, descKey, children }: {
  id: string;
  title: string;
  desc: string;
  onEditLabel: (key: string, value: string) => Promise<void>;
  labelKey: string;
  descKey: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);
  const [descDraft, setDescDraft] = useState(desc);

  useEffect(() => { setTitleDraft(title); }, [title]);
  useEffect(() => { setDescDraft(desc); }, [desc]);

  const saveTitle = async () => {
    await onEditLabel(labelKey, titleDraft);
    setEditingTitle(false);
  };
  const saveDesc = async () => {
    await onEditLabel(descKey, descDraft);
    setEditingDesc(false);
  };

  return (
    <div ref={ref} id={`stat-${id}`} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 scroll-mt-20">
      <div className="mb-3">
        <div className="flex items-start justify-between gap-2">
          {editingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white text-base font-semibold focus:outline-none focus:border-gray-500"
                autoFocus
              />
              <button onClick={saveTitle} className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"><Check className="w-4 h-4" /></button>
              <button onClick={() => { setEditingTitle(false); setTitleDraft(title); }} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <h3
              className="text-base font-semibold text-gray-900 dark:text-white cursor-text hover:opacity-70 transition-opacity flex items-center gap-1.5 group"
              onClick={() => setEditingTitle(true)}
            >
              {title}
              <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
            </h3>
          )}
        </div>
        {editingDesc ? (
          <div className="flex items-start gap-2 mt-1.5">
            <textarea
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              rows={2}
              className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-600 dark:text-gray-400 text-xs focus:outline-none focus:border-gray-500"
              autoFocus
            />
            <button onClick={saveDesc} className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mt-1"><Check className="w-4 h-4" /></button>
            <button onClick={() => { setEditingDesc(false); setDescDraft(desc); }} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white mt-1"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <p
            className="text-xs text-gray-500 dark:text-gray-500 mt-1 cursor-text hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
            onClick={() => setEditingDesc(true)}
          >
            {desc}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function MetricCard({ label, value, subValues, color = 'default' }: {
  label: string;
  value: string;
  subValues?: { label: string; value: string }[];
  color?: string;
}) {
  const colorClass = color === 'blue' ? 'text-gray-900 dark:text-white' : color === 'red' ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-white';
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
      {subValues && (
        <div className="flex gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
          {subValues.map((sv) => (
            <div key={sv.label}>
              <div className="text-xs text-gray-500 dark:text-gray-400">{sv.label}</div>
              <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">{sv.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultCard({ label, value, pnl, color }: { label: string; value: number; pnl: number; color: string }) {
  const colorClass = color === 'blue' ? 'text-gray-900 dark:text-white border-gray-300 dark:border-gray-700' : color === 'red' ? 'text-red-500 dark:text-red-400 border-red-200 dark:border-red-800' : 'text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-800';
  return (
    <div className={`bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border ${colorClass}`}>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className={`text-xl font-bold ${colorClass.split(' ')[0]}`}>{value}</div>
      <div className={`text-xs mt-1 ${pnl >= 0 ? 'text-gray-600 dark:text-gray-400' : 'text-red-500/70 dark:text-red-400/70'}`}>${pnl.toFixed(2)}</div>
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

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
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
        <text x="90" y="85" textAnchor="middle" className="fill-gray-900 dark:fill-white text-lg font-bold">{total}</text>
        <text x="90" y="105" textAnchor="middle" className="fill-gray-400 dark:fill-gray-500 text-xs">Total</text>
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

function ProgressBar({ segments, total }: { segments: { label: string; value: number; color: string }[]; total: number }) {
  if (total === 0) return <EmptyState />;
  return (
    <div>
      <div className="flex h-8 rounded-lg overflow-hidden">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="flex items-center justify-center text-xs font-medium text-white"
            style={{ width: `${(seg.value / total) * 100}%`, backgroundColor: seg.color }}
          >
            {seg.value > 0 && `${((seg.value / total) * 100).toFixed(0)}%`}
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: seg.color }} />
            <span className="text-gray-600 dark:text-gray-400">{seg.label}: {seg.value}</span>
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

function BreakdownTable({ data, keyField, labelKey, labels, showWinRate }: {
  data: Array<Record<string, string | number>>;
  keyField: string;
  labelKey: string;
  labels: Record<string, string>;
  showWinRate?: boolean;
}) {
  if (data.length === 0) return <EmptyState />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-xs">
            <th className="text-left px-3 py-2 font-medium">{labels[labelKey] || keyField}</th>
            <th className="text-right px-3 py-2 font-medium">{labels['label.trades'] || 'Trades'}</th>
            <th className="text-right px-3 py-2 font-medium">{labels['label.pnl'] || 'PnL'}</th>
            {showWinRate && <th className="text-right px-3 py-2 font-medium">{labels['label.win_rate_pct'] || 'Win Rate %'}</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
              <td className="px-3 py-2 text-gray-700 dark:text-gray-300 font-medium">{String(row[keyField] ?? '')}</td>
              <td className="px-3 py-2 text-right text-gray-500 dark:text-gray-400">{Number(row.trades ?? 0)}</td>
              <td className={`px-3 py-2 text-right font-medium ${Number(row.pnl ?? 0) >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500 dark:text-red-400'}`}>${Number(row.pnl ?? 0).toFixed(2)}</td>
              {showWinRate && <td className="px-3 py-2 text-right text-gray-500 dark:text-gray-400">{Number(row.winRate ?? 0).toFixed(1)}%</td>}
            </tr>
          ))}
        </tbody>
      </table>
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
