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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white border-2 border-red-500 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Banner */}
        <div className="bg-red-50 px-6 py-4 border-b border-red-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-red-100 border border-red-300 text-red-700">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-800 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                Failsafe Guard Active
              </span>
              <h3 className="font-serif font-bold text-stone-900 text-lg mt-0.5">
                Double-Booking Prevented!
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs">
          
          <div className="p-4 rounded-2xl bg-red-50/60 border border-red-200 text-stone-800 space-y-2">
            <h4 className="font-bold text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              {title}
            </h4>
            <p className="text-stone-700 leading-relaxed">
              {message}
            </p>
          </div>

          {conflictingBooking && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block mb-2">
                Already Confirmed Booking Details (Blocking Request)
              </span>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-emerald-800 font-bold">{conflictingBooking.referenceNumber}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase border border-emerald-300">
                    STATUS: {conflictingBooking.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-stone-700">
                  <div>
                    <span className="text-[10px] text-stone-500 block font-semibold">Customer</span>
                    <span className="font-semibold text-stone-900">{conflictingBooking.customerName}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-500 block font-semibold">Hall Reserved</span>
                    <span className="font-semibold text-amber-900">{conflictingBooking.hallName}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-500 block font-semibold">Date & Slot</span>
                    <span className="font-semibold text-stone-800">{conflictingBooking.eventDate} ({conflictingBooking.timeSlot.toUpperCase()})</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-stone-600 text-[11px] leading-relaxed">
            <strong className="text-stone-900">Why was this blocked?</strong> Our venue availability failsafe prevents approving 2 bookings for the same hall, on the same date, with overlapping time slots. To accommodate both guests, consider offering an alternative hall, date, or time slot.
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold transition-colors"
            >
              Understand & Close
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
