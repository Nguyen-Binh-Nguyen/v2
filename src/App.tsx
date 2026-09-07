import { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Check, ChevronDown, ChevronRight, ClipboardList, Download, Image as ImageIcon, Menu, Moon, MoreHorizontal, Plus, RotateCcw, Settings2, Sparkles, Sun, Target, TrendingUp, X } from 'lucide-react';
import type { Page, Trade, TradeView, BoardGroup } from './types';
import { realTrades } from './trades';
import { calculateAnalytics, formatCurrency, weekKey } from './analytics';
import { TradeTable, TradeGallery, WeeklyTable, WeeklyGallery, JournalToolbar, ViewTabs } from './components/JournalViews';
import { StatisticsPage } from './components/StatisticsPage';
import { TradeForm, blankForm } from './components/TradeForm';
import type { TradeFormState } from './components/TradeForm';
import { MiniStat } from './components/ui';
import { TradeDetail } from './components/TradeDetail';
import { fetchTrades, insertTradeDb, updateTradeDb, deleteTradeDb, clearAllTradesDb, restoreDemoTradesDb } from './lib/tradeApi';

function App() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<Page>('journal');
  const [view, setView] = useState<TradeView>('full-log');
  const [boardGroup, setBoardGroup] = useState<BoardGroup>('week');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TradeFormState>(blankForm);
  const [query, setQuery] = useState('');
  const [sortAscending, setSortAscending] = useState(false);
  const [notice, setNotice] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => localStorage.getItem('tradecraft-theme') === 'light' ? 'light' : 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [detailTrade, setDetailTrade] = useState<Trade | null>(null);
  const [coverImage, setCoverImage] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchTrades();
        if (data.length === 0) {
          await restoreDemoTradesDb();
          const fresh = await fetchTrades();
          setTrades(fresh);
        } else {
          setTrades(data);
        }
      } catch {
        setTrades(realTrades);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredTrades = useMemo(() => {
    let result = trades;
    if (view === 'loss-log') result = result.filter((t) => t.result === 'Loss');
    else if (view === 'win-log') result = result.filter((t) => t.result === 'Win');
    else if (view === 'weekly-log' || view === 'weekly-gallery') {
      const currentWeek = weekKey(new Date().toISOString());
      result = result.filter((t) => weekKey(t.dateTime) === currentWeek);
    }
    return result
      .filter((t) => Object.values(t).join(' ').toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => sortAscending ? a.dateTime.localeCompare(b.dateTime) : b.dateTime.localeCompare(a.dateTime));
  }, [trades, query, sortAscending, view]);

  const analytics = useMemo(() => calculateAnalytics(trades), [trades]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newTrade: Trade = {
      id: crypto.randomUUID(),
      name: form.name || `TEST ${String(trades.length + 1).padStart(2, '0')}`,
      dateTime: form.dateTime,
      type: form.type,
      result: form.result,
      pnl: Number(form.pnl),
      planCompliance: form.planCompliance,
      psychology: form.psychology,
      setupType: form.setupType,
      confluences: form.confluences,
      direction: form.direction,
      sl: Number(form.sl) || 0,
      tp: Number(form.tp) || 0,
      rr: Number(form.rr) || 0,
      notes: '',
      imageUrl: '',
    };
    try {
      await insertTradeDb(newTrade);
      setTrades([newTrade, ...trades]);
      setForm(blankForm);
      setShowForm(false);
      setNotice('Trade added');
      window.setTimeout(() => setNotice(''), 2800);
    } catch {
      setNotice('Failed to save trade');
      window.setTimeout(() => setNotice(''), 2800);
    }
  };

  const deleteTrade = async (id: string) => {
    try {
      await deleteTradeDb(id);
      setTrades(trades.filter((t) => t.id !== id));
      setNotice('Trade deleted');
      window.setTimeout(() => setNotice(''), 2800);
    } catch {
      setNotice('Failed to delete');
      window.setTimeout(() => setNotice(''), 2800);
    }
  };

  const saveTrade = async (updated: Trade) => {
    try {
      await updateTradeDb(updated);
      setTrades(trades.map((t) => t.id === updated.id ? updated : t));
      setDetailTrade(null);
      setNotice('Trade saved');
      window.setTimeout(() => setNotice(''), 2800);
    } catch {
      setNotice('Failed to save');
      window.setTimeout(() => setNotice(''), 2800);
    }
  };

  const clearJournal = async () => {
    try {
      await clearAllTradesDb();
      setTrades([]);
      setShowClearConfirm(false);
      setNotice('Journal cleared');
      window.setTimeout(() => setNotice(''), 2800);
    } catch {
      setNotice('Failed to clear');
      window.setTimeout(() => setNotice(''), 2800);
    }
  };

  const restoreDemo = async () => {
    try {
      await restoreDemoTradesDb();
      const fresh = await fetchTrades();
      setTrades(fresh);
      setNotice('Demo data restored');
      window.setTimeout(() => setNotice(''), 2800);
    } catch {
      setNotice('Failed to restore');
      window.setTimeout(() => setNotice(''), 2800);
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('tradecraft-theme', next);
  };

  const exportJournal = () => {
    const blob = new Blob([JSON.stringify(trades, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trading-journal.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setCoverImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const avgProfit = trades.length ? trades.reduce((s, t) => s + t.pnl, 0) / trades.length : 0;
  const winPnls = trades.filter((t) => t.pnl > 0).map((t) => t.pnl);
  const lossPnls = trades.filter((t) => t.pnl < 0).map((t) => t.pnl);
  const avgWin = winPnls.length ? winPnls.reduce((s, v) => s + v, 0) / winPnls.length : 0;
  const avgLoss = lossPnls.length ? lossPnls.reduce((s, v) => s + v, 0) / lossPnls.length : 0;

  if (loading) {
    return <div className="app-shell dark"><div className="loading-state">Loading your journal...</div></div>;
  }

  return (
    <div className={`app-shell ${theme} ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Target size={17} /></div>
          <span className="brand-name">Journal</span>
          <button className="icon-button sidebar-menu" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={16} /></button>
        </div>
        <div className="workspace">
          <div className="avatar">TC</div>
          <div><strong>My workspace</strong><span>Private documentary</span></div>
          <ChevronDown size={15} />
        </div>
        <nav className="nav-list">
          <button className={page === 'journal' ? 'nav-item active' : 'nav-item'} onClick={() => setPage('journal')}>
            <ClipboardList size={16} />Documentary <span className="nav-count">{trades.length}</span>
          </button>
          <button className={page === 'statistics' ? 'nav-item active' : 'nav-item'} onClick={() => setPage('statistics')}>
            <BarChart3 size={16} />Statistics
          </button>
        </nav>
        <div className="sidebar-section">
          <div className="sidebar-label">Workspace</div>
          <button className="nav-item muted"><Sparkles size={15} />Review ritual</button>
          <button className="nav-item muted"><Settings2 size={15} />Preferences</button>
        </div>
        <div className="sidebar-footer">
          <div className="offline-dot"></div>
          <span>Private & offline</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs">
            {!sidebarOpen && <button className="icon-button" onClick={() => setSidebarOpen(true)}><Menu size={16} /></button>}
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{page === 'journal' ? 'Documentary' : 'Statistics'}</strong>
          </div>
          <div className="top-actions">
            <div className="privacy-chip"><span className="pulse"></span>Auto-saved</div>
            <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}<span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
            <button className="icon-button"><MoreHorizontal size={18} /></button>
          </div>
        </header>

        <div className="page-wrap">
          {page === 'journal' ? (
            <>
              <section className="documentary-cover" aria-label="Documentary cover">
                {coverImage && <img src={coverImage} alt="Cover" className="cover-img" />}
                <div className="cover-grain"></div>
                <label className="cover-upload-btn">
                  <input type="file" accept="image/*" onChange={handleCoverUpload} hidden />
                  <ImageIcon size={14} /> {coverImage ? 'Change cover' : 'Upload cover image'}
                </label>
              </section>

              <section className="documentary-heading">
                <div className="documentary-title"><ClipboardList size={24} /><h1>DOCUMENTARY</h1></div>
              </section>

              <section className="hero-row documentary-actions">
                <div></div>
                <div className="hero-actions">
                  <button className="button secondary" onClick={exportJournal}><Download size={15} />Export</button>
                  <button className="button primary" onClick={() => setShowForm(true)}><Plus size={17} />New trade</button>
                </div>
              </section>

              <div className="quick-stats">
                <MiniStat label="Cumulative PnL" value={formatCurrency(trades.reduce((s, t) => s + t.pnl, 0))} tone={trades.reduce((s, t) => s + t.pnl, 0) >= 0 ? 'positive' : 'negative'} icon={<TrendingUp size={15} />} />
                <MiniStat label="Trades logged" value={String(trades.length).padStart(2, '0')} icon={<ClipboardList size={15} />} />
                <MiniStat label="Avg profit" value={formatCurrency(avgWin)} tone="positive" icon={<TrendingUp size={15} />} />
                <MiniStat label="Avg loss" value={formatCurrency(avgLoss)} tone="negative" icon={<TrendingUp size={15} />} />
              </div>

              <section className="panel journal-panel">
                <div className="panel-head">
                  <div>
                    <div className="panel-title"><ClipboardList size={17} />Documentary log</div>
                    <div className="panel-caption">Your execution history · {trades.length} records</div>
                  </div>
                </div>
                <ViewTabs view={view} setView={setView} />
                <JournalToolbar query={query} setQuery={setQuery} />
                {view === 'full-log' && <TradeTable trades={filteredTrades} sortAscending={sortAscending} setSortAscending={setSortAscending} onRowClick={setDetailTrade} onDelete={deleteTrade} />}
                {view === 'full-gallery' && <TradeGallery trades={filteredTrades} onCardClick={setDetailTrade} />}
                {view === 'weekly-log' && <WeeklyTable trades={filteredTrades} sortAscending={sortAscending} setSortAscending={setSortAscending} onRowClick={setDetailTrade} onDelete={deleteTrade} />}
                {view === 'weekly-gallery' && <WeeklyGallery trades={filteredTrades} onCardClick={setDetailTrade} />}
                {view === 'loss-log' && <TradeTable trades={filteredTrades} sortAscending={sortAscending} setSortAscending={setSortAscending} onRowClick={setDetailTrade} onDelete={deleteTrade} />}
                {view === 'win-log' && <TradeTable trades={filteredTrades} sortAscending={sortAscending} setSortAscending={setSortAscending} onRowClick={setDetailTrade} onDelete={deleteTrade} />}
              </section>

              <div className="journal-foot">
                <span><span className="offline-dot"></span>Everything is auto-saved</span>
                <div>
                  <button onClick={restoreDemo}><RotateCcw size={13} />Restore demo data</button>
                  {showClearConfirm ? (
                    <span className="confirm-inline">
                      <span className="confirm-text">Sure?</span>
                      <button className="button danger small" onClick={clearJournal}>Yes, clear</button>
                      <button className="button secondary small" onClick={() => setShowClearConfirm(false)}>Cancel</button>
                    </span>
                  ) : (
                    <button onClick={() => setShowClearConfirm(true)}><X size={13} />Clear journal</button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <StatisticsPage analytics={analytics} trades={trades} />
          )}
        </div>
      </main>

      {showForm && <TradeForm form={form} setForm={setForm} onSubmit={handleSubmit} onClose={() => setShowForm(false)} />}
      {detailTrade && <TradeDetail trade={detailTrade} onClose={() => setDetailTrade(null)} onSave={saveTrade} onDelete={deleteTrade} />}
      {notice && <div className="toast"><Check size={16} />{notice}</div>}
    </div>
  );
}

export default App;
