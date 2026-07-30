import React, { useState } from 'react';
import { 
  X, Bell, CheckCircle2, Clock, XCircle, Mail, Phone, DollarSign, 
  Trash2, RefreshCw, Filter, ShieldCheck, MailCheck, AlertTriangle, Send, ShieldAlert, Calendar, Check,
  Receipt, Search, Ticket
} from 'lucide-react';
import { BookingRequest, NotificationItem, BookingStatus, HallId, TimeSlot } from '../types';
import { doBookingsOverlap, getHallSlotAvailability } from '../utils/availability';
import { HALLS_DATA } from '../data/hallsData';
import { BookingTicketModal } from './BookingTicketModal';

interface ManagerPortalModalProps {
  bookings: BookingRequest[];
  notifications: NotificationItem[];
  unreadCount: number;
  onClose: () => void;
  onMarkNotificationsRead: () => void;
  onUpdateStatus: (bookingId: string, status: BookingStatus) => void;
  onDeleteBooking: (bookingId: string) => void;
}

export const ManagerPortalModal: React.FC<ManagerPortalModalProps> = ({
  bookings,
  notifications,
  unreadCount,
  onClose,
  onMarkNotificationsRead,
  onUpdateStatus,
  onDeleteBooking
}) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'bookings' | 'scheduleInspector' | 'emailLog'>('notifications');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [inspectorDate, setInspectorDate] = useState<string>('2026-08-15');
  const [viewingTicketBooking, setViewingTicketBooking] = useState<BookingRequest | null>(null);

  const filteredBookings = bookings.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const matchRef = b.referenceNumber.toLowerCase().includes(q);
      const matchName = b.customerName.toLowerCase().includes(q);
      const matchEmail = b.customerEmail.toLowerCase().includes(q);
      const matchHall = b.hallName.toLowerCase().includes(q);
      return matchRef || matchName || matchEmail || matchHall;
    }
    return true;
  });

  const totalRevenue = bookings
    .filter(b => b.status !== 'declined')
    .reduce((sum, b) => sum + b.estimatedTotal, 0);

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-stone-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header Bar */}
        <div className="bg-stone-950 px-6 py-5 border-b border-stone-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full"></span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-stone-100 text-xl">
                  Hall Owner & Manager Portal
                </h3>
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                  Live Notifications Active
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Real-time booking alert dashboard • Management Email: <strong className="text-amber-300">wandaniel554@gmail.com</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkNotificationsRead}
                className="px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark All Notifications Read
              </button>
            )}

            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Summary Metrics Bar */}
        <div className="bg-stone-950/60 px-6 py-4 border-b border-stone-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
            <span className="text-[10px] text-stone-400 uppercase font-medium">Total Bookings</span>
            <div className="text-xl font-bold font-serif text-white mt-0.5">{bookings.length}</div>
          </div>

          <div className="p-3 rounded-xl bg-stone-900 border border-amber-900/50">
            <span className="text-[10px] text-amber-400 uppercase font-medium">Pending Approvals</span>
            <div className="text-xl font-bold font-serif text-amber-300 mt-0.5">{pendingCount} Action Needed</div>
          </div>

          <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
            <span className="text-[10px] text-stone-400 uppercase font-medium">Estimated Revenue</span>
            <div className="text-xl font-bold font-serif text-emerald-400 mt-0.5">RM {totalRevenue.toLocaleString()}</div>
          </div>

          <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
            <span className="text-[10px] text-stone-400 uppercase font-medium">Alert Receiver</span>
            <div className="text-xs font-semibold text-stone-200 mt-1 truncate" title="wandaniel554@gmail.com">
              wandaniel554@gmail.com
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 border-b border-stone-800 flex flex-wrap gap-4 sm:gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'notifications' 
                ? 'border-amber-400 text-amber-300' 
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Alert Feed ({notifications.length})</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px]">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'bookings' 
                ? 'border-amber-400 text-amber-300' 
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Manage All Bookings ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('scheduleInspector')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'scheduleInspector' 
                ? 'border-amber-400 text-amber-300' 
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Failsafe Schedule Inspector</span>
          </button>

          <button
            onClick={() => setActiveTab('emailLog')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'emailLog' 
                ? 'border-amber-400 text-amber-300' 
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <MailCheck className="w-4 h-4" />
            <span>Simulated Email Logs</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          
          {/* TAB 1: NOTIFICATION FEED */}
          {activeTab === 'notifications' && (
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-xs">
                  No notifications recorded yet.
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      !notif.read 
                        ? 'bg-amber-950/40 border-amber-500/80 shadow-lg' 
                        : 'bg-stone-950/60 border-stone-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-amber-900 text-amber-200 text-[10px] font-bold font-mono">
                          {notif.referenceNumber}
                        </span>
                        <h4 className="font-bold text-stone-100 text-sm">{notif.title}</h4>
                      </div>

                      <span className="text-[10px] text-stone-400">
                        {new Date(notif.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-stone-300 mt-2">
                      {notif.message}
                    </p>

                    <div className="mt-3 pt-2 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-400">
                      <span className="flex items-center gap-1">
                        <MailCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Alert sent to: <strong className="text-stone-200">{notif.emailSentTo}</strong>
                      </span>

                      <span className="text-amber-300 font-semibold">
                        Customer: {notif.customerName}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: MANAGE ALL BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              
              {/* Filter & Search Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs bg-stone-950 p-3 rounded-2xl border border-stone-800">
                
                {/* Search Bar */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search by Ticket ID (e.g. NHC-2026-X9K3), Name, or Hall..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-9 pr-3 py-1.5 text-stone-100 text-xs focus:border-amber-500 focus:outline-none placeholder:text-stone-500 font-mono"
                  />
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2 text-stone-400 hover:text-white text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Status Filter Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-stone-400 text-[11px]">Filter:</span>
                  {['all', 'pending', 'confirmed', 'declined'].map(st => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 rounded-lg uppercase text-[10px] font-bold transition-colors ${
                        statusFilter === st 
                          ? 'bg-amber-500 text-stone-950' 
                          : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bookings List */}
              <div className="space-y-3">
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-12 text-stone-400 text-xs">
                    No bookings found for filter "{statusFilter}".
                  </div>
                ) : (
                  filteredBookings.map(b => {
                    // Check if this booking conflicts with another confirmed booking
                    const conflictingConfirmed = bookings.find(
                      cb => cb.id !== b.id && cb.status === 'confirmed' && doBookingsOverlap(b, cb)
                    );

                    return (
                      <div
                        key={b.id}
                        className={`p-4 rounded-2xl bg-stone-950 border transition-all space-y-3 ${
                          conflictingConfirmed && b.status !== 'confirmed' 
                            ? 'border-red-600/80 ring-1 ring-red-500/30' 
                            : 'border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        {/* CONFLICT ALERT BANNER */}
                        {conflictingConfirmed && b.status !== 'confirmed' && (
                          <div className="p-3 rounded-xl bg-red-950/90 border border-red-700 text-red-200 text-xs flex items-start gap-2 animate-pulse">
                            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-red-300 block font-bold">🚨 FAILSAFE CONFLICT DETECTED</strong>
                              <span>
                                <strong>{conflictingConfirmed.customerName}</strong> ({conflictingConfirmed.referenceNumber}) is <strong>ALREADY CONFIRMED</strong> for <strong>{b.hallName}</strong> on <strong>{b.eventDate} ({conflictingConfirmed.timeSlot.toUpperCase()})</strong>.
                              </span>
                              <span className="block mt-1 text-[10px] text-red-300 font-semibold">
                                Approving this request will be automatically BLOCKED by the double-booking failsafe system.
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-mono text-xs font-bold text-amber-400 mr-2">{b.referenceNumber}</span>
                            <span className="font-serif font-bold text-white text-sm">{b.hallName}</span>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            b.status === 'confirmed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                            b.status === 'declined' ? 'bg-red-950 text-red-300 border border-red-800' :
                            'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {b.status}
                          </span>
                        </div>

                        {/* Details Matrix */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-stone-900/80 p-3 rounded-xl border border-stone-800">
                          <div>
                            <span className="text-[10px] text-stone-400 block">Customer Name</span>
                            <span className="font-semibold text-stone-200">{b.customerName}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-400 block">Contact Info</span>
                            <span className="text-stone-300">{b.customerEmail}</span>
                            <span className="block text-[10px] text-stone-400">{b.customerPhone}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-400 block">Date & Slot</span>
                            <span className="font-semibold text-amber-300">{b.eventDate} ({b.timeSlot})</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-400 block">Guests & Total</span>
                            <span className="font-bold text-emerald-400">{b.guestCount} Guests • RM {b.estimatedTotal.toLocaleString()}</span>
                          </div>
                        </div>

                        {b.specialRequests && (
                          <p className="text-[11px] text-stone-400 italic bg-stone-900/50 p-2 rounded-lg border border-stone-800">
                            Special Requests: "{b.specialRequests}"
                          </p>
                        )}

                        {/* Quick Manager Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800 text-xs">
                          <span className="text-[10px] text-stone-400">Created: {new Date(b.createdAt).toLocaleDateString()}</span>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setViewingTicketBooking(b)}
                              className="px-3 py-1 rounded-lg bg-stone-800 hover:bg-amber-950 text-amber-300 border border-stone-700 hover:border-amber-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                              title="View and print official booking ticket pass"
                            >
                              <Receipt className="w-3.5 h-3.5 text-amber-400" />
                              <span>View Ticket Pass</span>
                            </button>

                            {b.status !== 'confirmed' && (
                              <button
                                onClick={() => onUpdateStatus(b.id, 'confirmed')}
                                className={`px-3 py-1 rounded-lg border text-xs font-bold transition-colors flex items-center gap-1 ${
                                  conflictingConfirmed 
                                    ? 'bg-red-950/80 hover:bg-red-900 text-red-200 border-red-700' 
                                    : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-800'
                                }`}
                                title={conflictingConfirmed ? "Failsafe will block approval due to conflict" : "Approve Booking"}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> 
                                {conflictingConfirmed ? 'Attempt Approve (Failsafe Protected)' : 'Approve Booking'}
                              </button>
                            )}

                            {b.status !== 'declined' && (
                              <button
                                onClick={() => onUpdateStatus(b.id, 'declined')}
                                className="px-3 py-1 rounded-lg bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Decline
                              </button>
                            )}

                            <button
                              onClick={() => onDeleteBooking(b.id)}
                              className="p-1.5 rounded-lg bg-stone-900 hover:bg-red-950 text-stone-400 hover:text-red-300 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* TAB 3: FAILSAFE SCHEDULE INSPECTOR */}
          {activeTab === 'scheduleInspector' && (
            <div className="space-y-5 text-xs">
              
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-amber-900/60 text-amber-300">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-stone-100 text-sm">Failsafe Date Inspector</h4>
                    <p className="text-stone-300 text-[11px] mt-0.5">
                      Select any calendar date to inspect reserved slots, pending requests, and failsafe status across both halls.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <label className="text-stone-300 font-semibold text-[11px]">Inspect Date:</label>
                  <input
                    type="date"
                    value={inspectorDate}
                    onChange={e => setInspectorDate(e.target.value)}
                    className="bg-stone-950 border border-amber-500/80 rounded-xl px-3 py-1.5 text-amber-300 font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Hall Side-By-Side Availability Inspector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {HALLS_DATA.map(hall => {
                  const availability = getHallSlotAvailability(hall.id, inspectorDate, bookings);

                  return (
                    <div key={hall.id} className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                        <div className="flex items-center space-x-2">
                          <img src={hall.primaryImage} alt={hall.name} referrerPolicy="no-referrer" className="w-10 h-10 rounded-lg object-cover" />
                          <div>
                            <h5 className="font-serif font-bold text-white text-sm">{hall.name}</h5>
                            <span className="text-[10px] text-stone-400">Date: {inspectorDate}</span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          availability.hasConfirmedBooking
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {availability.hasConfirmedBooking ? 'Has Confirmed Booking' : 'All Slots Open'}
                        </span>
                      </div>

                      {/* Slots Grid */}
                      <div className="space-y-2">
                        {(['morning', 'afternoon', 'evening', 'fullday'] as TimeSlot[]).map(st => {
                          const slotInfo = availability[st];
                          const matchingBooking = slotInfo.booking;
                          const isConf = matchingBooking?.status === 'confirmed';
                          const isPend = matchingBooking?.status === 'pending';

                          return (
                            <div key={st} className={`p-2.5 rounded-xl border flex items-center justify-between ${
                              isConf ? 'bg-red-950/50 border-red-800 text-red-200' :
                              isPend ? 'bg-amber-950/40 border-amber-800 text-amber-200' :
                              'bg-stone-900 border-stone-800 text-stone-300'
                            }`}>
                              <div>
                                <span className="font-bold capitalize block text-xs">{st} Slot</span>
                                {matchingBooking ? (
                                  <span className="text-[10px] opacity-80 block">
                                    {matchingBooking.customerName} ({matchingBooking.referenceNumber})
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-emerald-400 block">Open for booking</span>
                                )}
                              </div>

                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                isConf ? 'bg-red-900 text-white' :
                                isPend ? 'bg-amber-900 text-amber-200' :
                                'bg-emerald-900/80 text-emerald-300'
                              }`}>
                                {isConf ? '🛑 Confirmed' : isPend ? '⚠️ Pending' : '✓ Open'}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 4: SIMULATED EMAIL LOGS */}
          {activeTab === 'emailLog' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/60 text-xs text-amber-200 flex items-center gap-2">
                <MailCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Below is the exact email notification payload formatted and sent to <strong>wandaniel554@gmail.com</strong> whenever a customer places a booking request on the website.</span>
              </div>

              {notifications.map((n, i) => (
                <div key={i} className="p-4 rounded-xl bg-stone-950 border border-stone-800 font-mono text-xs space-y-2">
                  <div className="text-amber-400 font-bold border-b border-stone-800 pb-2 flex justify-between">
                    <span>TO: wandaniel554@gmail.com</span>
                    <span className="text-stone-400 font-normal">{new Date(n.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-stone-200 font-semibold">SUBJECT: {n.title} [{n.referenceNumber}]</div>
                  <div className="text-stone-300 whitespace-pre-wrap bg-stone-900 p-3 rounded border border-stone-800 text-[11px]">
{`ALERT: Customer Booking Received!

Reference: ${n.referenceNumber}
Customer Name: ${n.customerName}
Hall Selected: ${n.hallName}
Event Date: ${n.eventDate}
Estimated Revenue: RM ${n.estimatedTotal.toLocaleString()}

Message: ${n.message}
Target Manager: wandaniel554@gmail.com`}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {viewingTicketBooking && (
          <BookingTicketModal
            booking={viewingTicketBooking}
            onClose={() => setViewingTicketBooking(null)}
          />
        )}

      </div>
    </div>
  );
};
