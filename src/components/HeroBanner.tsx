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
    <div className="relative bg-stone-950 text-stone-100 overflow-hidden border-b border-stone-800">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-16 lg:pb-20 relative z-10">
        
        {/* Top Tagline Pill */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-stone-300 text-xs font-medium mb-5">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>Nilai Harta Consultant • Compact Event Halls (Hall A & Hall B)</span>
        </div>

        {/* Main Title & Subtitle */}
        <div className="max-w-3xl">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            Book Hall A & Hall B in <span className="text-amber-400">Nilai Harta</span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-stone-300 font-light leading-relaxed">
            Fully equipped small halls fitting around <strong>30 people</strong> — ideal for meetings, talks, classes, and training workshops. Prepared with <strong>Projector, Speaker & Mic, Whiteboard, Air Conditioning, Wi-Fi, Pantry with Water Dispenser, Toilet, and Surau</strong>. Rates in RM.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenBookingModal()}
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-6 py-3 rounded-xl text-sm transition-colors duration-150 shadow-lg flex items-center space-x-2"
            >
              <Calendar className="w-4.5 h-4.5 stroke-[2.2]" />
              <span>Book A Hall Now</span>
            </button>

            <a
              href="#availability-section"
              className="bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 hover:border-stone-500 font-semibold px-5 py-3 rounded-xl text-sm transition-colors duration-150 flex items-center space-x-2"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Check Live Availability</span>
            </a>
          </div>
        </div>

        {/* Quick Venue Cards Preview Bar */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
          
          {/* Card 1: Hall A */}
          <div 
            onClick={() => onSelectHallScroll('hall-grand-horizon')}
            className="group cursor-pointer rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500/50 p-4 transition-colors duration-150 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="inline-block px-2.5 py-0.5 rounded bg-stone-800 text-stone-200 text-xs font-medium border border-stone-700">
                Hall A • Up to 30 Pax
              </span>
              <span className="text-amber-400 text-xs font-semibold flex items-center gap-1">
                View Details <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <h3 className="font-serif text-lg font-bold text-white mt-2.5">
              Hall A
            </h3>
            
            <p className="text-xs text-stone-400 mt-1 line-clamp-2">
              Whiteboard, speaker & mic, projector, air-con, Wi-Fi, pantry with water dispenser, toilet & surau.
            </p>

            <div className="mt-3 pt-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-300">
              <span className="flex items-center gap-1.5 text-stone-400">
                <Users className="w-3.5 h-3.5 text-stone-400" />
                Up to 30 Pax
              </span>
              <span className="font-semibold text-amber-400">From RM 60 / hr</span>
            </div>
          </div>

          {/* Card 2: Hall B */}
          <div 
            onClick={() => onSelectHallScroll('hall-serenade-glasshouse')}
            className="group cursor-pointer rounded-xl bg-stone-900 border border-stone-800 hover:border-emerald-500/50 p-4 transition-colors duration-150 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="inline-block px-2.5 py-0.5 rounded bg-stone-800 text-stone-200 text-xs font-medium border border-stone-700">
                Hall B • Up to 35 Pax
              </span>
              <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                View Details <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <h3 className="font-serif text-lg font-bold text-white mt-2.5">
              Hall B
            </h3>

            <p className="text-xs text-stone-400 mt-1 line-clamp-2">
              Projector, 75" Smart TV, whiteboards, speaker & mics, air-con, Wi-Fi, pantry, toilet & surau.
            </p>

            <div className="mt-3 pt-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-300">
              <span className="flex items-center gap-1.5 text-stone-400">
                <Users className="w-3.5 h-3.5 text-stone-400" />
                Up to 35 Pax
              </span>
              <span className="font-semibold text-emerald-400">From RM 75 / hr</span>
            </div>
          </div>

        </div>

        {/* Value Props Strip */}
        <div className="mt-8 pt-6 border-t border-stone-800/80 grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs text-stone-300">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-stone-900 border border-stone-800 text-amber-400 shrink-0">
              <MailCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-stone-200">Instant Manager Notification</h4>
              <p className="text-stone-400 mt-0.5">When you submit a booking, our team receives an instant alert email and manager dashboard push notification.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-stone-900 border border-stone-800 text-amber-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-stone-200">Flexible Hourly & Full Day Rates</h4>
              <p className="text-stone-400 mt-0.5">Rent by the hour or choose discounted full-day packages with setup and teardown buffer time.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-stone-900 border border-stone-800 text-amber-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-stone-200">Transparent Cost & Custom Add-ons</h4>
              <p className="text-stone-400 mt-0.5">Customize floral arches, catering, AV equipment, and valet parking with instant price calculation.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

