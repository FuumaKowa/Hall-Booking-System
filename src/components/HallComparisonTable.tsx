import React from 'react';
import { Users, Check, X, Shield, Sparkles, Building2, Layers } from 'lucide-react';
import { HALLS_DATA } from '../data/hallsData';
import { HallId } from '../types';

interface HallComparisonTableProps {
  onBookHall: (hallId: HallId) => void;
}

export const HallComparisonTable: React.FC<HallComparisonTableProps> = ({ onBookHall }) => {
  const hall1 = HALLS_DATA[0]; // Grand Horizon
  const hall2 = HALLS_DATA[1]; // Serenade Glasshouse

  return (
    <div className="my-16 bg-stone-900/90 rounded-3xl border border-stone-800 p-6 sm:p-8 shadow-2xl">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800/60 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
          <Layers className="w-3.5 h-3.5" /> Hall Comparison Guide
        </span>
        <h2 className="font-serif text-3xl font-bold text-white tracking-tight">
          Which Hall Is Right For Your Event?
        </h2>
        <p className="text-xs text-stone-300 mt-2 font-light">
          Compare capacities, amenities, and pricing options between our two distinct venue spaces.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-stone-800">
              <th className="py-4 px-4 text-stone-400 font-semibold w-1/4">Specification</th>
              <th className="py-4 px-4 text-amber-300 font-serif text-lg font-bold w-3/8 bg-amber-950/20 rounded-t-xl">
                {hall1.name}
              </th>
              <th className="py-4 px-4 text-emerald-300 font-serif text-lg font-bold w-3/8 bg-emerald-950/20 rounded-t-xl">
                {hall2.name}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/60 text-stone-300">
            
            <tr>
              <td className="py-3 px-4 font-semibold text-stone-200">Max Guest Capacity</td>
              <td className="py-3 px-4 bg-amber-950/10 font-bold text-amber-200">Up to {hall1.maxCapacity} Guests</td>
              <td className="py-3 px-4 bg-emerald-950/10 font-bold text-emerald-200">Up to {hall2.maxCapacity} Guests</td>
            </tr>

            <tr>
              <td className="py-3 px-4 font-semibold text-stone-200">Total Hall Size</td>
              <td className="py-3 px-4 bg-amber-950/10">{hall1.sizeSqFt.toLocaleString()} sq. ft.</td>
              <td className="py-3 px-4 bg-emerald-950/10">{hall2.sizeSqFt.toLocaleString()} sq. ft.</td>
            </tr>

            <tr>
              <td className="py-3 px-4 font-semibold text-stone-200">Hourly Rate</td>
              <td className="py-3 px-4 bg-amber-950/10 font-mono text-amber-300 font-bold">RM {hall1.pricePerHour} / hour</td>
              <td className="py-3 px-4 bg-emerald-950/10 font-mono text-emerald-300 font-bold">RM {hall2.pricePerHour} / hour</td>
            </tr>

            <tr>
              <td className="py-3 px-4 font-semibold text-stone-200">Full-Day Package Rate</td>
              <td className="py-3 px-4 bg-amber-950/10 font-mono text-amber-300 font-bold">RM {hall1.fullDayRate.toLocaleString()} / day</td>
              <td className="py-3 px-4 bg-emerald-950/10 font-mono text-emerald-300 font-bold">RM {hall2.fullDayRate.toLocaleString()} / day</td>
            </tr>

            <tr>
              <td className="py-3 px-4 font-semibold text-stone-200">Display Equipment</td>
              <td className="py-3 px-4 bg-amber-950/10">Normal HD Projector + Motorized Screen</td>
              <td className="py-3 px-4 bg-emerald-950/10">Ultra-Bright HD Projector + 75" Smart TV</td>
            </tr>

            <tr>
              <td className="py-3 px-4 font-semibold text-stone-200">Whiteboard & Tools</td>
              <td className="py-3 px-4 bg-amber-950/10">Normal Whiteboard + Marker Pens & Eraser</td>
              <td className="py-3 px-4 bg-emerald-950/10">Dual Whiteboards + Marker Pens & Flipchart</td>
            </tr>

            <tr>
              <td className="py-3 px-4 font-semibold text-stone-200">Audio System</td>
              <td className="py-3 px-4 bg-amber-950/10">Prepared Speaker System + Wireless Mics</td>
              <td className="py-3 px-4 bg-emerald-950/10">Lecture Sound System + Wireless Mics</td>
            </tr>

            <tr>
              <td className="py-3 px-4 font-semibold text-stone-200">Internet & Air-Con</td>
              <td className="py-3 px-4 bg-amber-950/10">High-Speed Wi-Fi & Powerful Air Conditioning</td>
              <td className="py-3 px-4 bg-emerald-950/10">High-Speed Wi-Fi & Silent Air Conditioning</td>
            </tr>

            <tr>
              <td className="py-3 px-4 font-semibold text-stone-200">Pantry & Water Dispenser</td>
              <td className="py-3 px-4 bg-amber-950/10">Hot & Cold Water Dispenser + Coffee Station</td>
              <td className="py-3 px-4 bg-emerald-950/10">Hot & Cold Water Dispenser + Pantry Bar</td>
            </tr>

            <tr>
              <td className="py-3 px-4 font-semibold text-stone-200">Facilities</td>
              <td className="py-3 px-4 bg-amber-950/10">Clean Toilet & Dedicated Surau Access</td>
              <td className="py-3 px-4 bg-emerald-950/10">Clean Toilet & Dedicated Surau Access</td>
            </tr>

            <tr>
              <td className="py-3 px-4 font-semibold text-stone-200 font-sans">Action</td>
              <td className="py-4 px-4 bg-amber-950/20 rounded-b-xl">
                <button
                  onClick={() => onBookHall(hall1.id)}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-2 px-3 rounded-lg text-xs transition-colors shadow-md"
                >
                  Book {hall1.name}
                </button>
              </td>
              <td className="py-4 px-4 bg-emerald-500/20 rounded-b-xl">
                <button
                  onClick={() => onBookHall(hall2.id)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold py-2 px-3 rounded-lg text-xs transition-colors shadow-md"
                >
                  Book {hall2.name}
                </button>
              </td>
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  );
};
