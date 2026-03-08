import { supabase } from './supabase';
import type { Reservation } from '../types';

interface CalendarSettings {
  id: string;
  google_calendar_id: string | null;
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_client_id: string | null;
  google_client_secret: string | null;
}

async function getCalendarSettings(): Promise<CalendarSettings | null> {
  const { data } = await supabase.from('settings').select('*').single();
  return data;
}

async function refreshAccessToken(settings: CalendarSettings): Promise<string | null> {
  if (!settings.google_refresh_token || !settings.google_client_id || !settings.google_client_secret) {
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: settings.google_client_id,
        client_secret: settings.google_client_secret,
        refresh_token: settings.google_refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      console.warn('Google token refresh failed:', response.status);
      return null;
    }

    const data = await response.json();
    const newToken = data.access_token as string;

    // Save refreshed token to settings
    await supabase.from('settings').update({ google_access_token: newToken }).eq('id', settings.id);

    return newToken;
  } catch {
    console.error('Failed to refresh Google token');
    return null;
  }
}

async function calendarFetch(
  url: string,
  options: RequestInit,
  settings: CalendarSettings,
): Promise<Response | null> {
  let token = settings.google_access_token;
  if (!token) return null;

  let response = await fetch(url, {
    ...options,
    headers: { ...options.headers as Record<string, string>, Authorization: `Bearer ${token}` },
  });

  // If 401, try refreshing the token
  if (response.status === 401) {
    token = await refreshAccessToken(settings);
    if (!token) return null;

    response = await fetch(url, {
      ...options,
      headers: { ...options.headers as Record<string, string>, Authorization: `Bearer ${token}` },
    });
  }

  return response;
}

export async function syncReservationToCalendar(reservation: Reservation): Promise<string | null> {
  const settings = await getCalendarSettings();
  if (!settings?.google_access_token || !settings?.google_calendar_id) return null;

  const calendarId = encodeURIComponent(settings.google_calendar_id);

  const event = {
    summary: `Location: ${reservation.guest_name}`,
    description: [
      `Locataire: ${reservation.guest_name}`,
      `Personnes: ${reservation.guest_count || 'N/A'}`,
      `Téléphone: ${reservation.guest_phone || 'N/A'}`,
    ].join('\n'),
    start: {
      dateTime: `${reservation.checkin_date}T${reservation.checkin_time}:00`,
      timeZone: 'Europe/Paris',
    },
    end: {
      dateTime: `${reservation.checkout_date}T${reservation.checkout_time}:00`,
      timeZone: 'Europe/Paris',
    },
  };

  try {
    const url = reservation.google_event_id
      ? `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${reservation.google_event_id}`
      : `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;

    const response = await calendarFetch(url, {
      method: reservation.google_event_id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }, settings);

    if (response?.ok) {
      const data = await response.json();
      return data.id;
    }
    const errorBody = await response?.text().catch(() => 'no body');
    console.error('Google Calendar sync failed:', response?.status, errorBody);
    console.error('Event payload sent:', JSON.stringify(event, null, 2));
    return null;
  } catch (err) {
    console.error('Failed to sync with Google Calendar', err);
    return null;
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const settings = await getCalendarSettings();
  if (!settings?.google_access_token || !settings?.google_calendar_id) return;

  const calendarId = encodeURIComponent(settings.google_calendar_id);

  await calendarFetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
    { method: 'DELETE' },
    settings,
  ).catch(() => {});
}

/**
 * Build the Google OAuth authorization URL.
 * Redirect the user here to start the OAuth flow.
 */
export function getGoogleAuthUrl(clientId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.events',
    access_type: 'offline',
    prompt: 'consent',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/**
 * Exchange an authorization code for access + refresh tokens.
 */
export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Promise<{ access_token: string; refresh_token: string } | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return { access_token: data.access_token, refresh_token: data.refresh_token };
  } catch {
    return null;
  }
}
