import React from 'react';
import { Users, Check, X, Shield, Sparkles, Building2, Layers } from 'lucide-react';
import { HALLS_DATA } from '../data/hallsData';
import { HallId } from '../types';

interface HallComparisonTableProps {
  onBookHall: (hallId: HallId) => void;
}

export const HallComparisonTable: React.FC<HallComparisonTableProps> = ({ onBookHall }) => {
  const hall1 = HALLS_DATA[0]; // Alpha Hall
  const hall2 = HALLS_DATA[1]; // Hall B

  return (
    <div className="my-16 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-md">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold uppercase tracking-wider mb-2">
          <Layers className="w-3.5 h-3.5" /> Hall Comparison
        </span>
        <h2 className="font-serif text-3xl font-bold text-stone-900 tracking-tight">
          ALPHA HALL vs HALL B
        </h2>
        <p className="text-xs text-stone-600 mt-2 font-normal">
          Compare seating capacity, rental rates, and provided facilities.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-stone-200">
              <th className="py-4 px-4 text-stone-600 font-semibold w-1/4">Specification</th>
              <th className="py-4 px-4 text-amber-800 font-serif text-lg font-bold w-3/8 bg-amber-50 rounded-t-xl">
                {hall1.name}
              </th>
              <th className="py-4 px-4 text-emerald-800 font-serif text-lg font-bold w-3/8 bg-emerald-50 rounded-t-xl">
                {hall2.name}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 text-stone-800">
            
            <tr>
              <td className="py-3 px-4 font-semibold text-stone-900">Capacity & Seating</td>
              <td className="py-3 px-4 bg-amber-50/50 font-bold text-amber-900">53 Chairs, 13 Tables</td>
              <td className="py-3 px-4 bg-emerald-50/50 font-bold text-emerald-900">31 Chairs, 7 Round Tables, Sofas & Dining Table</td>
            </tr>

            <tr>
              <td className="py-3 px-4 font-semibold text-stone-900">
                Half Day Rate
                <span className="block text-[10px] text-stone-500 font-normal font-sans">9:00 AM – 1:00 PM or 2:00 PM – 6:00 PM</span>
              </td>
              <td className="py-3 px-4 bg-amber-50/50 font-mono text-amber-700 font-bold">RM {hall1.halfDayRate}</td>
              <td className="py-3 px-4 bg-emerald-50/50 font-mono text-emerald-700 font-bold">RM {hall2.halfDayRate}</td>
            </tr>

            <tr>
              <td className="py-3 px-4 font-semibold text-stone-900">
                Full Day Rate
                <span className="block text-[10px] text-stone-500 font-normal font-sans">9:00 AM – 6:00 PM</span>
              </td>
              <td className="py-3 px-4 bg-amber-50/50 font-mono text-amber-700 font-bold">RM {hall1.fullDayRate}</td>
              <td className="py-3 px-4 bg-emerald-50/50 font-mono text-emerald-700 font-bold">RM {hall2.fullDayRate}</td>
            </tr>

            <tr>
              <td className="py-3 px-4 font-semibold text-stone-900">AV & Media</td>
              <td className="py-3 px-4 bg-amber-50/50">1 Projector, 1 TV, 3 Mics & Speaker System</td>
              <td className="py-3 px-4 bg-emerald-50/50">3 Mics & Speaker System</td>
            </tr>

            <tr>
              <td className="py-3 px-4 font-semibold text-stone-900">Air Conditioning</td>
              <td className="py-3 px-4 bg-amber-50/50">Fully Air-Conditioned</td>
              <td className="py-3 px-4 bg-emerald-50/50">Fully Air-Conditioned</td>
            </tr>

            <tr>
              <td className="py-3 px-4 font-semibold text-stone-900">Facilities</td>
              <td className="py-3 px-4 bg-amber-50/50">Surau & Toilet Access</td>
              <td className="py-3 px-4 bg-emerald-50/50">Surau & Toilet Access</td>
            </tr>

            <tr>
              <td className="py-3 px-4 font-semibold text-stone-900">Catering</td>
              <td className="py-3 px-4 bg-amber-50/50 font-medium text-amber-900">Optional (Price to be discussed)</td>
              <td className="py-3 px-4 bg-emerald-50/50 font-medium text-emerald-900">Optional (Price to be discussed)</td>
            </tr>

            <tr>
              <td className="py-3 px-4 font-semibold text-stone-900 font-sans">Action</td>
              <td className="py-4 px-4 bg-amber-50 rounded-b-xl">
                <button
                  onClick={() => onBookHall(hall1.id)}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold py-2 px-3 rounded-lg text-xs transition-colors shadow-sm"
                >
                  Book {hall1.name}
                </button>
              </td>
              <td className="py-4 px-4 bg-emerald-50 rounded-b-xl">
                <button
                  onClick={() => onBookHall(hall2.id)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-bold py-2 px-3 rounded-lg text-xs transition-colors shadow-sm"
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
