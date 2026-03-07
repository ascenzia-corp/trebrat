import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Reservation } from '../types';

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .order('checkin_date', { ascending: true });
    setReservations((data as Reservation[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel('reservations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  const create = async (reservation: Partial<Reservation>) => {
    const { data, error } = await supabase.from('reservations').insert(reservation).select().single();
    if (error) throw error;
    return data as Reservation;
  };

  const update = async (id: string, updates: Partial<Reservation>) => {
    const { error } = await supabase.from('reservations').update(updates).eq('id', id);
    if (error) throw error;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('reservations').delete().eq('id', id);
    if (error) throw error;
  };

  return { reservations, loading, refresh: fetch, create, update, remove };
}

export function useReservation(id: string | undefined) {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase.from('reservations').select('*').eq('id', id).single()
      .then(({ data }) => {
        setReservation(data as Reservation);
        setLoading(false);
      });
  }, [id]);

  return { reservation, loading, setReservation };
}
