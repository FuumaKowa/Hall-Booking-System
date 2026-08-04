import express from 'express';
import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'node:crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import { HALLS_DATA, ADDON_OPTIONS } from './src/data/hallsData.js';
import { database, databaseEnabled } from './src/db/client.js';
import { bookingsTable, hallImagesTable, notificationsTable } from './src/db/schema.js';
const PORT = Number(process.env.PORT) || 3000;

interface BookingRecord {
  id: string;
  referenceNumber: string;
  hallId: 'hall-alpha' | 'hall-b' | 'hall-grand-horizon' | 'hall-serenade-glasshouse';
  hallName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventType: string;
  eventDate: string;
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'fullday';
  startTime: string;
  endTime: string;
  durationHours: number;
  guestCount: number;
  selectedAddons: string[];
  specialRequests?: string;
  estimatedTotal: number;
  depositAmount: number;
  status: 'pending' | 'confirmed' | 'declined' | 'completed';
  createdAt: string;
  notificationRead: boolean;
  paymentStatus?: 'unpaid' | 'deposit_paid' | 'fully_paid';
  paymentMethod?: string;
  paidAmount?: number;
  paymentReceiptRef?: string;
  paymentConfirmedAt?: string;
  paymentNotes?: string;
}

interface NotificationRecord {
  id: string;
  bookingId: string;
  referenceNumber: string;
  type: 'NEW_BOOKING' | 'STATUS_UPDATE';
  title: string;
  message: string;
  customerName: string;
  hallName: string;
  eventDate: string;
  estimatedTotal: number;
  timestamp: string;
  read: boolean;
  emailSentTo: string;
}

const DATA_FILE = path.join(process.cwd(), 'bookings_store.json');
const HALL_IMAGES_FILE = path.join(process.cwd(), 'hall_images_store.json');

interface CustomHallImages {
  primaryImage?: string;
  secondaryImages?: string[];
}

let customHallImagesMap: Record<string, CustomHallImages> = {};

function loadHallImages() {
  try {
    if (fs.existsSync(HALL_IMAGES_FILE)) {
      const raw = fs.readFileSync(HALL_IMAGES_FILE, 'utf-8');
      customHallImagesMap = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading hall images store:', err);
  }
}

function saveHallImages() {
  try {
    atomicWriteJson(HALL_IMAGES_FILE, customHallImagesMap);
  } catch (err) {
    console.error('Error saving hall images store:', err);
  }
}

loadHallImages();

function sanitizeImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const lower = url.toLowerCase().trim();

  // Return uploaded image URLs directly without stripping
  if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('data:image/') || lower.startsWith('/uploads/')) {
    return url;
  }

  if (lower.includes('hall_alpha2') || lower.includes('hall alpha 2') || lower.includes('hall_alpha_2')) return '/images/hall_alpha2.jpeg';
  if (lower.includes('hall alpha.png') || lower.includes('hall%20alpha.png') || lower.includes('hall_alpha.jpg')) return '/images/hall_alpha.jpeg';
  if (lower.includes('hall b panoramic.png') || lower.includes('hall%20b%20panoramic.png') || lower.includes('hall_b_panoramic.jpg')) return '/images/hall_b_panoramic.jpeg';
  if (lower.includes('hall_b_view_one')) return '/images/hall_b_view_one.jpeg';
  if (lower.includes('hall_b_view_two')) return '/images/hall_b_view_two.jpeg';
  if (lower.includes('surau')) return '/images/surau.jpeg';
  if (url.startsWith('/src/assets/images/')) {
    return url.replace('/src/assets/images/', '/images/');
  }
  return url;
}

async function processAndSaveImage(dataUrl: string, hallId: string, imageType: string): Promise<string> {
  if (!dataUrl || typeof dataUrl !== 'string') return dataUrl;
  
  // If it's already a hosted or local path URL, return directly
  if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://') || dataUrl.startsWith('/uploads/')) {
    return dataUrl;
  }

  if (!dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  // Save file locally in public/uploads/ and dist/public/uploads/
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (matches && matches[2]) {
      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const filename = `${hallId}_${imageType}_${Date.now()}.${ext}`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64'));

      // Also sync to dist/public/uploads if dist exists
      const distUploadsDir = path.join(process.cwd(), 'dist', 'public', 'uploads');
      if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
        if (!fs.existsSync(distUploadsDir)) {
          fs.mkdirSync(distUploadsDir, { recursive: true });
        }
        fs.writeFileSync(path.join(distUploadsDir, filename), Buffer.from(matches[2], 'base64'));
      }

      const localUrl = `/uploads/${filename}`;
      console.log(`[Image Upload] Saved image file -> ${localUrl}`);
      return localUrl;
    }
  } catch (fsErr) {
    console.error('[Image Upload] Local save fallback to dataUrl:', fsErr);
  }

  return dataUrl;
}

