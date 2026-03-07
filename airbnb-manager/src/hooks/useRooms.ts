import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Room } from '../types';

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('rooms').select('*').order('display_order', { ascending: true })
      .then(({ data }) => {
        setRooms((data as Room[]) || []);
        setLoading(false);
      });
  }, []);

  return { rooms, loading };
}
