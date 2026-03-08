import { supabase } from './supabase';
import type { Reservation } from '../types';

const CALENDAR_ID = 'c_b90baba6f4a6b60fa843f7d6571b8b6acde9fdc906939592f53a86e33c325d77@group.calendar.google.com';

interface CalendarSettings {
  google_access_token: string;
  google_refresh_token: string;
}

async function getCalendarSettings(): Promise<CalendarSettings | null> {
  const { data } = await supabase
    .from('settings')
    .select('*')
    .single();
  return data;
}

export async function syncReservationToCalendar(reservation: Reservation): Promise<string | null> {
  const settings = await getCalendarSettings();
  if (!settings?.google_access_token) return null;

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
    const calendarId = encodeURIComponent(CALENDAR_ID);
    let response: Response;

    if (reservation.google_event_id) {
      response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${reservation.google_event_id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${settings.google_access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );
    } else {
      response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${settings.google_access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );
    }

    if (response.ok) {
      const data = await response.json();
      return data.id;
    }
    console.warn('Google Calendar sync failed:', response.status);
    return null;
  } catch {
    console.error('Failed to sync with Google Calendar');
    return null;
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const settings = await getCalendarSettings();
  if (!settings?.google_access_token) return;

  const calendarId = encodeURIComponent(CALENDAR_ID);
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${settings.google_access_token}` },
    }
  ).catch(() => {});
}
