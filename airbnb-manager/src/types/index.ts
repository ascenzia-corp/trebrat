export type UserRole = 'owner' | 'cleaning' | 'maintenance';

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
}

export type ReservationStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

export interface Reservation {
  id: string;
  created_at: string;
  guest_name: string;
  guest_phone: string | null;
  guest_count: number | null;
  checkin_date: string;
  checkin_time: string;
  checkout_date: string;
  checkout_time: string;
  key_hidden: boolean;
  cleaning_done: boolean;
  inspection_done: boolean;
  status: ReservationStatus;
  notes: string | null;
  google_event_id: string | null;
}

export interface Room {
  id: string;
  name: string;
  display_order: number;
  floor: string;
}

export type InspectionStatus = 'ok' | 'issue' | 'needs_purchase';

export interface InspectionItem {
  id: string;
  reservation_id: string;
  room_id: string;
  comment: string | null;
  status: InspectionStatus;
  created_at: string;
  created_by: string;
  room?: Room;
  photos?: InspectionPhoto[];
}

export interface InspectionPhoto {
  id: string;
  inspection_item_id: string;
  photo_url: string;
  caption: string | null;
  created_at: string;
}

export type TaskType = 'cleaning' | 'inspection' | 'purchase' | 'maintenance';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Task {
  id: string;
  reservation_id: string | null;
  type: TaskType;
  title: string;
  description: string | null;
  assigned_to: string | null;
  assigned_role: string | null;
  status: TaskStatus;
  due_date: string | null;
  priority: TaskPriority;
  created_at: string;
  completed_at: string | null;
  assignee?: UserProfile;
  reservation?: Reservation;
}

export interface Purchase {
  id: string;
  reservation_id: string | null;
  task_id: string | null;
  item_name: string;
  quantity: number;
  purchased: boolean;
  receipt_photo: string | null;
  cost: number | null;
  purchased_by: string | null;
  purchased_at: string | null;
  notes: string | null;
  purchaser?: UserProfile;
  room_name?: string;
}
