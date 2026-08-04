import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { database } from '../src/db/client.js';
import { bookingsTable, hallImagesTable, notificationsTable } from '../src/db/schema.js';

if (!database) throw new Error('DATABASE_URL is required.');

const bookingPath = path.join(process.cwd(), 'bookings_store.json');
const imagePath = path.join(process.cwd(), 'hall_images_store.json');

if (fs.existsSync(bookingPath)) {
  const parsed = JSON.parse(fs.readFileSync(bookingPath, 'utf8'));
  for (const booking of parsed.bookings || []) {
    await database.insert(bookingsTable).values({
      id: booking.id, referenceNumber: booking.referenceNumber, hallId: booking.hallId,
      eventDate: booking.eventDate, status: booking.status,
      createdAt: new Date(booking.createdAt), data: booking,
    }).onConflictDoNothing();
  }
  for (const notification of parsed.notifications || []) {
    await database.insert(notificationsTable).values({
      id: notification.id, bookingId: notification.bookingId,
      createdAt: new Date(notification.timestamp), data: notification,
    }).onConflictDoNothing();
  }
}

if (fs.existsSync(imagePath)) {
  const images = JSON.parse(fs.readFileSync(imagePath, 'utf8'));
  for (const [hallId, data] of Object.entries(images)) {
    await database.insert(hallImagesTable).values({
      hallId, data: data as Record<string, unknown>, updatedAt: new Date(),
    }).onConflictDoNothing();
  }
}

const [bookingCount, notificationCount, imageCount] = await Promise.all([
  database.$count(bookingsTable), database.$count(notificationsTable), database.$count(hallImagesTable),
]);
console.log(JSON.stringify({ bookingCount, notificationCount, imageCount }));
process.exit(0);
