import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Purchase } from '../types';

export function usePurchases(filters?: { purchased?: boolean }) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('purchases').select('*').order('created_at', { ascending: false });

    if (filters?.purchased !== undefined) query = query.eq('purchased', filters.purchased);

    const { data } = await query;
    setPurchases((data as unknown as Purchase[]) || []);
    setLoading(false);
  }, [filters?.purchased]);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel('purchases')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  const create = async (purchase: Partial<Purchase>) => {
    const { data, error } = await supabase.from('purchases').insert(purchase).select().single();
    if (error) throw error;
    return data as Purchase;
  };

  const update = async (id: string, updates: Partial<Purchase>) => {
    const { error } = await supabase.from('purchases').update(updates).eq('id', id);
    if (error) throw error;
  };

  return { purchases, loading, refresh: fetch, create, update };
}
