import { db, collection, doc, setDoc, getDocs, deleteDoc } from '../lib/firebase';
import { safeFetchJson } from '../utils/apiUtils';
import { BookingRequest, NotificationItem, Hall, HallId, BookingStatus } from '../types';
import { HALLS_DATA, ADDON_OPTIONS } from '../data/hallsData';
import { cleanImageUrl } from '../utils/imageUtils';

const LOCAL_STORAGE_BOOKINGS_KEY = 'im_hall_bookings_v2';
const LOCAL_STORAGE_NOTIFS_KEY = 'im_hall_notifications_v2';
const LOCAL_STORAGE_HALL_IMAGES_KEY = 'im_hall_custom_images_v2';

// Helper to save to localStorage
function saveToLocalStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save to localStorage', e);
  }
}

// Helper to load from localStorage
function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load from localStorage', e);
  }
  return defaultValue;
}

export async function fetchAllBookings(): Promise<BookingRequest[]> {
  // 1. Try API
  const apiRes = await safeFetchJson('/api/bookings');
  if (apiRes.ok && apiRes.data?.bookings && Array.isArray(apiRes.data.bookings)) {
    const bookings: BookingRequest[] = apiRes.data.bookings;
    saveToLocalStorage(LOCAL_STORAGE_BOOKINGS_KEY, bookings);
    return bookings;
  }

  // 2. Fallback to direct Firestore
  try {
    const snap = await getDocs(collection(db, 'bookings'));
    if (!snap.empty) {
      const fsBookings: BookingRequest[] = [];
      snap.forEach(d => {
        fsBookings.push(d.data() as BookingRequest);
      });
      fsBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      saveToLocalStorage(LOCAL_STORAGE_BOOKINGS_KEY, fsBookings);
      return fsBookings;
    }
  } catch (e) {
    console.warn('Direct Firestore fetch error for bookings:', e);
  }

  // 3. Fallback to LocalStorage
  return loadFromLocalStorage<BookingRequest[]>(LOCAL_STORAGE_BOOKINGS_KEY, []);
}

export async function fetchAllNotifications(): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
  // 1. Try API
  const apiRes = await safeFetchJson('/api/notifications');
  if (apiRes.ok && apiRes.data?.notifications && Array.isArray(apiRes.data.notifications)) {
    const notifications: NotificationItem[] = apiRes.data.notifications;
    const unreadCount = apiRes.data.unreadCount ?? notifications.filter(n => !n.read).length;
    saveToLocalStorage(LOCAL_STORAGE_NOTIFS_KEY, notifications);
    return { notifications, unreadCount };
  }

  // 2. Fallback to direct Firestore
  try {
    const snap = await getDocs(collection(db, 'notifications'));
    if (!snap.empty) {
      const fsNotifs: NotificationItem[] = [];
      snap.forEach(d => {
        fsNotifs.push(d.data() as NotificationItem);
      });
      fsNotifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      saveToLocalStorage(LOCAL_STORAGE_NOTIFS_KEY, fsNotifs);
      return { notifications: fsNotifs, unreadCount: fsNotifs.filter(n => !n.read).length };
    }
  } catch (e) {
    console.warn('Direct Firestore fetch error for notifications:', e);
  }

  // 3. Fallback to LocalStorage
  const cachedNotifs = loadFromLocalStorage<NotificationItem[]>(LOCAL_STORAGE_NOTIFS_KEY, []);
  return { notifications: cachedNotifs, unreadCount: cachedNotifs.filter(n => !n.read).length };
}

