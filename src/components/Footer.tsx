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
    <footer className="bg-stone-950 text-stone-300 border-t border-stone-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-stone-800">
          
          {/* Col 1: Brand */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-stone-950 font-bold shadow-md">
                <Building2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="font-serif text-lg font-bold text-white tracking-tight block">
                  NILAI HARTA
                </span>
                <span className="text-[10px] text-amber-400 font-medium tracking-wider uppercase block">
                  Consultant Sdn Bhd
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed">
              Meeting and training hall rentals managed by Nilai Harta Consultant Sdn Bhd. Featuring Hall A and Hall B.
            </p>
          </div>

          {/* Col 2: The 2 Halls */}
          <div className="space-y-3 text-xs">
            <h4 className="font-serif font-bold text-white text-sm">Our 2 Halls</h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => onSelectHallScroll('hall-grand-horizon')}
                  className="text-stone-400 hover:text-amber-300 transition-colors flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Hall A (Up to 30 pax)
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectHallScroll('hall-serenade-glasshouse')}
                  className="text-stone-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Hall B (Up to 35 pax)
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenBookingModal}
                  className="text-amber-400 font-semibold hover:underline mt-2 inline-block"
                >
                  Book A Hall Date →
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact Details */}
          <div className="space-y-3 text-xs">
            <h4 className="font-serif font-bold text-white text-sm">Contact & Location</h4>
            <div className="space-y-2 text-stone-400">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Nilai Harta Consultant Sdn Bhd, Commercial Tower</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>+60 3-8000 4255</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>wandaniel554@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Col 4: Manager Portal Access */}
          <div className="space-y-3 text-xs bg-stone-900/80 p-4 rounded-2xl border border-stone-800">
            <h4 className="font-serif font-bold text-white text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Manager Access
            </h4>
            <p className="text-[11px] text-stone-400">
              Are you a hall manager? Access real-time booking alerts, customer requests, and email dispatch logs.
            </p>
            <button
              onClick={onOpenManagerPortal}
              className="w-full bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-800/60 font-semibold py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" /> Open Manager Alert Portal
            </button>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-3">
          <p>© {new Date().getFullYear()} Nilai Harta Consultant Sdn Bhd. All rights reserved.</p>
          <p className="flex items-center gap-1 text-[11px]">
            Designed for luxury events with instant manager notification system.
          </p>
        </div>

      </div>
    </footer>
  );
};
