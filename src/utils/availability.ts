import { BookingRequest, HallId, TimeSlot } from '../types';

export interface SlotRange {
  startMin: number; // Minutes from 00:00
  endMin: number;
}

export const STANDARD_OPERATING_HOURS = {
  startHour: 9,      // 9:00 AM
  endHour: 18,       // 6:00 PM
  startTimeStr: '09:00',
  endTimeStr: '18:00',
  label: '09:00 AM - 06:00 PM'
};

export const TIME_SLOT_DEFAULTS: Record<TimeSlot, { startMin: number; endMin: number; label: string; timeRangeStr: string; defaultStart: string; defaultDuration: number }> = {
  morning: { startMin: 9 * 60, endMin: 13 * 60, label: 'Half Day - Morning (09:00 - 13:00)', timeRangeStr: '09:00 - 13:00', defaultStart: '09:00', defaultDuration: 4 },
  afternoon: { startMin: 14 * 60, endMin: 18 * 60, label: 'Half Day - Afternoon (14:00 - 18:00)', timeRangeStr: '14:00 - 18:00', defaultStart: '14:00', defaultDuration: 4 },
  evening: { startMin: 18 * 60, endMin: 22 * 60, label: 'Evening Package (Overtime)', timeRangeStr: '18:00 - 22:00', defaultStart: '18:00', defaultDuration: 4 },
  fullday: { startMin: 9 * 60, endMin: 18 * 60, label: 'Full Day Package (09:00 - 18:00)', timeRangeStr: '09:00 - 18:00', defaultStart: '09:00', defaultDuration: 9 },
};

export interface HoursBreakdown {
  standardHours: number;
  overtimeHours: number;
  totalHours: number;
  isOvertimeApplied: boolean;
}

/**
 * Calculates standard hours (9am - 6pm) vs overtime hours (outside 9am - 6pm)
 */
export function calculateBookingHours(startTime: string, durationHours: number): HoursBreakdown {
  const parts = (startTime || '09:00').split(':').map(Number);
  const startHour = (!isNaN(parts[0]) ? parts[0] : 9) + (!isNaN(parts[1]) ? parts[1] / 60 : 0);
  const endHour = startHour + durationHours;

  const stdStart = 9;  // 09:00
  const stdEnd = 18;  // 18:00

  const overlapStart = Math.max(startHour, stdStart);
  const overlapEnd = Math.min(endHour, stdEnd);

  const standardHours = Math.max(0, overlapEnd - overlapStart);
  const overtimeHours = Math.max(0, durationHours - standardHours);

  return {
    standardHours,
    overtimeHours,
    totalHours: durationHours,
    isOvertimeApplied: overtimeHours > 0
  };
}

/**
 * Calculates start and end minutes from midnight for a given booking or parameters
 */
export function getBookingTimeRange(
  timeSlot: TimeSlot,
  startTime?: string,
  durationHours: number = 5
): SlotRange {
  if (timeSlot === 'fullday') {
    return { startMin: 8 * 60, endMin: 24 * 60 };
  }

  const def = TIME_SLOT_DEFAULTS[timeSlot] || TIME_SLOT_DEFAULTS.afternoon;

  if (startTime) {
    const parts = startTime.split(':').map(Number);
    if (!isNaN(parts[0]) && !isNaN(parts[1])) {
      const startMin = parts[0] * 60 + parts[1];
      const endMin = startMin + (durationHours * 60);

      // Validate that custom startTime isn't a stale morning time when slot is evening/afternoon
      let isValidForSlot = true;
      if (timeSlot === 'morning' && (startMin < 6 * 60 || startMin > 12 * 60)) isValidForSlot = false;
      if (timeSlot === 'afternoon' && (startMin < 11 * 60 || startMin > 17 * 60)) isValidForSlot = false;
      if (timeSlot === 'evening' && startMin < 17 * 60) isValidForSlot = false;

      if (isValidForSlot) {
        return { startMin, endMin };
      }
    }
  }

  return { startMin: def.startMin, endMin: def.endMin };
}

/**
 * Checks if two time ranges overlap
 */
export function doRangesOverlap(rangeA: SlotRange, rangeB: SlotRange): boolean {
  return rangeA.startMin < rangeB.endMin && rangeA.endMin > rangeB.startMin;
}

export function isWednesdayDate(dateStr?: string): boolean {
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
  const dt = new Date(y, m, d);
  return dt.getDay() === 3; // Wednesday
}

export function getWednesdaySyntheticBooking(hallId: HallId, dateStr: string): BookingRequest {
  return {
    id: `wed-reserved-${hallId}-${dateStr}`,
    referenceNumber: 'BK-WED-DEFAULT',
    hallId,
    hallName: hallId === 'hall-grand-horizon' ? 'ALPHA HALL' : 'HALL B',
    customerName: 'Default Weekly Reservation',
    customerEmail: 'management@imadina.com',
    customerPhone: '+601119602980',
    eventType: 'Weekly Reserved Slot',
    eventDate: dateStr,
    timeSlot: 'morning',
    startTime: '09:00',
    endTime: '13:00',
    durationHours: 4,
    guestCount: 0,
    selectedAddons: [],
    specialRequests: 'Reserved every Wednesday from 9am to 1pm by default for both halls.',
    estimatedTotal: 0,
    depositAmount: 0,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    notificationRead: true,
    paymentStatus: 'fully_paid'
  };
}

/**
 * Checks if two bookings conflict (same hall, same date, non-declined status, overlapping times)
 */