export async function fetchAllHalls(): Promise<{ halls: Hall[]; addons: typeof ADDON_OPTIONS }> {
  // 1. Try API
  const apiRes = await safeFetchJson('/api/halls');
  if (apiRes.ok && apiRes.data?.halls && Array.isArray(apiRes.data.halls)) {
    const sanitizedHalls = apiRes.data.halls.map((hall: Hall) => ({
      ...hall,
      primaryImage: cleanImageUrl(hall.primaryImage, hall.id.includes('grand') ? '/images/hall_alpha.jpeg' : '/images/hall_b_panoramic.jpeg'),
      secondaryImages: (hall.secondaryImages || []).map((img: string) => cleanImageUrl(img, '/images/surau.jpeg'))
    }));
    return { halls: sanitizedHalls, addons: apiRes.data.addons || ADDON_OPTIONS };
  }

  // 2. Fallback to direct Firestore + Default Halls
  let customImages: Record<string, { primaryImage?: string; secondaryImages?: string[] }> = {};
  try {
    const snap = await getDocs(collection(db, 'hall_images'));
    snap.forEach(d => {
      customImages[d.id] = d.data();
    });
    saveToLocalStorage(LOCAL_STORAGE_HALL_IMAGES_KEY, customImages);
  } catch (e) {
    console.warn('Direct Firestore fetch error for hall_images:', e);
    customImages = loadFromLocalStorage(LOCAL_STORAGE_HALL_IMAGES_KEY, {});
  }

  const effectiveHalls = HALLS_DATA.map(hall => {
    const custom = customImages[hall.id];
    const rawPrimary = custom?.primaryImage || hall.primaryImage;
    const rawSecondary = custom?.secondaryImages || hall.secondaryImages;

    return {
      ...hall,
      primaryImage: cleanImageUrl(rawPrimary, hall.id.includes('grand') ? '/images/hall_alpha.jpeg' : '/images/hall_b_panoramic.jpeg'),
      secondaryImages: (rawSecondary || []).map(img => cleanImageUrl(img, '/images/surau.jpeg'))
    };
  });

  return { halls: effectiveHalls, addons: ADDON_OPTIONS };
}

export async function createNewBooking(payload: any): Promise<{ booking: BookingRequest; notification: NotificationItem }> {
  const currentHall = HALLS_DATA.find(h => h.id === payload.hallId) || HALLS_DATA[0];
  const refNum = `BK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const bookingId = `b-${Date.now()}`;
  const notifId = `n-${Date.now()}`;

  const newBooking: BookingRequest = {
    id: bookingId,
    referenceNumber: refNum,
    hallId: payload.hallId,
    hallName: currentHall.name,
    customerName: payload.customerName,
    customerEmail: payload.customerEmail,
    customerPhone: payload.customerPhone || 'N/A',
    eventType: payload.eventType || 'Special Event',
    eventDate: payload.eventDate,
    timeSlot: payload.timeSlot || 'afternoon',
    startTime: payload.startTime || '12:00',
    endTime: payload.endTime || (payload.timeSlot === 'morning' ? '13:00' : payload.timeSlot === 'afternoon' ? '18:00' : '23:00'),
    durationHours: Number(payload.durationHours) || 5,
    guestCount: Number(payload.guestCount) || 50,
    selectedAddons: Array.isArray(payload.selectedAddons) ? payload.selectedAddons : [],
    specialRequests: payload.specialRequests || '',
    estimatedTotal: Number(payload.estimatedTotal) || 0,
    depositAmount: Number(payload.depositAmount) || 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
    notificationRead: false
  };

  const newNotification: NotificationItem = {
    id: notifId,
    bookingId,
    referenceNumber: refNum,
    type: 'NEW_BOOKING',
    title: `🚨 NEW BOOKING ALERT!`,
    message: `New booking submitted by ${newBooking.customerName} for ${newBooking.hallName} on ${newBooking.eventDate}. Total: RM ${newBooking.estimatedTotal.toLocaleString()}`,
    customerName: newBooking.customerName,
    hallName: newBooking.hallName,
    eventDate: newBooking.eventDate,
    estimatedTotal: newBooking.estimatedTotal,
    timestamp: new Date().toISOString(),
    read: false,
    emailSentTo: 'wandaniel554@gmail.com (Hall Owner)'
  };

  // 1. ALWAYS SAVE TO FIRESTORE DIRECTLY FIRST so it's instantly durable
  try {
    await setDoc(doc(db, 'bookings', newBooking.id), newBooking);
    await setDoc(doc(db, 'notifications', newNotification.id), newNotification);
    console.log('[Direct Firestore] Booking and notification successfully persisted!');
  } catch (fsErr) {
    console.error('[Direct Firestore] Error persisting booking:', fsErr);
  }

  // 2. ALWAYS SAVE TO LOCAL STORAGE as an offline backup
  const existingBookings = loadFromLocalStorage<BookingRequest[]>(LOCAL_STORAGE_BOOKINGS_KEY, []);
  saveToLocalStorage(LOCAL_STORAGE_BOOKINGS_KEY, [newBooking, ...existingBookings]);

  const existingNotifs = loadFromLocalStorage<NotificationItem[]>(LOCAL_STORAGE_NOTIFS_KEY, []);
  saveToLocalStorage(LOCAL_STORAGE_NOTIFS_KEY, [newNotification, ...existingNotifs]);

  // 3. TRY EXPRESS API (if backend server is active)
  try {
    const apiRes = await safeFetchJson('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (apiRes.ok && apiRes.data?.success && apiRes.data?.booking) {
      return {
        booking: apiRes.data.booking,
        notification: apiRes.data.notification || newNotification
      };
    }
  } catch (apiErr) {
    console.warn('[API] /api/bookings failed, using Firestore/LocalStorage result:', apiErr);
  }

  return { booking: newBooking, notification: newNotification };
}

export async function updateBookingStatusInStore(bookingId: string, status: BookingStatus): Promise<boolean> {
  // Update Firestore
  try {
    await setDoc(doc(db, 'bookings', bookingId), { status }, { merge: true });
  } catch (e) {
    console.error('[Direct Firestore] Error updating booking status:', e);
  }

  // Update localStorage
  const existing = loadFromLocalStorage<BookingRequest[]>(LOCAL_STORAGE_BOOKINGS_KEY, []);
  const updated = existing.map(b => b.id === bookingId ? { ...b, status } : b);
  saveToLocalStorage(LOCAL_STORAGE_BOOKINGS_KEY, updated);

  // Call API
  const res = await safeFetchJson(`/api/bookings/${bookingId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });

  return res.ok;
}

