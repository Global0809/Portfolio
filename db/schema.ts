import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
export const bookings = sqliteTable(
  'bookings',
  {
    id: text('id').primaryKey(),
    requestKey: text('request_key').notNull().unique(),
    requestHash: text('request_hash').notNull(),
    slot: integer('slot').notNull(),
    email: text('email').notNull(),
    emailHash: text('email_hash').notNull(),
    ipHash: text('ip_hash').notNull(),
    artist: text('artist').notNull(),
    song: text('song').notNull(),
    mood: text('mood').notNull(),
    link: text('link').notNull(),
    vision: text('vision').notNull(),
    inspiration: text('inspiration').notNull(),
    status: text('status').notNull(),
    verifyExpires: integer('verify_expires').notNull(),
    holdExpires: integer('hold_expires').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('one_active_slot')
      .on(table.slot)
      .where(
        sql`${table.status} in ('pending','reserved','started','completed')`,
      ),
    uniqueIndex('one_active_email')
      .on(table.emailHash)
      .where(sql`${table.status} in ('pending','reserved','started')`),
  ],
);
export const emails = sqliteTable('email_events', {
  id: text('id').primaryKey(),
  bookingId: text('booking_id')
    .notNull()
    .references(() => bookings.id),
  kind: text('kind').notNull(),
  status: text('status').notNull().default('queued'),
  leaseUntil: integer('lease_until').notNull().default(0),
  attempts: integer('attempts').notNull().default(0),
  providerId: text('provider_id'),
  createdAt: integer('created_at').notNull(),
});