export function doBookingsOverlap(
  bookingA: { hallId: HallId; eventDate: string; timeSlot: TimeSlot; startTime?: string; durationHours?: number; id?: string },
  bookingB: { hallId: HallId; eventDate: string; timeSlot: TimeSlot; startTime?: string; durationHours?: number; id?: string; status: string }
): boolean {
  if (bookingB.status === 'declined') return false;
  if (bookingA.id && bookingB.id && bookingA.id === bookingB.id) return false;
  if (bookingA.hallId !== bookingB.hallId) return false;
  if (bookingA.eventDate !== bookingB.eventDate) return false;

  // If Wednesday morning slot default reservation check
  if (isWednesdayDate(bookingA.eventDate)) {
    const rangeA = getBookingTimeRange(bookingA.timeSlot, bookingA.startTime, bookingA.durationHours);
    const wedRange = { startMin: 9 * 60, endMin: 13 * 60 };
    if (doRangesOverlap(rangeA, wedRange) && bookingB.id?.startsWith('wed-reserved')) {
      return true;
    }
  }

  // Same hall & same date: check slot / time overlap
  if (bookingA.timeSlot === 'fullday' || bookingB.timeSlot === 'fullday') {
    return true; // Full day occupies all slots on that date
  }

  if (bookingA.timeSlot === bookingB.timeSlot) {
    return true; // Same named slot
  }

  const rangeA = getBookingTimeRange(bookingA.timeSlot, bookingA.startTime, bookingA.durationHours);
  const rangeB = getBookingTimeRange(bookingB.timeSlot, bookingB.startTime, bookingB.durationHours);

  return doRangesOverlap(rangeA, rangeB);
}

export interface SameDayRestriction {
  isPast: boolean;
  isToday: boolean;
  canBookSameDay: boolean;
  allowedSlots: TimeSlot[];
  reason?: string;
}

export function getSameDayRestriction(dateStr: string, now = new Date()): SameDayRestriction {
  if (!dateStr) {
    return {
      isPast: false,
      isToday: false,
      canBookSameDay: true,
      allowedSlots: ['morning', 'afternoon', 'fullday', 'evening']
    };
  }

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  if (dateStr < todayStr) {
    return {
      isPast: true,
      isToday: false,
      canBookSameDay: false,
      allowedSlots: [],
      reason: 'Bookings for past dates are not allowed.'
    };
  }

  if (dateStr === todayStr) {
    const currentHour = now.getHours();
    if (currentHour >= 10) {
      return {
        isPast: false,
        isToday: true,
        canBookSameDay: false,
        allowedSlots: [],
        reason: 'Same-day bookings for today are closed (must be booked before 10:00 AM).'
      };
    } else {
      return {
        isPast: false,
        isToday: true,
        canBookSameDay: true,
        allowedSlots: ['afternoon'],
        reason: 'For same-day bookings placed before 10:00 AM, only the Afternoon slot (14:00 - 18:00 / 2:00 PM - 6:00 PM) is available.'
      };
    }
  }

  return {
    isPast: false,
    isToday: false,
    canBookSameDay: true,
    allowedSlots: ['morning', 'afternoon', 'fullday', 'evening']
  };
}

export interface DayHallAvailability {
  date: string;
  hallId: HallId;
  morning: { available: boolean; booking?: BookingRequest; reason?: string };
  afternoon: { available: boolean; booking?: BookingRequest; reason?: string };
  evening: { available: boolean; booking?: BookingRequest; reason?: string };
  fullday: { available: boolean; booking?: BookingRequest; reason?: string };
  hasConfirmedBooking: boolean;
  hasPendingBooking: boolean;
  conflictingBookings: BookingRequest[];
}

/**
 * Gets slot-by-slot availability status for a specific hall on a specific date
 */
export function getHallSlotAvailability(
  hallId: HallId,
  dateStr: string,
  allBookings: BookingRequest[]
): DayHallAvailability {
  const bookingsForDay = [...allBookings];
  const restriction = getSameDayRestriction(dateStr);

  // Automatically inject Wednesday default reservation for both halls
  if (isWednesdayDate(dateStr)) {
    bookingsForDay.push(getWednesdaySyntheticBooking(hallId, dateStr));
  }

  const dateBookings = bookingsForDay.filter(
    b => b.hallId === hallId && b.eventDate === dateStr && b.status !== 'declined'
  );

  const confirmed = dateBookings.filter(b => b.status === 'confirmed');
  const pending = dateBookings.filter(b => b.status === 'pending');

  const checkSlot = (slot: TimeSlot) => {
    if (restriction.isPast || !restriction.allowedSlots.includes(slot)) {
      return {
        available: false,
        booking: undefined,
        reason: restriction.reason
      };
    }
    const candidate = { hallId, eventDate: dateStr, timeSlot: slot };
    const matchingConfirmed = confirmed.find(b => doBookingsOverlap(candidate, b));
    const matchingPending = pending.find(b => doBookingsOverlap(candidate, b));

    const booking = matchingConfirmed || matchingPending;
    return {
      available: !matchingConfirmed, // Only confirmed blocks availability completely
      booking
    };
  };

  return {
    date: dateStr,
    hallId,
    morning: checkSlot('morning'),
    afternoon: checkSlot('afternoon'),
    evening: checkSlot('evening'),
    fullday: checkSlot('fullday'),
    hasConfirmedBooking: confirmed.length > 0,
    hasPendingBooking: pending.length > 0,
    conflictingBookings: dateBookings
  };
}
