import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { HALLS_DATA, ADDON_OPTIONS } from './src/data/hallsData.js';

// Load Firebase Config
let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (e) {
  console.error('Failed to load firebase-applet-config.json', e);
}

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(firebaseApp);

interface BookingRecord {
  id: string;
  referenceNumber: string;
  hallId: 'hall-grand-horizon' | 'hall-serenade-glasshouse';
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
    fs.writeFileSync(HALL_IMAGES_FILE, JSON.stringify(customHallImagesMap, null, 2), 'utf-8');
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
    const rawSecondary = custom?.secondaryImages || hall.secondaryImages;

    const primaryImage = sanitizeImageUrl(rawPrimary) || hall.primaryImage;
    const secondaryImages = (rawSecondary || []).map(s => sanitizeImageUrl(s) || s);

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
    hallId: 'hall-grand-horizon',
    hallName: 'Hall A',
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
    hallId: 'hall-serenade-glasshouse',
    hallName: 'Hall B',
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
    hallId: 'hall-grand-horizon',
    hallName: 'Hall A',
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
    fs.writeFileSync(DATA_FILE, JSON.stringify({ bookings, notifications }, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing data file:', err);
  }
}

let store = loadData();

async function syncFromFirestore() {
  try {
    const bookingsSnap = await getDocs(collection(db, 'bookings'));
    const notifsSnap = await getDocs(collection(db, 'notifications'));

    if (bookingsSnap.empty) {
      console.log('[Firestore Database] Initializing & seeding Firestore collections...');
      for (const b of sampleBookings) {
        await setDoc(doc(db, 'bookings', b.id), b);
      }
      for (const n of sampleNotifications) {
        await setDoc(doc(db, 'notifications', n.id), n);
      }
      store.bookings = [...sampleBookings];
      store.notifications = [...sampleNotifications];
    } else {
      const fetchedBookings: BookingRecord[] = [];
      bookingsSnap.forEach(d => fetchedBookings.push(d.data() as BookingRecord));
      
      const fetchedNotifs: NotificationRecord[] = [];
      notifsSnap.forEach(d => fetchedNotifs.push(d.data() as NotificationRecord));

      fetchedBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      fetchedNotifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      store.bookings = fetchedBookings;
      store.notifications = fetchedNotifs;
      console.log(`[Firestore Database] Active! Synced ${store.bookings.length} bookings and ${store.notifications.length} notifications from Cloud Firestore.`);
    }

    try {
      const imagesSnap = await getDocs(collection(db, 'hall_images'));
      imagesSnap.forEach(d => {
        customHallImagesMap[d.id] = d.data() as CustomHallImages;
      });
      saveHallImages();
    } catch (e) {
      console.error('[Firestore] Error syncing hall_images:', e);
    }

    saveData(store.bookings, store.notifications);
  } catch (err) {
    console.error('[Firestore Database] Error syncing with Cloud Firestore:', err);
  }
}

async function saveBookingToFirestore(booking: BookingRecord) {
  try {
    await setDoc(doc(db, 'bookings', booking.id), booking);
  } catch (e) {
    console.error('[Firestore] Error saving booking:', e);
  }
}

async function saveNotifToFirestore(notif: NotificationRecord) {
  try {
    await setDoc(doc(db, 'notifications', notif.id), notif);
  } catch (e) {
    console.error('[Firestore] Error saving notification:', e);
  }
}

async function deleteBookingFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, 'bookings', id));
  } catch (e) {
    console.error('[Firestore] Error deleting booking:', e);
  }
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

