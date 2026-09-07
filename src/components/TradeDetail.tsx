import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, Check, ChevronDown, Download, Image as ImageIcon, Trash2, TrendingUp, X } from 'lucide-react';
import type { Trade, Result, Psychology, Compliance, Direction } from '@/types';
import { confluenceOptions, setupTypeOptions } from '@/trades';
import { formatCurrency, formatDate, formatTime, resultTone } from '@/analytics';

type Props = {
  trade: Trade;
  onClose: () => void;
  onSave: (t: Trade) => void;
  onDelete: (id: string) => void;
};

const resultOptions: Result[] = ['Win', 'Loss', 'BE → Win', 'BE → Loss'];
const psychologyOptions: Psychology[] = ['Calm / Disciplined', 'FOMO / Impulsive', 'Fearful / Hesitant', 'Greedy / Overconfident', 'Revenge / Tilted'];
const complianceOptions: Compliance[] = ['Yes', 'No'];
const directionOptions: Direction[] = ['Long', 'Short'];
const typeOptions = ['NQ', 'ES', 'YM', 'RTY', 'Other'];

function BadgeSelect<T extends string>({ value, options, onChange, tone }: { value: T; options: T[]; onChange: (v: T) => void; tone?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div className="badge-select" ref={ref}>
      <button type="button" className={`badge-trigger ${tone || ''}`} onClick={() => setOpen(!open)}>
        {value}
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="badge-dropdown">
          {options.map((o) => (
            <button type="button" key={o} className={o === value ? 'selected' : ''} onClick={() => { onChange(o); setOpen(false); }}>
              {o}
              {o === value && <Check size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function TradeDetail({ trade, onClose, onSave, onDelete }: Props) {
  const [edited, setEdited] = useState<Trade>(trade);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEdited(trade);
    if (editorRef.current) {
      editorRef.current.innerHTML = trade.notes || '';
    }
  }, [trade]);

  const update = <K extends keyof Trade>(key: K, value: Trade[K]) => {
    setEdited((c) => ({ ...c, [key]: value }));
  };

  const toggleConfluence = (c: string) => {
    setEdited((current) => ({
      ...current,
      confluences: current.confluences.includes(c)
        ? current.confluences.filter((x) => x !== c)
        : [...current.confluences, c],
    }));
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      update('notes', editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            document.execCommand('insertHTML', false, `<img src="${dataUrl}" style="max-width:100%;border-radius:8px;margin:8px 0;" />`);
            handleEditorInput();
          };
          reader.readAsDataURL(blob);
        }
        return;
      }
    }
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleEditorInput();
  };

  const handleSave = () => {
    if (editorRef.current) {
      update('notes', editorRef.current.innerHTML);
    }
    onSave(edited);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        update('imageUrl', ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="modal-backdrop detail-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="trade-detail">
        <div className="detail-topbar">
          <button className="icon-button" onClick={onClose}><ArrowLeft size={18} /></button>
          <span className="detail-breadcrumb">{edited.name}</span>
          <div className="detail-topbar-actions">
            {showDeleteConfirm ? (
              <>
                <span className="confirm-text">Delete this trade?</span>
                <button className="button danger" onClick={() => { onDelete(edited.id); onClose(); }}>Yes, delete</button>
                <button className="button secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              </>
            ) : (
              <>
                <button className="icon-button" onClick={() => setShowDeleteConfirm(true)} aria-label="Delete"><Trash2 size={16} /></button>
                <button className="button primary" onClick={handleSave}>Save</button>
              </>
            )}
          </div>
        </div>

        <div className="detail-cover">
          {edited.imageUrl ? (
            <img src={edited.imageUrl} alt="Trade" className="detail-cover-img" />
          ) : (
            <div className="detail-cover-placeholder">
              <ImageIcon size={28} />
              <span>Click to add a trade image</span>
            </div>
          )}
          <label className="cover-upload-btn">
            <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
            <ImageIcon size={14} /> Change image
          </label>
        </div>

        <div className="detail-body">
          <div className="detail-header">
            <h1>{edited.name}</h1>
            <div className="detail-date">
              <CalendarDays size={14} />
              {formatDate(edited.dateTime)} · {formatTime(edited.dateTime)}
            </div>
          </div>

          <div className="detail-props">
            <div className="prop-row">
              <span className="prop-label">Type</span>
              <BadgeSelect value={edited.type as string} options={typeOptions} onChange={(v) => update('type', v)} />
            </div>
            <div className="prop-row">
              <span className="prop-label">Direction</span>
              <BadgeSelect value={edited.direction} options={directionOptions} onChange={(v) => update('direction', v)} />
            </div>
            <div className="prop-row">
              <span className="prop-label">Result</span>
              <BadgeSelect value={edited.result} options={resultOptions} onChange={(v) => update('result', v)} tone={resultTone(edited.result)} />
            </div>
            <div className="prop-row">
              <span className="prop-label">PnL</span>
              <input type="number" step="0.01" className="prop-input" value={edited.pnl} onChange={(e) => update('pnl', Number(e.target.value))} />
            </div>
            <div className="prop-row">
              <span className="prop-label">Plan compliance</span>
              <BadgeSelect value={edited.planCompliance} options={complianceOptions} onChange={(v) => update('planCompliance', v)} />
            </div>
            <div className="prop-row">
              <span className="prop-label">Psychology</span>
              <BadgeSelect value={edited.psychology} options={psychologyOptions} onChange={(v) => update('psychology', v)} />
            </div>
            <div className="prop-row">
              <span className="prop-label">Setup type</span>
              <BadgeSelect value={edited.setupType || 'Other'} options={setupTypeOptions} onChange={(v) => update('setupType', v)} />
            </div>
            <div className="prop-row">
              <span className="prop-label">SL</span>
              <input type="number" step="0.01" className="prop-input" value={edited.sl} onChange={(e) => update('sl', Number(e.target.value))} />
            </div>
            <div className="prop-row">
              <span className="prop-label">TP</span>
              <input type="number" step="0.01" className="prop-input" value={edited.tp} onChange={(e) => update('tp', Number(e.target.value))} />
            </div>
            <div className="prop-row">
              <span className="prop-label">RR</span>
              <input type="number" step="0.1" className="prop-input" value={edited.rr} onChange={(e) => update('rr', Number(e.target.value))} />
            </div>
          </div>

          <div className="detail-confluences">
            <span className="prop-label">Confluences</span>
            <div className="confluence-grid">
              {confluenceOptions.map((c) => (
                <button type="button" key={c} className={edited.confluences.includes(c) ? 'confluence-chip selected' : 'confluence-chip'} onClick={() => toggleConfluence(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="detail-editor-section">
            <div className="editor-label">
              <TrendingUp size={14} /> Trade notes
              <span className="editor-hint">Paste images with Cmd+V</span>
            </div>
            <div
              ref={editorRef}
              className="rich-editor"
              contentEditable
              suppressContentEditableWarning
              onInput={handleEditorInput}
              onPaste={handlePaste}
              data-placeholder="Write your trade review here... paste screenshots directly with Cmd+V"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export type { Trade };
