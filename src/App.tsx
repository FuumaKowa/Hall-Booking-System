import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { HallCard } from './components/HallCard';
import { HallComparisonTable } from './components/HallComparisonTable';
import { AvailabilityCalendar } from './components/AvailabilityCalendar';
import { BookingFormModal } from './components/BookingFormModal';
import { ManagerPortalModal } from './components/ManagerPortalModal';
import { FloorPlanModal } from './components/FloorPlanModal';
import { FailsafeModal } from './components/FailsafeModal';
import { TicketLookupModal } from './components/TicketLookupModal';
import { BookingTicketModal } from './components/BookingTicketModal';
import { Footer } from './components/Footer';

import { HALLS_DATA } from './data/hallsData';
import { cleanImageUrl } from './utils/imageUtils';
import { safeFetchJson } from './utils/apiUtils';
import { Hall, HallId, BookingRequest, NotificationItem, BookingStatus, PaymentStatus } from './types';
import { Bell } from 'lucide-react';

export default function App() {
  const [halls, setHalls] = useState<Hall[]>(HALLS_DATA);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Modals & Drawers
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [bookingHallId, setBookingHallId] = useState<HallId | undefined>(undefined);
  const [bookingDate, setBookingDate] = useState<string | undefined>(undefined);

  const [isManagerPortalOpen, setIsManagerPortalOpen] = useState<boolean>(false);
  const [isFloorPlanOpen, setIsFloorPlanOpen] = useState<boolean>(false);
  const [selectedFloorPlanHall, setSelectedFloorPlanHall] = useState<Hall | null>(null);

  const [isTicketLookupOpen, setIsTicketLookupOpen] = useState<boolean>(false);
  const [selectedTicketPass, setSelectedTicketPass] = useState<BookingRequest | null>(null);

  const [failsafeModal, setFailsafeModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    conflictingBooking?: BookingRequest;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const [toastAlert, setToastAlert] = useState<{ title: string; message: string } | null>(null);

  // Load bookings, notifications, and hall data on mount
  const fetchData = async () => {
    try {
      const [bRes, nRes, hRes] = await Promise.all([
        safeFetchJson('/api/bookings'),
        safeFetchJson('/api/notifications'),
        safeFetchJson('/api/halls')
      ]);

      if (bRes.ok && bRes.data) {
        setBookings(bRes.data.bookings || []);
      }

      if (nRes.ok && nRes.data) {
        setNotifications(nRes.data.notifications || []);
        setUnreadCount(nRes.data.unreadCount || 0);
      }

      if (hRes.ok && hRes.data && Array.isArray(hRes.data.halls)) {
        const sanitizedHalls = hRes.data.halls.map((hall: Hall) => ({
          ...hall,
          primaryImage: cleanImageUrl(hall.primaryImage, hall.id.includes('grand') ? '/images/hall_alpha.jpeg' : '/images/hall_b_panoramic.jpeg'),
          secondaryImages: (hall.secondaryImages || []).map((img: string) => cleanImageUrl(img, '/images/surau.jpeg'))
        }));
        setHalls(sanitizedHalls);
      }
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateHallImages = async (hallId: string, primaryImage?: string, secondaryImages?: string[]) => {
    try {
      const { ok, data } = await safeFetchJson(`/api/halls/${hallId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryImage, secondaryImages })
      });
      if (ok && data?.halls) {
        setHalls(data.halls);
        setToastAlert({
          title: 'Hall Photos Updated Live',
          message: `Photos updated for ${hallId}. Changes are visible across the site!`
        });
        setTimeout(() => setToastAlert(null), 5000);
      }
    } catch (err) {
      console.error('Error updating hall images:', err);
    }
  };

  const handleResetHallImages = async (hallId: string) => {
    try {
      const { ok, data } = await safeFetchJson(`/api/halls/${hallId}/images/reset`, {
        method: 'POST'
      });
      if (ok && data?.halls) {
        setHalls(data.halls);
        setToastAlert({
          title: 'Hall Photos Reset',
          message: `Hall photos restored to default.`
        });
        setTimeout(() => setToastAlert(null), 5000);
      }
    } catch (err) {
      console.error('Error resetting hall images:', err);
    }
  };

  // Handlers
  const handleOpenBookingModal = (hallId?: HallId, dateStr?: string) => {
    setBookingHallId(hallId);
    setBookingDate(dateStr);
    setIsBookingModalOpen(true);
  };

  const handleBookingCreated = (newBooking: BookingRequest, newNotif: NotificationItem) => {
    setBookings(prev => [newBooking, ...prev]);
    setNotifications(prev => [newNotif, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show Toast Notification
    setToastAlert({
      title: 'Booking Request Submitted',
      message: `${newBooking.customerName} requested ${newBooking.hallName} for ${newBooking.eventDate}.`
    });

    setTimeout(() => {
      setToastAlert(null);
    }, 6000);
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await safeFetchJson('/api/notifications/mark-read', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: BookingStatus) => {
    try {
      const { ok, status: statusCode, data } = await safeFetchJson(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (ok && data?.success) {
        fetchData();
      } else if (statusCode === 409 || data?.failsafeTriggered) {
        setFailsafeModal({
          isOpen: true,
          title: 'DOUBLE-BOOKING FAILSAFE ACTIVATED',
          message: data?.error || 'Cannot approve booking because another booking is ALREADY CONFIRMED for this venue, date, and time slot.',
          conflictingBooking: data?.conflictingBooking
        });
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleUpdatePayment = async (
    bookingId: string, 
    paymentData: { 
      paymentStatus: PaymentStatus;
      paymentMethod?: string;
      paidAmount?: number;
      paymentReceiptRef?: string;
      paymentNotes?: string;
      autoApprove?: boolean;
    }
  ) => {
    try {
      const { ok, status: statusCode, data } = await safeFetchJson(`/api/bookings/${bookingId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      if (ok && data?.success) {
        fetchData();
        setToastAlert({
          title: 'Payment Confirmed & Recorded',
          message: `Payment status updated to "${paymentData.paymentStatus.toUpperCase()}". Receipt: ${data.booking?.paymentReceiptRef || 'Generated'}`
        });
        setTimeout(() => setToastAlert(null), 5000);
      } else if (statusCode === 409 || data?.failsafeTriggered) {
        setFailsafeModal({
          isOpen: true,
          title: 'DOUBLE-BOOKING FAILSAFE ACTIVATED',
          message: data?.error || 'Payment recorded, but auto-approval was blocked because another booking is ALREADY CONFIRMED for this slot.',
          conflictingBooking: data?.conflictingBooking
        });
        fetchData();
      }
    } catch (err) {
      console.error('Error updating payment:', err);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      const { ok } = await safeFetchJson(`/api/bookings/${bookingId}`, { method: 'DELETE' });
      if (ok) {
        setBookings(prev => prev.filter(b => b.id !== bookingId));
      }
    } catch (err) {
      console.error('Error deleting booking:', err);
    }
  };

  const handleSelectHallScroll = (hallId: HallId) => {
    const el = document.getElementById(hallId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleViewFloorPlan = (hall: Hall) => {
    setSelectedFloorPlanHall(hall);
    setIsFloorPlanOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans selection:bg-amber-500 selection:text-white">
      
      {/* Toast Alert Popup */}
      {toastAlert && (
        <div className="fixed top-20 right-4 z-50 max-w-sm bg-white border border-stone-200 rounded-xl p-3.5 shadow-xl flex items-start space-x-3 text-xs">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-stone-900">{toastAlert.title}</h4>
            <p className="text-stone-600 mt-0.5">{toastAlert.message}</p>
          </div>
          <button 
            onClick={() => setToastAlert(null)}
            className="text-stone-400 hover:text-stone-600 ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar 
        unreadCount={unreadCount}
        onOpenManagerPortal={() => setIsManagerPortalOpen(true)}
        onOpenBookingModal={handleOpenBookingModal}
        onSelectHallScroll={handleSelectHallScroll}
        onOpenTicketLookup={() => setIsTicketLookupOpen(true)}
      />

      {/* Hero Header */}
      <HeroBanner 
        onOpenBookingModal={handleOpenBookingModal}
        onSelectHallScroll={handleSelectHallScroll}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* The 2 Hall Cards - Front and Center */}
        <div className="space-y-6">
          {halls.map(hall => (
            <HallCard 
              key={hall.id}
              hall={hall}
              onBookHall={(id) => handleOpenBookingModal(id)}
              onViewFloorPlan={handleViewFloorPlan}
            />
          ))}
        </div>

        {/* Hall Side-by-Side Comparison Table */}
        <HallComparisonTable 
          onBookHall={(id) => handleOpenBookingModal(id)}
        />

        {/* Live Availability Calendar */}
        <AvailabilityCalendar 
          bookings={bookings}
          onSelectDateToBook={(dateStr) => handleOpenBookingModal(undefined, dateStr)}
        />

      </main>

      {/* Footer */}
      <Footer 
        onOpenManagerPortal={() => setIsManagerPortalOpen(true)}
        onSelectHallScroll={handleSelectHallScroll}
        onOpenBookingModal={handleOpenBookingModal}
      />

      {/* Modals & Drawers */}
      {isBookingModalOpen && (
        <BookingFormModal 
          initialHallId={bookingHallId}
          initialDate={bookingDate}
          onClose={() => setIsBookingModalOpen(false)}
          onBookingCreated={handleBookingCreated}
        />
      )}

      {isManagerPortalOpen && (
        <ManagerPortalModal 
          bookings={bookings}
          notifications={notifications}
          unreadCount={unreadCount}
          halls={halls}
          onClose={() => setIsManagerPortalOpen(false)}
          onMarkNotificationsRead={handleMarkNotificationsRead}
          onUpdateStatus={handleUpdateStatus}
          onUpdatePayment={handleUpdatePayment}
          onDeleteBooking={handleDeleteBooking}
          onUpdateHallImages={handleUpdateHallImages}
          onResetHallImages={handleResetHallImages}
        />
      )}

      {isFloorPlanOpen && selectedFloorPlanHall && (
        <FloorPlanModal 
          hall={selectedFloorPlanHall}
          onClose={() => setIsFloorPlanOpen(false)}
        />
      )}

      <FailsafeModal 
        isOpen={failsafeModal.isOpen}
        title={failsafeModal.title}
        message={failsafeModal.message}
        conflictingBooking={failsafeModal.conflictingBooking}
        onClose={() => setFailsafeModal(prev => ({ ...prev, isOpen: false }))}
      />

      {isTicketLookupOpen && (
        <TicketLookupModal
          bookings={bookings}
          onClose={() => setIsTicketLookupOpen(false)}
          onSelectBookingTicket={(b) => setSelectedTicketPass(b)}
        />
      )}

      {selectedTicketPass && (
        <BookingTicketModal
          booking={selectedTicketPass}
          onClose={() => setSelectedTicketPass(null)}
        />
      )}

    </div>
  );
}

