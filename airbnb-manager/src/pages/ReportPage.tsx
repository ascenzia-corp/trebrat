import { useState } from 'react';
import { AlertTriangle, ShoppingCart, Send } from 'lucide-react';
import NavBar from '../components/layout/NavBar';
import PageContainer from '../components/layout/PageContainer';
import Input from '../components/ui/Input';
import { TextArea } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';

export default function ReportPage() {
  const [type, setType] = useState<'issue' | 'purchase'>('issue');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (type === 'issue') {
        await supabase.from('tasks').insert({
          type: 'maintenance',
          title,
          description: description || null,
          assigned_role: 'maintenance',
          status: 'todo',
          priority: 'normal',
        });
      } else {
        const { data: taskData } = await supabase.from('tasks').insert({
          type: 'purchase',
          title: `Acheter: ${itemName}`,
          description: description || null,
          assigned_role: 'maintenance',
          status: 'todo',
          priority: 'normal',
        }).select().single();

        await supabase.from('purchases').insert({
          task_id: taskData?.id,
          item_name: itemName,
          quantity: parseInt(quantity) || 1,
          notes: description || null,
        });
      }
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setTitle('');
        setDescription('');
        setItemName('');
        setQuantity('1');
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col h-full">
        <NavBar title="Signaler" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-ios-success/10 rounded-full flex items-center justify-center mb-4">
              <Send size={28} className="text-ios-success" />
            </div>
            <h2 className="text-[20px] font-semibold">Signalement envoyé</h2>
            <p className="text-[15px] text-ios-text-secondary mt-1">Le propriétaire a été notifié</p>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <NavBar title="Signaler" />
      <PageContainer>
        <div className="px-4 space-y-4 pb-4">
          {/* Type toggle */}
          <div className="flex bg-gray-200 rounded-lg p-0.5">
            <button
              onClick={() => setType('issue')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-[14px] font-medium transition-colors ${
                type === 'issue' ? 'bg-white text-ios-text shadow-sm' : 'text-ios-text-secondary'
              }`}
            >
              <AlertTriangle size={16} /> Problème
            </button>
            <button
              onClick={() => setType('purchase')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-[14px] font-medium transition-colors ${
                type === 'purchase' ? 'bg-white text-ios-text shadow-sm' : 'text-ios-text-secondary'
              }`}
            >
              <ShoppingCart size={16} /> Achat nécessaire
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {type === 'issue' ? (
              <Input label="Titre du problème" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Fuite robinet salle de bains" required />
            ) : (
              <>
                <Input label="Article à acheter" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Ex: Ampoule LED E27" required />
                <Input label="Quantité" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </>
            )}
            <TextArea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Plus de détails..." rows={4} />
            <Button type="submit" fullWidth>
              <Send size={18} className="mr-2" /> Envoyer le signalement
            </Button>
          </form>
        </div>
      </PageContainer>
    </div>
  );
}
