import React, { useState, useRef } from 'react';
import { ShoppingCart, Camera, Check, Plus } from 'lucide-react';
import NavBar from '../components/layout/NavBar';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { usePurchases } from '../hooks/usePurchases';
import { useAuthStore, useIsOwner } from '../stores/authStore';
import { uploadPhoto } from '../lib/image-utils';
import { supabase } from '../lib/supabase';

export default function PurchasesPage() {
  const isOwner = useIsOwner();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<'pending' | 'done'>('pending');
  const { purchases, loading, update, create } = usePurchases({ purchased: tab === 'done' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ item_name: '', quantity: '1', notes: '' });
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handlePurchase = async (id: string) => {
    await update(id, {
      purchased: true,
      purchased_by: user?.id,
      purchased_at: new Date().toISOString(),
    });
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleReceiptPhoto = async (purchaseId: string, file: File) => {
    const path = `${purchaseId}/${Date.now()}.jpg`;
    const url = await uploadPhoto(supabase, 'receipts', path, file);
    await update(purchaseId, { receipt_photo: url });
  };

  const handleCost = async (id: string, cost: string) => {
    const numCost = parseFloat(cost);
    if (!isNaN(numCost)) {
      await update(id, { cost: numCost });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await create({
      item_name: form.item_name,
      quantity: parseInt(form.quantity) || 1,
      notes: form.notes || null,
    });
    setShowForm(false);
    setForm({ item_name: '', quantity: '1', notes: '' });
  };

  return (
    <div className="flex flex-col h-full">
      <NavBar title="Achats" />

      {/* Tabs */}
      <div className="px-4 pb-3">
        <div className="flex bg-gray-200 rounded-lg p-0.5">
          <button
            onClick={() => setTab('pending')}
            className={`flex-1 py-2 rounded-md text-[14px] font-medium transition-colors ${
              tab === 'pending' ? 'bg-white text-ios-text shadow-sm' : 'text-ios-text-secondary'
            }`}
          >
            À acheter
          </button>
          <button
            onClick={() => setTab('done')}
            className={`flex-1 py-2 rounded-md text-[14px] font-medium transition-colors ${
              tab === 'done' ? 'bg-white text-ios-text shadow-sm' : 'text-ios-text-secondary'
            }`}
          >
            Achetés
          </button>
        </div>
      </div>

      <PageContainer>
        {loading ? (
          <div className="py-20"><Spinner /></div>
        ) : purchases.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart size={48} />}
            title={tab === 'pending' ? 'Rien à acheter' : 'Aucun achat'}
            description={tab === 'pending' ? 'Tous les achats sont faits' : "Pas encore d'achats réalisés"}
          />
        ) : (
          <div className="px-4 space-y-2 pb-4">
            {purchases.map((purchase) => (
              <Card key={purchase.id} className="fade-in">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[17px] font-medium">{purchase.item_name}</h3>
                      {purchase.quantity > 1 && (
                        <Badge variant="gray">x{purchase.quantity}</Badge>
                      )}
                    </div>
                    {purchase.notes && (
                      <p className="text-[14px] text-ios-text-secondary mt-0.5">{purchase.notes}</p>
                    )}
                    {purchase.purchaser && (
                      <p className="text-[13px] text-ios-text-secondary mt-1">Par {purchase.purchaser.full_name}</p>
                    )}
                  </div>

                  {!purchase.purchased ? (
                    <button
                      onClick={() => handlePurchase(purchase.id)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-ios-success/10 text-ios-success"
                      aria-label="Marquer comme acheté"
                    >
                      <Check size={22} />
                    </button>
                  ) : (
                    <div className="text-right">
                      {purchase.cost != null && (
                        <p className="text-[17px] font-semibold">{purchase.cost.toFixed(2)} €</p>
                      )}
                    </div>
                  )}
                </div>

                {purchase.purchased && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-ios-separator/30">
                    <Input
                      placeholder="Montant €"
                      type="number"
                      step="0.01"
                      defaultValue={purchase.cost?.toString() || ''}
                      onBlur={(e) => handleCost(purchase.id, e.target.value)}
                      className="flex-1"
                    />
                    <button
                      onClick={() => fileRefs.current[purchase.id]?.click()}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-ios-bg text-ios-text-secondary"
                      aria-label="Photo du ticket"
                    >
                      <Camera size={20} />
                    </button>
                    <input
                      ref={(el) => { fileRefs.current[purchase.id] = el; }}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => e.target.files?.[0] && handleReceiptPhoto(purchase.id, e.target.files[0])}
                      className="hidden"
                    />
                    {purchase.receipt_photo && (
                      <img src={purchase.receipt_photo} alt="Ticket" className="w-11 h-11 rounded-lg object-cover" />
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </PageContainer>

      {(isOwner || useAuthStore.getState().profile?.role === 'maintenance') && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-[calc(83px+var(--sab,0px)+16px)] right-4 w-14 h-14 bg-ios-primary text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-30"
          aria-label="Ajouter un achat"
        >
          <Plus size={28} />
        </button>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nouvel achat">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Article" value={form.item_name} onChange={(e) => setForm(f => ({ ...f, item_name: e.target.value }))} required />
          <Input label="Quantité" type="number" min="1" value={form.quantity} onChange={(e) => setForm(f => ({ ...f, quantity: e.target.value }))} />
          <Input label="Notes" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
          <Button type="submit" fullWidth>Ajouter</Button>
        </form>
      </Modal>
    </div>
  );
}
