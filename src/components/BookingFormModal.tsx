import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Clock, Users, Sparkles, Check, CheckCircle2, 
  DollarSign, Mail, Phone, User, FileText, AlertCircle, ArrowRight, ShieldCheck, MailCheck,
  ChevronLeft, ChevronRight, CalendarDays, Receipt, Printer
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
  const [startTime, setStartTime] = useState<string>('09:00');
  const [durationHours, setDurationHours] = useState<number>(4);
  const [guestCount, setGuestCount] = useState<number>(20);
  const [selectedAddons, setSelectedAddons] = useState<string[]>(['addon-projector-extra']);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [specialRequests, setSpecialRequests] = useState<string>('');

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
    if (newSlot === 'morning') {
      setStartTime('09:00');
      setDurationHours(4);
    } else if (newSlot === 'afternoon') {
      setStartTime('13:00');
      setDurationHours(5);
    } else if (newSlot === 'evening') {
      setStartTime('18:00');
      setDurationHours(4);
    } else if (newSlot === 'fullday') {
      setStartTime('09:00');
      setDurationHours(9);
    }
  };

  const updateSlotFromDurationAndStart = (dur: number, start: string) => {
    if (dur >= 8) {
      setTimeSlot('fullday');
    } else {
      const hour = parseInt(start.split(':')[0] || '8', 10);
      if (hour >= 17) {
        setTimeSlot('evening');
      } else if (hour >= 12) {
        setTimeSlot('afternoon');
      } else {
        setTimeSlot('morning');
      }
    }
  };

  const handleDurationChange = (newHours: number) => {
    const hours = Math.max(1, Math.min(12, newHours));
    setDurationHours(hours);
    updateSlotFromDurationAndStart(hours, startTime);
  };

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    updateSlotFromDurationAndStart(durationHours, newStart);
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
    const hoursInfo = calculateBookingHours(startTime, durationHours);
    let standardCost = 0;
    let overtimeCost = 0;
    let baseHallFee = 0;

    if (timeSlot === 'fullday') {
      // Full day package covers standard operating hours 09:00 - 18:00 (9 hrs) at fullDayRate
      standardCost = currentHall.fullDayRate;
      overtimeCost = hoursInfo.overtimeHours * currentHall.overtimeRatePerHour;
      baseHallFee = standardCost + overtimeCost;
    } else {
      standardCost = hoursInfo.standardHours * currentHall.pricePerHour;
      overtimeCost = hoursInfo.overtimeHours * currentHall.overtimeRatePerHour;
      baseHallFee = standardCost + overtimeCost;
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
      standardCost, 
      overtimeCost, 
      standardHours: hoursInfo.standardHours, 
      overtimeHours: hoursInfo.overtimeHours, 
      isOvertimeApplied: hoursInfo.isOvertimeApplied,
      addonsFee, 
      total, 
      deposit 
    };
  };

  const { baseHallFee, standardCost, overtimeCost, standardHours, overtimeHours, isOvertimeApplied, addonsFee, total, deposit } = calculatePricing();

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => 
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    );
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

      onBookingCreated(data.booking, data.notification);
    } catch (err: any) {
      console.error('Booking submission error:', err);
      setErrorMsg(err.message || 'Error connecting to server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-stone-900 border border-amber-900/40 rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header Bar */}
        <div className="bg-stone-950 px-6 py-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-100 text-lg">
                Hall Rental Reservation Form
              </h3>
              <p className="text-xs text-stone-400">
                Reserve your hall date & time • Management receives instant alert
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmation Screen View */}
        {confirmationData ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/50">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-amber-950 text-amber-300 text-xs font-bold border border-amber-800/80 mb-2">
                Booking Reference: {confirmationData.booking.referenceNumber}
              </span>
              <h3 className="font-serif text-2xl font-bold text-white">
                Booking Submission Received!
              </h3>
              <p className="text-xs text-stone-300 mt-2 max-w-md mx-auto">
                Thank you, <strong>{confirmationData.booking.customerName}</strong>. Your reservation request for <strong>{confirmationData.booking.hallName}</strong> has been received and stored.
              </p>
            </div>

            {/* Manager Alert Confirmation Box */}
            <div className="bg-stone-950 p-5 rounded-2xl border border-amber-900/50 text-left space-y-3 max-w-lg mx-auto">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                <MailCheck className="w-4 h-4" />
                <span>Management Notified Immediately!</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                An alert notification email has been dispatched to <strong>wandaniel554@gmail.com</strong> and added to our real-time Manager Alert Dashboard.
              </p>
              <div className="pt-2 border-t border-stone-800 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase block">Event Date</span>
                  <span className="font-semibold text-stone-200">{confirmationData.booking.eventDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase block">Total Estimated</span>
                  <span className="font-semibold text-amber-300">RM {confirmationData.booking.estimatedTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setShowTicketPass(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 text-stone-950 font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                <Receipt className="w-4 h-4" />
                <span>View & Print Official Ticket Pass</span>
              </button>

              <button
                onClick={onClose}
                className="w-full sm:w-auto bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold py-3 px-6 rounded-xl text-sm transition-all"
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
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
            
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-700 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step 1: Hall Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
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
                          ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20' 
                          : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <img src={hall.primaryImage} alt={hall.name} referrerPolicy="no-referrer" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-serif font-bold text-stone-100 text-sm">{hall.name}</h4>
                          {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                        </div>
                        <span className="text-[10px] text-stone-400 block mt-0.5">Capacity: {hall.minCapacity}-{hall.maxCapacity} Guests</span>
                        <span className="text-xs text-amber-300 font-bold block mt-1">RM {hall.pricePerHour}/hr • RM {hall.fullDayRate}/day</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Date, Time & Guest Count */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-stone-300">
                      Event Date *
                    </label>
                  </div>
                  <div className="relative">
                    <input 
                      type="date"
                      value={eventDate}
                      onChange={e => {
                        setEventDate(e.target.value);
                        const parts = e.target.value.split('-').map(Number);
                        if (parts.length === 3) setCalendarViewDate(new Date(parts[0], parts[1] - 1, 1));
                      }}
                      style={{ colorScheme: 'dark' }}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-3 pr-10 py-2 text-stone-100 text-xs focus:border-amber-500 focus:outline-none [color-scheme:dark]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setIsCalendarOpen(prev => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-amber-400 hover:text-amber-300 hover:bg-stone-800/80 transition-colors flex items-center justify-center"
                      title="Open visual calendar picker"
                    >
                      <CalendarDays className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Time Slot Package
                  </label>
                  <select
                    value={timeSlot}
                    onChange={e => handleTimeSlotChange(e.target.value as TimeSlot)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="morning">Morning (08:00 - 12:00)</option>
                    <option value="afternoon">Afternoon (12:00 - 17:00)</option>
                    <option value="evening">Evening (18:00 - 23:00)</option>
                    <option value="fullday">Full-Day Package (All Day Access)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Guest Count ({currentHall.minCapacity} - {currentHall.maxCapacity})
                  </label>
                  <input 
                    type="number"
                    min={currentHall.minCapacity}
                    max={currentHall.maxCapacity}
                    value={guestCount}
                    onChange={e => setGuestCount(Number(e.target.value))}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Interactive Calendar Picker Popup Grid */}
              {isCalendarOpen && (
                <div className="p-4 bg-stone-950 border border-amber-500/40 rounded-xl space-y-3 shadow-2xl animate-fadeIn">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-800">
                    <button
                      type="button"
                      onClick={() => setCalendarViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                      className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 transition-colors flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Prev</span>
                    </button>

                    <span className="font-serif font-bold text-amber-300 text-sm">
                      {calendarViewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>

                    <button
                      type="button"
                      onClick={() => setCalendarViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                      className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 transition-colors flex items-center gap-1"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-stone-400 uppercase tracking-wider">
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
                          confirmedSlots.includes('morning') && confirmedSlots.includes('afternoon') && confirmedSlots.includes('evening')
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
                                ? 'bg-amber-500 text-stone-950 font-bold shadow-lg ring-2 ring-amber-300 scale-105'
                                : isToday
                                ? 'bg-stone-800 text-amber-400 border border-amber-500/50'
                                : isFullDayReserved
                                ? 'bg-red-950/50 text-red-200 border border-red-800/80 hover:bg-red-900/60'
                                : hasConfirmed
                                ? 'bg-amber-950/40 text-amber-200 border border-amber-700/70 hover:bg-amber-900/50'
                                : hasPending
                                ? 'bg-stone-900 text-stone-300 border border-stone-700/60 hover:bg-stone-800'
                                : 'bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-amber-300 border border-stone-800/80'
                            }`}
                          >
                            <span>{d}</span>
                            <div className="flex items-center gap-0.5 mt-0.5">
                              {isFullDayReserved && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                              {!isFullDayReserved && hasConfirmed && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                              {!hasConfirmed && hasPending && <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />}
                              {isToday && !isSelected && !hasConfirmed && !hasPending && <span className="text-[7px] leading-none opacity-80 text-amber-400">Today</span>}
                            </div>
                          </button>
                        );
                      }
                      return cells;
                    })()}
                  </div>

                  <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Open</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Partial Slot Reserved</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Full Day Reserved</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCalendarOpen(false)}
                      className="text-stone-300 hover:text-stone-100 font-medium"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

              {/* Real-time Failsafe Availability Indicator Bar */}
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    Slot Availability on {eventDate} for {currentHall.name}:
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {availabilityData.loading ? 'Checking slots...' : 'Failsafe Verified'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                  {(['morning', 'afternoon', 'evening', 'fullday'] as TimeSlot[]).map(st => {
                    const status = checkSlotOverlap(st);
                    const isConf = !!status.confirmedMatch;
                    const isPend = !!status.pendingMatch;
                    const isSelectedSlot = timeSlot === st;

                    return (
                      <div 
                        key={st}
                        onClick={() => handleTimeSlotChange(st)}
                        className={`cursor-pointer p-2 rounded-lg border flex flex-col justify-between transition-all ${
                          isSelectedSlot ? 'ring-2 ring-amber-500' : ''
                        } ${
                          isConf ? 'bg-red-950/60 border-red-800 text-red-200' :
                          isPend ? 'bg-amber-950/40 border-amber-800 text-amber-200' :
                          'bg-stone-900 border-stone-800 text-emerald-300'
                        }`}
                      >
                        <span className="font-bold capitalize">{st}</span>
                        <span className="font-medium mt-0.5">
                          {isConf ? '🛑 RESERVED' : isPend ? '⚠️ REQUESTED' : '✓ AVAILABLE'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* DOUBLE-BOOKING FAILSAFE BANNER */}
                {isSlotConfirmedBlocked && (
                  <div className="p-3 rounded-xl bg-red-950 border border-red-700 text-red-200 text-xs flex items-start gap-2.5 mt-2 animate-pulse">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-red-300">DOUBLE-BOOKING FAILSAFE ACTIVE</h5>
                      <p className="mt-0.5 text-stone-200">
                        <strong>{currentHall.name}</strong> is <strong>ALREADY CONFIRMED & RESERVED</strong> on <strong>{eventDate}</strong> during the selected slot for <strong>{currentSlotConflict.confirmedMatch?.customerName}</strong> ({currentSlotConflict.confirmedMatch?.referenceNumber}).
                      </p>
                      <p className="mt-1 text-[11px] text-red-300 font-semibold">
                        Please choose a different date or time slot package to proceed.
                      </p>
                    </div>
                  </div>
                )}

                {/* PENDING REQUEST WARNING BANNER */}
                {!isSlotConfirmedBlocked && isSlotPendingWarning && (
                  <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-700 text-amber-200 text-xs flex items-start gap-2.5 mt-2">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-amber-300">Pending Request Notice</h5>
                      <p className="mt-0.5 text-stone-300">
                        Another customer ({currentSlotConflict.pendingMatch?.customerName}) has a pending request for this slot. You may still submit your request, and management will review availability before confirming.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Event Type, Start Time & Duration */}
            <div className="space-y-3">
              {/* Operating Hours Notice Banner */}
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-300 flex items-center gap-2">
                    <span>Standard Operating Hours: 9:00 AM – 6:00 PM</span>
                    <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[10px] uppercase font-mono">
                      Overtime Policy Active
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-300 mt-0.5">
                    Standard rate for {currentHall.name} is <strong>RM {currentHall.pricePerHour}/hr</strong> (9:00 AM – 6:00 PM). Extra hours before 9:00 AM or after 6:00 PM incur overtime charges of <strong>RM {currentHall.overtimeRatePerHour}/hr</strong> (+RM {currentHall.overtimeRatePerHour - currentHall.pricePerHour}/hr extra).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Event Occasion / Type
                  </label>
                  <select
                    value={eventType}
                    onChange={e => setEventType(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:border-amber-500 focus:outline-none"
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
                  <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center justify-between">
                    <span>Start Time</span>
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                  </label>
                  <select
                    value={startTime}
                    onChange={e => handleStartTimeChange(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:border-amber-500 focus:outline-none font-mono"
                  >
                    <option value="07:00">07:00 AM (Early Overtime +RM)</option>
                    <option value="08:00">08:00 AM (Early Overtime +RM)</option>
                    <option value="09:00">09:00 AM (Standard Operating Start)</option>
                    <option value="10:00">10:00 AM (Standard)</option>
                    <option value="11:00">11:00 AM (Standard)</option>
                    <option value="12:00">12:00 PM (Standard)</option>
                    <option value="13:00">01:00 PM (Standard)</option>
                    <option value="14:00">02:00 PM (Standard)</option>
                    <option value="15:00">03:00 PM (Standard)</option>
                    <option value="16:00">04:00 PM (Standard)</option>
                    <option value="17:00">05:00 PM (Standard)</option>
                    <option value="18:00">06:00 PM (Overtime Starts +RM)</option>
                    <option value="19:00">07:00 PM (Overtime +RM)</option>
                    <option value="20:00">08:00 PM (Overtime +RM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center justify-between">
                    <span>Duration (Hours)</span>
                    <span className="text-[10px] text-amber-400 font-normal">1 - 14 hrs</span>
                  </label>
                  <input 
                    type="number"
                    min={1}
                    max={14}
                    value={durationHours}
                    onChange={e => handleDurationChange(Number(e.target.value))}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:border-amber-500 focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              {/* Duration Quick Presets & Live Time Slot Auto-update Indicator */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider mr-1">Quick Duration:</span>
                  {[
                    { label: '2 hrs', hours: 2 },
                    { label: '4 hrs', hours: 4 },
                    { label: '5 hrs', hours: 5 },
                    { label: '9 hrs (Standard Full Day)', hours: 9 },
                    { label: '12 hrs (Incl. 3 hrs OT)', hours: 12 },
                  ].map(preset => (
                    <button
                      key={preset.hours}
                      type="button"
                      onClick={() => handleDurationChange(preset.hours)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        durationHours === preset.hours
                          ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                          : 'bg-stone-900 text-stone-300 hover:bg-stone-800 hover:text-white border border-stone-800'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Auto Time Slot Change Feedback Pill */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-800 text-amber-300 text-[11px] font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>
                    Auto Slot Package: <strong className="text-white uppercase">{timeSlot}</strong> ({durationHours} {durationHours === 1 ? 'hour' : 'hours'})
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3: Add-on Services Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                2. Customize Add-On Equipment & Services (Optional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ADDON_OPTIONS.map(addon => {
                  const isChecked = selectedAddons.includes(addon.id);
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={`cursor-pointer p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                        isChecked 
                          ? 'bg-amber-950/30 border-amber-500/80 text-amber-200' 
                          : 'bg-stone-950/40 border-stone-800 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isChecked ? 'bg-amber-500 border-amber-500 text-stone-950' : 'border-stone-600'}`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <span className="font-semibold block">{addon.name}</span>
                          <span className="text-[10px] text-stone-400">{addon.description}</span>
                        </div>
                      </div>

                      <span className="font-mono text-amber-300 font-bold ml-2 shrink-0">
                        +RM {addon.price}{addon.priceUnit === 'per_guest' ? '/pax' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Customer Details */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                3. Customer Contact Info (For Instant Confirmation Alert)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">Full Name *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Ahmad Razak"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">Email Address *</label>
                  <input 
                    type="email"
                    required
                    placeholder="ahmad@example.com"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">Phone Number *</label>
                  <input 
                    type="tel"
                    required
                    placeholder="+60 12-345 6789"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-[11px] text-stone-400 mb-1">Special Equipment / Setup Requests or Notes</label>
                <textarea 
                  rows={2}
                  placeholder="e.g. Need projector connected via HDMI to laptop, whiteboard markers set up, 20 chairs in classroom layout..."
                  value={specialRequests}
                  onChange={e => setSpecialRequests(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Price Summary & Submit Bar */}
            <div className="bg-stone-950 p-5 rounded-2xl border border-stone-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
                <div className="space-y-1 w-full">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Hourly Rate & Time Breakdown
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono font-normal">
                      Standard Window: 9:00 AM – 6:00 PM
                    </span>
                  </div>

                  <div className="text-xs text-stone-300 space-y-1.5 mt-2 bg-stone-900/60 p-3 rounded-xl border border-stone-800">
                    <div className="flex items-center justify-between gap-4">
                      <span>• Standard Operating Hours (9am–6pm): <strong>{standardHours} hrs</strong> @ RM {currentHall.pricePerHour}/hr</span>
                      <span className="font-mono font-semibold text-stone-200">RM {standardCost.toLocaleString()}</span>
                    </div>

                    {overtimeHours > 0 ? (
                      <div className="flex items-center justify-between gap-4 text-amber-300 font-semibold bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800/60">
                        <span className="flex items-center gap-1.5 text-xs">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          • Extra Overtime Hours (Outside 9am–6pm): <strong>{overtimeHours} hrs</strong> @ RM {currentHall.overtimeRatePerHour}/hr
                        </span>
                        <span className="font-mono font-bold text-amber-300">+RM {overtimeCost.toLocaleString()}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-400 flex items-center gap-1 pt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>All reserved hours fall within standard 9am–6pm operating time. No overtime surcharges applied!</span>
                      </div>
                    )}

                    {addonsFee > 0 && (
                      <div className="flex items-center justify-between gap-4 pt-1 border-t border-stone-800/80">
                        <span>• Add-on Equipment & Catering Services:</span>
                        <span className="font-mono font-semibold text-stone-200">+RM {addonsFee.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Estimated Total Cost</span>
                  <div className="text-2xl font-serif font-bold text-amber-300 flex items-baseline gap-2">
                    RM {total.toLocaleString()}
                    <span className="text-xs font-sans text-stone-400 font-normal">
                      (30% Security Deposit: RM {deposit.toLocaleString()})
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isSlotConfirmedBlocked}
                  className={`w-full sm:w-auto font-bold py-3.5 px-8 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 ${
                    isSlotConfirmedBlocked 
                      ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700' 
                      : 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 text-stone-950 hover:shadow-amber-500/20 active:scale-95'
                  }`}
                >
                {isSubmitting ? (
                  <span>Notifying Management...</span>
                ) : isSlotConfirmedBlocked ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-400" />
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
