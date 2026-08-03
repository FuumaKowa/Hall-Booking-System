import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Clock, Users, Sparkles, Check, CheckCircle2, 
  DollarSign, Mail, Phone, User, FileText, AlertCircle, ArrowRight, ShieldCheck, MailCheck,
  ChevronLeft, ChevronRight, CalendarDays, Receipt, Printer, MessageCircle, Send
} from 'lucide-react';
import { HALLS_DATA, ADDON_OPTIONS } from '../data/hallsData';
import { HallId, TimeSlot, BookingRequest, NotificationItem } from '../types';
import { doBookingsOverlap, calculateBookingHours } from '../utils/availability';
import { BookingTicketModal } from './BookingTicketModal';

interface BookingFormModalProps {
  initialHallId?: HallId;
  initialDate?: string;
  onClose: () => void;
  onBookingCreated: (booking: BookingRequest, notif: NotificationItem) => void;
}

export const BookingFormModal: React.FC<BookingFormModalProps> = ({
  initialHallId = 'hall-grand-horizon',
  initialDate,
  onClose,
  onBookingCreated
}) => {
  const [selectedHallId, setSelectedHallId] = useState<HallId>(initialHallId);
  const [eventType, setEventType] = useState<string>('Corporate Meeting');
  const [eventDate, setEventDate] = useState<string>(
    initialDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
  );
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('morning');
  const [guestCount, setGuestCount] = useState<number>(20);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [specialRequests, setSpecialRequests] = useState<string>('');

  const startTime = timeSlot === 'afternoon' ? '14:00' : '09:00';
  const durationHours = timeSlot === 'fullday' ? 9 : 4;

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmationData, setConfirmationData] = useState<{ booking: BookingRequest; notification: NotificationItem } | null>(null);
  const [showTicketPass, setShowTicketPass] = useState<boolean>(false);

  // Live Availability State
  const [availabilityData, setAvailabilityData] = useState<{
    confirmedBookings: BookingRequest[];
    pendingBookings: BookingRequest[];
    loading: boolean;
  }>({ confirmedBookings: [], pendingBookings: [], loading: false });

  // Interactive Calendar Date Picker State
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(() => {
    if (eventDate) {
      const parts = eventDate.split('-').map(Number);
      if (parts.length === 3) return new Date(parts[0], parts[1] - 1, 1);
    }
    return new Date();
  });

  const handleTimeSlotChange = (newSlot: TimeSlot) => {
    setTimeSlot(newSlot);
  };

  const currentHall = HALLS_DATA.find(h => h.id === selectedHallId) || HALLS_DATA[0];

  // Adjust default guest count if hall changes
  useEffect(() => {
    if (guestCount > currentHall.maxCapacity) {
      setGuestCount(currentHall.maxCapacity);
    } else if (guestCount < currentHall.minCapacity) {
      setGuestCount(currentHall.minCapacity);
    }
  }, [selectedHallId]);

  // Fetch real-time availability whenever hall or date changes
  useEffect(() => {
    let isMounted = true;
    const checkAvailability = async () => {
      if (!selectedHallId || !eventDate) return;
      setAvailabilityData(prev => ({ ...prev, loading: true }));
      try {
        const res = await fetch(`/api/availability/check?hallId=${selectedHallId}&eventDate=${eventDate}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setAvailabilityData({
              confirmedBookings: data.confirmedBookings || [],
              pendingBookings: data.pendingBookings || [],
              loading: false
            });
          }
        }
      } catch (err) {
        console.error('Error checking availability:', err);
        if (isMounted) setAvailabilityData(prev => ({ ...prev, loading: false }));
      }
    };

    checkAvailability();
    return () => { isMounted = false; };
  }, [selectedHallId, eventDate]);

  // All bookings store for calendar highlights
  const [allHallBookings, setAllHallBookings] = useState<BookingRequest[]>([]);

  useEffect(() => {
    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => {
        if (data && data.bookings) setAllHallBookings(data.bookings);
      })
      .catch(err => console.error('Error fetching all bookings:', err));
  }, []);

  // Determine if chosen timeSlot is taken by confirmed or pending using doBookingsOverlap
  const checkSlotOverlap = (targetSlot: TimeSlot) => {
    const isOverlapping = (b: BookingRequest) => {
      return doBookingsOverlap(
        {
          hallId: selectedHallId,
          eventDate,
          timeSlot: targetSlot,
          startTime,
          durationHours: targetSlot === 'fullday' ? 12 : durationHours
        },
        b
      );
    };

    const confirmedMatch = availabilityData.confirmedBookings.find(isOverlapping);
    const pendingMatch = availabilityData.pendingBookings.find(isOverlapping);

    return { confirmedMatch, pendingMatch };
  };

  const currentSlotConflict = checkSlotOverlap(timeSlot);
  const isSlotConfirmedBlocked = !!currentSlotConflict.confirmedMatch;
  const isSlotPendingWarning = !!currentSlotConflict.pendingMatch;

  // Price Calculation Logic
  const calculatePricing = () => {
    let baseHallFee = 0;

    if (timeSlot === 'fullday') {
      baseHallFee = currentHall.fullDayRate;
    } else {
      baseHallFee = currentHall.halfDayRate || 149;
    }

    let addonsFee = 0;
    selectedAddons.forEach(addonId => {
      const addon = ADDON_OPTIONS.find(a => a.id === addonId);
      if (addon) {
        if (addon.priceUnit === 'per_guest') {
          addonsFee += addon.price * guestCount;
        } else if (addon.priceUnit === 'per_hour') {
          addonsFee += addon.price * durationHours;
        } else {
          addonsFee += addon.price;
        }
      }
    });

    const total = baseHallFee + addonsFee;
    const deposit = Math.round(total * 0.3); // 30% deposit

    return { 
      baseHallFee, 
      addonsFee, 
      total, 
      deposit 
    };
  };

  const { baseHallFee, addonsFee, total, deposit } = calculatePricing();

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => 
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    );
  };

  const constructWhatsAppUrl = (booking: BookingRequest) => {
    const addonNames = (booking.selectedAddons || [])
      .map(id => ADDON_OPTIONS.find(a => a.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    const timeSlotLabel = booking.timeSlot === 'fullday' 
      ? 'Full Day Package (09:00 - 18:00)' 
      : booking.timeSlot === 'morning' 
      ? 'Half Day Morning (09:00 - 13:00)' 
      : 'Half Day Afternoon (14:00 - 18:00)';

    const text = `🏛️ *NEW HALL BOOKING RESERVATION*
---------------------------------------
📌 *Ref No:* ${booking.referenceNumber}
🏢 *Hall:* ${booking.hallName}
👤 *Name:* ${booking.customerName}
📞 *Phone:* ${booking.customerPhone}
✉️ *Email:* ${booking.customerEmail}

📅 *Event Date:* ${booking.eventDate}
⏰ *Time Slot:* ${timeSlotLabel} (${booking.startTime} - ${booking.endTime})
🎯 *Event Type:* ${booking.eventType}
👥 *Guest Count:* ${booking.guestCount} pax

📦 *Selected Add-ons:* ${addonNames || 'None'}
📝 *Special Requests:* ${booking.specialRequests || 'None'}

💰 *Estimated Total:* RM ${booking.estimatedTotal.toLocaleString()}
💳 *Deposit Required (30%):* RM ${booking.depositAmount.toLocaleString()}
---------------------------------------
_Sent via I-Madina Event Space Website_`;

    return `https://wa.me/601119602980?text=${encodeURIComponent(text)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !customerPhone || !eventDate) {
      setErrorMsg('Please complete all required customer details and date fields.');
      return;
    }

    if (isSlotConfirmedBlocked) {
      setErrorMsg(`DOUBLE-BOOKING FAILSAFE ACTIVE: ${currentHall.name} is already confirmed & reserved on ${eventDate} during this slot. Please choose another date or time slot package.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hallId: selectedHallId,
          customerName,
          customerEmail,
          customerPhone,
          eventType,
          eventDate,
          timeSlot,
          startTime,
          durationHours,
          guestCount,
          selectedAddons,
          specialRequests,
          estimatedTotal: total,
          depositAmount: deposit
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to process booking submission.');
      }

      setConfirmationData({
        booking: data.booking,
        notification: data.notification
      });

      // Auto send to WhatsApp
      const waUrl = constructWhatsAppUrl(data.booking);
      try {
        window.open(waUrl, '_blank');
      } catch (err) {
        console.log('WhatsApp window launch prevented by browser', err);
      }

      onBookingCreated(data.booking, data.notification);
    } catch (err: any) {
      console.error('Booking submission error:', err);
      setErrorMsg(err.message || 'Error connecting to server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header Bar */}
        <div className="bg-stone-50 px-6 py-5 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-lg">
                Hall Rental Reservation Form
              </h3>
              <p className="text-xs text-stone-600">
                Reserve your hall date & time • Management receives instant alert
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmation Screen View */}
        {confirmationData ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 mb-2">
                Booking Reference: {confirmationData.booking.referenceNumber}
              </span>
              <h3 className="font-serif text-2xl font-bold text-stone-900">
                Booking Submission Received!
              </h3>
              <p className="text-xs text-stone-600 mt-2 max-w-md mx-auto">
                Thank you, <strong>{confirmationData.booking.customerName}</strong>. Your reservation request for <strong>{confirmationData.booking.hallName}</strong> has been received and sent to WhatsApp +601119602980.
              </p>
            </div>

            {/* Manager Alert Confirmation Box */}
            <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 text-left space-y-3 max-w-lg mx-auto">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Sent to WhatsApp & Management Dashboard!</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Booking details have been dispatched to <strong>+601119602980</strong> via WhatsApp and notified to <strong>wandaniel554@gmail.com</strong>.
              </p>
              <div className="pt-2 border-t border-stone-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block">Event Date</span>
                  <span className="font-semibold text-stone-800">{confirmationData.booking.eventDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block">Total Estimated</span>
                  <span className="font-semibold text-amber-700">RM {confirmationData.booking.estimatedTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={constructWhatsAppUrl(confirmationData.booking)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send to WhatsApp (+601119602980)</span>
              </a>

              <button
                onClick={() => setShowTicketPass(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-stone-950 font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2"
              >
                <Receipt className="w-4 h-4" />
                <span>View & Print Official Ticket Pass</span>
              </button>

              <button
                onClick={onClose}
                className="w-full sm:w-auto bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold py-3 px-6 rounded-xl text-sm transition-all border border-stone-300"
              >
                Done / Back to Website
              </button>
            </div>

            {showTicketPass && (
              <BookingTicketModal
                booking={confirmationData.booking}
                onClose={() => setShowTicketPass(false)}
              />
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto bg-white">
            
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step 1: Hall Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">
                1. Select Event Hall
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {HALLS_DATA.map(hall => {
                  const isSelected = selectedHallId === hall.id;
                  return (
                    <div
                      key={hall.id}
                      onClick={() => setSelectedHallId(hall.id)}
                      className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-start space-x-3 ${
                        isSelected 
                          ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20' 
                          : 'bg-white border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <img src={hall.primaryImage} alt={hall.name} referrerPolicy="no-referrer" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-serif font-bold text-stone-900 text-sm">{hall.name}</h4>
                          {isSelected && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                        </div>
                        <span className="text-[10px] text-stone-500 block mt-0.5">Capacity: {hall.minCapacity}-{hall.maxCapacity} Guests</span>
                        <span className="text-xs text-amber-800 font-bold block mt-1">Half Day: RM {hall.halfDayRate} • Full Day: RM {hall.fullDayRate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Date, Time & Guest Count */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">
                  2. Select Date & Package
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Event Date *
                    </label>
                    <div className="relative">
                      <input 
                        type="date"
                        value={eventDate}
                        onChange={e => {
                          setEventDate(e.target.value);
                          const parts = e.target.value.split('-').map(Number);
                          if (parts.length === 3) setCalendarViewDate(new Date(parts[0], parts[1] - 1, 1));
                        }}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-3 pr-10 py-2 text-stone-900 text-xs focus:border-amber-500 focus:outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setIsCalendarOpen(prev => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-amber-600 hover:text-amber-700 hover:bg-amber-100 transition-colors flex items-center justify-center"
                        title="Open visual calendar picker"
                      >
                        <CalendarDays className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Rental Option Package *
                    </label>
                    <select
                      value={timeSlot}
                      onChange={e => handleTimeSlotChange(e.target.value as TimeSlot)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 text-xs font-semibold focus:border-amber-500 focus:outline-none"
                    >
                      <option value="morning">Half Day - Morning (09:00 - 13:00 / 9:00 AM - 1:00 PM) • RM {currentHall.halfDayRate}</option>
                      <option value="afternoon">Half Day - Afternoon (14:00 - 18:00 / 2:00 PM - 6:00 PM) • RM {currentHall.halfDayRate}</option>
                      <option value="fullday">Full Day Package (09:00 - 18:00 / 9:00 AM - 6:00 PM) • RM {currentHall.fullDayRate}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Event Occasion / Type
                    </label>
                    <select
                      value={eventType}
                      onChange={e => setEventType(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 text-xs focus:border-amber-500 focus:outline-none"
                    >
                      <option value="Corporate Meeting">Corporate Meeting / Discussion</option>
                      <option value="Training Workshop">Training Course / Workshop</option>
                      <option value="Educational Class">Educational Class / Lecture</option>
                      <option value="Talk / Keynote">Talk & Keynote Seminar</option>
                      <option value="Product Briefing">Product Briefing / Demo</option>
                      <option value="Exam / Assessment">Exam & Assessment Session</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Guest Count ({currentHall.minCapacity} - {currentHall.maxCapacity})
                    </label>
                    <input 
                      type="number"
                      min={currentHall.minCapacity}
                      max={currentHall.maxCapacity}
                      value={guestCount}
                      onChange={e => setGuestCount(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 text-xs focus:border-amber-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Interactive Calendar Picker Popup Grid */}
              {isCalendarOpen && (
                <div className="p-4 bg-white border border-amber-300 rounded-xl space-y-3 shadow-xl">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-200">
                    <button
                      type="button"
                      onClick={() => setCalendarViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                      className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Prev</span>
                    </button>

                    <span className="font-serif font-bold text-amber-900 text-sm">
                      {calendarViewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>

                    <button
                      type="button"
                      onClick={() => setCalendarViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                      className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center gap-1"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className="py-1">{d}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {(() => {
                      const year = calendarViewDate.getFullYear();
                      const month = calendarViewDate.getMonth();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const firstDayIndex = new Date(year, month, 1).getDay();
                      const todayStr = new Date().toISOString().split('T')[0];

                      const cells = [];
                      for (let i = 0; i < firstDayIndex; i++) {
                        cells.push(<div key={`empty-${i}`} className="h-9" />);
                      }

                      for (let d = 1; d <= daysInMonth; d++) {
                        const mm = String(month + 1).padStart(2, '0');
                        const dd = String(d).padStart(2, '0');
                        const dateStr = `${year}-${mm}-${dd}`;
                        const isSelected = dateStr === eventDate;
                        const isToday = dateStr === todayStr;

                        const dayBookings = allHallBookings.filter(b => b.hallId === selectedHallId && b.eventDate === dateStr && b.status !== 'declined');
                        
                        const confirmedSlots = dayBookings.filter(b => b.status === 'confirmed').map(b => b.timeSlot);
                        const isFullDayReserved = confirmedSlots.includes('fullday') || (
                          confirmedSlots.includes('morning') && confirmedSlots.includes('afternoon')
                        );
                        
                        const hasConfirmed = confirmedSlots.length > 0;
                        const hasPending = dayBookings.some(b => b.status === 'pending');

                        let cellTitle = `${dateStr}: Open for booking`;
                        if (isFullDayReserved) {
                          cellTitle = `${dateStr}: Entire day fully reserved`;
                        } else if (hasConfirmed) {
                          cellTitle = `${dateStr}: ${confirmedSlots.map(s => s.toUpperCase()).join(', ')} reserved. Other slots AVAILABLE!`;
                        } else if (hasPending) {
                          cellTitle = `${dateStr}: Pending request on file`;
                        }

                        cells.push(
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => {
                              setEventDate(dateStr);
                              setIsCalendarOpen(false);
                            }}
                            title={cellTitle}
                            className={`h-10 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center relative ${
                              isSelected
                                ? 'bg-amber-500 text-stone-950 font-bold shadow-md ring-2 ring-amber-400 scale-105'
                                : isToday
                                ? 'bg-stone-100 text-amber-700 border border-amber-400'
                                : isFullDayReserved
                                ? 'bg-red-100 text-red-900 border border-red-300 hover:bg-red-200'
                                : hasConfirmed
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                                : hasPending
                                ? 'bg-stone-100 text-stone-700 border border-stone-300 hover:bg-stone-200'
                                : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200'
                            }`}
                          >
                            <span>{d}</span>
                            <div className="flex items-center gap-0.5 mt-0.5">
                              {isFullDayReserved && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                              {!isFullDayReserved && hasConfirmed && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                              {!hasConfirmed && hasPending && <span className="w-1.5 h-1.5 rounded-full bg-stone-500" />}
                              {isToday && !isSelected && !hasConfirmed && !hasPending && <span className="text-[7px] leading-none opacity-80 text-amber-700">Today</span>}
                            </div>
                          </button>
                        );
                      }
                      return cells;
                    })()}
                  </div>

                  <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-600">
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Open</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Partial Slot Reserved</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Full Day Reserved</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCalendarOpen(false)}
                      className="text-stone-700 hover:text-stone-900 font-bold"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

              {/* Real-time Failsafe Availability Indicator Bar */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    Slot Availability on {eventDate} for {currentHall.name}:
                  </span>
                  <span className="text-[10px] text-stone-500">
                    {availabilityData.loading ? 'Checking slots...' : 'Failsafe Verified'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                  {(['morning', 'afternoon', 'fullday'] as TimeSlot[]).map(st => {
                    const status = checkSlotOverlap(st);
                    const isConf = !!status.confirmedMatch;
                    const isPend = !!status.pendingMatch;
                    const isSelectedSlot = timeSlot === st;
                    const slotLabel = st === 'morning' ? 'Morning (9am - 1pm)' : st === 'afternoon' ? 'Afternoon (2pm - 6pm)' : 'Full Day (9am - 6pm)';

                    return (
                      <div 
                        key={st}
                        onClick={() => handleTimeSlotChange(st)}
                        className={`cursor-pointer p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                          isSelectedSlot ? 'ring-2 ring-amber-500 font-bold shadow-xs' : ''
                        } ${
                          isConf ? 'bg-red-100 border-red-300 text-red-900' :
                          isPend ? 'bg-amber-100 border-amber-300 text-amber-900' :
                          'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}
                      >
                        <span className="font-bold text-xs">{slotLabel}</span>
                        <span className="font-medium mt-1">
                          {isConf ? '🛑 RESERVED' : isPend ? '⚠️ REQUESTED' : '✓ AVAILABLE'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* DOUBLE-BOOKING FAILSAFE BANNER */}
                {isSlotConfirmedBlocked && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs flex items-start gap-2.5 mt-2">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-red-800">DOUBLE-BOOKING FAILSAFE ACTIVE</h5>
                      <p className="mt-0.5 text-stone-800">
                        <strong>{currentHall.name}</strong> is <strong>ALREADY CONFIRMED & RESERVED</strong> on <strong>{eventDate}</strong> during the selected slot for <strong>{currentSlotConflict.confirmedMatch?.customerName}</strong> ({currentSlotConflict.confirmedMatch?.referenceNumber}).
                      </p>
                      <p className="mt-1 text-[11px] text-red-800 font-semibold">
                        Please choose a different date or time slot package to proceed.
                      </p>
                    </div>
                  </div>
                )}

                {/* PENDING REQUEST WARNING BANNER */}
                {!isSlotConfirmedBlocked && isSlotPendingWarning && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5 mt-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-amber-800">Pending Request Notice</h5>
                      <p className="mt-0.5 text-stone-700">
                        Another customer ({currentSlotConflict.pendingMatch?.customerName}) has a pending request for this slot. You may still submit your request, and management will review availability before confirming.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Step 3: Optional Add-ons & Catering */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">
                3. Optional Add-ons & Catering
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ADDON_OPTIONS.map(addon => {
                  const isSelected = selectedAddons.includes(addon.id);
                  const isCatering = addon.category === 'catering';
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-start space-x-3 ${
                        isSelected 
                          ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20' 
                          : 'bg-white border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-amber-500 border-amber-500 text-stone-950' : 'border-stone-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <h5 className="font-semibold text-stone-900 text-xs">{addon.name}</h5>
                        <p className="text-[10px] text-stone-500 mt-0.5 leading-snug">{addon.description}</p>
                        <span className="inline-block mt-2 text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                          {isCatering ? 'Optional (Price to be discussed)' : `+RM ${addon.price}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer Details */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">
                4. Customer Contact Info (For Instant Confirmation Alert)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-stone-600 mb-1">Full Name *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Ahmad Razak"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-stone-600 mb-1">Email Address *</label>
                  <input 
                    type="email"
                    required
                    placeholder="ahmad@example.com"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-stone-600 mb-1">Phone Number *</label>
                  <input 
                    type="tel"
                    required
                    placeholder="+60 12-345 6789"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-[11px] text-stone-600 mb-1">Special Equipment / Setup Requests or Notes</label>
                <textarea 
                  rows={2}
                  placeholder="e.g. Need projector connected via HDMI to laptop, whiteboard markers set up, 20 chairs in classroom layout..."
                  value={specialRequests}
                  onChange={e => setSpecialRequests(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Price Summary & Submit Bar */}
            <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
                <div className="space-y-1 w-full">
                  <div className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" /> Rental Package & Price Breakdown
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono font-normal">
                      Standard Rates: Half Day (9am–1pm / 2pm–6pm) RM 149 • Full Day (9am–6pm) RM 299
                    </span>
                  </div>

                  <div className="text-xs text-stone-700 space-y-1.5 mt-2 bg-white p-3 rounded-xl border border-stone-200">
                    <div className="flex items-center justify-between gap-4">
                      <span>• Selected Package ({timeSlot === 'fullday' ? 'Full Day Rental' : 'Half Day Rental'}):</span>
                      <span className="font-mono font-bold text-stone-900">
                        RM {timeSlot === 'fullday' ? currentHall.fullDayRate : currentHall.halfDayRate}
                      </span>
                    </div>

                    {selectedAddons.includes('addon-catering-service') && (
                      <div className="flex items-center justify-between gap-4 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-amber-900 font-medium">
                        <span>• Optional Catering Service:</span>
                        <span className="font-semibold text-xs text-amber-800">Price to be discussed with manager</span>
                      </div>
                    )}

                    {addonsFee > 0 && (
                      <div className="flex items-center justify-between gap-4 pt-1 border-t border-stone-200">
                        <span>• Equipment Add-ons Fee:</span>
                        <span className="font-mono font-semibold text-stone-900">+RM {addonsFee.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-semibold">Estimated Total Cost</span>
                  <div className="text-2xl font-serif font-bold text-stone-900 flex items-baseline gap-2">
                    RM {total.toLocaleString()}
                    <span className="text-xs font-sans text-stone-600 font-normal">
                      (30% Security Deposit: RM {deposit.toLocaleString()})
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isSlotConfirmedBlocked}
                  className={`w-full sm:w-auto font-bold py-3.5 px-8 rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 ${
                    isSlotConfirmedBlocked 
                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300' 
                      : 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-stone-950 active:scale-95'
                  }`}
                >
                {isSubmitting ? (
                  <span>Notifying Management...</span>
                ) : isSlotConfirmedBlocked ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>Slot Blocked by Failsafe</span>
                  </>
                ) : (
                  <>
                    <MailCheck className="w-4 h-4" />
                    <span>Submit Booking & Inform Team</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
        )}

      </div>
    </div>
  );
};
