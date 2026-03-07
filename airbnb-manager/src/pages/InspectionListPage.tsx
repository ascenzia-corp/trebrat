import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, ClipboardList } from 'lucide-react';
import NavBar from '../components/layout/NavBar';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { useReservations } from '../hooks/useReservations';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function InspectionListPage() {
  const navigate = useNavigate();
  const { reservations, loading } = useReservations();
  const activeReservations = reservations.filter(r => r.status === 'upcoming' || r.status === 'active');

  return (
    <div className="flex flex-col h-full">
      <NavBar title="État des lieux" />
      <PageContainer>
        {loading ? (
          <div className="py-20"><Spinner /></div>
        ) : activeReservations.length === 0 ? (
          <EmptyState icon={<ClipboardList size={48} />} title="Aucune réservation active" description="Les réservations à inspecter apparaîtront ici" />
        ) : (
          <div className="px-4 space-y-2 pb-4">
            {activeReservations.map((r) => (
              <Card key={r.id} onClick={() => navigate(`/inspection/${r.id}`)} className="fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[17px] font-medium">{r.guest_name}</h3>
                    <p className="text-[15px] text-ios-text-secondary">
                      {format(parseISO(r.checkin_date), 'd MMM', { locale: fr })} → {format(parseISO(r.checkout_date), 'd MMM', { locale: fr })}
                    </p>
                  </div>
                  <Badge variant={r.inspection_done ? 'success' : 'gray'}>
                    {r.inspection_done ? (
                      <span className="flex items-center gap-1"><ClipboardCheck size={14} /> Fait</span>
                    ) : 'À faire'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
