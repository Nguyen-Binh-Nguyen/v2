import type { Trade, TradeView } from '@/types';
import { CalendarDays, Check, ChevronDown, ClipboardList, Image as ImageIcon, LayoutGrid, List, Trash2, X } from 'lucide-react';
import { formatDate, formatTime, formatCurrency, resultTone, weekKey, shortDayLabel } from '@/analytics';

export function TradeTable({ trades, sortAscending, setSortAscending, onRowClick, onDelete }: {
  trades: Trade[];
  sortAscending: boolean;
  setSortAscending: (v: boolean) => void;
  onRowClick: (trade: Trade) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="table-scroll">
      <table className="compact-table">
        <thead>
          <tr>
            <th className="index-col">#</th>
            <th><button className="th-sort" onClick={() => setSortAscending(!sortAscending)}>Date & time <ChevronDown size={13} className={sortAscending ? 'rotate' : ''} /></button></th>
            <th>Plan</th>
            <th>Psychology</th>
            <th>Confluences</th>
            <th>L/S</th>
            <th>SL</th>
            <th>TP</th>
            <th>Result</th>
            <th>PnL</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, index) => (
            <tr key={trade.id} className="clickable-row" onClick={() => onRowClick(trade)}>
              <td className="index-col">{String(index + 1).padStart(2, '0')}</td>
              <td>
                <div className="date-cell">
                  <CalendarDays size={14} />
                  <div>
                    <strong>{formatDate(trade.dateTime)}</strong>
                    <span>{formatTime(trade.dateTime)}</span>
                  </div>
                </div>
              </td>
              <td><span className={`compliance ${trade.planCompliance.toLowerCase()}`}>{trade.planCompliance === 'Yes' ? <Check size={12} /> : <X size={12} />}{trade.planCompliance}</span></td>
              <td><span className="psychology"><span className={`psych-dot ${trade.psychology === 'Calm / Disciplined' ? 'green' : 'red'}`}></span>{trade.psychology}</span></td>
              <td className="confluences">{trade.confluences.length ? trade.confluences.join(', ') : <span className="empty-value">—</span>}</td>
              <td><span className={`dir-pill ${trade.direction.toLowerCase()}`}>{trade.direction === 'Long' ? 'L' : 'S'}</span></td>
              <td className="mono-cell">${trade.sl}</td>
              <td className="mono-cell">${trade.tp}</td>
              <td><span className={`result-pill ${resultTone(trade.result)}`}><span></span>{trade.result}</span></td>
              <td><strong className={trade.pnl >= 0 ? 'positive' : 'negative'}>{trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}</strong></td>
              <td><button className="row-delete" onClick={(e) => { e.stopPropagation(); onDelete(trade.id); }} aria-label="Delete trade"><Trash2 size={14} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {trades.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon"><ClipboardList size={22} /></div>
          <h3>No trades found</h3>
          <p>Adjust your view or add your first trade to start building your record.</p>
        </div>
      )}
    </div>
  );
}

export function TradeGallery({ trades, onCardClick }: { trades: Trade[]; onCardClick: (trade: Trade) => void }) {
  return (
    <div className="gallery-grid">
      {trades.map((trade) => (
        <div className="gallery-card" key={trade.id} onClick={() => onCardClick(trade)}>
          <div className="gallery-image">
            {trade.imageUrl ? (
              <img src={trade.imageUrl} alt={trade.name} />
            ) : (
              <div className="gallery-no-image"><ImageIcon size={28} /></div>
            )}
          </div>
          <div className="gallery-info">
            <div className="gallery-top">
              <strong>{trade.name}</strong>
              <span className={`result-pill ${resultTone(trade.result)}`}><span></span>{trade.result}</span>
            </div>
            <div className="gallery-meta">{formatDate(trade.dateTime)} · {trade.direction}</div>
            <strong className={trade.pnl >= 0 ? 'positive' : 'negative'}>{trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}</strong>
          </div>
        </div>
      ))}
      {trades.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon"><LayoutGrid size={22} /></div>
          <h3>No trades to display</h3>
          <p>Add a trade to see it in the gallery.</p>
        </div>
      )}
    </div>
  );
}