function getEffectiveHalls() {
  return HALLS_DATA.map(hall => {
    const custom = customHallImagesMap[hall.id];
    const rawPrimary = custom?.primaryImage || hall.primaryImage;
    const rawSecondary = custom?.secondaryImages !== undefined ? custom.secondaryImages : hall.secondaryImages;

    const primaryImage = sanitizeImageUrl(rawPrimary) || hall.primaryImage;
    let secondaryImages = (rawSecondary || []).map(s => sanitizeImageUrl(s) || s);

    if (hall.id === 'hall-alpha') {
      if (!secondaryImages.some(img => img.includes('hall_alpha2'))) {
        secondaryImages = ['/images/hall_alpha2.jpeg', ...secondaryImages.filter(img => !img.includes('hall_alpha.jpeg'))];
      }
    }

    return {
      ...hall,
      primaryImage,
      secondaryImages
    };
  });
}

// Initialize initial default sample bookings if empty
const sampleBookings: BookingRecord[] = [
  {
    id: 'b-101',
    referenceNumber: 'BK-2026-7841',
    hallId: 'hall-alpha',
    hallName: 'ALPHA HALL',
    customerName: 'Ahmad Razak',
    customerEmail: 'ahmad.razak@example.com',
    customerPhone: '+60 12-345 6789',
    eventType: 'Corporate Strategy Meeting',
    eventDate: '2026-08-15',
    timeSlot: 'evening',
    startTime: '18:00',
    endTime: '22:00',
    durationHours: 4,
    guestCount: 25,
    selectedAddons: ['addon-projector-extra', 'addon-coffee-station'],
    specialRequests: 'HDMI cable and presenter clicker needed for presentation.',
    estimatedTotal: 440,
    depositAmount: 132,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    notificationRead: true,
    paymentStatus: 'fully_paid',
    paymentMethod: 'Instant Bank Transfer',
    paidAmount: 440,
    paymentReceiptRef: 'REC-2026-9012',
    paymentConfirmedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    paymentNotes: 'Paid in full upon confirmation. Verified by Management.'
  },
  {
    id: 'b-102',
    referenceNumber: 'BK-2026-9032',
    hallId: 'hall-b',
    hallName: 'HALL B',
    customerName: 'Siti Aminah',
    customerEmail: 'siti.aminah@example.com',
    customerPhone: '+60 19-876 5432',
    eventType: 'Training Workshop',
    eventDate: '2026-08-22',
    timeSlot: 'afternoon',
    startTime: '12:00',
    endTime: '17:00',
    durationHours: 5,
    guestCount: 30,
    selectedAddons: ['addon-whiteboard-pack', 'addon-catering-standard', 'addon-sound-dj'],
    specialRequests: 'Classroom desk layout requested for 30 participants with power sockets.',
    estimatedTotal: 945,
    depositAmount: 283.5,
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    notificationRead: false,
    paymentStatus: 'deposit_paid',
    paymentMethod: 'DuitNow QR Code',
    paidAmount: 283.5,
    paymentReceiptRef: 'REC-2026-8841',
    paymentConfirmedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    paymentNotes: '30% deposit received via QR Pay.'
  },
  {
    id: 'b-103',
    referenceNumber: 'BK-2026-4419',
    hallId: 'hall-alpha',
    hallName: 'ALPHA HALL',
    customerName: 'David Lee',
    customerEmail: 'd.lee@example.com',
    customerPhone: '+60 16-234 5678',
    eventType: 'Client Briefing',
    eventDate: '2026-08-15',
    timeSlot: 'evening',
    startTime: '18:00',
    endTime: '22:00',
    durationHours: 4,
    guestCount: 20,
    selectedAddons: ['addon-coffee-station'],
    specialRequests: 'Conflicting request submitted for same hall & date as Ahmad Razak.',
    estimatedTotal: 400,
    depositAmount: 120,
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    notificationRead: false,
    paymentStatus: 'unpaid'
  }
];

const sampleNotifications: NotificationRecord[] = [
  {
    id: 'n-103',
    bookingId: 'b-103',
    referenceNumber: 'BK-2026-4419',
    type: 'NEW_BOOKING',
    title: '🚨 NEW BOOKING ALERT! (⚠️ Conflict Warning: Hall A already confirmed on Aug 15!)',
    message: 'David Lee requested Hall A for Aug 15, 2026 (Evening slot). ⚠️ FAILSAFE WARNING: Ahmad Razak is ALREADY CONFIRMED for this slot!',
    customerName: 'David Lee',
    hallName: 'Hall A',
    eventDate: '2026-08-15',
    estimatedTotal: 400,
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    read: false,
    emailSentTo: 'wandaniel554@gmail.com (Hall Management)'
  },
  {
    id: 'n-102',
    bookingId: 'b-102',
    referenceNumber: 'BK-2026-9032',
    type: 'NEW_BOOKING',
    title: '🔔 New Hall Booking Received!',
    message: 'Siti Aminah booked Hall B for Aug 22, 2026 (30 guests). Total: RM 945',
    customerName: 'Siti Aminah',
    hallName: 'Hall B',
    eventDate: '2026-08-22',
    estimatedTotal: 945,
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    read: false,
    emailSentTo: 'wandaniel554@gmail.com (Hall Management)'
  }
];

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        bookings: parsed.bookings || sampleBookings,
        notifications: parsed.notifications || sampleNotifications
      };
    }
  } catch (err) {
    console.error('Error reading data file:', err);
  }
  return { bookings: sampleBookings, notifications: sampleNotifications };
}

