import type { Trade } from './supabase';

export type BreakdownRow = {
  key: string;
  trades: number;
  pnl: number;
  avgEarning: number;
  avgLosing: number;
  winRate: number;
  proportion: number;
};

export type Metrics = {
  totalTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  beWin: number;
  beLoss: number;
  winRate: number;
  totalPnL: number;
  avgPnL: number;
  avgWinPoints: number;
  avgLossPoints: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  avgRR: number;
  expectancy: number;
  avgSL: number;
  avgTP: number;
  compliant: number;
  nonCompliant: number;
  maxConsecutiveLoss: number;
  maxDrawdown: number;
  peakPnL: number;
  troughPnL: number;
  worstDailyPnL: number;
  bestDailyPnL: number;
  worstWeeklyPnL: number;
  bestWeeklyPnL: number;
  cumulativePnL: { date: string; value: number }[];
  tradesByTime: { hour: string; count: number }[];
  winRateByTime: { hour: string; winRate: number }[];
  totalPnLByTime: { hour: string; pnl: number }[];
  avgPnLByTime: { hour: string; avgPnL: number }[];
  byWeekday: BreakdownRow[];
  byMonth: BreakdownRow[];
  bySetup: BreakdownRow[];
  byConfluence: BreakdownRow[];
  byPsychology: BreakdownRow[];
  byPlanCompliance: BreakdownRow[];
  byResult: BreakdownRow[];
  byDirection: BreakdownRow[];
  avgRRByResult: { result: string; avgRR: number; trades: number }[];
};

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const RESULT_LABELS: Record<string, string> = {
  win: 'Win',
  loss: 'Loss',
  breakeven: 'Breakeven',
  be_win: 'BE → Win',
  be_loss: 'BE → Loss',
};

export const PSYCHOLOGY_OPTIONS = [
  'Calm/Disciplined',
  'FOMO/Impulsive',
  'Fearful/Hesitant',
  'Revenge/Tilted',
  'Greedy/Overconfident',
];

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function isWin(t: Trade): boolean {
  return t.result === 'win';
}

function isLoss(t: Trade): boolean {
  return t.result === 'loss' || t.result === 'be_loss';
}

function buildBreakdown(
  groups: Map<string, { trades: number; pnl: number; wins: number; earnings: number; earningCount: number; losses: number; losingCount: number }>,
  totalTrades: number,
  labelMap?: (key: string) => string
): BreakdownRow[] {
  const entries = Array.from(groups.entries());
  return entries
    .sort((a, b) => b[1].pnl - a[1].pnl)
    .map(([key, e]) => ({
      key: labelMap ? labelMap(key) : key,
      trades: e.trades,
      pnl: e.pnl,
      avgEarning: e.earningCount > 0 ? e.earnings / e.earningCount : 0,
      avgLosing: e.losingCount > 0 ? e.losses / e.losingCount : 0,
      winRate: e.trades > 0 ? (e.wins / e.trades) * 100 : 0,
      proportion: totalTrades > 0 ? (e.trades / totalTrades) * 100 : 0,
    }));
}

