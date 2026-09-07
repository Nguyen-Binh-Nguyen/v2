import type { FormEvent, Dispatch, SetStateAction } from 'react';
import { Plus, X } from 'lucide-react';
import type { Trade, Result, Psychology, Compliance, Direction } from '@/types';
import { confluenceOptions, setupTypeOptions } from '@/trades';

const resultOptions: Result[] = ['Win', 'Loss', 'BE → Win', 'BE → Loss'];
const psychologyOptions: Psychology[] = ['Calm / Disciplined', 'FOMO / Impulsive', 'Fearful / Hesitant', 'Greedy / Overconfident', 'Revenge / Tilted'];
const typeOptions = ['NQ', 'ES', 'YM', 'RTY', 'Other'];

export type TradeFormState = {
  name: string;
  dateTime: string;
  type: string;
  result: Result;
  pnl: string;
  planCompliance: Compliance;
  psychology: Psychology;
  setupType: string;
  confluences: string[];
  direction: Direction;
  sl: string;
  tp: string;
  rr: string;
};

export const blankForm: TradeFormState = {
  name: '',
  dateTime: new Date().toISOString().slice(0, 16),
  type: 'NQ',
  result: 'Win',
  pnl: '',
  planCompliance: 'Yes',
  psychology: 'Calm / Disciplined',
  setupType: 'Other',
  confluences: [],
  direction: 'Long',
  sl: '',
  tp: '',
  rr: '',
};

export function TradeForm({ form, setForm, onSubmit, onClose }: {
  form: TradeFormState;
  setForm: Dispatch<SetStateAction<TradeFormState>>;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  const update = <K extends keyof TradeFormState>(key: K, value: TradeFormState[K]) =>
    setForm((c) => ({ ...c, [key]: value }));

  const toggleConfluence = (c: string) => {
    setForm((current) => ({
      ...current,
      confluences: current.confluences.includes(c)
        ? current.confluences.filter((x) => x !== c)
        : [...current.confluences, c],
    }));
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <div className="eyebrow"><span className="eyebrow-dot"></span>NEW RECORD</div>
            <h2>Log a trade</h2>
            <p>Capture the decision while it is still fresh.</p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-grid">
            <label>Name<input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. TEST 52" /></label>
            <label>Date & time<input type="datetime-local" value={form.dateTime} onChange={(e) => update('dateTime', e.target.value)} required /></label>
            <label>Type
              <select value={form.type} onChange={(e) => update('type', e.target.value)}>
                {typeOptions.map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
            <label>Direction
              <select value={form.direction} onChange={(e) => update('direction', e.target.value as Direction)}>
                <option>Long</option><option>Short</option>
              </select>
            </label>
            <label>Result
              <select value={form.result} onChange={(e) => update('result', e.target.value as Result)}>
                {resultOptions.map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
            <label>PnL <span className="label-hint">USD</span>
              <input type="number" step="0.01" value={form.pnl} onChange={(e) => update('pnl', e.target.value)} placeholder="e.g. 250" required />
            </label>
            <label>Stop Loss <span className="label-hint">$</span>
              <input type="number" step="0.01" value={form.sl} onChange={(e) => update('sl', e.target.value)} placeholder="e.g. 100" />
            </label>
            <label>Take Profit <span className="label-hint">$</span>
              <input type="number" step="0.01" value={form.tp} onChange={(e) => update('tp', e.target.value)} placeholder="e.g. 200" />
            </label>
            <label>Risk-Reward
              <input type="number" step="0.1" value={form.rr} onChange={(e) => update('rr', e.target.value)} placeholder="e.g. 2.0" />
            </label>
            <label>Plan compliance
              <select value={form.planCompliance} onChange={(e) => update('planCompliance', e.target.value as Compliance)}>
                <option>Yes</option><option>No</option>
              </select>
            </label>
            <label>Psychology
              <select value={form.psychology} onChange={(e) => update('psychology', e.target.value as Psychology)}>
                {psychologyOptions.map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
            <label>Setup type
              <select value={form.setupType} onChange={(e) => update('setupType', e.target.value)}>
                {setupTypeOptions.map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
          </div>
          <div className="confluence-section">
            <label className="confluence-label">Confluences</label>
            <div className="confluence-grid">
              {confluenceOptions.map((c) => (
                <button type="button" key={c} className={form.confluences.includes(c) ? 'confluence-chip selected' : 'confluence-chip'} onClick={() => toggleConfluence(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="form-footer">
            <span><span className="offline-dot"></span>Saved on submit</span>
            <div>
              <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="button primary"><Plus size={16} />Add trade</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
