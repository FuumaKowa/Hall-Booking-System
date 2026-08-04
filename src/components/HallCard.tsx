import React, { useState } from 'react';
import { 
  Users, Maximize2, DollarSign, CheckCircle2, Tv, Volume2, 
  Utensils, Sparkles, Car, Sun, Trees, Mic, Lightbulb, Wind, Coffee,
  MapPin, Calendar, Layout, ArrowRight, Eye, ShieldCheck, ZoomIn, X, ChevronLeft, ChevronRight,
  Scan
} from 'lucide-react';
import { Hall, HallId } from '../types';

interface HallCardProps {
  hall: Hall;
  onBookHall: (hallId: HallId) => void;
  onViewFloorPlan: (hall: Hall) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Tv: <Tv className="w-4 h-4 text-emerald-700" />,
  Volume2: <Volume2 className="w-4 h-4 text-emerald-700" />,
  Users: <Users className="w-4 h-4 text-emerald-700" />,
  Utensils: <Utensils className="w-4 h-4 text-emerald-700" />,
  Sparkles: <Sparkles className="w-4 h-4 text-emerald-700" />,
  Car: <Car className="w-4 h-4 text-emerald-700" />,
  Sun: <Sun className="w-4 h-4 text-sky-700" />,
  Trees: <Trees className="w-4 h-4 text-sky-700" />,
  Mic: <Mic className="w-4 h-4 text-sky-700" />,
  Lightbulb: <Lightbulb className="w-4 h-4 text-sky-700" />,
  Wind: <Wind className="w-4 h-4 text-sky-700" />,
  Coffee: <Coffee className="w-4 h-4 text-sky-700" />
};

import { cleanImageUrl } from '../utils/imageUtils';

