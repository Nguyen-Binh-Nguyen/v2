import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const STORAGE_BUCKET = 'trade-images';

export type Trade = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  date: string;
  time: string | null;
  symbol: string;
  direction: 'long' | 'short';
  setup_type: string;
  result: 'win' | 'loss' | 'breakeven' | 'be_win' | 'be_loss';
  pnl: number;
  r_multiple: number | null;
  sl_points: number | null;
  tp_points: number | null;
  psychology: string;
  plan_compliance: boolean;
  confluences: string[];
  notes: string;
  image_path: string | null;
};

export type JournalSettings = {
  id: string;
  user_id: string;
  updated_at: string;
  theme: 'dark' | 'light';
  documentary_cover: string | null;
  statistics_cover: string | null;
  documentary_cover_offset: number;
  statistics_cover_offset: number;
  labels: Record<string, string>;
  confluences: string[];
};

export const DEFAULT_CONFLUENCES = [
  'Goldbach Time', 'Monc-Weec', 'Hid Monc-Weec', 'Dailyc', 'Hid Dailyc', 'Quarterc', 'Hid Quarterc',
  'Microc', 'Hid Microc', 'Nanoc', 'Hid Nanoc', 'H1 IMB GB', 'H1 OB GB', 'M15 IMB GB', 'M15 OB OB',
  'M5 IMB GB', 'M5 OB GB', 'M1 IMB GB', 'M1 OB GB', '1st IMB', 'Prev 1st IMB', 'RTH', 'Prev RTH',
  'CB MOR', 'NXOG', 'Abo/Bel 1 T.O', 'Abo/Bel 2 T.O', 'Abo/Bel 2+ T.O', 'OTE+M1 IMB', 'SMTF',
];

