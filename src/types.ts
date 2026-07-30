export type HallId = 'hall-grand-horizon' | 'hall-serenade-glasshouse';

export interface Hall {
  id: HallId;
  name: string;
  tagline: string;
  description: string;
  maxCapacity: number;
  minCapacity: number;
  pricePerHour: number;
  overtimeRatePerHour: number;
  fullDayRate: number;
  sizeSqFt: number;
  primaryImage: string;
  secondaryImages: string[];
  features: string[];
  amenities: {
    iconName: string;
    title: string;
    description: string;
  }[];
  floorPlanSpec: {
    dimensions: string;
    ceilingHeight: string;
    stageDimensions: string;
    parkingCapacity: string;
  };
  idealFor: string[];
  badgeText?: string;
}

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'fullday';

export interface AddonOption {
  id: string;
  name: string;
  category: 'catering' | 'decor' | 'av_tech' | 'service';
  price: number;
  priceUnit: 'flat' | 'per_guest' | 'per_hour';
  description: string;
  iconName: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'declined' | 'completed';
export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'fully_paid';

export interface BookingRequest {
  id: string;
  referenceNumber: string;
  hallId: HallId;
  hallName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventType: string;
  eventDate: string; // YYYY-MM-DD
  timeSlot: TimeSlot;
  startTime: string;
  endTime: string;
  durationHours: number;
  guestCount: number;
  selectedAddons: string[]; // addon ids
  specialRequests?: string;
  estimatedTotal: number;
  depositAmount: number;
  status: BookingStatus;
  createdAt: string; // ISO string
  notificationRead: boolean;

  // Confirmed Payment Fields
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  paidAmount?: number;
  paymentReceiptRef?: string;
  paymentConfirmedAt?: string;
  paymentNotes?: string;
}

export interface NotificationItem {
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

export interface AvailabilitySlot {
  date: string;
  hall1Booked: boolean;
  hall2Booked: boolean;
}
