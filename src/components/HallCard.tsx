import React, { useState } from 'react';
import { 
  Users, Maximize2, DollarSign, CheckCircle2, Tv, Volume2, 
  Utensils, Sparkles, Car, Sun, Trees, Mic, Lightbulb, Wind, Coffee,
  MapPin, Calendar, Layout, ArrowRight, Eye, ShieldCheck
} from 'lucide-react';
import { Hall, HallId } from '../types';

interface HallCardProps {
  hall: Hall;
  onBookHall: (hallId: HallId) => void;
  onViewFloorPlan: (hall: Hall) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Tv: <Tv className="w-4 h-4 text-amber-400" />,
  Volume2: <Volume2 className="w-4 h-4 text-amber-400" />,
  Users: <Users className="w-4 h-4 text-amber-400" />,
  Utensils: <Utensils className="w-4 h-4 text-amber-400" />,
  Sparkles: <Sparkles className="w-4 h-4 text-amber-400" />,
  Car: <Car className="w-4 h-4 text-amber-400" />,
  Sun: <Sun className="w-4 h-4 text-emerald-400" />,
  Trees: <Trees className="w-4 h-4 text-emerald-400" />,
  Mic: <Mic className="w-4 h-4 text-emerald-400" />,
  Lightbulb: <Lightbulb className="w-4 h-4 text-emerald-400" />,
  Wind: <Wind className="w-4 h-4 text-emerald-400" />,
  Coffee: <Coffee className="w-4 h-4 text-emerald-400" />
};

