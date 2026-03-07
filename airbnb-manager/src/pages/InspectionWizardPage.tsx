import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, ChevronLeft, ChevronRight, X, Check, AlertTriangle, ShoppingCart } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { TextArea } from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import { useRooms } from '../hooks/useRooms';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { uploadPhoto } from '../lib/image-utils';
import type { InspectionStatus, InspectionItem, InspectionPhoto } from '../types';

interface RoomState {
  comment: string;
  status: InspectionStatus;
  photos: { file?: File; url: string; caption: string }[];
  purchaseItem: string;
  existingItemId?: string;
}

export default function InspectionWizardPage() {
  const { reservationId } = useParams<{ reservationId: string }>();
  const navigate = useNavigate();
  const { rooms, loading: roomsLoading } = useRooms();
  const user = useAuthStore((s) => s.user);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [roomStates, setRoomStates] = useState<Record<string, RoomState>>({});
  const [saving, setSaving] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing inspection data
  useEffect(() => {
    if (!reservationId || rooms.length === 0) return;
    supabase.from('inspection_items').select('*, photos:inspection_photos(*)').eq('reservation_id', reservationId)
      .then(({ data }) => {
        if (!data) return;
        const states: Record<string, RoomState> = {};
        for (const item of data as (InspectionItem & { photos: InspectionPhoto[] })[]) {
          states[item.room_id] = {
            comment: item.comment || '',
            status: item.status,
            photos: (item.photos || []).map(p => ({ url: p.photo_url, caption: p.caption || '' })),
            purchaseItem: '',
            existingItemId: item.id,
          };
        }
        setRoomStates(states);
      });
  }, [reservationId, rooms]);

  if (roomsLoading) return <div className="flex items-center justify-center h-screen"><Spinner /></div>;
  if (rooms.length === 0) return null;

  const currentRoom = rooms[currentIndex];
  const state = roomStates[currentRoom.id] || { comment: '', status: 'ok' as InspectionStatus, photos: [], purchaseItem: '' };

  const updateState = (updates: Partial<RoomState>) => {
    setRoomStates(prev => ({
      ...prev,
      [currentRoom.id]: { ...state, ...updates },
    }));
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file);
      updateState({ photos: [...state.photos, { file, url, caption: '' }] });
    }
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...state.photos];
    newPhotos.splice(index, 1);
    updateState({ photos: newPhotos });
  };

  const handleFinish = async () => {
    if (!reservationId || !user) return;
    setSaving(true);
    try {
      for (const room of rooms) {
        const rs = roomStates[room.id];
        if (!rs) continue;

        let itemId = rs.existingItemId;

        if (itemId) {
          await supabase.from('inspection_items').update({
            comment: rs.comment || null,
            status: rs.status,
          }).eq('id', itemId);
        } else {
          const { data } = await supabase.from('inspection_items').insert({
            reservation_id: reservationId,
            room_id: room.id,
            comment: rs.comment || null,
            status: rs.status,
            created_by: user.id,
          }).select().single();
          itemId = data?.id;
        }

        if (itemId) {
          for (const photo of rs.photos) {
            if (photo.file) {
              const path = `${reservationId}/${room.id}/${Date.now()}.jpg`;
              const url = await uploadPhoto(supabase, 'inspection-photos', path, photo.file);
              await supabase.from('inspection_photos').insert({
                inspection_item_id: itemId,
                photo_url: url,
                caption: photo.caption || null,
              });
            }
          }
        }

        // Create purchase if needed
        if (rs.status === 'needs_purchase' && rs.purchaseItem) {
          const { data: taskData } = await supabase.from('tasks').insert({
            reservation_id: reservationId,
            type: 'purchase',
            title: `Acheter: ${rs.purchaseItem} (${room.name})`,
            assigned_role: 'maintenance',
            status: 'todo',
            priority: 'normal',
          }).select().single();

          await supabase.from('purchases').insert({
            reservation_id: reservationId,
            task_id: taskData?.id,
            item_name: rs.purchaseItem,
          });
        }
      }

      // Mark inspection as done
      await supabase.from('reservations').update({ inspection_done: true }).eq('id', reservationId);
      navigate(-1);
    } catch (err) {
      console.error('Error saving inspection:', err);
    } finally {
      setSaving(false);
    }
  };

  const statusButtons: { value: InspectionStatus; icon: React.ReactNode; label: string; color: string }[] = [
    { value: 'ok', icon: <Check size={20} />, label: 'OK', color: 'bg-ios-success text-white' },
    { value: 'issue', icon: <AlertTriangle size={20} />, label: 'Problème', color: 'bg-ios-warning text-white' },
    { value: 'needs_purchase', icon: <ShoppingCart size={20} />, label: 'Achat', color: 'bg-ios-danger text-white' },
  ];

  const isLast = currentIndex === rooms.length - 1;

  return (
    <div className="flex flex-col h-screen bg-ios-bg">
      {/* Header */}
      <div className="bg-white border-b border-ios-separator/30 px-4 py-3" style={{ paddingTop: 'calc(var(--sat, 0px) + 12px)' }}>
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-ios-primary text-[17px] min-w-[44px] min-h-[44px] flex items-center" aria-label="Fermer">
            <X size={24} />
          </button>
          <div className="text-center">
            <h1 className="text-[17px] font-semibold">{currentRoom.name}</h1>
            <p className="text-[13px] text-ios-text-secondary">{currentRoom.floor} — {currentIndex + 1}/{rooms.length}</p>
          </div>
          <div className="w-11" />
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-ios-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / rooms.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto ios-scroll px-4 py-4 space-y-4">
        {/* Status buttons */}
        <div className="grid grid-cols-3 gap-2">
          {statusButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => {
                updateState({ status: btn.value });
                if (navigator.vibrate) navigator.vibrate(10);
              }}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl font-medium text-[14px] transition-all min-h-[44px] ${
                state.status === btn.value ? btn.color : 'bg-white text-ios-text-secondary'
              }`}
              aria-label={btn.label}
              aria-pressed={state.status === btn.value}
            >
              {btn.icon}
              {btn.label}
            </button>
          ))}
        </div>

        {/* Purchase item field */}
        {state.status === 'needs_purchase' && (
          <div className="fade-in">
            <Input
              label="Article à acheter"
              value={state.purchaseItem}
              onChange={(e) => updateState({ purchaseItem: e.target.value })}
              placeholder="Ex: Ampoule, Rideau..."
            />
          </div>
        )}

        {/* Comment */}
        <TextArea
          label="Commentaire"
          value={state.comment}
          onChange={(e) => updateState({ comment: e.target.value })}
          placeholder="Noter l'état de la pièce..."
          rows={3}
        />

        {/* Photos */}
        <div>
          <label className="block text-[13px] text-ios-text-secondary font-medium uppercase tracking-wide mb-2">Photos</label>
          <div className="grid grid-cols-3 gap-2">
            {state.photos.map((photo, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={photo.url}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setLightboxPhoto(photo.url)}
                />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
                  aria-label="Supprimer la photo"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl bg-white border-2 border-dashed border-ios-separator flex flex-col items-center justify-center text-ios-text-secondary min-h-[44px]"
              aria-label="Prendre une photo"
            >
              <Camera size={24} />
              <span className="text-[11px] mt-1">Photo</span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handlePhoto}
            className="hidden"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-t border-ios-separator/30 px-4 py-3" style={{ paddingBottom: 'calc(var(--sab, 0px) + 12px)' }}>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex-1"
          >
            <ChevronLeft size={20} className="mr-1" /> Précédent
          </Button>
          {isLast ? (
            <Button onClick={handleFinish} disabled={saving} className="flex-1">
              {saving ? 'Enregistrement...' : 'Terminer'}
            </Button>
          ) : (
            <Button onClick={() => setCurrentIndex(i => Math.min(rooms.length - 1, i + 1))} className="flex-1">
              Suivant <ChevronRight size={20} className="ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setLightboxPhoto(null)}>
          <button className="absolute top-4 right-4 text-white z-10 min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ top: 'calc(var(--sat, 0px) + 16px)' }} aria-label="Fermer">
            <X size={28} />
          </button>
          <img src={lightboxPhoto} alt="Photo agrandie" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}
