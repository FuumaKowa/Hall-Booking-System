import React, { useState } from 'react';
import { X, Search, Ticket, AlertCircle } from 'lucide-react';
import { BookingRequest } from '../types';

interface TicketLookupModalProps {
  bookings: BookingRequest[];
  onClose: () => void;
  onSelectBookingTicket: (booking: BookingRequest) => void;
}

export const TicketLookupModal: React.FC<TicketLookupModalProps> = ({
  bookings,
  onClose,
  onSelectBookingTicket
}) => {
  const [searchRef, setSearchRef] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const trimmed = searchRef.trim().toUpperCase();
    if (!trimmed) {
      setErrorMsg('Please enter a valid Reference ID or Ticket Code.');
      return;
    }

    const match = bookings.find(
      b => b.referenceNumber.toUpperCase() === trimmed || b.id.toUpperCase() === trimmed
    );

    if (match) {
      onSelectBookingTicket(match);
      onClose();
    } else {
      setErrorMsg(`No venue booking record found matching Ticket ID "${trimmed}". Please verify the reference code with the customer or manager.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-stone-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-stone-100">
        
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center space-x-2">
            <Ticket className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-bold text-lg text-white">
              Verify / Lookup Ticket ID
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-stone-300">
          Enter the official <strong>Booking Reference / Ticket ID</strong> (e.g., <code className="bg-stone-950 px-1.5 py-0.5 rounded text-amber-300 font-mono">NHC-2026-X9K3</code>) to retrieve the official digital pass and proof of hall reservation.
        </p>

        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1.5">
              Ticket Reference ID
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. NHC-2026-X9K3"
                value={searchRef}
                onChange={e => {
                  setSearchRef(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-10 pr-4 py-3 text-stone-100 text-sm font-mono uppercase focus:border-amber-500 focus:outline-none placeholder:text-stone-600 font-bold tracking-wider"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-700 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
            >
              <Ticket className="w-4 h-4" />
              <span>Retrieve Digital Pass</span>
            </button>
          </div>
        </form>

        {/* Quick recent bookings helper if available */}
        {bookings.length > 0 && (
          <div className="pt-3 border-t border-stone-800 space-y-2">
            <span className="text-[10px] text-stone-400 uppercase font-semibold block">
              Recent Ticket References on File:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {bookings.slice(0, 4).map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    onSelectBookingTicket(b);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-stone-950 hover:bg-amber-950 text-amber-300 border border-stone-800 hover:border-amber-700 text-[11px] font-mono font-bold transition-all"
                >
                  {b.referenceNumber}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
