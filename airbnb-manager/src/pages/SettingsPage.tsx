import { useState, useEffect } from 'react';
import NavBar from '../components/layout/NavBar';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export default function SettingsPage() {
  const { signOut, profile } = useAuthStore();
  const [calendarId, setCalendarId] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('settings').select('*').single().then(({ data }) => {
      if (data) setCalendarId(data.google_calendar_id || '');
    });
  }, []);

  const handleSaveCalendar = async () => {
    const { data } = await supabase.from('settings').select('id').single();
    if (data) {
      await supabase.from('settings').update({ google_calendar_id: calendarId }).eq('id', data.id);
    } else {
      await supabase.from('settings').insert({ google_calendar_id: calendarId });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <NavBar title="Paramètres" showBack />
      <PageContainer>
        <div className="px-4 space-y-4 pb-6">
          {/* Profile */}
          <Card>
            <h3 className="text-[13px] font-medium text-ios-text-secondary uppercase tracking-wide mb-3">Profil</h3>
            <div className="space-y-2">
              <p className="text-[17px]">{profile?.full_name}</p>
              <p className="text-[15px] text-ios-text-secondary capitalize">{profile?.role === 'owner' ? 'Propriétaire' : profile?.role === 'cleaning' ? 'Ménage' : 'Maintenance'}</p>
            </div>
          </Card>

          {/* Google Calendar */}
          {profile?.role === 'owner' && (
            <Card>
              <h3 className="text-[13px] font-medium text-ios-text-secondary uppercase tracking-wide mb-3">Google Calendar</h3>
              <div className="space-y-3">
                <Input
                  label="ID du calendrier"
                  value={calendarId}
                  onChange={(e) => setCalendarId(e.target.value)}
                  placeholder="exemple@group.calendar.google.com"
                />
                <Button variant={saved ? 'secondary' : 'primary'} fullWidth onClick={handleSaveCalendar}>
                  {saved ? '✓ Enregistré' : 'Enregistrer'}
                </Button>
              </div>
            </Card>
          )}

          {/* Logout */}
          <Card>
            <Button variant="danger" fullWidth onClick={signOut}>
              Se déconnecter
            </Button>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}
