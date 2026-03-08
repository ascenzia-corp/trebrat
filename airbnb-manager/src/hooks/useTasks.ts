import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Task } from '../types';

export function useTasks(filters?: { reservationId?: string; assignedTo?: string; assignedRole?: string; type?: string; status?: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('tasks').select('*').order('due_date', { ascending: true });

    if (filters?.reservationId) query = query.eq('reservation_id', filters.reservationId);
    if (filters?.assignedTo) query = query.eq('assigned_to', filters.assignedTo);
    if (filters?.assignedRole) query = query.eq('assigned_role', filters.assignedRole);
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.status) query = query.eq('status', filters.status);

    const { data } = await query;
    setTasks((data as Task[]) || []);
    setLoading(false);
  }, [filters?.reservationId, filters?.assignedTo, filters?.assignedRole, filters?.type, filters?.status]);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel('tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  const create = async (task: Partial<Task>) => {
    const { data, error } = await supabase.from('tasks').insert(task).select().single();
    if (error) throw error;
    return data as Task;
  };

  const update = async (id: string, updates: Partial<Task>) => {
    const { error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (error) throw error;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  };

  return { tasks, loading, refresh: fetch, create, update, remove };
}

export async function createAutoTasks(reservationId: string, guestName: string, checkinDate: string, checkoutDate: string) {
  const checkin = new Date(checkinDate);
  const cleaningDue = new Date(checkin);
  cleaningDue.setDate(cleaningDue.getDate() - 1);

  const tasks = [
    {
      reservation_id: reservationId,
      type: 'cleaning',
      title: `Préparer le logement pour ${guestName}`,
      assigned_role: 'cleaning',
      status: 'todo',
      due_date: cleaningDue.toISOString(),
      priority: 'high',
    },
    {
      reservation_id: reservationId,
      type: 'inspection',
      title: `État des lieux de sortie ${guestName}`,
      assigned_role: 'cleaning',
      status: 'todo',
      due_date: new Date(checkoutDate).toISOString(),
      priority: 'normal',
    },
    {
      reservation_id: reservationId,
      type: 'maintenance',
      title: `Cacher la clef pour ${guestName}`,
      assigned_role: 'owner',
      status: 'todo',
      due_date: new Date(checkinDate).toISOString(),
      priority: 'high',
    },
  ];

  const { error } = await supabase.from('tasks').insert(tasks);
  if (error) throw error;
}
