import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Calendar as CalendarIcon, List } from 'lucide-react';
import NavBar from '../components/layout/NavBar';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { TextArea } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useReservations } from '../hooks/useReservations';
import { createAutoTasks } from '../hooks/useTasks';
import type { Reservation, ReservationStatus } from '../types';
import { format, parseISO, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';

const statusConfig: Record<ReservationStatus, { color: 'blue' | 'green' | 'gray' | 'red'; label: string }> = {
  upcoming: { color: 'blue', label: 'À venir' },
  active: { color: 'green', label: 'En cours' },
  completed: { color: 'gray', label: 'Terminée' },
  cancelled: { color: 'red', label: 'Annulée' },
};

function ReservationCard({ reservation, onClick }: { reservation: Reservation; onClick: () => void }) {
  const config = statusConfig[reservation.status];
  return (
    <Card statusColor={config.color} onClick={onClick} className="fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[17px] font-semibold truncate">{reservation.guest_name}</h3>
            <Badge variant={config.color === 'blue' ? 'primary' : config.color === 'green' ? 'success' : config.color === 'red' ? 'danger' : 'gray'}>
              {config.label}
            </Badge>
          </div>
          <p className="text-[15px] text-ios-text-secondary">
            {format(parseISO(reservation.checkin_date), 'd MMM', { locale: fr })} ({reservation.checkin_time?.slice(0, 5)})
            {' → '}
            {format(parseISO(reservation.checkout_date), 'd MMM yyyy', { locale: fr })} ({reservation.checkout_time?.slice(0, 5)})
          </p>
          {reservation.guest_count && (
            <div className="flex items-center gap-1 mt-1 text-[13px] text-ios-text-secondary">
              <Users size={14} />
              <span>{reservation.guest_count} personne{reservation.guest_count > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-3 mt-3">
        <StatusBadge done={reservation.key_hidden} icon="🔑" label="Clef" />
        <StatusBadge done={reservation.cleaning_done} icon="🧹" label="Ménage" />
        <StatusBadge done={reservation.inspection_done} icon="📋" label="État des lieux" />
      </div>
    </Card>
  );
}

function StatusBadge({ done, icon, label }: { done: boolean; icon: string; label: string }) {
  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded-full text-[12px] ${
        done ? 'bg-green-100 text-ios-success' : 'bg-gray-100 text-ios-text-secondary'
      }`}
      title={label}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function CalendarView({ reservations, onSelect }: { reservations: Reservation[]; onSelect: (r: Reservation) => void }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const days: (number | null)[] = Array(startDay).fill(null);
  for (let i = 1; i <= lastDay.getDate(); i++) days.push(i);
  while (days.length % 7 !== 0) days.push(null);

  const getReservationsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return reservations.filter(r => r.checkin_date <= dateStr && r.checkout_date >= dateStr);
  };

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-ios-primary text-[17px]" aria-label="Mois précédent">‹</button>
        <h3 className="text-[17px] font-semibold capitalize">{format(currentMonth, 'MMMM yyyy', { locale: fr })}</h3>
        <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-ios-primary text-[17px]" aria-label="Mois suivant">›</button>
      </div>
      <div className="grid grid-cols-7 gap-px text-center text-[13px] text-ios-text-secondary mb-1">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => <div key={d} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const dayReservations = getReservationsForDay(day);
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isCurrentDay = isToday(parseISO(dateStr));
          return (
            <div
              key={i}
              className={`relative p-1 min-h-[40px] flex flex-col items-center rounded-lg ${isCurrentDay ? 'bg-ios-primary/10' : ''}`}
              onClick={() => dayReservations.length === 1 && onSelect(dayReservations[0])}
            >
              <span className={`text-[13px] ${isCurrentDay ? 'text-ios-primary font-bold' : ''}`}>{day}</span>
              {dayReservations.map((r, j) => (
                <div
                  key={j}
                  className={`w-full h-1 rounded-full mt-0.5 ${
                    r.status === 'active' ? 'bg-ios-success' : r.status === 'upcoming' ? 'bg-ios-primary' : 'bg-ios-text-secondary'
                  }`}
                  title={r.guest_name}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ReservationsPage() {
  const navigate = useNavigate();
  const { reservations, loading, create } = useReservations();
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [form, setForm] = useState({
    guest_name: '',
    guest_phone: '',
    guest_count: '',
    checkin_date: '',
    checkin_time: '16:00',
    checkout_date: '',
    checkout_time: '11:00',
    notes: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const reservation = await create({
        guest_name: form.guest_name,
        guest_phone: form.guest_phone || null,
        guest_count: form.guest_count ? parseInt(form.guest_count) : null,
        checkin_date: form.checkin_date,
        checkin_time: form.checkin_time,
        checkout_date: form.checkout_date,
        checkout_time: form.checkout_time,
        notes: form.notes || null,
        status: 'upcoming',
      });
      await createAutoTasks(reservation.id, reservation.guest_name, reservation.checkin_date, reservation.checkout_date);
      setShowForm(false);
      setForm({ guest_name: '', guest_phone: '', guest_count: '', checkin_date: '', checkin_time: '16:00', checkout_date: '', checkout_time: '11:00', notes: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const todayCheckins = reservations.filter(r => isToday(parseISO(r.checkin_date)) && r.status === 'upcoming');

  return (
    <div className="flex flex-col h-full">
      <NavBar
        title="Réservations"
        rightAction={
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(v => v === 'list' ? 'calendar' : 'list')}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-ios-primary"
              aria-label={viewMode === 'list' ? 'Vue calendrier' : 'Vue liste'}
            >
              {viewMode === 'list' ? <CalendarIcon size={22} /> : <List size={22} />}
            </button>
          </div>
        }
      />

      {todayCheckins.length > 0 && (
        <div className="mx-4 mb-2 p-3 bg-ios-primary/10 rounded-xl">
          <p className="text-[15px] text-ios-primary font-medium">
            📅 {todayCheckins.length} check-in{todayCheckins.length > 1 ? 's' : ''} aujourd'hui : {todayCheckins.map(r => r.guest_name).join(', ')}
          </p>
        </div>
      )}

      <PageContainer>
        {loading ? (
          <div className="py-20"><Spinner /></div>
        ) : viewMode === 'calendar' ? (
          <CalendarView reservations={reservations} onSelect={(r) => navigate(`/reservations/${r.id}`)} />
        ) : reservations.length === 0 ? (
          <EmptyState icon={<CalendarIcon size={48} />} title="Aucune réservation" description="Ajoutez votre première réservation" />
        ) : (
          <div className="px-4 space-y-3 pb-4">
            {reservations.map((r) => (
              <ReservationCard key={r.id} reservation={r} onClick={() => navigate(`/reservations/${r.id}`)} />
            ))}
          </div>
        )}
      </PageContainer>

      <button
        onClick={() => setShowForm(true)}
        className="fixed right-4 w-14 h-14 bg-ios-primary text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-50"
        style={{ bottom: 'calc(65px + var(--sab, 0px) + 16px)' }}
        aria-label="Ajouter une réservation"
      >
        <Plus size={28} />
      </button>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nouvelle réservation">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nom du locataire" value={form.guest_name} onChange={(e) => setForm(f => ({ ...f, guest_name: e.target.value }))} required />
          <Input label="Téléphone" type="tel" value={form.guest_phone} onChange={(e) => setForm(f => ({ ...f, guest_phone: e.target.value }))} />
          <Input label="Nombre de personnes" type="number" min="1" value={form.guest_count} onChange={(e) => setForm(f => ({ ...f, guest_count: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Check-in" type="date" value={form.checkin_date} onChange={(e) => setForm(f => ({ ...f, checkin_date: e.target.value }))} required />
            <Input label="Heure" type="time" value={form.checkin_time} onChange={(e) => setForm(f => ({ ...f, checkin_time: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Check-out" type="date" value={form.checkout_date} onChange={(e) => setForm(f => ({ ...f, checkout_date: e.target.value }))} required />
            <Input label="Heure" type="time" value={form.checkout_time} onChange={(e) => setForm(f => ({ ...f, checkout_time: e.target.value }))} />
          </div>
          <TextArea label="Notes" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
          <Button type="submit" fullWidth>Créer la réservation</Button>
        </form>
      </Modal>
    </div>
  );
}
