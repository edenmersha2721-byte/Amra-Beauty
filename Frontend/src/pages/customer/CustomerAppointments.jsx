import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarDays, Clock, XCircle, CalendarClock, RefreshCw } from 'lucide-react';
import Loader from '../../components/common/Loader.jsx';
import Modal from '../../components/common/Modal.jsx';
import { appointmentApi } from '../../api/endpoints.js';
import { currency, formatDate, formatTime, statusColor, todayISO } from '../../utils/format.js';

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];
const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
];

export default function CustomerAppointments() {
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Reschedule modal
  const [target, setTarget] = useState(null); // appointment being rescheduled
  const [rDate, setRDate] = useState('');
  const [rTime, setRTime] = useState('');
  const [rSaving, setRSaving] = useState(false);

  const load = () => {
    setLoading(true);
    appointmentApi.mine().then((r) => setAppts(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const cancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await appointmentApi.cancel(id);
      toast.success('Appointment cancelled');
      load();
    } catch (e) {
      toast.error(e.friendlyMessage || 'Could not cancel');
    }
  };

  const openReschedule = (a) => {
    setTarget(a);
    setRDate(a.reschedule_date ? String(a.reschedule_date).slice(0, 10) : String(a.appointment_date).slice(0, 10));
    setRTime(a.reschedule_time ? String(a.reschedule_time).slice(0, 5) : String(a.appointment_time).slice(0, 5));
  };

  const submitReschedule = async (e) => {
    e.preventDefault();
    if (!rDate || !rTime) return toast.error('Pick a new date and time');
    setRSaving(true);
    try {
      await appointmentApi.reschedule(target.id, { appointment_date: rDate, appointment_time: rTime });
      toast.success('Reschedule requested — awaiting salon approval.');
      setTarget(null);
      load();
    } catch (e) {
      toast.error(e.friendlyMessage || 'Could not request reschedule');
    } finally {
      setRSaving(false);
    }
  };

  const filtered = filter === 'all' ? appts : appts.filter((a) => a.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-4 py-1.5 text-sm capitalize transition ${
                filter === f ? 'border-gold/60 bg-gold/15 text-gold' : 'border-line bg-white/5 hover:border-gold'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <Link to="/book" className="btn-gold">Book New</Link>
      </div>

      {loading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <div className="card py-16 text-center text-muted">No {filter !== 'all' ? filter : ''} appointments found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((a) => (
            <div key={a.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-xl text-cream">{a.service_name || a.service_name_snapshot}</h3>
                  {a.category_name && <p className="text-xs text-muted">{a.category_name}</p>}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusColor(a.status)}`}>{a.status}</span>
              </div>
              <div className="mt-4 space-y-1.5 text-sm text-muted">
                <p className="flex items-center gap-2"><CalendarDays size={15} className="text-gold" /> {formatDate(a.appointment_date)}</p>
                <p className="flex items-center gap-2"><Clock size={15} className="text-gold" /> {formatTime(a.appointment_time)}</p>
              </div>

              {a.reschedule_date && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-gold/25 bg-gold/10 p-3 text-sm text-cream/80">
                  <CalendarClock size={15} className="mt-0.5 shrink-0 text-gold" />
                  <span>
                    Reschedule requested to <strong className="text-gold">{formatDate(a.reschedule_date)} · {formatTime(a.reschedule_time)}</strong><br />
                    <span className="text-xs text-muted">Awaiting salon approval.</span>
                  </span>
                </div>
              )}

              {a.notes && <p className="mt-3 rounded-lg bg-white/[0.03] p-3 text-sm text-muted">“{a.notes}”</p>}

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
                <span className="font-serif text-xl font-semibold text-gold">{currency(a.price_snapshot)}</span>
                {['pending', 'confirmed'].includes(a.status) && (
                  <div className="flex gap-2">
                    <button onClick={() => openReschedule(a)} className="btn-outline text-sm">
                      <RefreshCw size={14} /> {a.reschedule_date ? 'Change request' : 'Reschedule'}
                    </button>
                    <button onClick={() => cancel(a.id)} className="btn-outline border-rose-300 text-sm text-rose-300 hover:bg-rose-500/10">
                      <XCircle size={14} /> Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reschedule modal */}
      <Modal open={!!target} onClose={() => setTarget(null)} title="Request Reschedule">
        {target && (
          <form onSubmit={submitReschedule} className="space-y-4">
            <p className="text-sm text-muted">
              <span className="text-cream">{target.service_name || target.service_name_snapshot}</span> — currently{' '}
              {formatDate(target.appointment_date)} at {formatTime(target.appointment_time)}.
            </p>
            <div>
              <label className="label">New Date</label>
              <input type="date" min={todayISO()} className="input" value={rDate} onChange={(e) => setRDate(e.target.value)} required />
            </div>
            <div>
              <label className="label">New Time</label>
              <select className="input" value={rTime} onChange={(e) => setRTime(e.target.value)} required>
                <option value="">Select a time…</option>
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{formatTime(t)}</option>)}
              </select>
            </div>
            <p className="rounded-lg border border-line bg-white/[0.03] p-3 text-xs text-muted">
              Your request will be sent to the salon. The appointment keeps its current time until an admin approves the change.
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setTarget(null)} className="btn-ghost">Cancel</button>
              <button disabled={rSaving} className="btn-gold">{rSaving ? 'Sending…' : 'Send Request'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