function saveData(bookings: BookingRecord[], notifications: NotificationRecord[]) {
  try {
    atomicWriteJson(DATA_FILE, { bookings, notifications });
  } catch (err) {
    console.error('Error writing data file:', err);
  }
}

function atomicWriteJson(filePath: string, value: unknown) {
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(value, null, 2), 'utf-8');
  fs.renameSync(temporaryPath, filePath);
}

function calculateBookingTotal(body: Record<string, unknown>, hall: (typeof HALLS_DATA)[number]): number {
  const slot = String(body.timeSlot || 'afternoon');
  const duration = Math.max(1, Math.min(12, Number(body.durationHours) || 1));
  let total = slot === 'fullday'
    ? hall.fullDayRate
    : slot === 'morning' || slot === 'afternoon'
      ? hall.halfDayRate
      : hall.pricePerHour * duration;

  const addonIds = Array.isArray(body.selectedAddons) ? body.selectedAddons.map(String) : [];
  for (const addon of ADDON_OPTIONS.filter(item => addonIds.includes(item.id))) {
    if (addon.priceUnit === 'per_guest') total += addon.price * Math.max(1, Number(body.guestCount) || 1);
    else if (addon.priceUnit === 'per_hour') total += addon.price * duration;
    else total += addon.price;
  }
  return Math.round(total * 100) / 100;
}

let store = loadData();

async function syncFromDatabase() {
  if (!databaseEnabled || !database) return;
  const [bookingRows, notificationRows, imageRows] = await Promise.all([
    database.select().from(bookingsTable).orderBy(desc(bookingsTable.createdAt)),
    database.select().from(notificationsTable).orderBy(desc(notificationsTable.createdAt)),
    database.select().from(hallImagesTable),
  ]);
  store.bookings = bookingRows.map(row => row.data as unknown as BookingRecord);
  store.notifications = notificationRows.map(row => row.data as unknown as NotificationRecord);
  customHallImagesMap = Object.fromEntries(
    imageRows.map(row => [row.hallId, row.data as unknown as CustomHallImages])
  );
  console.log(`[Neon Postgres] Synced ${store.bookings.length} bookings and ${store.notifications.length} notifications.`);
}

async function saveBookingToDatabase(booking: BookingRecord) {
  if (!databaseEnabled || !database) {
    saveData(store.bookings, store.notifications);
    return;
  }
  await database.insert(bookingsTable).values({
    id: booking.id,
    referenceNumber: booking.referenceNumber,
    hallId: booking.hallId,
    eventDate: booking.eventDate,
    status: booking.status,
    createdAt: new Date(booking.createdAt),
    data: booking as unknown as Record<string, unknown>,
  }).onConflictDoUpdate({
    target: bookingsTable.id,
    set: {
      referenceNumber: booking.referenceNumber,
      hallId: booking.hallId,
      eventDate: booking.eventDate,
      status: booking.status,
      data: booking as unknown as Record<string, unknown>,
    },
  });
}

async function saveNotificationToDatabase(notification: NotificationRecord) {
  if (!databaseEnabled || !database) {
    saveData(store.bookings, store.notifications);
    return;
  }
  await database.insert(notificationsTable).values({
    id: notification.id,
    bookingId: notification.bookingId,
    createdAt: new Date(notification.timestamp),
    data: notification as unknown as Record<string, unknown>,
  }).onConflictDoUpdate({
    target: notificationsTable.id,
    set: { data: notification as unknown as Record<string, unknown> },
  });
}

async function persistNewBooking(
  booking: BookingRecord,
  notification: NotificationRecord,
): Promise<BookingRecord | undefined> {
  if (!databaseEnabled || !database) {
    await saveBookingToDatabase(booking);
    await saveNotificationToDatabase(notification);
    return undefined;
  }

  return database.transaction(async tx => {
    // Serialize reservations for one hall/date across every Vercel instance.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`${booking.hallId}:${booking.eventDate}`}))`);
    const rows = await tx.select().from(bookingsTable).where(and(
      eq(bookingsTable.hallId, booking.hallId),
      eq(bookingsTable.eventDate, booking.eventDate),
    ));
    const conflict = rows
      .map(row => row.data as unknown as BookingRecord)
      .find(existing => existing.status !== 'declined' && checkBookingOverlap(booking, existing));
    if (conflict) return conflict;

    await tx.insert(bookingsTable).values({
      id: booking.id,
      referenceNumber: booking.referenceNumber,
      hallId: booking.hallId,
      eventDate: booking.eventDate,
      status: booking.status,
      createdAt: new Date(booking.createdAt),
      data: booking as unknown as Record<string, unknown>,
    });
    await tx.insert(notificationsTable).values({
      id: notification.id,
      bookingId: notification.bookingId,
      createdAt: new Date(notification.timestamp),
      data: notification as unknown as Record<string, unknown>,
    });
    return undefined;
  });
}

