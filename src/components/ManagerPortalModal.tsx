import React, { useState } from 'react';
import { 
  X, Bell, CheckCircle2, Clock, XCircle, Mail, Phone, DollarSign, 
  Trash2, RefreshCw, Filter, ShieldCheck, MailCheck, AlertTriangle, Send, ShieldAlert, Calendar, Check,
  Receipt, Search, Ticket, Image, Upload, Plus, RotateCcw, Camera, ChevronLeft, ChevronRight, Star
} from 'lucide-react';
import { BookingRequest, NotificationItem, BookingStatus, PaymentStatus, HallId, TimeSlot, Hall } from '../types';
import { doBookingsOverlap, getHallSlotAvailability } from '../utils/availability';
import { HALLS_DATA } from '../data/hallsData';
import { cleanImageUrl, compressImageFile } from '../utils/imageUtils';
import { BookingTicketModal } from './BookingTicketModal';

interface ManagerPortalModalProps {
  bookings: BookingRequest[];
  notifications: NotificationItem[];
  unreadCount: number;
  halls?: Hall[];
  onClose: () => void;
  onMarkNotificationsRead: () => void;
  onUpdateStatus: (bookingId: string, status: BookingStatus) => void;
  onUpdatePayment: (
    bookingId: string, 
    paymentData: { 
      paymentStatus: PaymentStatus;
      paymentMethod?: string;
      paidAmount?: number;
      paymentReceiptRef?: string;
      paymentNotes?: string;
      autoApprove?: boolean;
    }
  ) => void;
  onDeleteBooking: (bookingId: string) => void;
  onUpdateHallImages?: (hallId: string, primaryImage?: string, secondaryImages?: string[]) => Promise<void>;
  onResetHallImages?: (hallId: string) => Promise<void>;
}

