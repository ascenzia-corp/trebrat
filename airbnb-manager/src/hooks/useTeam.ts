import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { UserProfile, UserRole } from '../types';

export function useTeam() {
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: true });
    setMembers((data as UserProfile[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const invite = async (email: string, role: UserRole, fullName: string) => {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: Math.random().toString(36).slice(-12),
      email_confirm: true,
    });
    if (error) throw error;
    if (data.user) {
      await supabase.from('user_profiles').insert({
        id: data.user.id,
        full_name: fullName,
        role,
      });
    }
    await fetch();
  };

  const updateRole = async (userId: string, role: UserRole) => {
    const { error } = await supabase.from('user_profiles').update({ role }).eq('id', userId);
    if (error) throw error;
    await fetch();
  };

  return { members, loading, refresh: fetch, invite, updateRole };
}
