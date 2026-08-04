import { safeFetchJson } from '../utils/apiUtils';
import { BookingRequest, NotificationItem, Hall, BookingStatus } from '../types';
import { HALLS_DATA, ADDON_OPTIONS } from '../data/hallsData';
import { cleanImageUrl } from '../utils/imageUtils';

const BOOKINGS_KEY = 'im_hall_bookings_v2';
const HALL_IMAGES_KEY = 'im_hall_custom_images_v2';
const MANAGER_PASSWORD_KEY = 'im_hall_manager_password';

function saveLocal<T>(key: string, data: T) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* optional cache */ }
}

function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export function managerAuthHeaders(): Record<string, string> {
  const password = sessionStorage.getItem(MANAGER_PASSWORD_KEY);
  return password ? { 'x-manager-password': password } : {};
}

export async function authenticateManager(password: string): Promise<boolean> {
  const result = await safeFetchJson('/api/manager/login', {
    method: 'POST',
    headers: { 'x-manager-password': password }
  });
  if (result.ok) sessionStorage.setItem(MANAGER_PASSWORD_KEY, password);
  return result.ok;
}

export async function fetchAllBookings(manager = false): Promise<BookingRequest[]> {
  const result = await safeFetchJson('/api/bookings', {
    headers: manager ? managerAuthHeaders() : {}
  });
  if (result.ok && Array.isArray(result.data?.bookings)) return result.data.bookings;
  return manager ? [] : loadLocal<BookingRequest[]>(BOOKINGS_KEY, []);
}

export async function fetchAllNotifications(): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
  const result = await safeFetchJson('/api/notifications', { headers: managerAuthHeaders() });
  const notifications = result.ok && Array.isArray(result.data?.notifications) ? result.data.notifications : [];
  return { notifications, unreadCount: result.ok ? Number(result.data?.unreadCount) || 0 : 0 };
}

export async function fetchAllHalls(): Promise<{ halls: Hall[]; addons: typeof ADDON_OPTIONS }> {
  const result = await safeFetchJson('/api/halls');
  if (result.ok && Array.isArray(result.data?.halls)) {
    const halls = result.data.halls.map((hall: Hall) => ({
      ...hall,
      primaryImage: cleanImageUrl(hall.primaryImage, '/images/hall_alpha.jpeg'),
      secondaryImages: (hall.secondaryImages || []).map(img => cleanImageUrl(img, '/images/surau-v2.jpeg'))
    }));
    return { halls, addons: result.data.addons || ADDON_OPTIONS };
  }
  const custom = loadLocal<Record<string, { primaryImage?: string; secondaryImages?: string[] }>>(HALL_IMAGES_KEY, {});
  return {
    halls: HALLS_DATA.map(hall => ({ ...hall, ...custom[hall.id] })),
    addons: ADDON_OPTIONS
  };
}

export async function createNewBooking(payload: unknown): Promise<{ booking: BookingRequest; notification: NotificationItem }> {
  const result = await safeFetchJson('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!result.ok || !result.data?.booking) throw new Error(result.error || 'Booking could not be saved.');
  const booking = result.data.booking as BookingRequest;
  const notification = result.data.notification as NotificationItem;
  saveLocal(BOOKINGS_KEY, [booking, ...loadLocal<BookingRequest[]>(BOOKINGS_KEY, []).filter(b => b.id !== booking.id)]);
  return { booking, notification };
}

export async function updateBookingStatusInStore(bookingId: string, status: BookingStatus): Promise<boolean> {
  const result = await safeFetchJson(`/api/bookings/${bookingId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...managerAuthHeaders() },
    body: JSON.stringify({ status })
  });
  return result.ok;
}

export async function recordBookingPaymentInStore(bookingId: string, paymentData: unknown): Promise<boolean> {
  const result = await safeFetchJson(`/api/bookings/${bookingId}/payment`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...managerAuthHeaders() },
    body: JSON.stringify(paymentData)
  });
  return result.ok;
}

export async function deleteBookingFromStore(bookingId: string): Promise<boolean> {
  const result = await safeFetchJson(`/api/bookings/${bookingId}`, {
    method: 'DELETE',
    headers: managerAuthHeaders()
  });
  return result.ok;
}

export async function markNotificationsReadInStore(): Promise<boolean> {
  const result = await safeFetchJson('/api/notifications/mark-read', {
    method: 'POST',
    headers: managerAuthHeaders()
  });
  return result.ok;
}