export const ManagerPortalModal: React.FC<ManagerPortalModalProps> = ({
  bookings,
  notifications,
  unreadCount,
  halls = HALLS_DATA,
  onClose,
  onMarkNotificationsRead,
  onUpdateStatus,
  onUpdatePayment,
  onDeleteBooking,
  onUpdateHallImages = async (_hallId: string, _primaryImage?: string, _secondaryImages?: string[]) => {},
  onResetHallImages = async (_hallId: string) => {}
}) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'bookings' | 'scheduleInspector' | 'photos' | 'emailLog'>('notifications');
  const [selectedHallForMedia, setSelectedHallForMedia] = useState<HallId>('hall-b');
  const [uploadingState, setUploadingState] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState<{ [key: string]: string }>({});

  const handleFileSelectForPrimary = async (hall: Hall, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingState(`Uploading cover image for ${hall.name}...`);
    try {
      const dataUrl = await compressImageFile(file);
      if (dataUrl) {
        await onUpdateHallImages(hall.id, dataUrl, hall.secondaryImages);
      }
    } catch (err) {
      console.error('Error compressing primary image:', err);
    } finally {
      setUploadingState(null);
    }
  };

  const handleFileSelectForSecondary = async (hall: Hall, index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingState(`Uploading photo ${index + 1} for ${hall.name}...`);
    try {
      const dataUrl = await compressImageFile(file);
      if (dataUrl) {
        const updatedSecondary = [...hall.secondaryImages];
        updatedSecondary[index] = dataUrl;
        await onUpdateHallImages(hall.id, hall.primaryImage, updatedSecondary);
      }
    } catch (err) {
      console.error('Error compressing secondary image:', err);
    } finally {
      setUploadingState(null);
    }
  };

  const handleAddSecondaryPhoto = async (hall: Hall, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingState(`Adding photo to ${hall.name}...`);
    try {
      const dataUrl = await compressImageFile(file);
      if (dataUrl) {
        const updatedSecondary = [...hall.secondaryImages, dataUrl];
        await onUpdateHallImages(hall.id, hall.primaryImage, updatedSecondary);
      }
    } catch (err) {
      console.error('Error compressing added photo:', err);
    } finally {
      setUploadingState(null);
    }
  };

  const handleRemoveSecondaryPhoto = async (hall: Hall, index: number) => {
    setUploadingState(`Deleting photo ${index + 1}...`);
    try {
      const updatedSecondary = hall.secondaryImages.filter((_, idx) => idx !== index);
      await onUpdateHallImages(hall.id, hall.primaryImage, updatedSecondary);
    } catch (err) {
      console.error('Error removing secondary photo:', err);
    } finally {
      setUploadingState(null);
    }
  };

  const handleMoveSecondaryPhoto = async (hall: Hall, index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= hall.secondaryImages.length) return;

    setUploadingState(`Moving photo ${index + 1}...`);
    try {
      const updatedSecondary = [...hall.secondaryImages];
      [updatedSecondary[index], updatedSecondary[nextIndex]] = [updatedSecondary[nextIndex], updatedSecondary[index]];
      await onUpdateHallImages(hall.id, hall.primaryImage, updatedSecondary);
    } catch (err) {
      console.error('Error reordering secondary photos:', err);
    } finally {
      setUploadingState(null);
    }
  };

  const handleMakePrimaryPhoto = async (hall: Hall, index: number) => {
    setUploadingState(`Setting photo ${index + 1} as the cover...`);
    try {
      const updatedSecondary = [...hall.secondaryImages];
      const [newPrimary] = updatedSecondary.splice(index, 1);
      if (hall.primaryImage) updatedSecondary.unshift(hall.primaryImage);
      await onUpdateHallImages(hall.id, newPrimary, updatedSecondary);
    } catch (err) {
      console.error('Error setting primary photo:', err);
    } finally {
      setUploadingState(null);
    }
  };

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [inspectorDate, setInspectorDate] = useState<string>('2026-08-15');
  const [viewingTicketBooking, setViewingTicketBooking] = useState<BookingRequest | null>(null);
  
  // Payment Modal State
  const [confirmingPaymentBooking, setConfirmingPaymentBooking] = useState<BookingRequest | null>(null);
  const [payStatus, setPayStatus] = useState<PaymentStatus>('fully_paid');
  const [payMethod, setPayMethod] = useState<string>('Instant Online Bank Transfer');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payReceiptRef, setPayReceiptRef] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [payAutoApprove, setPayAutoApprove] = useState<boolean>(true);

  const openPaymentDialog = (booking: BookingRequest) => {
    setConfirmingPaymentBooking(booking);
    const initialStatus = booking.paymentStatus || 'fully_paid';
    setPayStatus(initialStatus);
    setPayMethod(booking.paymentMethod || 'Instant Online Bank Transfer');
    const initialAmount = booking.paidAmount !== undefined 
      ? booking.paidAmount 
      : (initialStatus === 'deposit_paid' ? booking.depositAmount : booking.estimatedTotal);
    setPayAmount(initialAmount);
    setPayReceiptRef(booking.paymentReceiptRef || `REC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`);
    setPayNotes(booking.paymentNotes || '');
    setPayAutoApprove(booking.status === 'pending');
  };

  const handlePayStatusChange = (newStatus: PaymentStatus, booking: BookingRequest) => {
    setPayStatus(newStatus);
    if (newStatus === 'fully_paid') {
      setPayAmount(booking.estimatedTotal);
    } else if (newStatus === 'deposit_paid') {
      setPayAmount(booking.depositAmount);
    } else {
      setPayAmount(0);
    }
  };

  const handleConfirmPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingPaymentBooking) return;

    onUpdatePayment(confirmingPaymentBooking.id, {
      paymentStatus: payStatus,
      paymentMethod: payMethod,
      paidAmount: Number(payAmount),
      paymentReceiptRef: payReceiptRef,
      paymentNotes: payNotes,
      autoApprove: payAutoApprove
    });

    setConfirmingPaymentBooking(null);
  };

  const filteredBookings = bookings.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    
    if (paymentFilter !== 'all') {
      const bPayStatus = b.paymentStatus || 'unpaid';
      if (paymentFilter === 'unpaid' && bPayStatus !== 'unpaid') return false;
      if (paymentFilter === 'deposit_paid' && bPayStatus !== 'deposit_paid') return false;
      if (paymentFilter === 'fully_paid' && bPayStatus !== 'fully_paid') return false;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const matchRef = b.referenceNumber.toLowerCase().includes(q);
      const matchName = b.customerName.toLowerCase().includes(q);
      const matchEmail = b.customerEmail.toLowerCase().includes(q);
      const matchHall = b.hallName.toLowerCase().includes(q);
      const matchReceipt = (b.paymentReceiptRef || '').toLowerCase().includes(q);
      return matchRef || matchName || matchEmail || matchHall || matchReceipt;
    }
    return true;
  });

  const totalCollectedRevenue = bookings
    .filter(b => b.status !== 'declined')
    .reduce((sum, b) => {
      if (b.paidAmount) return sum + b.paidAmount;
      if (b.paymentStatus === 'fully_paid') return sum + b.estimatedTotal;
      if (b.paymentStatus === 'deposit_paid') return sum + b.depositAmount;
      return sum;
    }, 0);

  const totalRevenue = bookings
    .filter(b => b.status !== 'declined')
    .reduce((sum, b) => sum + b.estimatedTotal, 0);

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header Bar */}
        <div className="bg-stone-50 px-6 py-5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
              <Bell className="w-5 h-5 text-amber-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-600 rounded-full"></span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-stone-900 text-xl">
                  Hall Owner & Manager Portal
                </h3>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                  Live Notifications Active
                </span>
              </div>
              <p className="text-xs text-stone-600">
                Real-time booking alert dashboard • Management Email: <strong className="text-amber-800">wandaniel554@gmail.com</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkNotificationsRead}
                className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" /> Mark All Notifications Read
              </button>
            )}

            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Summary Metrics Bar */}
        <div className="bg-stone-50/60 px-6 py-4 border-b border-stone-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-white border border-stone-200 shadow-xs">
            <span className="text-[10px] text-stone-500 uppercase font-semibold">Total Bookings</span>
            <div className="text-xl font-bold font-serif text-stone-900 mt-0.5">{bookings.length}</div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-amber-300 shadow-xs">
            <span className="text-[10px] text-amber-800 uppercase font-semibold">Pending Approvals</span>
            <div className="text-xl font-bold font-serif text-amber-700 mt-0.5">{pendingCount} Action Needed</div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-emerald-300 shadow-xs">
            <span className="text-[10px] text-emerald-800 uppercase font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Confirmed Payments
            </span>
            <div className="text-xl font-bold font-serif text-emerald-700 mt-0.5">RM {totalCollectedRevenue.toLocaleString()}</div>
            <span className="text-[9px] text-stone-500 font-medium">Total Est: RM {totalRevenue.toLocaleString()}</span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-stone-200 shadow-xs">
            <span className="text-[10px] text-stone-500 uppercase font-semibold">Alert Receiver</span>
            <div className="text-xs font-bold text-stone-800 mt-1 truncate" title="wandaniel554@gmail.com">
              wandaniel554@gmail.com
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 border-b border-stone-200 flex flex-wrap gap-4 sm:gap-6 text-xs font-bold bg-white">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'notifications' 
                ? 'border-amber-500 text-amber-900' 
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-600" />
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
                ? 'border-amber-500 text-amber-900' 
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Manage All Bookings ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('scheduleInspector')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'scheduleInspector' 
                ? 'border-amber-500 text-amber-900' 
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Failsafe Schedule Inspector</span>
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'photos' 
                ? 'border-amber-500 text-amber-900' 
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Camera className="w-4 h-4 text-amber-600" />
            <span>🖼️ Manage Hall Photos</span>
          </button>

          <button
            onClick={() => setActiveTab('emailLog')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'emailLog' 
                ? 'border-amber-500 text-amber-900' 
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <MailCheck className="w-4 h-4 text-amber-600" />
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
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs bg-stone-950 p-3 rounded-2xl border border-stone-800">
                
                {/* Search Bar */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search by Ticket ID (e.g. BK-2026-X9K3), Receipt (REC-...), Name, or Hall..."
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

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Schedule Status Filter */}
                  <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-xl border border-stone-800">
                    <span className="text-stone-400 text-[10px] uppercase font-bold px-1.5">Schedule:</span>
                    {['all', 'pending', 'confirmed', 'declined'].map(st => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-2.5 py-1 rounded-lg uppercase text-[10px] font-bold transition-colors ${
                          statusFilter === st 
                            ? 'bg-amber-500 text-stone-950' 
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {/* Payment Status Filter */}
                  <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-xl border border-stone-800">
                    <span className="text-stone-400 text-[10px] uppercase font-bold px-1.5">Payment:</span>
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'fully_paid', label: '🟢 Fully Paid' },
                      { id: 'deposit_paid', label: '🟡 Deposit' },
                      { id: 'unpaid', label: '🔴 Unpaid' }
                    ].map(pf => (
                      <button
                        key={pf.id}
                        onClick={() => setPaymentFilter(pf.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                          paymentFilter === pf.id 
                            ? 'bg-emerald-500 text-stone-950' 
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {pf.label}
                      </button>
                    ))}
                  </div>
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
                          <div className="p-3 rounded-xl bg-red-950/90 border border-red-700 text-red-200 text-xs flex items-start gap-2">
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

                        {/* Confirmed Payment Details Bar */}
                        <div className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] uppercase font-bold text-stone-400">Payment Status:</span>
                            {b.paymentStatus === 'fully_paid' && (
                              <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Fully Paid (RM {(b.paidAmount || b.estimatedTotal).toLocaleString()})
                              </span>
                            )}
                            {b.paymentStatus === 'deposit_paid' && (
                              <span className="bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                <Receipt className="w-3 h-3 text-amber-400" /> Deposit Paid (RM {(b.paidAmount || b.depositAmount).toLocaleString()})
                              </span>
                            )}
                            {(!b.paymentStatus || b.paymentStatus === 'unpaid') && (
                              <span className="bg-stone-800 text-stone-400 border border-stone-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                Unpaid (RM 0 Collected)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-stone-300">
                            {b.paymentReceiptRef && (
                              <span className="font-mono text-amber-300 font-semibold">
                                Receipt: {b.paymentReceiptRef}
                              </span>
                            )}
                            {b.paymentMethod && (
                              <span className="text-stone-400 text-[10px]">
                                Via {b.paymentMethod}
                              </span>
                            )}
                            <button
                              onClick={() => openPaymentDialog(b)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[11px] font-bold transition-colors flex items-center gap-1"
                            >
                              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{b.paymentStatus && b.paymentStatus !== 'unpaid' ? 'Edit Payment' : 'Confirm Payment'}</span>
                            </button>
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
                          <img src={cleanImageUrl(hall.primaryImage, (hall.id === 'hall-alpha' || hall.id.includes('alpha') || hall.id.includes('grand')) ? '/images/hall_alpha.jpeg' : '/images/hall_b_panoramic.jpeg')} alt={hall.name} referrerPolicy="no-referrer" className="w-10 h-10 rounded-lg object-cover" />
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
                        {(['morning', 'afternoon', 'fullday'] as TimeSlot[]).map(st => {
                          const slotInfo = availability[st];
                          const matchingBooking = slotInfo?.booking;
                          const isConf = matchingBooking?.status === 'confirmed';
                          const isPend = matchingBooking?.status === 'pending';
                          const slotLabel = st === 'morning' ? 'Morning Half Day (09:00 - 13:00)' : st === 'afternoon' ? 'Afternoon Half Day (14:00 - 18:00)' : 'Full Day Package (09:00 - 18:00)';

                          return (
                            <div key={st} className={`p-2.5 rounded-xl border flex items-center justify-between ${
                              isConf ? 'bg-red-950/50 border-red-800 text-red-200' :
                              isPend ? 'bg-amber-950/40 border-amber-800 text-amber-200' :
                              'bg-stone-900 border-stone-800 text-stone-300'
                            }`}>
                              <div>
                                <span className="font-bold block text-xs">{slotLabel}</span>
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

          {/* TAB 5: MANAGE HALL PHOTOS (ADMIN UPLOAD & REPLACE) */}
          {activeTab === 'photos' && (
            <div className="space-y-6">
              
              {/* Info banner */}
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs flex items-start gap-3 shadow-md">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-bold text-amber-300 text-sm">Real-Time Hall Photo & Media Manager</h4>
                  <p className="text-stone-300 leading-relaxed">
                    Upload new photos or replace existing primary cover photos and secondary views for both <strong>Alpha Hall</strong> and <strong>Hall B</strong>. Any photo uploaded here is saved to the server and <strong>updates live instantly on the client website</strong>!
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              {uploadingState && (
                <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs flex items-center gap-2 animate-pulse font-bold">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{uploadingState}</span>
                </div>
              )}

              {/* Hall Selector Tabs */}
              <div className="flex items-center space-x-3 border-b border-stone-800 pb-3">
                {halls.map(hall => (
                  <button
                    key={hall.id}
                    onClick={() => setSelectedHallForMedia(hall.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                      selectedHallForMedia === hall.id
                        ? 'bg-amber-500 text-stone-950 shadow-lg scale-102'
                        : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800'
                    }`}
                  >
                    <Image className="w-4 h-4" />
                    <span>{hall.name} Media</span>
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-stone-950/40">
                      {1 + (hall.secondaryImages?.length || 0)} Photos
                    </span>
                  </button>
                ))}
              </div>

              {/* Selected Hall Photos Content */}
              {halls.filter(h => h.id === selectedHallForMedia).map(hall => (
                <div key={hall.id} className="space-y-6">
                  
                  {/* Hall Header & Reset Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/90 p-4 rounded-2xl border border-stone-800">
                    <div>
                      <h4 className="font-serif font-bold text-stone-100 text-lg flex items-center gap-2">
                        <span>{hall.name}</span>
                        <span className="text-xs font-sans font-normal text-amber-400 bg-amber-950/60 border border-amber-800 px-2.5 py-0.5 rounded-full">
                          {hall.badgeText || hall.tagline}
                        </span>
                      </h4>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Replace cover photo, update interior gallery views, or add extra venue photos.
                      </p>
                    </div>

                    <button
                      onClick={async () => {
                        if (confirm(`Reset all photos for ${hall.name} back to default?`)) {
                          setUploadingState(`Resetting ${hall.name} photos...`);
                          await onResetHallImages(hall.id);
                          setUploadingState(null);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-red-950/50 hover:border-red-600/50 text-stone-300 hover:text-red-300 border border-stone-700 text-xs font-semibold transition-all flex items-center space-x-1.5 self-start sm:self-auto"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Reset Hall Photos</span>
                    </button>
                  </div>

                  {/* SECTION 1: PRIMARY COVER IMAGE */}
                  <div className="p-5 rounded-2xl bg-stone-950 border border-stone-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
                      <div>
                        <h5 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                          <span>🌟 Primary Main Cover Image</span>
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono uppercase">
                            Main Card Banner
                          </span>
                        </h5>
                        <p className="text-[11px] text-stone-400">
                          This is the main hero/card photo visible on the main page.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      {/* Image Preview */}
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-stone-700 bg-stone-900 group">
                        <img 
                          src={cleanImageUrl(hall.primaryImage, (hall.id === 'hall-alpha' || hall.id.includes('alpha') || hall.id.includes('grand')) ? '/images/hall_alpha.jpeg' : '/images/hall_b_panoramic.jpeg')} 
                          alt={`${hall.name} Cover`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2.5">
                          <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                            Current Cover Image
                          </span>
                        </div>
                      </div>

                      {/* Controls & Upload Input */}
                      <div className="md:col-span-2 space-y-3">
                        <label className="block">
                          <span className="text-xs font-bold text-stone-300 mb-1.5 block">
                            📁 Upload New Cover Image File from Device
                          </span>
                          <div className="relative flex items-center">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleFileSelectForPrimary(hall, e)}
                              className="hidden" 
                              id={`primary-upload-${hall.id}`}
                            />
                            <label
                              htmlFor={`primary-upload-${hall.id}`}
                              className="w-full cursor-pointer px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-amber-500/20"
                            >
                              <Upload className="w-4 h-4" />
                              <span>Select Image File from Computer / Mobile</span>
                            </label>
                          </div>
                        </label>

                        {/* Or Paste URL */}
                        <div className="pt-2 border-t border-stone-800/80">
                          <span className="text-[11px] text-stone-400 block mb-1">
                            or Paste Direct Image URL:
                          </span>
                          <div className="flex gap-2">
                            <input 
                              type="url"
                              placeholder="https://example.com/hall-photo.jpg"
                              value={urlInput[`primary-${hall.id}`] || ''}
                              onChange={(e) => setUrlInput(prev => ({ ...prev, [`primary-${hall.id}`]: e.target.value }))}
                              className="flex-1 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                const url = urlInput[`primary-${hall.id}`];
                                if (url) {
                                  setUploadingState('Applying cover image URL...');
                                  await onUpdateHallImages(hall.id, url, hall.secondaryImages);
                                  setUrlInput(prev => ({ ...prev, [`primary-${hall.id}`]: '' }));
                                  setUploadingState(null);
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-all border border-stone-700"
                            >
                              Apply URL
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: SECONDARY / GALLERY VIEWS */}
                  <div className="p-5 rounded-2xl bg-stone-950 border border-stone-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800/80 pb-3">
                      <div>
                        <h5 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                          <span>📸 Secondary Interior Gallery Views ({hall.secondaryImages?.length || 0})</span>
                        </h5>
                        <p className="text-[11px] text-stone-400">
                          These photos appear in this order on the client site. Use the arrows to rearrange them, or set one as the cover.
                        </p>
                      </div>

                      {/* Add Extra Gallery Photo Button */}
                      <div>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleAddSecondaryPhoto(hall, e)}
                          className="hidden" 
                          id={`add-gallery-${hall.id}`}
                        />
                        <label
                          htmlFor={`add-gallery-${hall.id}`}
                          className="cursor-pointer px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center space-x-1.5 shadow-md"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add New Gallery Photo</span>
                        </label>
                      </div>
                    </div>

                    {/* Secondary Photos Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {hall.secondaryImages.map((imgUrl, idx) => {
                        const isView1 = imgUrl.toLowerCase().includes('view_one') || imgUrl.toLowerCase().includes('view_1') || imgUrl.toLowerCase().includes('hall_b_1');
                        const isView2 = imgUrl.toLowerCase().includes('view_two') || imgUrl.toLowerCase().includes('view_2') || imgUrl.toLowerCase().includes('hall_b_2');
                        const isSurau = imgUrl.toLowerCase().includes('surau');
                        
                        const labelText = isView1 ? 'View 1 (Tables & Mics)' : isView2 ? 'View 2 (Lounge & Sofas)' : isSurau ? 'Surau Facility' : `Gallery View ${idx + 1}`;

                        return (
                          <div key={`${imgUrl}-${idx}`} className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-3 flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="relative aspect-video rounded-lg overflow-hidden border border-stone-700 bg-black group">
                                <img 
                                  src={cleanImageUrl(imgUrl, hall.id === 'hall-alpha' ? '/images/hall_alpha2.jpeg' : '/images/hall_b_panoramic.jpeg')}
                                  alt={`${hall.name} View ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                />
                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-bold text-amber-300 backdrop-blur-xs">
                                  {labelText}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSecondaryPhoto(hall, idx)}
                                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white shadow-md transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                                  title="Delete this photo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>

                              <div className="text-[11px] font-bold text-stone-300 truncate" title={labelText}>
                                {labelText}
                              </div>
                              <div className="grid grid-cols-3 gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleMoveSecondaryPhoto(hall, idx, -1)}
                                  disabled={idx === 0 || Boolean(uploadingState)}
                                  className="flex items-center justify-center gap-1 rounded-lg border border-stone-700 bg-stone-800 px-2 py-1.5 text-[10px] font-bold text-stone-200 transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-35"
                                  title="Move this photo earlier"
                                >
                                  <ChevronLeft className="h-3.5 w-3.5" /> Earlier
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMakePrimaryPhoto(hall, idx)}
                                  disabled={Boolean(uploadingState)}
                                  className="flex items-center justify-center gap-1 rounded-lg border border-amber-700/70 bg-amber-950/40 px-2 py-1.5 text-[10px] font-bold text-amber-300 transition-colors hover:bg-amber-900/50 disabled:cursor-not-allowed disabled:opacity-35"
                                  title="Use this photo as the hall cover"
                                >
                                  <Star className="h-3.5 w-3.5" /> Cover
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveSecondaryPhoto(hall, idx, 1)}
                                  disabled={idx === hall.secondaryImages.length - 1 || Boolean(uploadingState)}
                                  className="flex items-center justify-center gap-1 rounded-lg border border-stone-700 bg-stone-800 px-2 py-1.5 text-[10px] font-bold text-stone-200 transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-35"
                                  title="Move this photo later"
                                >
                                  Later <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-stone-800">
                              {/* Replace File Button */}
                              <div>
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  onChange={(e) => handleFileSelectForSecondary(hall, idx, e)}
                                  className="hidden" 
                                  id={`sec-upload-${hall.id}-${idx}`}
                                />
                                <label
                                  htmlFor={`sec-upload-${hall.id}-${idx}`}
                                  className="w-full cursor-pointer px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 hover:text-amber-200 border border-stone-700 font-bold text-xs transition-all flex items-center justify-center space-x-1.5"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Replace Photo File</span>
                                </label>
                              </div>

                              {/* Paste URL or Remove */}
                              <div className="flex gap-1.5 items-center">
                                <input 
                                  type="url"
                                  placeholder="Or paste URL..."
                                  value={urlInput[`sec-${hall.id}-${idx}`] || ''}
                                  onChange={(e) => setUrlInput(prev => ({ ...prev, [`sec-${hall.id}-${idx}`]: e.target.value }))}
                                  className="flex-1 px-2 py-1 rounded bg-stone-950 border border-stone-800 text-[10px] text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                                />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const url = urlInput[`sec-${hall.id}-${idx}`];
                                    if (url) {
                                      setUploadingState(`Applying URL for photo ${idx + 1}...`);
                                      const updatedSecondary = [...hall.secondaryImages];
                                      updatedSecondary[idx] = url;
                                      await onUpdateHallImages(hall.id, hall.primaryImage, updatedSecondary);
                                      setUrlInput(prev => ({ ...prev, [`sec-${hall.id}-${idx}`]: '' }));
                                      setUploadingState(null);
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-[10px] font-bold transition-all shadow-xs"
                                >
                                  Apply URL
                                </button>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              ))}

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

        {/* CONFIRM PAYMENT MODAL OVERLAY */}
        {confirmingPaymentBooking && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/90">
            <div className="relative w-full max-w-lg bg-stone-900 border border-emerald-500/50 rounded-3xl shadow-xl p-6 space-y-5">
              
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-white text-lg">Confirm & Record Payment</h3>
                    <p className="text-xs text-stone-400 font-mono">
                      Ref: <span className="text-amber-400 font-bold">{confirmingPaymentBooking.referenceNumber}</span> • {confirmingPaymentBooking.customerName}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setConfirmingPaymentBooking(null)}
                  className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Booking Summary Box */}
              <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 block uppercase">Venue & Date</span>
                  <span className="font-bold text-stone-200">{confirmingPaymentBooking.hallName}</span>
                  <span className="block text-[11px] text-amber-300">{confirmingPaymentBooking.eventDate} ({confirmingPaymentBooking.timeSlot})</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block uppercase">Grand Total / Deposit</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm block">Total: RM {confirmingPaymentBooking.estimatedTotal.toLocaleString()}</span>
                  <span className="font-mono text-stone-300 text-[11px]">30% Deposit: RM {confirmingPaymentBooking.depositAmount.toLocaleString()}</span>
                </div>
              </div>

              <form onSubmit={handleConfirmPaymentSubmit} className="space-y-4 text-xs">
                
                {/* Payment Tier Selector */}
                <div>
                  <label className="block text-stone-300 font-semibold mb-1.5 text-[11px]">
                    1. Select Confirmed Payment Tier:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handlePayStatusChange('fully_paid', confirmingPaymentBooking)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                        payStatus === 'fully_paid'
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/50'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                      <span className="block text-[11px]">Paid in Full (100%)</span>
                      <span className="font-mono text-[10px] opacity-80">RM {confirmingPaymentBooking.estimatedTotal.toLocaleString()}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePayStatusChange('deposit_paid', confirmingPaymentBooking)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                        payStatus === 'deposit_paid'
                          ? 'bg-amber-950 border-amber-500 text-amber-200 ring-1 ring-amber-500/50'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <Receipt className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                      <span className="block text-[11px]">Deposit Paid (30%)</span>
                      <span className="font-mono text-[10px] opacity-80">RM {confirmingPaymentBooking.depositAmount.toLocaleString()}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePayStatusChange('unpaid', confirmingPaymentBooking)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                        payStatus === 'unpaid'
                          ? 'bg-red-950 border-red-500 text-red-200 ring-1 ring-red-500/50'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <XCircle className="w-4 h-4 text-red-400 mx-auto mb-1" />
                      <span className="block text-[11px]">Mark Unpaid</span>
                      <span className="font-mono text-[10px] opacity-80">RM 0</span>
                    </button>
                  </div>
                </div>

                {/* Amount & Method Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-300 font-semibold mb-1 text-[11px]">Amount Received (RM):</label>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={e => setPayAmount(Number(e.target.value))}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-300 font-semibold mb-1 text-[11px]">Payment Method:</label>
                    <select
                      value={payMethod}
                      onChange={e => setPayMethod(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-semibold focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="Instant Online Bank Transfer">Instant Bank Transfer (FPX)</option>
                      <option value="DuitNow QR / E-Wallet">DuitNow QR / E-Wallet</option>
                      <option value="Credit / Debit Card">Credit / Debit Card</option>
                      <option value="Cash / Over The Counter">Cash Deposit</option>
                      <option value="Cheque / Banker's Draft">Cheque / Banker's Draft</option>
                    </select>
                  </div>
                </div>

                {/* Receipt Reference No */}
                <div>
                  <label className="block text-stone-300 font-semibold mb-1 text-[11px]">Official Payment Receipt Reference No:</label>
                  <input
                    type="text"
                    value={payReceiptRef}
                    onChange={e => setPayReceiptRef(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                    placeholder="REC-2026-XXXXX"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-stone-300 font-semibold mb-1 text-[11px]">Payment Remarks / Bank Ref Notes (Optional):</label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={e => setPayNotes(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-200 focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. Verified Maybank transfer ref MBB-9831"
                  />
                </div>

                {/* Auto Approve Checkbox */}
                {confirmingPaymentBooking.status === 'pending' && payStatus !== 'unpaid' && (
                  <label className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/80 flex items-center space-x-2.5 cursor-pointer text-amber-200">
                    <input
                      type="checkbox"
                      checked={payAutoApprove}
                      onChange={e => setPayAutoApprove(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold">
                      Also automatically mark booking schedule as <strong>APPROVED / CONFIRMED</strong> upon payment receipt.
                    </span>
                  </label>
                )}

                {/* Submit Actions */}
                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setConfirmingPaymentBooking(null)}
                    className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save & Issue Receipt</span>
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
