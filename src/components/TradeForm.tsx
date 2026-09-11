import { useEffect, useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import type { Trade } from '@/lib/supabase';
import type { UseJournalData } from '@/hooks/useJournalData';
import { PSYCHOLOGY_OPTIONS, RESULT_LABELS } from '@/lib/metrics';

type TradeFormProps = {
  trade: Trade | null;
  onClose: () => void;
  onSave: (trade: Omit<Trade, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  initialDate?: string;
  data: UseJournalData;
};

const DIRECTIONS: ('long' | 'short')[] = ['long', 'short'];
const RESULT_KEYS = ['win', 'loss', 'be_win', 'be_loss'] as const;

const DEFAULT_NOTES = `HTF Scenario [M15|H1]
H1:
M15:
Scenario 1:
Scenario 2:

LTF Scenario [M1|15S]
M1:
15s:

Trade That Should Be Done
M1:
15S:

Mistakes from Today:
`;

export function TradeForm({ trade, onClose, onSave, initialDate, data }: TradeFormProps) {
  const { uploadImage, getSignedUrl, settings } = data;
  const [form, setForm] = useState({
    date: trade?.date || initialDate || new Date().toISOString().slice(0, 10),
    time: trade?.time || '',
    direction: trade?.direction || 'long' as 'long' | 'short',
    result: trade?.result || 'win' as Trade['result'],
    pnl: trade?.pnl?.toString() || '',
    sl_points: trade?.sl_points?.toString() || '',
    tp_points: trade?.tp_points?.toString() || '',
    psychology: trade?.psychology || '',
    plan_compliance: trade?.plan_compliance ?? true,
    confluences: trade?.confluences?.slice() || [] as string[],
    notes: trade?.notes || DEFAULT_NOTES,
    image_path: trade?.image_path || null as string | null,
  setup_type: trade?.setup_type || '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const confluenceOptions = settings?.confluences || [];

  useEffect(() => {
    if (form.image_path) {
      getSignedUrl(form.image_path).then(setImagePreview).catch(() => setImagePreview(null));
    } else {
      setImagePreview(null);
    }
  }, [form.image_path, getSignedUrl]);

  const handleImageUpload = async (file: File) => {
    try {
      const path = await uploadImage(file, 'trades');
      setForm((f) => ({ ...f, image_path: path }));
    } catch {
      setError('Failed to upload image. Please try again.');
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleImageUpload(file);
        return;
      }
    }
  };

  const toggleConfluence = (c: string) => {
    setForm((f) => {
      if (f.confluences.includes(c)) {
        return { ...f, confluences: f.confluences.filter((x) => x !== c) };
      }
      return { ...f, confluences: [...f.confluences, c] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({
        date: form.date,
        time: form.time || null,
        symbol: '',
        direction: form.direction,
        setup_type: form.setup_type,
        result: form.result,
        pnl: parseFloat(form.pnl) || 0,
        r_multiple: null,
        sl_points: form.sl_points ? parseFloat(form.sl_points) : null,
        tp_points: form.tp_points ? parseFloat(form.tp_points) : null,
        psychology: form.psychology,
        plan_compliance: form.plan_compliance,
        confluences: form.confluences,
        notes: form.notes,
        image_path: form.image_path || null,
      });
      onClose();
    } catch {
      setError('Failed to save trade. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors";
  const labelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{trade ? 'Edit Trade' : 'Log New Trade'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-1 border-b border-gray-200 dark:border-gray-800">Trade Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Time</label>
                <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className={labelClass}>Plan Compliance</label>
                <select
                  value={form.plan_compliance ? 'yes' : 'no'}
                  onChange={(e) => setForm({ ...form, plan_compliance: e.target.value === 'yes' })}
                  className={inputClass}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Psychology</label>
                <select value={form.psychology} onChange={(e) => setForm({ ...form, psychology: e.target.value })} className={inputClass}>
                  <option value="">Select...</option>
                  {PSYCHOLOGY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className={labelClass}>Confluences</label>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                {confluenceOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleConfluence(c)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      form.confluences.includes(c)
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {c}
                  </button>
                ))}
                {confluenceOptions.length === 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 px-2 py-1">
                    No confluences configured. Add them on the Statistics page.
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className={labelClass}>L/S</label>
                <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value as 'long' | 'short' })} className={inputClass}>
                  {DIRECTIONS.map((d) => <option key={d} value={d}>{d === 'long' ? 'Long' : 'Short'}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Result</label>
                <select value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value as Trade['result'] })} className={inputClass}>
                  {RESULT_KEYS.map((r) => <option key={r} value={r}>{RESULT_LABELS[r]}</option>)}
                  {trade?.result === 'breakeven' && <option value="breakeven">Breakeven (legacy)</option>}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className={labelClass}>SL (points)</label>
                <input type="number" step="0.01" value={form.sl_points} onChange={(e) => setForm({ ...form, sl_points: e.target.value })} placeholder="0.00" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>TP (points)</label>
                <input type="number" step="0.01" value={form.tp_points} onChange={(e) => setForm({ ...form, tp_points: e.target.value })} placeholder="0.00" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>PnL ($)</label>
                <input type="number" step="0.01" value={form.pnl} onChange={(e) => setForm({ ...form, pnl: e.target.value })} placeholder="0.00" className={inputClass} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-1 border-b border-gray-200 dark:border-gray-800">Notes & Analysis</h3>
            <div>
              <label className={labelClass}>Notes (supports text + image pasting)</label>
              <textarea
                ref={notesRef}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                onPaste={handlePaste}
                rows={16}
                placeholder="Write your analysis... You can paste images directly into this area."
                className={inputClass + ' font-mono text-xs leading-relaxed resize-y'}
              />
            </div>

            <div className="mt-3">
              <label className={labelClass}>Trade Image</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-white cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                      e.target.value = '';
                    }}
                  />
                </label>
                {imagePreview && (
                  <div className="relative">
                    <img src={imagePreview} alt="Trade" className="h-16 w-24 object-cover rounded-lg border border-gray-300 dark:border-gray-700" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image_path: null })}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {!imagePreview && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <ImageIcon className="w-4 h-4" /> Or paste an image with Ctrl+V
                  </span>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-white font-medium rounded-lg transition-colors text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-gray-900 dark:bg-white hover:opacity-90 text-white dark:text-gray-900 font-medium rounded-lg transition-colors disabled:opacity-50 text-sm">
              {saving ? 'Saving...' : trade ? 'Update Trade' : 'Add Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