export const HallCard: React.FC<HallCardProps> = ({ hall, onBookHall, onViewFloorPlan }) => {
  const [activeImgIndex, setActiveImgIndex] = useState<number>(0);
  const images = [hall.primaryImage, ...hall.secondaryImages];

  const isGrandHorizon = hall.id === 'hall-grand-horizon';
  const themeAccent = isGrandHorizon 
    ? {
        border: 'border-amber-500/30 hover:border-amber-500/60',
        badge: 'bg-amber-950/90 text-amber-300 border-amber-800/60',
        textAccent: 'text-amber-400',
        bgAccent: 'from-amber-500 to-yellow-600',
        glow: 'shadow-amber-950/30'
      }
    : {
        border: 'border-emerald-500/30 hover:border-emerald-500/60',
        badge: 'bg-emerald-950/90 text-emerald-300 border-emerald-800/60',
        textAccent: 'text-emerald-400',
        bgAccent: 'from-emerald-500 to-teal-600',
        glow: 'shadow-emerald-950/30'
      };

  return (
    <div 
      id={hall.id}
      className={`rounded-3xl bg-stone-900 border ${themeAccent.border} p-6 sm:p-8 shadow-2xl ${themeAccent.glow} transition-all duration-300 relative overflow-hidden my-10`}
    >
      
      {/* Top Header Badge Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${themeAccent.badge}`}>
            {hall.badgeText || (isGrandHorizon ? 'Hall A • Up to 30 Pax' : 'Hall B • Up to 35 Pax')}
          </span>
          <span className="text-xs text-stone-400 bg-stone-800 px-2.5 py-1 rounded-full border border-stone-700 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-stone-300" />
            {hall.minCapacity} - {hall.maxCapacity} Guests
          </span>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold font-serif text-white">
            RM {hall.pricePerHour} <span className="text-xs font-sans text-stone-400 font-normal">/ hour</span>
          </div>
          <div className="text-xs text-amber-300 font-medium">
            Full-Day Package: RM {hall.fullDayRate.toLocaleString()} (Best Value)
          </div>
        </div>
      </div>

      {/* Hall Main Title & Tagline */}
      <div className="mb-6">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {hall.name}
        </h2>
        <p className="text-sm text-stone-300 font-light mt-1">
          {hall.tagline}
        </p>
      </div>

      {/* Image Gallery Grid & Specs Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Gallery Column (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative rounded-2xl overflow-hidden aspect-[16/10] border border-stone-800 bg-stone-950 group">
            <img 
              src={images[activeImgIndex] || hall.primaryImage} 
              alt={hall.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent pointer-events-none"></div>
            
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-stone-200">
              <span className="bg-stone-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-stone-700 font-mono">
                {hall.sizeSqFt.toLocaleString()} sq. ft. Total Space
              </span>

              <button 
                onClick={() => onViewFloorPlan(hall)}
                className="bg-stone-900/90 hover:bg-stone-800 backdrop-blur-md text-amber-300 px-3 py-1 rounded-lg border border-amber-600/50 font-medium flex items-center gap-1.5 shadow-md transition-colors"
              >
                <Layout className="w-3.5 h-3.5" />
                Floor Layout Spec
              </button>
            </div>
          </div>

          {/* Thumbnail switcher */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImgIndex(idx)}
                  className={`relative rounded-lg overflow-hidden w-20 h-14 border-2 transition-all ${
                    activeImgIndex === idx 
                      ? 'border-amber-400 scale-105 shadow-lg' 
                      : 'border-stone-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt={`Thumbnail ${idx}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Specs & Key Highlights Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-stone-950/60 p-5 rounded-2xl border border-stone-800">
          
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Venue Overview
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              {hall.description}
            </p>
          </div>

          {/* Technical Spec Matrix */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-stone-800">
            <div className="bg-stone-900/80 p-2.5 rounded-lg border border-stone-800">
              <span className="block text-[10px] text-stone-400 uppercase">Dimensions</span>
              <span className="font-semibold text-stone-200">{hall.floorPlanSpec.dimensions}</span>
            </div>
            <div className="bg-stone-900/80 p-2.5 rounded-lg border border-stone-800">
              <span className="block text-[10px] text-stone-400 uppercase">Ceiling Height</span>
              <span className="font-semibold text-stone-200">{hall.floorPlanSpec.ceilingHeight}</span>
            </div>
            <div className="bg-stone-900/80 p-2.5 rounded-lg border border-stone-800">
              <span className="block text-[10px] text-stone-400 uppercase">Stage Area</span>
              <span className="font-semibold text-stone-200">{hall.floorPlanSpec.stageDimensions}</span>
            </div>
            <div className="bg-stone-900/80 p-2.5 rounded-lg border border-stone-800">
              <span className="block text-[10px] text-stone-400 uppercase">Parking Bays</span>
              <span className="font-semibold text-stone-200">{hall.floorPlanSpec.parkingCapacity}</span>
            </div>
          </div>

          {/* Ideal Event Types */}
          <div>
            <span className="block text-[10px] text-stone-400 uppercase mb-1.5 font-medium">Ideal For:</span>
            <div className="flex flex-wrap gap-1.5">
              {hall.idealFor.map((item, idx) => (
                <span key={idx} className="bg-stone-800 text-stone-300 text-[11px] px-2 py-0.5 rounded border border-stone-700">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Primary CTA */}
          <div className="pt-2">
            <button
              onClick={() => onBookHall(hall.id)}
              className={`w-full bg-gradient-to-r ${themeAccent.bgAccent} text-stone-950 font-bold py-3 px-4 rounded-xl text-sm transition-all duration-200 shadow-md hover:brightness-110 active:scale-[0.99] flex items-center justify-center space-x-2`}
            >
              <Calendar className="w-4 h-4 stroke-[2.2]" />
              <span>Book {hall.name}</span>
            </button>
            <p className="text-[10px] text-center text-stone-400 mt-2">
              Manager notification sent instantly upon request
            </p>
          </div>

        </div>

      </div>

      {/* Amenities & Key Equipment Features Grid */}
      <div className="mt-8 pt-6 border-t border-stone-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400" /> Key Features & Built-in Amenities
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {hall.amenities.map((amenity, idx) => (
            <div key={idx} className="flex items-start space-x-3 p-3 rounded-xl bg-stone-950/70 border border-stone-800/80">
              <div className="p-2 rounded-lg bg-stone-900 border border-stone-700/60 shrink-0">
                {ICON_MAP[amenity.iconName] || <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-100">{amenity.title}</h4>
                <p className="text-[11px] text-stone-400 mt-0.5 leading-tight">{amenity.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