export async function recordBookingPaymentInStore(bookingId: string, paymentData: any): Promise<boolean> {
  // Update Firestore
  try {
    await setDoc(doc(db, 'bookings', bookingId), paymentData, { merge: true });
  } catch (e) {
    console.error('[Direct Firestore] Error recording payment:', e);
  }

  // Update localStorage
  const existing = loadFromLocalStorage<BookingRequest[]>(LOCAL_STORAGE_BOOKINGS_KEY, []);
  const updated = existing.map(b => b.id === bookingId ? { ...b, ...paymentData } : b);
  saveToLocalStorage(LOCAL_STORAGE_BOOKINGS_KEY, updated);

  // Call API
  const res = await safeFetchJson(`/api/bookings/${bookingId}/payment`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData)
  });

  return res.ok;
}

export async function deleteBookingFromStore(bookingId: string): Promise<boolean> {
  // Delete from Firestore
  try {
    await deleteDoc(doc(db, 'bookings', bookingId));
  } catch (e) {
    console.error('[Direct Firestore] Error deleting booking:', e);
  }

  // Update localStorage
  const existing = loadFromLocalStorage<BookingRequest[]>(LOCAL_STORAGE_BOOKINGS_KEY, []);
  const updated = existing.filter(b => b.id !== bookingId);
  saveToLocalStorage(LOCAL_STORAGE_BOOKINGS_KEY, updated);

  // Call API
  const res = await safeFetchJson(`/api/bookings/${bookingId}`, {
    method: 'DELETE'
  });

  return res.ok;
}

export async function markNotificationsReadInStore(): Promise<boolean> {
  // Call API
  safeFetchJson('/api/notifications/mark-read', { method: 'POST' }).catch(() => {});
  return true;
}
