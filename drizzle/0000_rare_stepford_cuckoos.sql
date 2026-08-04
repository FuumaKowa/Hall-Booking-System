CREATE TABLE "bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"reference_number" text NOT NULL,
	"hall_id" text NOT NULL,
	"event_date" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hall_images" (
	"hall_id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_reference_number_unique" ON "bookings" USING btree ("reference_number");--> statement-breakpoint
CREATE INDEX "bookings_availability_idx" ON "bookings" USING btree ("hall_id","event_date","status");--> statement-breakpoint
CREATE INDEX "notifications_booking_idx" ON "notifications" USING btree ("booking_id");