export const HallCard: React.FC<HallCardProps> = ({ hall, onBookHall, onViewFloorPlan }) => {
  const [activeImgIndex, setActiveImgIndex] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');

  // Deduplicate and clean image paths
  const rawPrimary = cleanImageUrl(hall.primaryImage, hall.id.includes('grand') ? '/images/hall_alpha.jpeg' : '/images/hall_b_panoramic.jpeg');
  const rawSecondary = (hall.secondaryImages || []).map(img => cleanImageUrl(img, '/images/surau.jpeg'));

  const images = Array.from(new Set([rawPrimary, ...rawSecondary].filter(Boolean)));
  const currentImg = images[activeImgIndex] || rawPrimary;
  const isPanoramic = currentImg.toLowerCase().includes('panoramic');

  const getImageLabel = (url: string, idx: number): string => {
    const lower = url.toLowerCase();
    if (lower.includes('panoramic')) return 'Panoramic View';
    if (lower.includes('hall alpha')) return 'Alpha Main';
    if (lower.includes('hall b 1') || lower.includes('hall_b_1') || lower.includes('view_one') || lower.includes('view_1')) return 'Hall View 1';
    if (lower.includes('hall b 2') || lower.includes('hall_b_2') || lower.includes('view_two') || lower.includes('view_2')) return 'Hall View 2';
    if (lower.includes('surau')) return 'Surau Facility';
    return `Photo ${idx + 1}`;
  };

  const isGrandHorizon = hall.id === 'hall-grand-horizon';
  const themeAccent = isGrandHorizon 
    ? {
        border: 'border-emerald-200 hover:border-emerald-400',
        badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        textAccent: 'text-emerald-800',
        bgAccent: 'from-emerald-700 to-emerald-800 text-white',
        glow: 'shadow-emerald-100'
      }
    : {
        border: 'border-sky-200 hover:border-sky-400',
        badge: 'bg-sky-100 text-sky-900 border-sky-300',
        textAccent: 'text-sky-800',
        bgAccent: 'from-sky-700 to-sky-800 text-white',
        glow: 'shadow-sky-100'
      };

  const handleNextImg = () => {
    setActiveImgIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImg = () => {
    setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div 
      id={hall.id}
      className={`rounded-3xl bg-white border ${themeAccent.border} p-6 sm:p-8 shadow-sm hover:shadow-md relative overflow-hidden my-10 transition-colors duration-150 text-stone-800`}
    >
      
      {/* Top Header Badge Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${themeAccent.badge}`}>
            {hall.badgeText || (isGrandHorizon ? 'Alpha Hall • Up to 30 Pax' : 'Hall B • Up to 35 Pax')}
          </span>
          <span className="text-xs text-stone-700 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200 flex items-center gap-1 font-medium">
            <Users className="w-3.5 h-3.5 text-stone-600" />
            {hall.minCapacity} - {hall.maxCapacity} Guests
          </span>
        </div>

        <div className="text-right">
          <div className="text-xl font-bold font-serif text-stone-900">
            Half Day: <span className="text-emerald-800">RM {hall.halfDayRate}</span>
          </div>
          <div className="text-xs text-sky-800 font-semibold mt-0.5">
            Full Day: RM {hall.fullDayRate}
          </div>
        </div>
      </div>

      {/* Hall Main Title & Tagline */}
      <div className="mb-6">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
          {hall.name}
        </h2>
        <p className="text-sm text-stone-600 font-normal mt-1">
          {hall.tagline}
        </p>
      </div>

      {/* Image Gallery Grid & Specs Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Gallery Column (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className={`relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-900 shadow-sm group transition-all duration-200 ${
            isPanoramic ? 'aspect-[18/9]' : 'aspect-[16/10]'
          }`}>
            <img 
              src={currentImg} 
              alt={`${hall.name} - ${getImageLabel(currentImg, activeImgIndex)}`}
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('/images/hall_alpha.jpeg') && !target.src.endsWith('/images/hall_b_panoramic.jpeg')) {
                  target.src = hall.id.includes('grand') ? '/images/hall_alpha.jpeg' : '/images/hall_b_panoramic.jpeg';
                }
              }}
              className={`w-full h-full transition-all duration-300 ${
                fitMode === 'contain' || isPanoramic ? 'object-contain bg-stone-950' : 'object-cover'
              }`}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-stone-950/20 pointer-events-none"></div>
            
            {/* Top Badge Overlay */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs">
              <span className="bg-stone-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-stone-700/80 font-medium text-amber-400 flex items-center gap-1.5 shadow-sm">
                <Scan className="w-3.5 h-3.5" />
                {getImageLabel(currentImg, activeImgIndex)}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setFitMode(prev => prev === 'cover' ? 'contain' : 'cover')}
                  className="bg-stone-900/80 hover:bg-stone-900 backdrop-blur-md text-stone-200 hover:text-white px-2.5 py-1 rounded-lg border border-stone-700 text-[11px] font-medium transition-colors"
                  title="Toggle Fit / Fill View"
                >
                  {fitMode === 'cover' ? 'Fit Full Photo' : 'Fill Container'}
                </button>
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="bg-amber-500/90 hover:bg-amber-500 backdrop-blur-md text-stone-950 px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  Expand High-Res
                </button>
              </div>
            </div>


          </div>

          {/* Thumbnail switcher with labeled badges */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {images.map((imgUrl, idx) => {
                const label = getImageLabel(imgUrl, idx);
                const isSelected = activeImgIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveImgIndex(idx)}
                    className={`relative shrink-0 rounded-xl overflow-hidden w-24 h-16 border-2 transition-all duration-150 group ${
                      isSelected 
                        ? 'border-amber-500 ring-2 ring-amber-300 scale-105 shadow-md' 
                        : 'border-stone-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={imgUrl} 
                      alt={label} 
                      referrerPolicy="no-referrer" 
                      className="w-full h-full object-cover bg-stone-900" 
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-stone-950/85 backdrop-blur-[2px] py-0.5 px-1 text-[9px] text-stone-200 font-medium truncate text-center">
                      {label}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Specs & Key Highlights Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-stone-50 p-5 rounded-2xl border border-stone-200">
          
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" /> Venue Overview
            </h3>
            <p className="text-xs text-stone-700 leading-relaxed">
              {hall.description}
            </p>
          </div>



          {/* Ideal Event Types */}
          <div>
            <span className="block text-[10px] text-stone-500 uppercase mb-1.5 font-bold">Ideal For:</span>
            <div className="flex flex-wrap gap-1.5">
              {hall.idealFor.map((item, idx) => (
                <span key={idx} className="bg-white text-stone-700 text-[11px] px-2 py-0.5 rounded border border-stone-200 font-medium">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Primary CTA */}
          <div className="pt-2">
            <button
              onClick={() => onBookHall(hall.id)}
              className={`w-full bg-gradient-to-r ${themeAccent.bgAccent} text-stone-950 font-bold py-3 px-4 rounded-xl text-sm transition-colors duration-150 shadow-sm hover:brightness-105 flex items-center justify-center space-x-2`}
            >
              <Calendar className="w-4 h-4 stroke-[2.2]" />
              <span>Book {hall.name}</span>
            </button>
            <p className="text-[10px] text-center text-stone-500 mt-2">
              Manager notification sent instantly upon request
            </p>
          </div>

        </div>

      </div>

      {/* Amenities & Key Equipment Features Grid */}
      <div className="mt-8 pt-6 border-t border-stone-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-600" /> Key Features & Built-in Amenities
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {hall.amenities.map((amenity, idx) => (
            <div key={idx} className="flex items-start space-x-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
              <div className="p-2 rounded-lg bg-white border border-stone-200 shrink-0">
                {ICON_MAP[amenity.iconName] || <CheckCircle2 className="w-4 h-4 text-amber-600" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">{amenity.title}</h4>
                <p className="text-[11px] text-stone-600 mt-0.5 leading-tight">{amenity.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal for High-Res & Ultra-Wide Panoramic Viewing */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fadeIn">
          {/* Lightbox Header */}
          <div className="flex items-center justify-between text-white border-b border-stone-800 pb-3">
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold flex items-center gap-2">
                {hall.name} - <span className="text-amber-400 font-sans text-base">{getImageLabel(currentImg, activeImgIndex)}</span>
              </h3>
              <p className="text-xs text-stone-400">Image {activeImgIndex + 1} of {images.length}</p>
            </div>
            <button
              onClick={() => setLightboxOpen(false)}
              className="p-2 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Main Image Stage */}
          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            <button
              onClick={handlePrevImg}
              className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white border border-stone-700 transition-colors shadow-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="max-w-full max-h-full flex items-center justify-center overflow-auto p-2">
              <img
                src={currentImg}
                alt={getImageLabel(currentImg, activeImgIndex)}
                referrerPolicy="no-referrer"
                className="max-h-[80vh] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-stone-800"
              />
            </div>

            <button
              onClick={handleNextImg}
              className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white border border-stone-700 transition-colors shadow-lg"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Footer Thumbnail Bar */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto pt-3 border-t border-stone-800">
            {images.map((imgUrl, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImgIndex(idx)}
                className={`relative rounded-lg overflow-hidden w-20 h-14 border-2 transition-all shrink-0 ${
                  activeImgIndex === idx
                    ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105'
                    : 'border-stone-700 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={imgUrl} alt={getImageLabel(imgUrl, idx)} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-stone-950/80 text-[8px] text-stone-300 truncate text-center py-0.5">
                  {getImageLabel(imgUrl, idx)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
