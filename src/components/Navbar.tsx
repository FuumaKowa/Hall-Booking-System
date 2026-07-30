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
    <header className="sticky top-0 z-40 backdrop-blur-md bg-stone-900/95 border-b border-stone-800 text-stone-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-bold shadow-md transition-transform group-hover:scale-105">
            <Building2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-stone-100 block leading-none">
              NILAI HARTA
            </span>
            <span className="block text-[10px] tracking-widest text-amber-400 font-medium uppercase mt-0.5">
              Consultant Sdn Bhd
            </span>
          </div>
        </div>

        {/* Desktop Quick Nav Links */}
        <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium">
          <button 
            onClick={() => onSelectHallScroll('hall-grand-horizon')}
            className="text-stone-300 hover:text-amber-400 transition-colors py-1"
          >
            Hall A
          </button>

          <button 
            onClick={() => onSelectHallScroll('hall-serenade-glasshouse')}
            className="text-stone-300 hover:text-amber-400 transition-colors py-1"
          >
            Hall B
          </button>

          <a 
            href="#availability-section" 
            className="text-stone-300 hover:text-amber-400 transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4 text-stone-400" />
            Availability
          </a>
        </nav>

        {/* Action Buttons & Manager Alert Portal */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Ticket Pass Lookup Button */}
          {onOpenTicketLookup && (
            <button
              onClick={onOpenTicketLookup}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-stone-800 text-stone-300 border border-stone-700 hover:border-amber-500/60 hover:text-amber-300 transition-all"
              title="Lookup Official Booking Ticket & Proof Pass by Ref ID"
            >
              <Ticket className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Ticket Pass Lookup</span>
            </button>
          )}

          {/* Manager Portal Toggle */}
          <button
            onClick={onOpenManagerPortal}
            className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
              unreadCount > 0
                ? 'bg-amber-950/80 text-amber-200 border-amber-600'
                : 'bg-stone-800 text-stone-300 border-stone-700 hover:border-stone-500 hover:text-white'
            }`}
            title="Open Management Portal & Booking Notifications"
          >
            <div className="relative flex items-center gap-1.5">
              <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-amber-400' : 'text-stone-400'}`} />
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              )}
            </div>
            <span className="hidden sm:inline">Manager Portal</span>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-amber-900/90 text-amber-200 px-1.5 py-0.2 rounded font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Primary Book Hall CTA */}
          <button
            onClick={() => onOpenBookingModal()}
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95 flex items-center space-x-1.5"
          >
            <Calendar className="w-4 h-4" />
            <span>Book A Hall</span>
          </button>

        </div>
      </div>
    </header>
  );
};

