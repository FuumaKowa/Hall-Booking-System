import React from 'react';
import { Building2, Phone, Mail, MapPin, Bell, ShieldCheck, Heart } from 'lucide-react';
import { HallId } from '../types';

interface FooterProps {
  onOpenManagerPortal: () => void;
  onSelectHallScroll: (hallId: HallId) => void;
  onOpenBookingModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenManagerPortal,
  onSelectHallScroll,
  onOpenBookingModal
}) => {
  return (
    <footer className="bg-stone-100 text-stone-700 border-t border-stone-200 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-stone-200">
          
          {/* Col 1: Brand */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="h-11 w-11 rounded-xl bg-white border border-emerald-100 p-1 flex items-center justify-center shadow-xs">
                <img 
                  src="/imadina-logo.jpg" 
                  alt="I-Madina Logo" 
                  className="h-full w-auto object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="font-serif text-lg font-bold text-emerald-900 tracking-tight block">
                  I-MADINA
                </span>
                <span className="text-[10px] text-sky-700 font-bold tracking-wider uppercase block">
                  Event Space
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Affordable, comfortable and fully equipped spaces for meetings, classes, seminars and private gatherings at I-Madina Event Space.
            </p>
          </div>

          {/* Col 2: The 2 Halls */}
          <div className="space-y-3 text-xs">
            <h4 className="font-serif font-bold text-stone-900 text-sm">Our 2 Halls</h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => onSelectHallScroll('hall-grand-horizon')}
                  className="text-stone-600 hover:text-emerald-700 transition-colors flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  ALPHA HALL (Seminars & Classes)
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectHallScroll('hall-serenade-glasshouse')}
                  className="text-stone-600 hover:text-sky-700 transition-colors flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
                  HALL B (Events & Gatherings)
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenBookingModal}
                  className="text-emerald-700 font-bold hover:underline mt-2 inline-block"
                >
                  Book A Hall Date →
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact Details */}
          <div className="space-y-3 text-xs">
            <h4 className="font-serif font-bold text-stone-900 text-sm">Contact & Location</h4>
            <div className="space-y-2 text-stone-600">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>I-Madina Event Space</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <a href="tel:+601119602980" className="hover:underline text-stone-700 font-medium">+601119602980</a>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>wandaniel554@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Col 4: Manager Portal Access */}
          <div className="space-y-3 text-xs bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Manager Access
            </h4>
            <p className="text-[11px] text-stone-600">
              Are you a hall manager? Access real-time booking alerts, customer requests, and email dispatch logs.
            </p>
            <button
              onClick={onOpenManagerPortal}
              className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Bell className="w-3.5 h-3.5 text-emerald-700" /> Open Manager Alert Portal
            </button>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3">
          <p>© {new Date().getFullYear()} I-Madina Event Space. All rights reserved.</p>
          <p className="flex items-center gap-1 text-[11px]">
            Affordable & comfortable hall venue rentals.
          </p>
        </div>

      </div>
    </footer>
  );
};
