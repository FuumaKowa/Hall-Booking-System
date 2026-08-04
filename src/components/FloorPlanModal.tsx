import React from 'react';
import { X, Layout, Maximize2, Users, ShieldCheck } from 'lucide-react';
import { Hall } from '../types';

interface FloorPlanModalProps {
  hall: Hall;
  onClose: () => void;
}

export const FloorPlanModal: React.FC<FloorPlanModalProps> = ({ hall, onClose }) => {
  const isAlpha = hall.id === 'hall-alpha' || hall.id.includes('alpha') || hall.id === 'hall-grand-horizon';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden my-8 p-6 sm:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center space-x-2">
            <Layout className="w-5 h-5 text-amber-600" />
            <h3 className="font-serif font-bold text-stone-900 text-xl">
              {hall.name} • Floor Plan Layout
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Floorplan Visual Representation */}
        <div className="my-6 p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
          
          <div className="text-center pb-2 border-b border-stone-200">
            <span className="text-xs text-amber-800 font-mono font-bold uppercase tracking-wider">
              FLOOR PLAN ARCHITECTURE DIAGRAM
            </span>
            <p className="text-[11px] text-stone-600 mt-0.5">
              Dimensions: {hall.floorPlanSpec.dimensions} | Total: {hall.sizeSqFt.toLocaleString()} sq ft
            </p>
          </div>

          {/* Graphical Floor Layout Box */}
          <div className="w-full aspect-[16/9] bg-white rounded-xl border-2 border-dashed border-stone-300 p-4 relative flex flex-col justify-between font-mono text-xs text-stone-800">
            
            {/* Top Stage Area */}
            <div className="bg-amber-100 border border-amber-300 text-amber-900 py-2 text-center rounded-lg font-bold shadow-xs">
              [ PRESENTER AREA • {hall.floorPlanSpec.stageDimensions} ]
            </div>

            {/* Middle Main Guest Seating Zone */}
            <div className="my-3 py-6 rounded-lg bg-stone-50 border border-stone-200 text-center flex flex-col items-center justify-center space-y-1">
              <Users className="w-6 h-6 text-amber-600" />
              <span className="font-bold text-stone-900">MAIN SEATING / CLASSROOM ZONE</span>
              <span className="text-[10px] text-stone-600">
                {isAlpha ? '53 Chairs & 13 Tables Setup' : '31 Chairs, 7 Round & Dining Tables'}
              </span>
            </div>

            {/* Bottom Service & Control Area */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-center">
              <div className="p-2 rounded bg-stone-50 border border-stone-200 text-stone-700">
                PROJECTOR & SCREEN
              </div>
              <div className="p-2 rounded bg-stone-50 border border-stone-200 text-stone-700">
                PANTRY & RECEPTION
              </div>
            </div>

          </div>

          {/* Specs List */}
          <div className="grid grid-cols-2 gap-3 text-xs pt-2">
            <div className="bg-white p-2.5 rounded-xl border border-stone-200">
              <span className="text-[10px] text-stone-500 uppercase block font-semibold">Ceiling Clearance</span>
              <span className="font-semibold text-stone-900">{hall.floorPlanSpec.ceilingHeight}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-stone-200">
              <span className="text-[10px] text-stone-500 uppercase block font-semibold">Parking Spaces</span>
              <span className="font-semibold text-stone-900">{hall.floorPlanSpec.parkingCapacity}</span>
            </div>
          </div>

        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold py-2.5 px-6 rounded-xl text-xs transition-colors shadow-xs"
          >
            Close Floor Plan Spec
          </button>
        </div>

      </div>
    </div>
  );
};