export function WeeklyTable({ trades, sortAscending, setSortAscending, onRowClick, onDelete }: {
  trades: Trade[];
  sortAscending: boolean;
  setSortAscending: (v: boolean) => void;
  onRowClick: (trade: Trade) => void;
  onDelete: (id: string) => void;
}) {
  const groups = Array.from(new Set(trades.map((t) => weekKey(t.dateTime)))).sort().reverse();
  return (
    <div className="weekly-wrap">
      {groups.map((key) => {
        const weekTrades = trades.filter((t) => weekKey(t.dateTime) === key);
        const total = weekTrades.reduce((s, t) => s + t.pnl, 0);
        return (
          <div className="weekly-group" key={key}>
            <div className="weekly-group-head">
              <strong>Week of {shortDayLabel(key)}</strong>
              <span>{weekTrades.length} trades</span>
              <strong className={total >= 0 ? 'positive' : 'negative'}>{total >= 0 ? '+' : ''}{formatCurrency(total)}</strong>
            </div>
            <TradeTable trades={weekTrades} sortAscending={sortAscending} setSortAscending={setSortAscending} onRowClick={onRowClick} onDelete={onDelete} />
          </div>
        );
      })}
      {groups.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon"><ClipboardList size={22} /></div>
          <h3>No trades this week</h3>
          <p>Add trades to see them grouped by week.</p>
        </div>
      )}
    </div>
  );
}

export function WeeklyGallery({ trades, onCardClick }: { trades: Trade[]; onCardClick: (trade: Trade) => void }) {
  const groups = Array.from(new Set(trades.map((t) => weekKey(t.dateTime)))).sort().reverse();
  return (
    <div className="weekly-wrap">
      {groups.map((key) => {
        const weekTrades = trades.filter((t) => weekKey(t.dateTime) === key);
        const total = weekTrades.reduce((s, t) => s + t.pnl, 0);
        return (
          <div className="weekly-group" key={key}>
            <div className="weekly-group-head">
              <strong>Week of {shortDayLabel(key)}</strong>
              <span>{weekTrades.length} trades</span>
              <strong className={total >= 0 ? 'positive' : 'negative'}>{total >= 0 ? '+' : ''}{formatCurrency(total)}</strong>
            </div>
            <TradeGallery trades={weekTrades} onCardClick={onCardClick} />
          </div>
        );
      })}
      {groups.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon"><LayoutGrid size={22} /></div>
          <h3>No trades this week</h3>
          <p>Add trades to see them in the weekly gallery.</p>
        </div>
      )}
    </div>
  );
}

export function JournalToolbar({ query, setQuery }: { query: string; setQuery: (q: string) => void }) {
  return (
    <div className="toolbar">
      <div className="search-box">
        <List size={15} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search trades..." />
      </div>
    </div>
  );
}

export function ViewTabs({ view, setView }: { view: TradeView; setView: (v: TradeView) => void }) {
  const tabs: { id: TradeView; label: string; icon: typeof List }[] = [
    { id: 'full-log', label: 'Full Log', icon: List },
    { id: 'full-gallery', label: 'Full Gallery', icon: LayoutGrid },
    { id: 'weekly-log', label: 'Weekly Log', icon: List },
    { id: 'weekly-gallery', label: 'Weekly Gallery', icon: LayoutGrid },
    { id: 'loss-log', label: 'Loss Log', icon: List },
    { id: 'win-log', label: 'Win Log', icon: List },
  ];
  return (
    <div className="view-tabs">
      {tabs.map((tab) => (
        <button key={tab.id} className={view === tab.id ? 'selected' : ''} onClick={() => setView(tab.id)}>
          <tab.icon size={14} />{tab.label}
        </button>
      ))}
    </div>
  );
}