export const DEFAULT_LABELS: Record<string, string> = {
  'toc.cumulative_pnl': 'Cumulative PnL',
  'toc.result': 'Result',
  'toc.psychology': 'Psychology',
  'toc.plan_compliance': 'Plan Compliance',
  'toc.profit_factor': 'Profit Factor',
  'toc.avg_rr': 'Avg RR',
  'toc.expectancy': 'Expectancy ($USD)',
  'toc.max_consecutive_loss': 'Max Consecutive Loss',
  'toc.max_drawdown': 'Max Drawdown',
  'toc.worst_pnl': 'Worst Daily/Weekly PnL',
  'toc.best_pnl': 'Best Daily/Weekly PnL',
  'toc.trades_by_time': 'Trades by Time',
  'toc.win_rate_by_time': 'Win Rate by Time',
  'toc.total_pnl_by_time': 'Total PnL by Time',
  'toc.avg_pnl_by_time': 'Avg PnL by Time',
  'toc.confluences': 'Confluences',
  'toc.weekdays': 'Weekdays',
  'toc.months': 'Months',
  'toc.setup_type': 'Setup Type',

  'section.cumulative_pnl': 'Cumulative PnL',
  'section.result': 'Result',
  'section.psychology': 'Psychology',
  'section.plan_compliance': 'Plan Compliance',
  'section.profit_factor': 'Profit Factor',
  'section.avg_rr': 'Avg RR',
  'section.expectancy': 'Expectancy ($USD)',
  'section.max_consecutive_loss': 'Max Consecutive Loss',
  'section.max_drawdown': 'Max Drawdown',
  'section.worst_pnl': 'Worst Daily/Weekly PnL',
  'section.best_pnl': 'Best Daily/Weekly PnL',
  'section.trades_by_time': 'Trades by Time',
  'section.win_rate_by_time': 'Win Rate by Time',
  'section.total_pnl_by_time': 'Total PnL by Time',
  'section.avg_pnl_by_time': 'Avg PnL by Time',
  'section.confluences': 'Confluences',
  'section.weekdays': 'Weekdays',
  'section.months': 'Months',
  'section.setup_type': 'Setup Type',

  'desc.cumulative_pnl': 'Running total of profit and loss across all trades over time.',
  'desc.result': 'Breakdown of trades by outcome: wins, losses, and breakeven.',
  'desc.psychology': 'Distribution of trades across emotional and psychological states.',
  'desc.plan_compliance': 'How often trades followed the predefined trading plan.',
  'desc.profit_factor': 'Gross profit divided by gross loss — a measure of profitability.',
  'desc.avg_rr': 'Average reward-to-risk ratio across all trades.',
  'desc.expectancy': 'Average dollar amount expected per trade based on historical results.',
  'desc.max_consecutive_loss': 'Longest streak of losing trades in a row.',
  'desc.max_drawdown': 'Largest peak-to-trough decline in cumulative PnL.',
  'desc.worst_pnl': 'Worst single-day and single-week PnL performance.',
  'desc.best_pnl': 'Best single-day and single-week PnL performance.',
  'desc.trades_by_time': 'Number of trades taken grouped by hour of day.',
  'desc.win_rate_by_time': 'Win rate percentage grouped by hour of day.',
  'desc.total_pnl_by_time': 'Total PnL grouped by hour of day.',
  'desc.avg_pnl_by_time': 'Average PnL per trade grouped by hour of day.',
  'desc.confluences': 'Performance breakdown by confluence factors.',
  'desc.weekdays': 'Performance breakdown by day of the week.',
  'desc.months': 'Performance breakdown by month.',
  'desc.setup_type': 'Performance breakdown by setup type.',

  'label.wins': 'Wins',
  'label.losses': 'Losses',
  'label.breakeven': 'Breakeven',
  'label.win_rate': 'Win Rate',
  'label.total_trades': 'Total Trades',
  'label.total_pnl': 'Total PnL',
  'label.avg_pnl': 'Avg PnL / Trade',
  'label.gross_profit': 'Gross Profit',
  'label.gross_loss': 'Gross Loss',
  'label.compliant': 'Compliant',
  'label.non_compliant': 'Non-Compliant',
  'label.long': 'Long',
  'label.short': 'Short',
  'label.hour': 'Hour',
  'label.day': 'Day',
  'label.month': 'Month',
  'label.trades': 'Trades',
  'label.pnl': 'PnL',
  'label.win_rate_pct': 'Win Rate %',
  'label.avg_pnl_per_trade': 'Avg PnL / Trade',
  'label.peak': 'Peak',
  'label.trough': 'Trough',
  'label.drawdown': 'Drawdown',
  'label.streak': 'Streak',
  'label.daily': 'Daily',
  'label.weekly': 'Weekly',
  'label.count': 'Count',
  'label.type': 'Type',
  'label.confluence': 'Confluence',
  'label.weekday': 'Weekday',
  'label.setup': 'Setup',
  'label.symbol': 'Symbol',
  'label.direction': 'Direction',
  'label.date': 'Date',
  'label.time': 'Time',
  'label.result': 'Result',
  'label.r_multiple': 'R Multiple',
  'label.sl_points': 'SL (points)',
  'label.tp_points': 'TP (points)',
  'label.psychology': 'Psychology',
  'label.plan_compliance': 'Plan Compliance',
  'label.confluences': 'Confluences',
  'label.notes': 'Notes',
  'label.image': 'Image',
  'label.actions': 'Actions',
  'label.avg_sl': 'Avg SL (points)',
  'label.avg_tp': 'Avg TP (points)',
  'label.avg_rr_short': 'Avg RR',
  'label.expectancy': 'Expectancy',
  'label.profit_factor': 'Profit Factor',
  'label.max_consecutive_loss': 'Max Consecutive Loss',
  'label.max_drawdown': 'Max Drawdown',
  'label.worst_daily': 'Worst Daily PnL',
  'label.worst_weekly': 'Worst Weekly PnL',
  'label.best_daily': 'Best Daily PnL',
  'label.best_weekly': 'Best Weekly PnL',
};
