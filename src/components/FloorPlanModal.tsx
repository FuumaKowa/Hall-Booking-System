import React from 'react';
import { X, Layout, Maximize2, Users, ShieldCheck } from 'lucide-react';
import { Hall } from '../types';

interface FloorPlanModalProps {
  hall: Hall;
  onClose: () => void;
}

export const FloorPlanModal: React.FC<FloorPlanModalProps> = ({ hall, onClose }) => {
  const isGrand = hall.id === 'hall-grand-horizon';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-amber-900/40 rounded-3xl shadow-xl overflow-hidden my-8 p-6 sm:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center space-x-2">
            <Layout className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-bold text-white text-xl">
              {hall.name} • Floor Plan Layout
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Floorplan Visual Representation */}
        <div className="my-6 p-6 rounded-2xl bg-stone-950 border border-stone-800 space-y-4">
          
          <div className="text-center pb-2 border-b border-stone-800/80">
            <span className="text-xs text-amber-300 font-mono font-bold uppercase tracking-wider">
              FLOOR PLAN ARCHITECTURE DIAGRAM
            </span>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Dimensions: {hall.floorPlanSpec.dimensions} | Total: {hall.sizeSqFt.toLocaleString()} sq ft
            </p>
          </div>

          {/* Graphical Floor Layout Box */}
          <div className="w-full aspect-[16/9] bg-stone-900 rounded-xl border-2 border-dashed border-stone-700 p-4 relative flex flex-col justify-between font-mono text-xs text-stone-300">
            
            {/* Top Stage Area */}
            <div className="bg-amber-950/80 border border-amber-500/80 text-amber-200 py-2 text-center rounded-lg font-bold shadow-md">
              [ STAGE AREA • {hall.floorPlanSpec.stageDimensions} ]
              {isGrand && <span className="block text-[9px] text-amber-400 font-normal">20ft HD LED Screen Backdrop</span>}
            </div>

            {/* Middle Main Guest Seating Zone */}
            <div className="my-3 py-6 rounded-lg bg-stone-950/80 border border-stone-800 text-center flex flex-col items-center justify-center space-y-1">
              <Users className="w-6 h-6 text-amber-400" />
              <span className="font-bold text-stone-100">MAIN SEATING / BANQUET ZONE</span>
              <span className="text-[10px] text-stone-400">
                {isGrand ? 'Round Banquet Tables or Theater Row Layout (100 - 500 Guests)' : 'Intimate Dining Tables & High Top Lounge (30 - 160 Guests)'}
              </span>
            </div>

            {/* Bottom Service & Control Area */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-center">
              <div className="p-2 rounded bg-stone-950 border border-stone-800 text-stone-300">
                {isGrand ? 'BRIDAL & VIP SUITE' : '360 GLASS WALL PANORAMA'}
              </div>
              <div className="p-2 rounded bg-stone-950 border border-stone-800 text-stone-300">
                {isGrand ? 'CATERING KITCHEN & FOYER' : 'OUTDOOR GARDEN COURTYARD'}
              </div>
            </div>

          </div>

          {/* Specs List */}
          <div className="grid grid-cols-2 gap-3 text-xs pt-2">
            <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
              <span className="text-[10px] text-stone-400 uppercase block font-medium">Ceiling Clearance</span>
              <span className="font-semibold text-stone-200">{hall.floorPlanSpec.ceilingHeight}</span>
            </div>
            <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
              <span className="text-[10px] text-stone-400 uppercase block font-medium">Parking Spaces</span>
              <span className="font-semibold text-stone-200">{hall.floorPlanSpec.parkingCapacity}</span>
            </div>
          </div>

        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-2.5 px-6 rounded-xl text-xs transition-colors"
          >
            Close Floor Plan Spec
          </button>
        </div>

      </div>
    </div>
  );
};