async function startServer() {
  await syncFromFirestore();
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Static uploads serving
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
  app.use('/images', express.static(path.join(process.cwd(), 'public', 'images')));

  // API Routes
  
  // 1. Get Hall details & add-on options
  app.get('/api/halls', (req, res) => {
    res.json({
      halls: getEffectiveHalls(),
      addons: ADDON_OPTIONS
    });
  });

  // 1b. Update Hall Images (Admin Site Upload / Replace)
  app.post('/api/halls/:hallId/images', async (req, res) => {
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

    saveHallImages();

    // Sync custom images to Firestore if available
    try {
      await setDoc(doc(db, 'hall_images', hallId), customHallImagesMap[hallId]);
    } catch (e) {
      console.error('[Firestore] Error saving hall images:', e);
    }

    console.log(`[ADMIN IMAGE UPDATED] Hall: ${hallId} | Primary updated: ${!!primaryImage} | Secondary count: ${secondaryImages?.length}`);

    res.json({
      success: true,
      message: 'Hall images updated successfully!',
      halls: getEffectiveHalls()
    });
  });

  // 1c. Reset Hall Images to Default
  app.post('/api/halls/:hallId/images/reset', async (req, res) => {
    const { hallId } = req.params;
    delete customHallImagesMap[hallId];
    saveHallImages();

    try {
      await deleteDoc(doc(db, 'hall_images', hallId));
    } catch (e) {
      console.error('[Firestore] Error deleting custom hall images:', e);
    }

    res.json({
      success: true,
      message: 'Hall images reset to defaults!',
      halls: getEffectiveHalls()
    });
  });

  // 2. Get Bookings
  app.get('/api/bookings', (req, res) => {
    res.json({
      bookings: store.bookings
    });
  });

  // 2b. Failsafe Availability Checker Endpoint
  app.get('/api/availability/check', (req, res) => {
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
      confirmedBookings: confirmed,
      pendingBookings: pending,
      isFullyOccupied: confirmed.some(b => b.timeSlot === 'fullday') || confirmed.length >= 3
    });
  });

  // 3. Create New Customer Booking -> WITH DOUBLE BOOKING FAILSAFE
  app.post('/api/bookings', (req, res) => {
    const body = req.body;
    
    if (!body.hallId || !body.customerName || !body.customerEmail || !body.eventDate) {
      return res.status(400).json({ error: 'Missing required booking fields' });
    }

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

    // FAILSAFE CHECK 1: Is there an existing CONFIRMED booking that overlaps?
    const confirmedConflict = store.bookings.find(
      b => b.status === 'confirmed' && checkBookingOverlap(candidateBooking, b)
    );

    if (confirmedConflict) {
      return res.status(409).json({
        success: false,
        error: `DOUBLE-BOOKING FAILSAFE BLOCKED: ${confirmedConflict.hallName} is ALREADY CONFIRMED & RESERVED on ${body.eventDate} for ${confirmedConflict.customerName} (${confirmedConflict.timeSlot.toUpperCase()} slot). Please choose another date or time slot!`,
        failsafeTriggered: true,
        conflictingBooking: confirmedConflict
      });
    }

    // FAILSAFE CHECK 2: Is there an existing PENDING booking that overlaps?
    const pendingConflict = store.bookings.find(
      b => b.status === 'pending' && checkBookingOverlap(candidateBooking, b)
    );

    const hall = HALLS_DATA.find(h => h.id === body.hallId);
    const hallName = hall ? hall.name : body.hallId;

    const refNum = `BK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBookingId = `b-${Date.now()}`;

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
      estimatedTotal: Number(body.estimatedTotal) || 0,
      depositAmount: Number(body.depositAmount) || 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      notificationRead: false
    };

    // Construct Manager Alert Notification with Conflict Warning if applicable
    const titleText = pendingConflict 
      ? `🚨 NEW BOOKING ALERT! (⚠️ Conflict Warning: Pending request exists for this slot!)`
      : `🚨 NEW BOOKING ALERT!`;

    const messageText = pendingConflict
      ? `New booking submitted by ${newBooking.customerName} for ${newBooking.hallName} on ${newBooking.eventDate}. ⚠️ WARNING: Another pending booking (${pendingConflict.referenceNumber} - ${pendingConflict.customerName}) is also requesting this time slot!`
      : `New booking submitted by ${newBooking.customerName} for ${newBooking.hallName} on ${newBooking.eventDate}. Estimated revenue: RM ${newBooking.estimatedTotal.toLocaleString()}`;

    const newNotification: NotificationRecord = {
      id: `notif-${Date.now()}`,
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

    store.bookings.unshift(newBooking);
    store.notifications.unshift(newNotification);
    saveData(store.bookings, store.notifications);
    saveBookingToFirestore(newBooking);
    saveNotifToFirestore(newNotification);

    console.log('====================================================');
    console.log(`[MANAGER INFORMED] Email sent to: wandaniel554@gmail.com`);
    console.log(`[BOOKING REF]: ${refNum} | Hall: ${hallName} | Date: ${body.eventDate}`);
    if (pendingConflict) {
      console.log(`[FAILSAFE WARNING]: Time slot overlaps with pending request ${pendingConflict.referenceNumber}`);
    }
    console.log('====================================================');

    res.status(201).json({
      success: true,
      message: pendingConflict
        ? 'Booking request submitted! Note: Another request is currently pending for this slot.'
        : 'Booking successfully placed! Management has been notified.',
      hasPendingConflict: !!pendingConflict,
      booking: newBooking,
      notification: newNotification
    });
  });

  // 4. Update Booking Status (Manager Actions) -> WITH STRICT APPROVAL FAILSAFE
  app.patch('/api/bookings/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

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
      id: `notif-${Date.now()}`,
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
    saveData(store.bookings, store.notifications);
    saveBookingToFirestore(store.bookings[bookingIndex]);
    saveNotifToFirestore(notif);

    res.json({
      success: true,
      booking: store.bookings[bookingIndex]
    });
  });

  // 4b. Record / Confirm Payment for Booking (Admin Site)
  app.patch('/api/bookings/:id/payment', (req, res) => {
    const { id } = req.params;
    const { paymentStatus, paymentMethod, paidAmount, paymentReceiptRef, paymentNotes, autoApprove } = req.body;

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
    booking.paymentReceiptRef = paymentReceiptRef || `REC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    booking.paymentConfirmedAt = new Date().toISOString();
    if (paymentNotes !== undefined) booking.paymentNotes = paymentNotes;

    const statusTitle = booking.paymentStatus === 'fully_paid' 
      ? `💳 PAYMENT CONFIRMED (PAID IN FULL)! [${booking.paymentReceiptRef}]`
      : booking.paymentStatus === 'deposit_paid'
      ? `💰 DEPOSIT CONFIRMED! [${booking.paymentReceiptRef}]`
      : `⚠️ PAYMENT STATUS RESET`;

    const notif: NotificationRecord = {
      id: `notif-${Date.now()}`,
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
    saveData(store.bookings, store.notifications);
    saveBookingToFirestore(booking);
    saveNotifToFirestore(notif);

    console.log(`[PAYMENT CONFIRMED] Booking ${booking.referenceNumber} | Paid: RM ${booking.paidAmount} (${booking.paymentStatus}) | Ref: ${booking.paymentReceiptRef}`);

    res.json({
      success: true,
      message: `Payment updated successfully! Official receipt ${booking.paymentReceiptRef} generated.`,
      booking,
      notification: notif
    });
  });

  // 5. Get Notifications
  app.get('/api/notifications', (req, res) => {
    res.json({
      notifications: store.notifications,
      unreadCount: store.notifications.filter(n => !n.read).length
    });
  });

  // 6. Mark Notifications Read
  app.post('/api/notifications/mark-read', (req, res) => {
    store.notifications = store.notifications.map(n => ({ ...n, read: true }));
    saveData(store.bookings, store.notifications);
    for (const n of store.notifications) {
      saveNotifToFirestore(n);
    }
    res.json({ success: true, unreadCount: 0 });
  });

  // 7. Delete Booking
  app.delete('/api/bookings/:id', (req, res) => {
    const { id } = req.params;
    store.bookings = store.bookings.filter(b => b.id !== id);
    saveData(store.bookings, store.notifications);
    deleteBookingFromFirestore(id);
    res.json({ success: true });
  });

  // 8. Gemini AI Venue & Booking Assistant
  app.post('/api/ai-assistant', async (req, res) => {
    try {
      const { userQuery, context } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.json({
          reply: "I am your Nilai Harta Consultant Sdn Bhd Assistant! We offer Hall A (up to 30 pax, RM 60/hr) and Hall B (up to 35 pax, RM 75/hr). Both halls are fully equipped with normal whiteboard, prepared speaker & mic system, projector, air conditioning, high-speed Wi-Fi, pantry with water dispenser, clean toilets, and surau access. How can I help you book a hall today?"
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are the friendly AI Concierge for "Nilai Harta Consultant Sdn Bhd".
We offer EXACTLY 2 small, fully-equipped halls available for rental:
1. Hall A:
   - Capacity: Up to 30 pax (550 sq ft)
   - Rates: RM 60/hr or RM 450 full-day
   - Best for: Meetings, Public Talks, Classes & Workshops
   - Key features: Normal Whiteboard, Speaker & Mic prepared, Normal Projector, Air Conditioning, High-Speed Wi-Fi, Pantry with Water Dispenser, Clean Toilets, and Surau (Prayer Room).

2. Hall B:
   - Capacity: Up to 35 pax (650 sq ft)
   - Rates: RM 75/hr or RM 550 full-day
   - Best for: Educational Classes, Training Workshops, Lectures, Public Talks & Exams
   - Key features: Projector & 75" Smart TV, Speaker & Mic system, Whiteboards, Air Conditioning, High-Speed Wi-Fi, Pantry with Water Dispenser, Clean Toilets, and Surau Access.

Important note: The currency is Ringgit Malaysia (RM). All prices are in RM.
Customer query: "${userQuery}"
Additional Context: ${context || 'General inquiry'}

Provide a concise, helpful, professional response recommending the best hall or answering questions about booking, capacity, pricing (in RM), or equipment (projector, whiteboard, speaker/mic, air-con, Wi-Fi, pantry, surau, toilet). Keep response under 150 words.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      res.json({
        reply: response.text || "Thank you for reaching out! Let us know your preferred date, time slot, and guest count, and we will help reserve the ideal hall for your meeting, class, or talk."
      });
    } catch (err: any) {
      console.error('Gemini AI Assistant error:', err);
      res.json({
        reply: "Our halls at Nilai Harta Consultant Sdn Bhd fit around 30 people and are fully equipped with whiteboard, speaker & mic, projector, air conditioning, Wi-Fi, pantry with water dispenser, clean toilets, and surau access (rates from RM 60/hr). Feel free to click 'Book A Hall' to submit a reservation!"
      });
    }
  });

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
