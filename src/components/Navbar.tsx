import React from 'react';
import { Building2, Bell, Calendar, Ticket } from 'lucide-react';
import { HallId } from '../types';

interface NavbarProps {
  unreadCount: number;
  onOpenManagerPortal: () => void;
  onOpenBookingModal: (hallId?: HallId) => void;
  onSelectHallScroll: (hallId: HallId) => void;
  onOpenTicketLookup?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  unreadCount,
  onOpenManagerPortal,
  onOpenBookingModal,
  onSelectHallScroll,
  onOpenTicketLookup
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 text-stone-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="h-11 w-11 rounded-xl bg-white border border-emerald-100 p-1 flex items-center justify-center shadow-xs group-hover:border-emerald-300 transition-all duration-200">
            <img 
              src="/imadina-logo.jpg" 
              alt="I-Madina Logo" 
              className="h-full w-auto object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-emerald-900 block leading-none group-hover:text-emerald-700 transition-colors">
              I-MADINA
            </span>
            <span className="block text-[10px] tracking-widest text-sky-700 font-bold uppercase mt-0.5">
              Event Space
            </span>
          </div>
        </div>

        {/* Desktop Quick Nav Links */}
        <nav className="hidden lg:flex items-center space-x-8 text-sm font-semibold">
          <button 
            onClick={() => onSelectHallScroll('hall-grand-horizon')}
            className="text-stone-700 hover:text-emerald-700 transition-colors duration-150 py-1"
          >
            ALPHA HALL
          </button>

          <button 
            onClick={() => onSelectHallScroll('hall-serenade-glasshouse')}
            className="text-stone-700 hover:text-emerald-700 transition-colors duration-150 py-1"
          >
            HALL B
          </button>

          <a 
            href="#availability-section" 
            className="text-stone-700 hover:text-emerald-700 transition-colors duration-150 flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            Availability
          </a>
        </nav>

        {/* Action Buttons & Manager Alert Portal */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Ticket Pass Lookup Button */}
          {onOpenTicketLookup && (
            <button
              onClick={onOpenTicketLookup}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100 transition-colors duration-150"
              title="Lookup Official Booking Ticket & Proof Pass by Ref ID"
            >
              <Ticket className="w-4 h-4 text-emerald-700" />
              <span className="hidden md:inline">Ticket Pass Lookup</span>
            </button>
          )}

          {/* Manager Portal Toggle */}
          <button
            onClick={onOpenManagerPortal}
            className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors duration-150 border ${
              unreadCount > 0
                ? 'bg-sky-50 text-sky-900 border-sky-300'
                : 'bg-stone-100 text-stone-700 border-stone-200 hover:border-stone-400 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
            title="Open Management Portal & Booking Notifications"
          >
            <div className="relative flex items-center gap-1.5">
              <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-sky-600' : 'text-stone-500'}`} />
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              )}
            </div>
            <span className="hidden sm:inline">Manager Portal</span>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-sky-600 text-white px-1.5 py-0.2 rounded font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Primary Book Hall CTA */}
          <button
            onClick={() => onOpenBookingModal()}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition-colors duration-150 shadow-xs flex items-center space-x-1.5"
          >
            <Calendar className="w-4 h-4" />
            <span>Book A Hall</span>
          </button>

        </div>
      </div>
    </header>
  );
};

