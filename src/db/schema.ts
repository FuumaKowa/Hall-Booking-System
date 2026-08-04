import { index, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const bookingsTable = pgTable('bookings', {
  id: text('id').primaryKey(),
  referenceNumber: text('reference_number').notNull(),
  hallId: text('hall_id').notNull(),
  eventDate: text('event_date').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  data: jsonb('data').notNull().$type<Record<string, unknown>>(),
}, table => [
  uniqueIndex('bookings_reference_number_unique').on(table.referenceNumber),
  index('bookings_availability_idx').on(table.hallId, table.eventDate, table.status),
]);

export const notificationsTable = pgTable('notifications', {
  id: text('id').primaryKey(),
  bookingId: text('booking_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  data: jsonb('data').notNull().$type<Record<string, unknown>>(),
}, table => [index('notifications_booking_idx').on(table.bookingId)]);

export const hallImagesTable = pgTable('hall_images', {
  hallId: text('hall_id').primaryKey(),
  data: jsonb('data').notNull().$type<Record<string, unknown>>(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});
