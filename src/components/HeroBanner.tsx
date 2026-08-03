import React from 'react';
import { Calendar, ShieldCheck, ArrowRight, Users, Clock, MailCheck } from 'lucide-react';
import { HallId } from '../types';

interface HeroBannerProps {
  onOpenBookingModal: (hallId?: HallId) => void;
  onSelectHallScroll: (hallId: HallId) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onOpenBookingModal,
  onSelectHallScroll
}) => {
  return (
    <div className="bg-white text-stone-900 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Main Title & Direct Hall Selection Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-stone-100">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>I-Madina Event Space • Official Venue Portal</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-stone-900">
              Event Hall Rentals
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-stone-600 font-normal">
              Affordable, comfortable and fully equipped spaces for meetings, classes, seminars and private gatherings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onOpenBookingModal()}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-colors duration-150 shadow-xs flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Book A Hall</span>
            </button>

            <a
              href="#availability-section"
              className="bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2"
            >
              <Clock className="w-4 h-4 text-sky-700" />
              <span>Calendar</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

