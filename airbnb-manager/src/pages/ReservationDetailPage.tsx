import React, { useState, useEffect } from 'react';
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
import { supabase } from '../lib/supabase';
import type { InspectionItem } from '../types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { reservation, loading, setReservation } = useReservation(id);
  const { update, remove } = useReservations();
  const { tasks } = useTasks({ reservationId: id });
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (reservation) setNotes(reservation.notes || '');
  }, [reservation]);

  useEffect(() => {
    if (!id) return;
    supabase.from('inspection_items').select('*, room:rooms(*)').eq('reservation_id', id)
      .then(({ data }) => setInspectionItems((data as InspectionItem[]) || []));
  }, [id]);

  if (loading || !reservation) return <div className="flex items-center justify-center h-full"><Spinner /></div>;

  const handleToggle = async (field: 'key_hidden' | 'cleaning_done' | 'inspection_done', value: boolean) => {
    await update(reservation.id, { [field]: value });
    setReservation({ ...reservation, [field]: value });
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleDelete = async () => {
    if (confirm('Supprimer cette réservation ?')) {
      await remove(reservation.id);
      navigate('/reservations');
    }
  };

  const handleNotesBlur = () => {
    if (notes !== reservation.notes) {
      update(reservation.id, { notes });
    }
  };

  const okCount = inspectionItems.filter(i => i.status === 'ok').length;
  const issueCount = inspectionItems.filter(i => i.status !== 'ok').length;

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
              <Toggle label="🧹 Ménage fait" checked={reservation.cleaning_done} onChange={(v) => handleToggle('cleaning_done', v)} />
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

          {/* Inspection */}
          <Card>
            <h3 className="text-[13px] font-medium text-ios-text-secondary uppercase tracking-wide mb-3">État des lieux</h3>
            {inspectionItems.length === 0 ? (
              <Button fullWidth onClick={() => navigate(`/inspection/${reservation.id}`)}>
                Démarrer l'état des lieux
              </Button>
            ) : (
              <div>
                <div className="flex gap-3 mb-3">
                  <Badge variant="success">{okCount} OK</Badge>
                  {issueCount > 0 && <Badge variant="warning">{issueCount} remarque{issueCount > 1 ? 's' : ''}</Badge>}
                </div>
                <Button variant="secondary" fullWidth onClick={() => navigate(`/inspection/${reservation.id}`)}>
                  Voir / Modifier
                </Button>
              </div>
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
