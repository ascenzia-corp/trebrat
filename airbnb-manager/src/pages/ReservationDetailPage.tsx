import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, Users, Trash2, Plus } from 'lucide-react';
import NavBar from '../components/layout/NavBar';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Toggle from '../components/ui/Toggle';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { TextArea } from '../components/ui/Input';
import { useReservation, useReservations } from '../hooks/useReservations';
import { useTasks } from '../hooks/useTasks';
import { useTeam } from '../hooks/useTeam';
import { supabase } from '../lib/supabase';
import { deleteCalendarEvent } from '../lib/google-calendar';
import type { InspectionItem, InspectionType, UserProfile } from '../types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

function InspectionTab({
  type,
  items,
  members,
  onNavigate,
}: {
  type: InspectionType;
  items: InspectionItem[];
  members: UserProfile[];
  onNavigate: (inspectorName?: string) => void;
}) {
  const okCount = items.filter(i => i.status === 'ok').length;
  const issueCount = items.filter(i => i.status !== 'ok').length;
  const existingName = items.find(i => i.inspector_name)?.inspector_name || '';
  const [name, setName] = useState(existingName);

  // Keep local state in sync when items change (e.g. after navigation back)
  useEffect(() => {
    const saved = items.find(i => i.inspector_name)?.inspector_name || '';
    if (saved) setName(saved);
  }, [items]);

  const handleNameChange = async (newName: string) => {
    setName(newName);
    // Persist inspector name to all existing inspection items
    if (items.length > 0) {
      const ids = items.map(i => i.id);
      await supabase
        .from('inspection_items')
        .update({ inspector_name: newName || null })
        .in('id', ids);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[13px] text-ios-text-secondary font-medium uppercase tracking-wide mb-1">Réalisé par</label>
        <select
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full h-[44px] px-4 rounded-[10px] bg-ios-bg text-[17px] text-ios-text"
        >
          <option value="">— Choisir un inspecteur —</option>
          {members.map((m) => (
            <option key={m.id} value={m.full_name}>{m.full_name}</option>
          ))}
        </select>
      </div>

      {items.length === 0 ? (
        <Button fullWidth onClick={() => onNavigate(name)}>
          Démarrer l'état des lieux {type === 'checkin' ? "d'entrée" : 'de sortie'}
        </Button>
      ) : (
        <div>
          <div className="flex gap-3 mb-3">
            <Badge variant="success">{okCount} OK</Badge>
            {issueCount > 0 && <Badge variant="warning">{issueCount} remarque{issueCount > 1 ? 's' : ''}</Badge>}
          </div>
          <Button variant="secondary" fullWidth onClick={() => onNavigate(name)}>
            Voir / Modifier
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { reservation, loading, setReservation } = useReservation(id);
  const { update, remove } = useReservations();
  const { tasks } = useTasks({ reservationId: id });
  const { members } = useTeam();
  const [checkinItems, setCheckinItems] = useState<InspectionItem[]>([]);
  const [checkoutItems, setCheckoutItems] = useState<InspectionItem[]>([]);
  const [inspectionTab, setInspectionTab] = useState<InspectionType>('checkin');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (reservation) setNotes(reservation.notes || '');
  }, [reservation]);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('inspection_items')
      .select('*, room:rooms(*), creator:user_profiles!inspection_items_created_by_fkey(*)')
      .eq('reservation_id', id)
      .then(({ data }) => {
        const items = (data as InspectionItem[]) || [];
        setCheckinItems(items.filter(i => i.inspection_type === 'checkin'));
        setCheckoutItems(items.filter(i => i.inspection_type === 'checkout'));
      });
  }, [id]);

  if (loading || !reservation) return <div className="flex items-center justify-center h-full"><Spinner /></div>;

  const handleToggle = async (field: 'key_hidden' | 'cleaning_done' | 'inspection_done', value: boolean) => {
    await update(reservation.id, { [field]: value });
    setReservation({ ...reservation, [field]: value });
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleDelete = async () => {
    if (confirm('Supprimer cette réservation ?')) {
      if (reservation.google_event_id) {
        deleteCalendarEvent(reservation.google_event_id).catch(() => {});
      }
      await remove(reservation.id);
      navigate('/reservations');
    }
  };

  const handleNotesBlur = () => {
    if (notes !== reservation.notes) {
      update(reservation.id, { notes });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <NavBar
        title={reservation.guest_name}
        showBack
        largeTitle={false}
        rightAction={
          <button onClick={handleDelete} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-ios-danger" aria-label="Supprimer">
            <Trash2 size={20} />
          </button>
        }
      />
      <PageContainer>
        <div className="px-4 space-y-4 pb-6">
          {/* Header */}
          <div className="text-center py-4">
            <h2 className="text-[28px] font-bold">{reservation.guest_name}</h2>
            <p className="text-[15px] text-ios-text-secondary mt-1">
              {format(parseISO(reservation.checkin_date), 'd MMMM yyyy', { locale: fr })} → {format(parseISO(reservation.checkout_date), 'd MMMM yyyy', { locale: fr })}
            </p>
          </div>

          {/* Informations */}
          <Card>
            <h3 className="text-[13px] font-medium text-ios-text-secondary uppercase tracking-wide mb-3">Informations</h3>
            {reservation.guest_phone && (
              <a href={`tel:${reservation.guest_phone}`} className="flex items-center gap-3 py-2 text-ios-primary">
                <Phone size={18} />
                <span className="text-[17px]">{reservation.guest_phone}</span>
              </a>
            )}
            {reservation.guest_count && (
              <div className="flex items-center gap-3 py-2 text-ios-text-secondary">
                <Users size={18} />
                <span className="text-[17px] text-ios-text">{reservation.guest_count} personne{reservation.guest_count > 1 ? 's' : ''}</span>
              </div>
            )}
            <div className="text-[15px] text-ios-text-secondary mt-2">
              <p>Check-in : {reservation.checkin_time?.slice(0, 5)} — Check-out : {reservation.checkout_time?.slice(0, 5)}</p>
            </div>
          </Card>

          {/* Toggles */}
          <Card>
            <div className="space-y-1 divide-y divide-ios-separator/30">
              <Toggle label="🔑 Clef cachée" checked={reservation.key_hidden} onChange={(v) => handleToggle('key_hidden', v)} />

              {/* Ménage à l'entrée */}
              <div>
                <Toggle label="🧹 Ménage à l'entrée" checked={reservation.cleaning_checkin} onChange={async (v) => {
                  const updates: Partial<typeof reservation> = { cleaning_checkin: v };
                  if (!v) updates.cleaning_checkin_by = null;
                  await update(reservation.id, updates);
                  setReservation({ ...reservation, ...updates });
                }} />
                {reservation.cleaning_checkin && (
                  <select
                    value={reservation.cleaning_checkin_by || ''}
                    onChange={async (e) => {
                      const val = e.target.value || null;
                      await update(reservation.id, { cleaning_checkin_by: val });
                      setReservation({ ...reservation, cleaning_checkin_by: val });
                    }}
                    className="w-full h-[44px] px-4 mb-2 rounded-[10px] bg-ios-bg text-[17px] text-ios-text"
                  >
                    <option value="">— Qui ? —</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.full_name}>{m.full_name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Ménage à la sortie */}
              <div>
                <Toggle label="🧹 Ménage à la sortie" checked={reservation.cleaning_checkout} onChange={async (v) => {
                  const updates: Partial<typeof reservation> = { cleaning_checkout: v };
                  if (!v) updates.cleaning_checkout_by = null;
                  await update(reservation.id, updates);
                  setReservation({ ...reservation, ...updates });
                }} />
                {reservation.cleaning_checkout && (
                  <select
                    value={reservation.cleaning_checkout_by || ''}
                    onChange={async (e) => {
                      const val = e.target.value || null;
                      await update(reservation.id, { cleaning_checkout_by: val });
                      setReservation({ ...reservation, cleaning_checkout_by: val });
                    }}
                    className="w-full h-[44px] px-4 mb-2 rounded-[10px] bg-ios-bg text-[17px] text-ios-text"
                  >
                    <option value="">— Qui ? —</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.full_name}>{m.full_name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Lits à faire */}
              <div>
                <Toggle label="🛏️ Lits à faire" checked={reservation.beds_to_make} onChange={async (v) => {
                  const updates: Partial<typeof reservation> = { beds_to_make: v };
                  if (!v) updates.beds_to_make_by = null;
                  await update(reservation.id, updates);
                  setReservation({ ...reservation, ...updates });
                }} />
                {reservation.beds_to_make && (
                  <select
                    value={reservation.beds_to_make_by || ''}
                    onChange={async (e) => {
                      const val = e.target.value || null;
                      await update(reservation.id, { beds_to_make_by: val });
                      setReservation({ ...reservation, beds_to_make_by: val });
                    }}
                    className="w-full h-[44px] px-4 mb-2 rounded-[10px] bg-ios-bg text-[17px] text-ios-text"
                  >
                    <option value="">— Qui ? —</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.full_name}>{m.full_name}</option>
                    ))}
                  </select>
                )}
              </div>

              <Toggle label="📋 État des lieux réalisé" checked={reservation.inspection_done} onChange={(v) => handleToggle('inspection_done', v)} />
            </div>
          </Card>

          {/* Tasks */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-medium text-ios-text-secondary uppercase tracking-wide">Tâches liées</h3>
              <button className="text-ios-primary text-[15px] font-medium min-w-[44px] min-h-[44px] flex items-center justify-end" onClick={() => navigate('/tasks')}>
                <Plus size={16} className="mr-1" /> Ajouter
              </button>
            </div>
            {tasks.length === 0 ? (
              <p className="text-[15px] text-ios-text-secondary">Aucune tâche</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between py-1">
                    <span className={`text-[15px] ${task.status === 'done' ? 'line-through text-ios-text-secondary' : ''}`}>
                      {task.title}
                    </span>
                    <Badge variant={task.status === 'done' ? 'success' : task.status === 'in_progress' ? 'warning' : 'gray'}>
                      {task.status === 'done' ? 'Fait' : task.status === 'in_progress' ? 'En cours' : 'À faire'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Inspection with tabs */}
          <Card>
            <h3 className="text-[13px] font-medium text-ios-text-secondary uppercase tracking-wide mb-3">État des lieux</h3>

            {/* Tab switcher */}
            <div className="flex bg-gray-200 rounded-lg p-0.5 mb-4">
              <button
                onClick={() => setInspectionTab('checkin')}
                className={`flex-1 py-2 rounded-md text-[14px] font-medium transition-colors ${
                  inspectionTab === 'checkin' ? 'bg-white text-ios-text shadow-sm' : 'text-ios-text-secondary'
                }`}
              >
                Entrée
              </button>
              <button
                onClick={() => setInspectionTab('checkout')}
                className={`flex-1 py-2 rounded-md text-[14px] font-medium transition-colors ${
                  inspectionTab === 'checkout' ? 'bg-white text-ios-text shadow-sm' : 'text-ios-text-secondary'
                }`}
              >
                Sortie
              </button>
            </div>

            {inspectionTab === 'checkin' ? (
              <InspectionTab
                type="checkin"
                items={checkinItems}
                members={members}
                onNavigate={(name) => navigate(`/inspection/${reservation.id}/checkin${name ? `?inspector=${encodeURIComponent(name)}` : ''}`)}
              />
            ) : (
              <InspectionTab
                type="checkout"
                items={checkoutItems}
                members={members}
                onNavigate={(name) => navigate(`/inspection/${reservation.id}/checkout${name ? `?inspector=${encodeURIComponent(name)}` : ''}`)}
              />
            )}
          </Card>

          {/* Notes */}
          <Card>
            <h3 className="text-[13px] font-medium text-ios-text-secondary uppercase tracking-wide mb-3">Notes</h3>
            <TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Ajouter des notes..."
              rows={4}
            />
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}
