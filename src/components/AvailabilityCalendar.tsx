import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle, Clock, Sparkles } from 'lucide-react';
import { BookingRequest, HallId } from '../types';

interface AvailabilityCalendarProps {
  bookings: BookingRequest[];
  onSelectDateToBook: (dateStr: string, hallId?: HallId) => void;
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  bookings,
  onSelectDateToBook
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 7, 1)); // August 2026

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getBookingsForDate = (dateString: string) => {
    return bookings.filter(b => b.eventDate === dateString && b.status !== 'declined');
  };

  return (
    <div id="availability-section" className="my-16 bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
      
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800/60 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <CalendarIcon className="w-3.5 h-3.5" /> Live Availability Calendar
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Check Reserved & Open Dates
          </h2>
          <p className="text-xs text-stone-300 mt-1">
            Click on any date to immediately reserve either Hall A or Hall B.
          </p>
        </div>

        {/* Month Switcher Controls */}
        <div className="flex items-center space-x-3 bg-stone-950 p-1.5 rounded-xl border border-stone-800">
          <button 
            onClick={handlePrevMonth}
            className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="font-serif font-bold text-stone-200 text-sm px-3 min-w-[130px] text-center">
            {monthNames[month]} {year}
          </span>

          <button 
            onClick={handleNextMonth}
            className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-stone-300 mb-6 pb-4 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span>Hall A Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span>Hall B Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-stone-800 border border-stone-700"></span>
          <span>Both Halls Available</span>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-stone-400 mb-2">
        <span>SUN</span>
        <span>MON</span>
        <span>TUE</span>
        <span>WED</span>
        <span>THU</span>
        <span>FRI</span>
        <span>SAT</span>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        
        {/* Blank Padding Days */}
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`blank-${i}`} className="h-24 sm:h-28 rounded-xl bg-stone-950/30 border border-stone-900/50 pointer-events-none opacity-20"></div>
        ))}

        {/* Days of Month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const monthStr = String(month + 1).padStart(2, '0');
          const dayStr = String(dayNum).padStart(2, '0');
          const dateString = `${year}-${monthStr}-${dayStr}`;

          const dateBookings = getBookingsForDate(dateString);
          const hasGrandBooked = dateBookings.some(b => b.hallId === 'hall-grand-horizon');
          const hasGlasshouseBooked = dateBookings.some(b => b.hallId === 'hall-serenade-glasshouse');

          return (
            <div
              key={dateString}
              onClick={() => onSelectDateToBook(dateString)}
              className="group cursor-pointer h-24 sm:h-28 rounded-xl bg-stone-950 border border-stone-800/80 hover:border-amber-500/80 p-2 flex flex-col justify-between transition-colors duration-150 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-stone-200 group-hover:text-amber-300">
                  {dayNum}
                </span>

                <span className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 font-medium transition-opacity">
                  Book +
                </span>
              </div>

              {/* Status Badges for Halls on this day */}
              <div className="space-y-1">
                {hasGrandBooked ? (
                  <div className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/80 font-medium truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span className="hidden sm:inline">Hall A Booked</span>
                    <span className="sm:hidden">Hall A</span>
                  </div>
                ) : (
                  <div className="text-[9px] px-1.5 py-0.5 rounded bg-stone-900 text-stone-500 border border-stone-800/60 truncate">
                    Hall A Open
                  </div>
                )}

                {hasGlasshouseBooked ? (
                  <div className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-medium truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="hidden sm:inline">Hall B Booked</span>
                    <span className="sm:hidden">Hall B</span>
                  </div>
                ) : (
                  <div className="text-[9px] px-1.5 py-0.5 rounded bg-stone-900 text-stone-500 border border-stone-800/60 truncate">
                    Hall B Open
                  </div>
                )}
              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
};
