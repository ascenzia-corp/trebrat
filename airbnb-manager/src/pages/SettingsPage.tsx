import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import NavBar from '../components/layout/NavBar';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { getGoogleAuthUrl, exchangeCodeForTokens } from '../lib/google-calendar';

export default function SettingsPage() {
  const { signOut, profile } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [calendarId, setCalendarId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [saved, setSaved] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Load settings
  useEffect(() => {
    supabase.from('settings').select('*').single().then(({ data }) => {
      if (data) {
        setSettingsId(data.id);
        setCalendarId(data.google_calendar_id || '');
        setClientId(data.google_client_id || '');
        setClientSecret(data.google_client_secret || '');
        setConnected(!!data.google_refresh_token);
      }
    });
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) return;

    // Remove code from URL
    setSearchParams({}, { replace: true });

    (async () => {
      setConnecting(true);
      // Fetch current credentials from settings
      const { data: s } = await supabase.from('settings').select('*').single();
      if (!s?.google_client_id || !s?.google_client_secret) {
        alert('Client ID et Client Secret manquants. Enregistrez-les d\'abord.');
        setConnecting(false);
        return;
      }

      const redirectUri = `${window.location.origin}/settings`;
      const tokens = await exchangeCodeForTokens(code, s.google_client_id, s.google_client_secret, redirectUri);

      if (tokens) {
        await supabase.from('settings').update({
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token,
        }).eq('id', s.id);
        setConnected(true);
      } else {
        alert('Échec de la connexion Google. Vérifiez vos identifiants OAuth.');
      }
      setConnecting(false);
    })();
  }, [searchParams, setSearchParams]);

  const handleSave = async () => {
    const updates = {
      google_calendar_id: calendarId || null,
      google_client_id: clientId || null,
      google_client_secret: clientSecret || null,
    };

    if (settingsId) {
      await supabase.from('settings').update(updates).eq('id', settingsId);
    } else {
      const { data } = await supabase.from('settings').insert(updates).select().single();
      if (data) setSettingsId(data.id);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleConnect = () => {
    if (!clientId) {
      alert('Renseignez d\'abord le Client ID.');
      return;
    }
    const redirectUri = `${window.location.origin}/settings`;
    window.location.href = getGoogleAuthUrl(clientId, redirectUri);
  };

  const handleDisconnect = async () => {
    if (!settingsId) return;
    await supabase.from('settings').update({
      google_access_token: null,
      google_refresh_token: null,
    }).eq('id', settingsId);
    setConnected(false);
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-medium text-ios-text-secondary uppercase tracking-wide">Google Calendar</h3>
                {connected ? (
                  <Badge variant="success">Connecté</Badge>
                ) : (
                  <Badge variant="gray">Non connecté</Badge>
                )}
              </div>
              <div className="space-y-3">
                <Input
                  label="ID du calendrier"
                  value={calendarId}
                  onChange={(e) => setCalendarId(e.target.value)}
                  placeholder="exemple@group.calendar.google.com"
                />
                <Input
                  label="Client ID Google"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="xxxx.apps.googleusercontent.com"
                />
                <Input
                  label="Client Secret Google"
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="GOCSPX-..."
                />

                <Button variant={saved ? 'secondary' : 'primary'} fullWidth onClick={handleSave}>
                  {saved ? '✓ Enregistré' : 'Enregistrer'}
                </Button>

                {!connected ? (
                  <Button variant="secondary" fullWidth onClick={handleConnect} disabled={connecting}>
                    {connecting ? 'Connexion en cours...' : 'Connecter Google Calendar'}
                  </Button>
                ) : (
                  <button
                    onClick={handleDisconnect}
                    className="w-full text-center text-[14px] text-ios-danger py-2"
                  >
                    Déconnecter Google Calendar
                  </button>
                )}
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
