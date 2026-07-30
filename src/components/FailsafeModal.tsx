import React from 'react';
import { ShieldAlert, X, AlertTriangle, Calendar, Clock, CheckCircle2, User, XCircle, ArrowRight } from 'lucide-react';
import { BookingRequest } from '../types';

interface FailsafeModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  conflictingBooking?: BookingRequest;
  onClose: () => void;
  onDeclineConflict?: (bookingId: string) => void;
}

export const FailsafeModal: React.FC<FailsafeModalProps> = ({
  isOpen,
  title,
  message,
  conflictingBooking,
  onClose,
  onDeclineConflict
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-stone-900 border-2 border-red-500 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Banner */}
        <div className="bg-red-950 px-6 py-4 border-b border-red-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-red-900/80 border border-red-600 text-red-200 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-300 bg-red-900/90 px-2 py-0.5 rounded border border-red-700">
                Failsafe Guard Active
              </span>
              <h3 className="font-serif font-bold text-white text-lg mt-0.5">
                Double-Booking Prevented!
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-red-900/50 hover:bg-red-800 text-red-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs">
          
          <div className="p-4 rounded-2xl bg-stone-950 border border-red-900/80 text-stone-200 space-y-2">
            <h4 className="font-bold text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              {title}
            </h4>
            <p className="text-stone-300 leading-relaxed">
              {message}
            </p>
          </div>

          {conflictingBooking && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-2">
                Already Confirmed Booking Details (Blocking Request)
              </span>

              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-emerald-400 font-bold">{conflictingBooking.referenceNumber}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 text-[10px] font-bold uppercase border border-emerald-700">
                    STATUS: {conflictingBooking.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-stone-300">
                  <div>
                    <span className="text-[10px] text-stone-400 block">Customer</span>
                    <span className="font-semibold text-white">{conflictingBooking.customerName}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 block">Hall Reserved</span>
                    <span className="font-semibold text-amber-300">{conflictingBooking.hallName}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 block">Date & Slot</span>
                    <span className="font-semibold text-stone-200">{conflictingBooking.eventDate} ({conflictingBooking.timeSlot.toUpperCase()})</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 text-stone-400 text-[11px] leading-relaxed">
            <strong className="text-stone-200">Why was this blocked?</strong> Our venue availability failsafe prevents approving 2 bookings for the same hall, on the same date, with overlapping time slots. To accommodate both guests, consider offering an alternative hall, date, or time slot.
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold transition-colors"
            >
              Understand & Close
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
