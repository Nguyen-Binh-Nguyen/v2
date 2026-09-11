import type { ReactNode } from 'react';
import { BarChart3, Check, ClipboardList, LineChart, MoreHorizontal, Sparkles, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/analytics';

export function MiniStat({ label, value, tone, icon }: { label: string; value: string; tone?: string; icon: ReactNode }) {
  return (
    <div className="mini-stat">
      <div className="mini-stat-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong className={tone || ''}>{value}</strong>
      </div>
    </div>
  );
}

export function MetricCard({ label, value, detail, positive, icon }: { label: string; value: string; detail: string; positive: boolean; icon: ReactNode }) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${positive ? 'good' : 'alert'}`}>{icon}</div>
      <span>{label}</span>
      <strong className={positive ? 'positive' : ''}>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

export function ChartPanel({ title, caption, icon, children }: { title: string; caption: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="panel chart-panel">
      <div className="panel-head">
        <div>
          <div className="panel-title">{icon}{title}</div>
          <div className="panel-caption">{caption}</div>
        </div>
        <button className="icon-button"><MoreHorizontal size={17} /></button>
      </div>
      {children}
    </section>
  );
}

export function EquityChart({ points }: { points: { label: string; value: number }[] }) {
  if (!points.length) return <div className="chart-empty">Add trades to reveal your equity curve.</div>;
  const width = 680;
  const height = 230;
  const values = points.map((p) => p.value);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const range = max - min || 1;
  const coords = points.map((p, i) => `${(i / Math.max(points.length - 1, 1)) * width},${height - ((p.value - min) / range) * height}`).join(' ');
  const zeroY = height - ((0 - min) / range) * height;
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(103,163,119,0.22)" />
            <stop offset="100%" stopColor="rgba(103,163,119,0)" />
          </linearGradient>
        </defs>
        <line x1="0" y1={zeroY} x2={width} y2={zeroY} className="zero-line" />
        <polyline points={`0,${height} ${coords} ${width},${height}`} fill="url(#equityFill)" stroke="none" />
        <polyline points={coords} className="equity-line" />
        {points.map((p, i) => (
          <circle key={`${p.label}-${i}`} cx={(i / Math.max(points.length - 1, 1)) * width} cy={height - ((p.value - min) / range) * height} r="3" className="chart-point" />
        ))}
      </svg>
      <div className="chart-labels">
        <span>{points[0].label}</span>
        <span>{points[Math.floor(points.length / 2)].label}</span>
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  );
}

export function DailyChart({ points }: { points: { label: string; value: number }[] }) {
  if (!points.length) return <div className="chart-empty">Add trades to reveal daily performance.</div>;
  const max = Math.max(...points.map((p) => Math.abs(p.value)), 1);
  return (
    <div className="bar-chart">
      {points.slice(-12).map((p) => (
        <div className="bar-item" key={p.label}>
          <div className="bar-track">
            <div className={`bar ${p.value >= 0 ? 'positive-bar' : 'negative-bar'}`} style={{ height: `${Math.max((Math.abs(p.value) / max) * 85, 5)}%` }} />
          </div>
          <span>{p.label.split(' ')[1] || p.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Insight({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="insight">
      <span>{label}</span>
      <strong className={positive ? 'positive' : ''}>{value}</strong>
    </div>
  );
}

export { BarChart3, Check, ClipboardList, LineChart, Sparkles, Target, TrendingDown, TrendingUp, formatCurrency };