export function computeMetrics(trades: Trade[]): Metrics {
  const sorted = [...trades].sort((a, b) => {
    const da = new Date(`${a.date}T${a.time || '00:00'}`);
    const db = new Date(`${b.date}T${b.time || '00:00'}`);
    return da.getTime() - db.getTime();
  });

  const totalTrades = sorted.length;
  const wins = sorted.filter((t) => t.result === 'win').length;
  const losses = sorted.filter((t) => t.result === 'loss').length;
  const beWin = sorted.filter((t) => t.result === 'be_win').length;
  const beLoss = sorted.filter((t) => t.result === 'be_loss').length;
  const breakeven = sorted.filter((t) => t.result === 'breakeven').length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const totalPnL = sorted.reduce((s, t) => s + (t.pnl || 0), 0);
  const avgPnL = totalTrades > 0 ? totalPnL / totalTrades : 0;
  const grossProfit = sorted.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(sorted.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  const rrValues = sorted.filter((t) => t.r_multiple != null).map((t) => t.r_multiple!);
  const avgRR = rrValues.length > 0 ? rrValues.reduce((s, v) => s + v, 0) / rrValues.length : 0;
  const expectancy = avgPnL;

  // Avg win/loss points: average TP for winning trades, average SL for losing trades
  const winTPValues = sorted.filter((t) => isWin(t) && t.tp_points != null).map((t) => t.tp_points!);
  const avgWinPoints = winTPValues.length > 0 ? winTPValues.reduce((s, v) => s + v, 0) / winTPValues.length : 0;
  const lossSLValues = sorted.filter((t) => isLoss(t) && t.sl_points != null).map((t) => t.sl_points!);
  const avgLossPoints = lossSLValues.length > 0 ? lossSLValues.reduce((s, v) => s + v, 0) / lossSLValues.length : 0;

  const slValues = sorted.filter((t) => t.sl_points != null).map((t) => t.sl_points!);
  const avgSL = slValues.length > 0 ? slValues.reduce((s, v) => s + v, 0) / slValues.length : 0;
  const tpValues = sorted.filter((t) => t.tp_points != null).map((t) => t.tp_points!);
  const avgTP = tpValues.length > 0 ? tpValues.reduce((s, v) => s + v, 0) / tpValues.length : 0;

  const compliant = sorted.filter((t) => t.plan_compliance).length;
  const nonCompliant = totalTrades - compliant;

  // Max consecutive loss (loss + be_loss both count as losing trades)
  let maxConsecutiveLoss = 0;
  let currentStreak = 0;
  for (const t of sorted) {
    if (isLoss(t)) {
      currentStreak++;
      maxConsecutiveLoss = Math.max(maxConsecutiveLoss, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  // Cumulative PnL + drawdown
  let cumulative = 0;
  const cumulativePnL: { date: string; value: number }[] = [];
  let peak = 0;
  let trough = 0;
  let maxDrawdown = 0;
  for (const t of sorted) {
    cumulative += t.pnl || 0;
    cumulativePnL.push({ date: t.date, value: cumulative });
    peak = Math.max(peak, cumulative);
    trough = Math.min(trough, cumulative);
    const dd = peak - cumulative;
    maxDrawdown = Math.max(maxDrawdown, dd);
  }

  // Daily PnL
  const dailyMap = new Map<string, number>();
  for (const t of sorted) {
    dailyMap.set(t.date, (dailyMap.get(t.date) || 0) + (t.pnl || 0));
  }
  const dailyValues = Array.from(dailyMap.values());
  const worstDailyPnL = dailyValues.length > 0 ? Math.min(...dailyValues) : 0;
  const bestDailyPnL = dailyValues.length > 0 ? Math.max(...dailyValues) : 0;

  // Weekly PnL
  const weeklyMap = new Map<string, number>();
  for (const t of sorted) {
    const d = new Date(t.date);
    const week = getISOWeek(d);
    weeklyMap.set(week, (weeklyMap.get(week) || 0) + (t.pnl || 0));
  }
  const weeklyValues = Array.from(weeklyMap.values());
  const worstWeeklyPnL = weeklyValues.length > 0 ? Math.min(...weeklyValues) : 0;
  const bestWeeklyPnL = weeklyValues.length > 0 ? Math.max(...weeklyValues) : 0;

  // Time-based metrics
  const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  const timeCount = new Map<string, number>();
  const timeWinCount = new Map<string, number>();
  const timePnL = new Map<string, number>();
  for (const h of HOURS) {
    timeCount.set(h, 0);
    timeWinCount.set(h, 0);
    timePnL.set(h, 0);
  }
  for (const t of sorted) {
    if (!t.time) continue;
    const hour = t.time.substring(0, 2) + ':00';
    timeCount.set(hour, (timeCount.get(hour) || 0) + 1);
    if (isWin(t)) timeWinCount.set(hour, (timeWinCount.get(hour) || 0) + 1);
    timePnL.set(hour, (timePnL.get(hour) || 0) + (t.pnl || 0));
  }
  const tradesByTime = HOURS.map((h) => ({ hour: h, count: timeCount.get(h) || 0 })).filter((x) => x.count > 0);
  const winRateByTime = HOURS.map((h) => {
    const c = timeCount.get(h) || 0;
    const w = timeWinCount.get(h) || 0;
    return { hour: h, winRate: c > 0 ? (w / c) * 100 : 0 };
  }).filter((x) => timeCount.get(x.hour)! > 0);
  const totalPnLByTime = HOURS.map((h) => ({ hour: h, pnl: timePnL.get(h) || 0 })).filter((x) => x.pnl !== 0);
  const avgPnLByTime = HOURS.map((h) => {
    const c = timeCount.get(h) || 0;
    const p = timePnL.get(h) || 0;
    return { hour: h, avgPnL: c > 0 ? p / c : 0 };
  }).filter((x) => timeCount.get(x.hour)! > 0);

  // Helper to accumulate a group entry
  type GroupEntry = { trades: number; pnl: number; wins: number; earnings: number; earningCount: number; losses: number; losingCount: number };
  function newEntry(): GroupEntry {
    return { trades: 0, pnl: 0, wins: 0, earnings: 0, earningCount: 0, losses: 0, losingCount: 0 };
  }
  function addTrade(entry: GroupEntry, t: Trade) {
    entry.trades++;
    entry.pnl += t.pnl || 0;
    if (isWin(t)) entry.wins++;
    if ((t.pnl || 0) > 0) {
      entry.earnings += t.pnl || 0;
      entry.earningCount++;
    }
    if ((t.pnl || 0) < 0) {
      entry.losses += t.pnl || 0;
      entry.losingCount++;
    }
  }

  // By weekday
  const weekdayMap = new Map<string, GroupEntry>();
  for (let i = 0; i < 7; i++) weekdayMap.set(WEEKDAY_NAMES[i], newEntry());
  for (const t of sorted) {
    const d = new Date(t.date);
    const day = WEEKDAY_NAMES[d.getDay()];
    addTrade(weekdayMap.get(day)!, t);
  }
  const byWeekday = WEEKDAY_NAMES
    .map((day) => ({ day, entry: weekdayMap.get(day)! }))
    .filter((x) => x.entry.trades > 0)
    .map((x) => ({
      key: x.day,
      trades: x.entry.trades,
      pnl: x.entry.pnl,
      avgEarning: x.entry.earningCount > 0 ? x.entry.earnings / x.entry.earningCount : 0,
      avgLosing: x.entry.losingCount > 0 ? x.entry.losses / x.entry.losingCount : 0,
      winRate: x.entry.trades > 0 ? (x.entry.wins / x.entry.trades) * 100 : 0,
      proportion: totalTrades > 0 ? (x.entry.trades / totalTrades) * 100 : 0,
    }));

  // By month
  const monthMap = new Map<string, GroupEntry>();
  for (const t of sorted) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${MONTH_NAMES[d.getMonth()]}`;
    if (!monthMap.has(key)) monthMap.set(key, newEntry());
    addTrade(monthMap.get(key)!, t);
  }
  const byMonth = Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, e]) => ({
      key,
      trades: e.trades,
      pnl: e.pnl,
      avgEarning: e.earningCount > 0 ? e.earnings / e.earningCount : 0,
      avgLosing: e.losingCount > 0 ? e.losses / e.losingCount : 0,
      winRate: e.trades > 0 ? (e.wins / e.trades) * 100 : 0,
      proportion: totalTrades > 0 ? (e.trades / totalTrades) * 100 : 0,
    }));

  // By setup type
  const setupMap = new Map<string, GroupEntry>();
  for (const t of sorted) {
    const key = t.setup_type || 'Unknown';
    if (!setupMap.has(key)) setupMap.set(key, newEntry());
    addTrade(setupMap.get(key)!, t);
  }
  const bySetup = buildBreakdown(setupMap, totalTrades);

  // By confluence
  const confluenceMap = new Map<string, GroupEntry>();
  for (const t of sorted) {
    for (const c of t.confluences || []) {
      const key = c.trim();
      if (!key) continue;
      if (!confluenceMap.has(key)) confluenceMap.set(key, newEntry());
      addTrade(confluenceMap.get(key)!, t);
    }
  }
  const byConfluence = buildBreakdown(confluenceMap, totalTrades);

  // By psychology
  const psychMap = new Map<string, GroupEntry>();
  for (const t of sorted) {
    const key = t.psychology || 'Unknown';
    if (!psychMap.has(key)) psychMap.set(key, newEntry());
    addTrade(psychMap.get(key)!, t);
  }
  const byPsychology = buildBreakdown(psychMap, totalTrades);

  // Plan compliance
  const planMap = new Map<string, GroupEntry>();
  planMap.set('Yes', newEntry());
  planMap.set('No', newEntry());
  for (const t of sorted) {
    addTrade(planMap.get(t.plan_compliance ? 'Yes' : 'No')!, t);
  }
  const byPlanCompliance = buildBreakdown(planMap, totalTrades);

  // By result — 4 categories: Win, Loss, BE → Win, BE → Loss
  const resultMap = new Map<string, GroupEntry>();
  resultMap.set('win', newEntry());
  resultMap.set('loss', newEntry());
  resultMap.set('be_win', newEntry());
  resultMap.set('be_loss', newEntry());
  for (const t of sorted) {
    let key: string;
    if (t.result === 'win') key = 'win';
    else if (t.result === 'loss') key = 'loss';
    else if (t.result === 'be_win') key = 'be_win';
    else if (t.result === 'be_loss') key = 'be_loss';
    else key = 'breakeven';
    if (!resultMap.has(key)) resultMap.set(key, newEntry());
    addTrade(resultMap.get(key)!, t);
  }
  const byResult = buildBreakdown(resultMap, totalTrades, (k) => RESULT_LABELS[k] || k);

  // Avg RR by result
  const rrByResultMap = new Map<string, { sum: number; count: number }>();
  for (const t of sorted) {
    if (t.r_multiple == null) continue;
    let key: string;
    if (t.result === 'win') key = 'win';
    else if (t.result === 'loss') key = 'loss';
    else if (t.result === 'be_win') key = 'be_win';
    else if (t.result === 'be_loss') key = 'be_loss';
    else key = 'breakeven';
    const entry = rrByResultMap.get(key) || { sum: 0, count: 0 };
    entry.sum += t.r_multiple;
    entry.count++;
    rrByResultMap.set(key, entry);
  }
  const avgRRByResult = Array.from(rrByResultMap.entries())
    .map(([result, e]) => ({ result: RESULT_LABELS[result] || result, avgRR: e.count > 0 ? e.sum / e.count : 0, trades: e.count }))
    .sort((a, b) => b.trades - a.trades);

  // By direction
  const dirMap = new Map<string, GroupEntry>();
  dirMap.set('Long', newEntry());
  dirMap.set('Short', newEntry());
  for (const t of sorted) {
    addTrade(dirMap.get(t.direction === 'long' ? 'Long' : 'Short')!, t);
  }
  const byDirection = buildBreakdown(dirMap, totalTrades);

  return {
    totalTrades,
    wins,
    losses,
    breakeven,
    beWin,
    beLoss,
    winRate,
    totalPnL,
    avgPnL,
    avgWinPoints,
    avgLossPoints,
    grossProfit,
    grossLoss,
    profitFactor,
    avgRR,
    expectancy,
    avgSL,
    avgTP,
    compliant,
    nonCompliant,
    maxConsecutiveLoss,
    maxDrawdown,
    peakPnL: peak,
    troughPnL: trough,
    worstDailyPnL,
    bestDailyPnL,
    worstWeeklyPnL,
    bestWeeklyPnL,
    cumulativePnL,
    tradesByTime,
    winRateByTime,
    totalPnLByTime,
    avgPnLByTime,
    byWeekday,
    byMonth,
    bySetup,
    byConfluence,
    byPsychology,
    byPlanCompliance,
    byResult,
    byDirection,
    avgRRByResult,
  };
}

export function getWeekKey(dateStr: string): string {
  return getISOWeek(new Date(dateStr));
}

export function getCurrentWeekKey(): string {
  return getISOWeek(new Date());
}

export { WEEKDAY_NAMES, MONTH_NAMES };
