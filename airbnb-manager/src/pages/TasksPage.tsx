import React, { useState } from 'react';
import { CheckSquare, Plus, Circle, CheckCircle2, Clock } from 'lucide-react';
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
import { useTasks } from '../hooks/useTasks';
import { useAuthStore, useIsOwner } from '../stores/authStore';
import type { TaskType, TaskPriority, TaskStatus } from '../types';
import { format, parseISO, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';

const typeFilters = [
  { value: '', label: 'Toutes' },
  { value: 'cleaning', label: 'Ménage' },
  { value: 'inspection', label: 'État des lieux' },
  { value: 'purchase', label: 'Achats' },
  { value: 'maintenance', label: 'Maintenance' },
];

const statusFilters = [
  { value: '', label: 'Tout' },
  { value: 'todo', label: 'À faire' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'done', label: 'Terminé' },
];

const priorityConfig: Record<TaskPriority, { variant: 'gray' | 'primary' | 'warning' | 'danger'; label: string }> = {
  low: { variant: 'gray', label: 'Basse' },
  normal: { variant: 'primary', label: 'Normale' },
  high: { variant: 'warning', label: 'Haute' },
  urgent: { variant: 'danger', label: 'Urgente' },
};

export default function TasksPage() {
  const isOwner = useIsOwner();
  const profile = useAuthStore((s) => s.profile);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const filters: any = {};
  if (typeFilter) filters.type = typeFilter;
  if (statusFilter) filters.status = statusFilter;
  if (!isOwner && profile) {
    filters.assignedRole = profile.role;
  }

  const { tasks, loading, create, update } = useTasks(filters);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'maintenance' as TaskType,
    priority: 'normal' as TaskPriority,
    due_date: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await create({
      title: form.title,
      description: form.description || null,
      type: form.type,
      priority: form.priority,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      assigned_role: form.type === 'cleaning' ? 'cleaning' : form.type === 'maintenance' ? 'maintenance' : 'owner',
    });
    setShowForm(false);
    setForm({ title: '', description: '', type: 'maintenance', priority: 'normal', due_date: '' });
  };

  const toggleStatus = async (taskId: string, current: TaskStatus) => {
    const next: TaskStatus = current === 'done' ? 'todo' : 'done';
    try {
      await update(taskId, {
        status: next,
        completed_at: next === 'done' ? new Date().toISOString() : null,
      });
      if (navigator.vibrate) navigator.vibrate(10);
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_date && isPast(parseISO(t.due_date)));

  return (
    <div className="flex flex-col h-full">
      <NavBar
        title={isOwner ? 'Tâches' : 'Mes tâches'}
        rightAction={
          overdueTasks.length > 0 ? (
            <div className="bg-ios-danger text-white text-[12px] font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {overdueTasks.length}
            </div>
          ) : undefined
        }
      />

      {/* Type filters */}
      <div className="px-4 pb-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {typeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-[14px] font-medium transition-colors min-h-[32px] ${
                typeFilter === f.value ? 'bg-ios-primary text-white' : 'bg-white text-ios-text-secondary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status filters */}
      <div className="px-4 pb-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors min-h-[32px] ${
                statusFilter === f.value ? 'bg-gray-700 text-white' : 'bg-gray-100 text-ios-text-secondary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <PageContainer>
        {loading ? (
          <div className="py-20"><Spinner /></div>
        ) : tasks.length === 0 ? (
          <EmptyState icon={<CheckSquare size={48} />} title="Aucune tâche" description="Toutes les tâches sont terminées" />
        ) : (
          <div className="px-4 space-y-2 pb-4">
            {tasks.map((task) => {
              const pConfig = priorityConfig[task.priority];
              const isOverdue = task.status !== 'done' && task.due_date && isPast(parseISO(task.due_date));
              return (
                <Card key={task.id} className="fade-in">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleStatus(task.id, task.status)}
                      className="mt-0.5 min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 -my-2"
                      aria-label={task.status === 'done' ? 'Marquer non fait' : 'Marquer fait'}
                    >
                      {task.status === 'done' ? (
                        <CheckCircle2 size={24} className="text-ios-success" />
                      ) : task.status === 'in_progress' ? (
                        <Clock size={24} className="text-ios-warning" />
                      ) : (
                        <Circle size={24} className="text-ios-separator" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[17px] font-medium ${task.status === 'done' ? 'line-through text-ios-text-secondary' : ''}`}>
                          {task.title}
                        </span>
                        <Badge variant={pConfig.variant}>{pConfig.label}</Badge>
                      </div>
                      {task.description && (
                        <p className="text-[14px] text-ios-text-secondary mt-0.5 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-[13px] text-ios-text-secondary">
                        {task.assignee && <span>{task.assignee.full_name}</span>}
                        {task.due_date && (
                          <span className={isOverdue ? 'text-ios-danger font-medium' : ''}>
                            {isOverdue ? '⚠️ ' : ''}{format(parseISO(task.due_date), 'd MMM', { locale: fr })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </PageContainer>

      {isOwner && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-[calc(83px+var(--sab,0px)+16px)] right-4 w-14 h-14 bg-ios-primary text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-30"
          aria-label="Ajouter une tâche"
        >
          <Plus size={28} />
        </button>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nouvelle tâche">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Titre" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} required />
          <TextArea label="Description" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          <div>
            <label className="block text-[13px] text-ios-text-secondary font-medium uppercase tracking-wide mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm(f => ({ ...f, type: e.target.value as TaskType }))}
              className="w-full h-[44px] px-4 rounded-[10px] bg-ios-bg text-[17px]"
            >
              <option value="cleaning">Ménage</option>
              <option value="inspection">État des lieux</option>
              <option value="purchase">Achat</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] text-ios-text-secondary font-medium uppercase tracking-wide mb-1">Priorité</label>
            <select
              value={form.priority}
              onChange={(e) => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}
              className="w-full h-[44px] px-4 rounded-[10px] bg-ios-bg text-[17px]"
            >
              <option value="low">Basse</option>
              <option value="normal">Normale</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
          <Input label="Date d'échéance" type="date" value={form.due_date} onChange={(e) => setForm(f => ({ ...f, due_date: e.target.value }))} />
          <Button type="submit" fullWidth>Créer la tâche</Button>
        </form>
      </Modal>
    </div>
  );
}