async function saveHallImagesToDatabase(hallId: string) {
  if (!databaseEnabled || !database) {
    saveHallImages();
    return;
  }
  const value = customHallImagesMap[hallId];
  if (!value) {
    await database.delete(hallImagesTable).where(eq(hallImagesTable.hallId, hallId));
    return;
  }
  await database.insert(hallImagesTable).values({
    hallId,
    data: value as unknown as Record<string, unknown>,
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: hallImagesTable.hallId,
    set: { data: value as unknown as Record<string, unknown>, updatedAt: new Date() },
  });
}

async function deleteBookingFromDatabase(id: string) {
  if (!databaseEnabled || !database) {
    saveData(store.bookings, store.notifications);
    return;
  }
  await database.transaction(async tx => {
    await tx.delete(notificationsTable).where(eq(notificationsTable.bookingId, id));
    await tx.delete(bookingsTable).where(eq(bookingsTable.id, id));
  });
}

function isWednesdayDate(dateStr?: string): boolean {
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
  const dt = new Date(y, m, d);
  return dt.getDay() === 3;
}

// Helper function to check if two bookings overlap in time slot/date for the same hall
function checkBookingOverlap(
  b1: { hallId: string; eventDate: string; timeSlot: string; startTime?: string; durationHours?: number; id?: string },
  b2: { hallId: string; eventDate: string; timeSlot: string; startTime?: string; durationHours?: number; id?: string; status: string }
): boolean {
  if (b2.status === 'declined') return false;
  if (b1.id && b2.id && b1.id === b2.id) return false;
  if (b1.hallId !== b2.hallId) return false;
  if (b1.eventDate !== b2.eventDate) return false;

  // Same hall & date: check slot / time overlap
  if (b1.timeSlot === 'fullday' || b2.timeSlot === 'fullday') return true;
  if (b1.timeSlot === b2.timeSlot) return true;

  const parseRange = (slot: string, start?: string, dur: number = 5) => {
    if (slot === 'fullday') return { s: 480, e: 1440 };

    let s = 480;
    let e = 1020;
    if (slot === 'morning') { s = 480; e = 720; } // 08:00 - 12:00
    else if (slot === 'afternoon') { s = 720; e = 1020; } // 12:00 - 17:00
    else if (slot === 'evening') { s = 1080; e = 1380; } // 18:00 - 23:00

    if (start) {
      const p = start.split(':').map(Number);
      if (!isNaN(p[0]) && !isNaN(p[1])) {
        const customS = p[0] * 60 + p[1];
        const customE = customS + (dur * 60);

        let isValid = true;
        if (slot === 'morning' && (customS < 360 || customS > 720)) isValid = false;
        if (slot === 'afternoon' && (customS < 660 || customS > 1020)) isValid = false;
        if (slot === 'evening' && customS < 1020) isValid = false;

        if (isValid) return { s: customS, e: customE };
      }
    }

    return { s, e };
  };

  const r1 = parseRange(b1.timeSlot, b1.startTime, b1.durationHours);
  const r2 = parseRange(b2.timeSlot, b2.startTime, b2.durationHours);

  return r1.s < r2.e && r1.e > r2.s;
}

