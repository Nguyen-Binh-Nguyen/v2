import type { Analytics, Trade } from '@/types';
import { BarChart3, CalendarDays, Check, ChevronDown, ClipboardList, LineChart, MoreHorizontal, Sparkles, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency, shortDayLabel } from '@/analytics';
import { ChartPanel, EquityChart, DailyChart, Insight, MetricCard } from './ui';

const tocItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'charts', label: 'Charts' },
  { id: 'insights', label: 'Insights' },
  { id: 'result-breakdown', label: 'Result Breakdown' },
  { id: 'emotion-breakdown', label: 'Emotion Breakdown' },
  { id: 'weekday-breakdown', label: 'Weekday Breakdown' },
  { id: 'compliance-breakdown', label: 'Plan Compliance' },
  { id: 'confluence-breakdown', label: 'Confluences' },
];

export function StatisticsPage({ analytics, trades }: { analytics: Analytics; trades: Trade[] }) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <section className="stats-cover" aria-label="Statistics cover">
        <div className="cover-grain"></div>
      </section>

      <section className="stats-heading">
        <h1>Statistics</h1>
      </section>

      <nav className="toc-bar">
        {tocItems.map((item) => (
          <button key={item.id} onClick={() => scrollTo(item.id)}>{item.label}</button>
        ))}
      </nav>

      <div id="overview" className="metric-grid">
        <MetricCard label="Cumulative PnL" value={formatCurrency(analytics.cumulative)} detail={`${analytics.totalTrades} total trades`} positive={analytics.cumulative >= 0} icon={<TrendingUp size={17} />} />
        <MetricCard label="Max drawdown" value={formatCurrency(analytics.maxDrawdown)} detail={analytics.maxDrawdownPct ? `${analytics.maxDrawdownPct.toFixed(1)}% from peak` : 'No drawdown'} positive={false} icon={<TrendingDown size={17} />} />
        <MetricCard label="Profit factor" value={analytics.profitFactor.toFixed(2)} detail={`${formatCurrency(analytics.grossProfit)} gross profit`} positive={analytics.profitFactor >= 1} icon={<BarChart3 size={17} />} />
        <MetricCard label="Win rate" value={`${analytics.winRate.toFixed(1)}%`} detail={`${analytics.wins} winning trades`} positive={analytics.winRate >= 50} icon={<Target size={17} />} />
        <MetricCard label="Avg profit" value={formatCurrency(analytics.avgWin)} detail="Per winning trade" positive={true} icon={<TrendingUp size={17} />} />
        <MetricCard label="Avg loss" value={formatCurrency(analytics.avgLoss)} detail="Per losing trade" positive={false} icon={<TrendingDown size={17} />} />
      </div>

      <div id="charts" className="chart-grid">
        <ChartPanel title="Equity curve" caption="Cumulative PnL over time" icon={<LineChart size={16} />}>
          <EquityChart points={analytics.equity} />
        </ChartPanel>
        <ChartPanel title="Daily PnL" caption="Results grouped by trading day" icon={<BarChart3 size={16} />}>
          <DailyChart points={analytics.daily} />
        </ChartPanel>
      </div>

      <div id="insights" className="lower-grid">
        <section className="panel insight-panel">
          <div className="panel-head">
            <div className="panel-title"><Sparkles size={16} />Performance notes</div>
          </div>
          <div className="insights">
            <Insight label="Best day" value={analytics.bestDay ? `${shortDayLabel(analytics.bestDay.key)} · ${formatCurrency(analytics.bestDay.value)}` : '—'} positive />
            <Insight label="Worst day" value={analytics.worstDay ? `${shortDayLabel(analytics.worstDay.key)} · ${formatCurrency(analytics.worstDay.value)}` : '—'} />
            <Insight label="Worst week" value={analytics.worstWeek ? `${shortDayLabel(analytics.worstWeek.key)} · ${formatCurrency(analytics.worstWeek.value)}` : '—'} />
            <Insight label="Gross loss" value={formatCurrency(analytics.grossLoss)} />
            <Insight label="Avg win" value={formatCurrency(analytics.avgWin)} positive />
            <Insight label="Avg loss" value={formatCurrency(analytics.avgLoss)} />
            <Insight label="Expectancy" value={formatCurrency(analytics.expectancy)} positive={analytics.expectancy >= 0} />
            <Insight label="Gross profit" value={formatCurrency(analytics.grossProfit)} positive />
          </div>
        </section>
        <section className="panel read-panel">
          <div className="panel-head">
            <div className="panel-title"><ClipboardList size={16} />Journal quality</div>
          </div>
          <div className="quality-row">
            <div className="quality-ring" style={{ '--progress': `${analytics.compliance * 3.6}deg` } as React.CSSProperties}>
              <span>{Math.round(analytics.compliance)}%</span>
            </div>
            <div>
              <strong>Process consistency</strong>
              <p>Every trade is a chance to build a more repeatable process.</p>
            </div>
          </div>
        </section>
      </div>

      <div id="result-breakdown">
        <BreakdownTable title="Result" icon={<Target size={15} />} headers={['Result', 'Trades', 'Proportion', 'PnL', 'Avg Win', 'Avg Loss', 'Expectancy']}
          rows={analytics.resultBreakdown.map((r) => [
            r.result, String(r.trades), `${r.proportion.toFixed(1)}%`, formatCurrency(r.pnl), formatCurrency(r.avgWin), formatCurrency(r.avgLoss), formatCurrency(r.expectancy)
          ])} toneFn={(row) => row[0] === 'Win' ? 'positive' : row[0] === 'Loss' ? 'negative' : 'neutral'} />
      </div>

      <div id="emotion-breakdown">
        <BreakdownTable title="Emotion" icon={<Sparkles size={15} />} headers={['Emotion', 'Trades', 'Proportion', 'PnL', 'Avg Win', 'Avg Loss']}
          rows={analytics.psychologyBreakdown.map((p) => [
            p.psych, String(p.trades), `${p.proportion.toFixed(1)}%`, formatCurrency(p.pnl), formatCurrency(p.avgWin), formatCurrency(p.avgLoss)
          ])} toneFn={(row) => row[3].startsWith('-') ? 'negative' : 'positive'} />
      </div>

      <div id="weekday-breakdown">
        <BreakdownTable title="Weekdays" icon={<CalendarDays size={15} />} headers={['Weekday', 'Trades', 'PnL', 'Win Rate', 'Avg Win', 'Avg Loss']}
          rows={analytics.weekdayBreakdown.map((w) => [
            w.weekday, String(w.trades), formatCurrency(w.pnl), `${w.winRate.toFixed(1)}%`, formatCurrency(w.avgWin), formatCurrency(w.avgLoss)
          ])} toneFn={(row) => row[2].startsWith('-') ? 'negative' : 'positive'} />
      </div>

      <div id="compliance-breakdown">
        <BreakdownTable title="Plan Compliance" icon={<Check size={15} />} headers={['Compliance', 'Trades', 'PnL', 'Win Rate', 'Avg Win', 'Avg Loss']}
          rows={analytics.complianceBreakdown.map((c) => [
            c.compliance, String(c.trades), formatCurrency(c.pnl), `${c.winRate.toFixed(1)}%`, formatCurrency(c.avgWin), formatCurrency(c.avgLoss)
          ])} toneFn={(row) => row[0] === 'Yes' ? 'positive' : 'negative'} />
      </div>

      <div id="confluence-breakdown">
        <BreakdownTable title="Confluences" icon={<BarChart3 size={15} />} headers={['Confluence', 'Trades', 'PnL', 'Win Rate', 'Avg Win', 'Avg Loss']}
          rows={analytics.confluenceBreakdown.map((c) => [
            c.confluence, String(c.trades), formatCurrency(c.pnl), `${c.winRate.toFixed(1)}%`, formatCurrency(c.avgWin), formatCurrency(c.avgLoss)
          ])} toneFn={(row) => row[2].startsWith('-') ? 'negative' : 'positive'} />
      </div>
    </>
  );
}

function BreakdownTable({ title, icon, headers, rows, toneFn }: { title: string; icon: React.ReactNode; headers: string[]; rows: string[][]; toneFn: (row: string[]) => string }) {
  return (
    <section className="panel breakdown-panel">
      <div className="panel-head">
        <div>
          <div className="panel-title">{icon}{title}</div>
          <div className="panel-caption">Breakdown by {title.toLowerCase()}</div>
        </div>
        <button className="icon-button"><MoreHorizontal size={17} /></button>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {headers.map((h, i) => <th key={h} className={i === 0 ? 'first-col' : ''}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className={ci === 0 ? 'first-col' : ''}>
                    {ci === 0 ? <span className={`breakdown-label ${toneFn(row)}`}>{cell}</span> : <span className={ci === 3 || ci === 2 ? toneFn(row) : ''}>{cell}</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