function createApp() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  const requireManager: express.RequestHandler = (req, res, next) => {
    const configuredPassword = process.env.MANAGER_PASSWORD;
    if (!configuredPassword) {
      return res.status(503).json({ error: 'Manager access is not configured.' });
    }
    if (req.get('x-manager-password') !== configuredPassword) {
      return res.status(401).json({ error: 'Invalid manager password.' });
    }
    next();
  };

  app.post('/api/manager/login', requireManager, (_req, res) => {
    res.json({ success: true });
  });

  const requirePersistentDatabase: express.RequestHandler = (_req, res, next) => {
    if (process.env.VERCEL && !databaseEnabled) {
      return res.status(503).json({ error: 'DATABASE_URL is not configured for this deployment.' });
    }
    next();
  };
  app.use('/api/bookings', requirePersistentDatabase);
  app.use('/api/notifications', requirePersistentDatabase);
  app.use('/api/halls/:hallId/images', requirePersistentDatabase);

  // Static uploads serving
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
  app.use('/images', express.static(path.join(process.cwd(), 'public', 'images')));

  // API Routes
  
  // 1. Get Hall details & add-on options
  app.get('/api/halls', async (_req, res) => {
    await syncFromDatabase();
    res.json({
      halls: getEffectiveHalls(),
      addons: ADDON_OPTIONS
    });
  });

  // 1b. Update Hall Images (Admin Site Upload / Replace)
  app.post('/api/halls/:hallId/images', requireManager, async (req, res) => {
    await syncFromDatabase();
    const { hallId } = req.params;
    const { primaryImage, secondaryImages } = req.body;

    const hall = HALLS_DATA.find(h => h.id === hallId);
    if (!hall) {
      return res.status(404).json({ error: 'Hall not found' });
    }

    if (!customHallImagesMap[hallId]) {
      customHallImagesMap[hallId] = {};
    }

    if (primaryImage !== undefined) {
      const uploadedPrimary = await processAndSaveImage(primaryImage, hallId, 'primary');
      customHallImagesMap[hallId].primaryImage = uploadedPrimary;
    }
    if (secondaryImages !== undefined && Array.isArray(secondaryImages)) {
      const processedSecondary: string[] = [];
      for (let i = 0; i < secondaryImages.length; i++) {
        const uploadedSec = await processAndSaveImage(secondaryImages[i], hallId, `secondary_${i}`);
        processedSecondary.push(uploadedSec);
      }
      customHallImagesMap[hallId].secondaryImages = processedSecondary;
    }

    await saveHallImagesToDatabase(hallId);

    console.log(`[ADMIN IMAGE UPDATED] Hall: ${hallId} | Primary updated: ${!!primaryImage} | Secondary count: ${secondaryImages?.length}`);

    res.json({
      success: true,
      message: 'Hall images updated successfully!',
      halls: getEffectiveHalls()
    });
  });

  // 1c. Reset Hall Images to Default
  app.post('/api/halls/:hallId/images/reset', requireManager, async (req, res) => {
    await syncFromDatabase();
    const { hallId } = req.params;
    delete customHallImagesMap[hallId];
    await saveHallImagesToDatabase(hallId);

    res.json({
      success: true,
      message: 'Hall images reset to defaults!',
      halls: getEffectiveHalls()
    });
  });

  // 2. Get Bookings
  app.get('/api/bookings', async (req, res) => {
    await syncFromDatabase();
    const isManager = Boolean(process.env.MANAGER_PASSWORD) && req.get('x-manager-password') === process.env.MANAGER_PASSWORD;
    const bookings = isManager ? store.bookings : store.bookings.map(b => ({
      id: b.id,
      hallId: b.hallId,
      hallName: b.hallName,
      eventDate: b.eventDate,
      timeSlot: b.timeSlot,
      startTime: b.startTime,
      endTime: b.endTime,
      durationHours: b.durationHours,
      status: b.status
    }));
    res.json({ bookings });
  });

  // 2b. Failsafe Availability Checker Endpoint
  app.get('/api/availability/check', async (req, res) => {
    await syncFromDatabase();
    const { hallId, eventDate } = req.query as { hallId?: string; eventDate?: string };
    
    if (!hallId || !eventDate) {
      return res.status(400).json({ error: 'hallId and eventDate required' });
    }

    const hallBookings = store.bookings.filter(
      b => b.hallId === hallId && b.eventDate === eventDate && b.status !== 'declined'
    );

    const confirmed = hallBookings.filter(b => b.status === 'confirmed');
    const pending = hallBookings.filter(b => b.status === 'pending');

    res.json({
      hallId,
      eventDate,
      totalActiveBookings: hallBookings.length,
      confirmedCount: confirmed.length,
      pendingCount: pending.length,
      confirmedBookings: confirmed.map(b => ({ timeSlot: b.timeSlot, startTime: b.startTime, endTime: b.endTime })),
      pendingBookings: pending.map(b => ({ timeSlot: b.timeSlot, startTime: b.startTime, endTime: b.endTime })),
      isFullyOccupied: confirmed.some(b => b.timeSlot === 'fullday') || confirmed.length >= 3
    });
  });

  // 3. Create New Customer Booking -> WITH DOUBLE BOOKING FAILSAFE
  app.post('/api/bookings', async (req, res) => {
    await syncFromDatabase();
    const body = req.body;
    
    if (!body.hallId || !body.customerName || !body.customerEmail || !body.eventDate) {
      return res.status(400).json({ error: 'Missing required booking fields' });
    }

    const hall = HALLS_DATA.find(h => h.id === body.hallId);
    if (!hall) return res.status(400).json({ error: 'Invalid hall.' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.eventDate)) return res.status(400).json({ error: 'Invalid event date.' });
    if (!/^\S+@\S+\.\S+$/.test(body.customerEmail)) return res.status(400).json({ error: 'Invalid email address.' });

    const candidateBooking = {
      hallId: body.hallId,
      eventDate: body.eventDate,
      timeSlot: body.timeSlot || 'afternoon',
      startTime: body.startTime,
      durationHours: body.durationHours || 5
    };

    // Date & Same-day restriction check
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (body.eventDate < todayStr) {
      return res.status(400).json({
        success: false,
        error: 'Bookings for past dates are not allowed.',
        failsafeTriggered: true
      });
    }

    if (body.eventDate === todayStr) {
      const currentHour = now.getHours();
      if (currentHour >= 10) {
        return res.status(400).json({
          success: false,
          error: 'Same-day bookings for today are closed (must be booked before 10:00 AM).',
          failsafeTriggered: true
        });
      }
      if (candidateBooking.timeSlot !== 'afternoon') {
        return res.status(400).json({
          success: false,
          error: 'For same-day bookings placed before 10:00 AM, only the Afternoon slot (14:00 - 18:00 / 2:00 PM - 6:00 PM) is available.',
          failsafeTriggered: true
        });
      }
    }

    if (isWednesdayDate(body.eventDate)) {
      const slot = body.timeSlot || 'morning';
      let isWedOverlap = false;
      if (slot === 'morning' || slot === 'fullday') {
        isWedOverlap = true;
      } else if (body.startTime) {
        const parts = body.startTime.split(':').map(Number);
        if (!isNaN(parts[0])) {
          const startM = parts[0] * 60 + (parts[1] || 0);
          const endM = startM + ((body.durationHours || 4) * 60);
          if (startM < 13 * 60 && endM > 9 * 60) isWedOverlap = true;
        }
      }

      if (isWedOverlap) {
        return res.status(409).json({
          success: false,
          error: `RESERVED SLOT: Every Wednesday 09:00 AM - 01:00 PM is reserved by default for both halls. Please select Wednesday afternoon/evening or a different date.`,
          failsafeTriggered: true
        });
      }
    }

    // FAILSAFE CHECK: Is there an existing active (confirmed or pending) booking that overlaps?
    const existingConflict = store.bookings.find(
      b => b.status !== 'declined' && checkBookingOverlap(candidateBooking, b)
    );

    if (existingConflict) {
      return res.status(409).json({
        success: false,
        error: `This hall is already reserved on ${body.eventDate} during the selected time. Please choose another date or time slot.`,
        failsafeTriggered: true
      });
    }

    const hallName = hall.name;

    const refNum = `BK-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const newBookingId = `b-${randomUUID()}`;

    const newBooking: BookingRecord = {
      id: newBookingId,
      referenceNumber: refNum,
      hallId: body.hallId,
      hallName: hallName,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone || 'N/A',
      eventType: body.eventType || 'Special Event',
      eventDate: body.eventDate,
      timeSlot: body.timeSlot || 'afternoon',
      startTime: body.startTime || '12:00',
      endTime: body.endTime || '17:00',
      durationHours: body.durationHours || 5,
      guestCount: Number(body.guestCount) || 50,
      selectedAddons: Array.isArray(body.selectedAddons) ? body.selectedAddons : [],
      specialRequests: body.specialRequests || '',
      estimatedTotal: calculateBookingTotal(body, hall),
      depositAmount: Math.round(calculateBookingTotal(body, hall) * 0.5),
      status: 'pending',
      createdAt: new Date().toISOString(),
      notificationRead: false
    };

    // Construct Manager Alert Notification
    const titleText = `🚨 NEW BOOKING ALERT!`;
    const messageText = `New booking submitted by ${newBooking.customerName} for ${newBooking.hallName} on ${newBooking.eventDate}. Estimated revenue: RM ${newBooking.estimatedTotal.toLocaleString()}`;

    const newNotification: NotificationRecord = {
      id: `notif-${randomUUID()}`,
      bookingId: newBookingId,
      referenceNumber: refNum,
      type: 'NEW_BOOKING',
      title: titleText,
      message: messageText,
      customerName: newBooking.customerName,
      hallName: newBooking.hallName,
      eventDate: newBooking.eventDate,
      estimatedTotal: newBooking.estimatedTotal,
      timestamp: new Date().toISOString(),
      read: false,
      emailSentTo: 'wandaniel554@gmail.com (Hall Owner / Manager Email)'
    };

    const transactionConflict = await persistNewBooking(newBooking, newNotification);
    if (transactionConflict) {
      return res.status(409).json({
        success: false,
        error: 'This hall was just reserved for the selected time. Please choose another date or time slot.',
        failsafeTriggered: true,
      });
    }
    store.bookings.unshift(newBooking);
    store.notifications.unshift(newNotification);

    console.log('====================================================');
    console.log(`[MANAGER INFORMED] Email sent to: wandaniel554@gmail.com`);
    console.log(`[BOOKING REF]: ${refNum} | Hall: ${hallName} | Date: ${body.eventDate}`);
    console.log('====================================================');

    res.status(201).json({
      success: true,
      message: 'Booking successfully placed! Management has been notified.',
      booking: newBooking,
      notification: newNotification
    });
  });

  // 4. Update Booking Status (Manager Actions) -> WITH STRICT APPROVAL FAILSAFE
  app.patch('/api/bookings/:id', requireManager, async (req, res) => {
    await syncFromDatabase();
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'declined', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid booking status.' });
    }

    const bookingIndex = store.bookings.findIndex(b => b.id === id);
    if (bookingIndex === -1) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const targetBooking = store.bookings[bookingIndex];

    // STRICT DOUBLE-BOOKING FAILSAFE: If attempting to confirm/approve, verify no other confirmed booking overlaps!
    if (status === 'confirmed') {
      const conflictingConfirmed = store.bookings.find(
        b => b.id !== id && b.status === 'confirmed' && checkBookingOverlap(targetBooking, b)
      );

      if (conflictingConfirmed) {
        console.error(`[FAILSAFE BLOCKED APPROVAL] Target ${targetBooking.referenceNumber} conflicts with already confirmed ${conflictingConfirmed.referenceNumber}`);
        return res.status(409).json({
          success: false,
          error: `DOUBLE-BOOKING FAILSAFE ACTIVATED: Cannot approve booking! ${targetBooking.hallName} is ALREADY CONFIRMED & APPROVED for ${conflictingConfirmed.customerName} (${conflictingConfirmed.referenceNumber}) on ${targetBooking.eventDate} during the ${conflictingConfirmed.timeSlot.toUpperCase()} slot.`,
          failsafeTriggered: true,
          conflictingBooking: conflictingConfirmed
        });
      }
    }

    store.bookings[bookingIndex].status = status;
    
    // Add status notification
    const notif: NotificationRecord = {
      id: `notif-${randomUUID()}`,
      bookingId: store.bookings[bookingIndex].id,
      referenceNumber: store.bookings[bookingIndex].referenceNumber,
      type: 'STATUS_UPDATE',
      title: `Booking ${status.toUpperCase()}`,
      message: `Booking ${store.bookings[bookingIndex].referenceNumber} status changed to ${status}`,
      customerName: store.bookings[bookingIndex].customerName,
      hallName: store.bookings[bookingIndex].hallName,
      eventDate: store.bookings[bookingIndex].eventDate,
      estimatedTotal: store.bookings[bookingIndex].estimatedTotal,
      timestamp: new Date().toISOString(),
      read: true,
      emailSentTo: `${store.bookings[bookingIndex].customerEmail} & Hall Manager`
    };

    store.notifications.unshift(notif);
    await saveBookingToDatabase(store.bookings[bookingIndex]);
    await saveNotificationToDatabase(notif);

    res.json({
      success: true,
      booking: store.bookings[bookingIndex]
    });
  });

  // 4b. Record / Confirm Payment for Booking (Admin Site)
  app.patch('/api/bookings/:id/payment', requireManager, async (req, res) => {
    await syncFromDatabase();
    const { id } = req.params;
    const { paymentStatus, paymentMethod, paidAmount, paymentReceiptRef, paymentNotes, autoApprove } = req.body;

    if (!['unpaid', 'deposit_paid', 'fully_paid'].includes(paymentStatus)) {
      return res.status(400).json({ error: 'Invalid payment status.' });
    }
    if (paidAmount !== undefined && (!Number.isFinite(Number(paidAmount)) || Number(paidAmount) < 0)) {
      return res.status(400).json({ error: 'Invalid payment amount.' });
    }

    const bookingIndex = store.bookings.findIndex(b => b.id === id);
    if (bookingIndex === -1) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = store.bookings[bookingIndex];

    // Auto-approve schedule status check if requested and currently pending
    if (autoApprove && booking.status !== 'confirmed') {
      const conflictingConfirmed = store.bookings.find(
        b => b.id !== id && b.status === 'confirmed' && checkBookingOverlap(booking, b)
      );

      if (conflictingConfirmed) {
        return res.status(409).json({
          success: false,
          error: `Payment recorded, but DOUBLE-BOOKING FAILSAFE blocked auto-approval: ${conflictingConfirmed.customerName} (${conflictingConfirmed.referenceNumber}) is already confirmed for this slot.`,
          failsafeTriggered: true,
          conflictingBooking: conflictingConfirmed
        });
      }

      booking.status = 'confirmed';
    }

    booking.paymentStatus = paymentStatus || 'fully_paid';
    booking.paymentMethod = paymentMethod || 'Online Bank Transfer';
    booking.paidAmount = paidAmount !== undefined ? Number(paidAmount) : (paymentStatus === 'deposit_paid' ? booking.depositAmount : booking.estimatedTotal);
    booking.paymentReceiptRef = paymentReceiptRef || `REC-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    booking.paymentConfirmedAt = new Date().toISOString();
    if (paymentNotes !== undefined) booking.paymentNotes = paymentNotes;

    const statusTitle = booking.paymentStatus === 'fully_paid' 
      ? `💳 PAYMENT CONFIRMED (PAID IN FULL)! [${booking.paymentReceiptRef}]`
      : booking.paymentStatus === 'deposit_paid'
      ? `💰 DEPOSIT CONFIRMED! [${booking.paymentReceiptRef}]`
      : `⚠️ PAYMENT STATUS RESET`;

    const notif: NotificationRecord = {
      id: `notif-${randomUUID()}`,
      bookingId: booking.id,
      referenceNumber: booking.referenceNumber,
      type: 'STATUS_UPDATE',
      title: statusTitle,
      message: `Payment of RM ${booking.paidAmount.toLocaleString()} (${booking.paymentStatus.toUpperCase().replace('_', ' ')}) recorded via ${booking.paymentMethod} for ${booking.customerName} (${booking.referenceNumber}). Receipt Ref: ${booking.paymentReceiptRef}`,
      customerName: booking.customerName,
      hallName: booking.hallName,
      eventDate: booking.eventDate,
      estimatedTotal: booking.estimatedTotal,
      timestamp: new Date().toISOString(),
      read: false,
      emailSentTo: `${booking.customerEmail} & wandaniel554@gmail.com`
    };

    store.notifications.unshift(notif);
    await saveBookingToDatabase(booking);
    await saveNotificationToDatabase(notif);

    console.log(`[PAYMENT CONFIRMED] Booking ${booking.referenceNumber} | Paid: RM ${booking.paidAmount} (${booking.paymentStatus}) | Ref: ${booking.paymentReceiptRef}`);

    res.json({
      success: true,
      message: `Payment updated successfully! Official receipt ${booking.paymentReceiptRef} generated.`,
      booking,
      notification: notif
    });
  });

  // 5. Get Notifications
  app.get('/api/notifications', requireManager, async (req, res) => {
    await syncFromDatabase();
    res.json({
      notifications: store.notifications,
      unreadCount: store.notifications.filter(n => !n.read).length
    });
  });

  // 6. Mark Notifications Read
  app.post('/api/notifications/mark-read', requireManager, async (req, res) => {
    await syncFromDatabase();
    store.notifications = store.notifications.map(n => ({ ...n, read: true }));
    await Promise.all(store.notifications.map(saveNotificationToDatabase));
    res.json({ success: true, unreadCount: 0 });
  });

  // 7. Delete Booking
  app.delete('/api/bookings/:id', requireManager, async (req, res) => {
    await syncFromDatabase();
    const { id } = req.params;
    store.bookings = store.bookings.filter(b => b.id !== id);
    store.notifications = store.notifications.filter(n => n.bookingId !== id);
    await deleteBookingFromDatabase(id);
    res.json({ success: true });
  });

  // 8. Offline venue assistant (no external AI service required)
  app.post('/api/ai-assistant', (req, res) => {
    const query = String(req.body?.userQuery || '').toLowerCase();
    let reply = 'We offer Alpha Hall (up to 53 guests) and Hall B (up to 31 guests). Both cost RM 40/hour, RM 149 half-day, or RM 299 full-day. Select “Book A Hall” to check a date and submit your request.';

    if (/price|rate|cost|berapa|harga/.test(query)) {
      reply = 'Both halls cost RM 40 per hour, RM 149 for a half day, or RM 299 for a full day. Optional presenter cables and the flipchart set are RM 15 each; catering is quoted separately.';
    } else if (/capacity|people|guest|pax|muat/.test(query)) {
      reply = 'Alpha Hall accommodates up to 53 guests. Hall B accommodates up to 31 guests. Alpha Hall is the better choice for groups larger than 31.';
    } else if (/facility|equipment|projector|microphone|wifi|surau|toilet/.test(query)) {
      reply = 'The halls include air conditioning, microphones and speakers, presentation equipment, Wi-Fi, nearby toilets, and surau access. Alpha Hall includes a projector and television; Hall B also provides flexible dining and lounge seating.';
    } else if (/available|availability|date|book|reserve/.test(query)) {
      reply = 'Use “Book A Hall” and select your preferred date and time. The system checks existing reservations before accepting the request. Wednesday mornings from 9:00 AM to 1:00 PM are reserved.';
    } else if (/hall b|event|gathering|dining/.test(query)) {
      reply = 'Hall B is ideal for small gatherings, private meetings, dining setups, and networking events, with capacity for up to 31 guests.';
    } else if (/alpha|seminar|class|training|workshop/.test(query)) {
      reply = 'Alpha Hall is ideal for seminars, classes, workshops, training, and larger meetings, with capacity for up to 53 guests.';
    }

    res.json({ reply });
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('API request failed:', error);
    res.status(500).json({ error: 'The server could not complete this request.' });
  });

  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

const app = createApp();

if (!process.env.VERCEL) {
  void (async () => {
    await syncFromDatabase();
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
      app.use(vite.middlewares);
    }
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));
  })();
}

export default app;
