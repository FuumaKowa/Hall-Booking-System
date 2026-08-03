import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  Building2, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Sparkles,
  Receipt,
  CheckCircle2,
  Download,
  MessageCircle
} from 'lucide-react';
import { BookingRequest } from '../types';
import { ADDON_OPTIONS } from '../data/hallsData';
import { calculateBookingHours } from '../utils/availability';

interface BookingTicketModalProps {
  booking: BookingRequest;
  onClose: () => void;
}

export const BookingTicketModal: React.FC<BookingTicketModalProps> = ({ booking, onClose }) => {
  const [copied, setCopied] = useState(false);

  const hoursBreakdown = calculateBookingHours(booking.startTime, booking.durationHours);

  const handleCopyRef = () => {
    navigator.clipboard.writeText(booking.referenceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Resolve addon names
  const addonNames = (booking.selectedAddons || [])
    .map(id => ADDON_OPTIONS.find(a => a.id === id)?.name)
    .filter(Boolean);

  const isConfirmed = booking.status === 'confirmed';
  const isDeclined = booking.status === 'declined';
  const isPending = booking.status === 'pending';

  const handlePrint = () => {
    try {
      const printWindow = window.open('', '_blank', 'width=800,height=900');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Venue Ticket - ${booking.referenceNumber}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1c1917; background: #fff; line-height: 1.5; }
              .ticket-box { border: 2px solid #d97706; border-radius: 12px; padding: 30px; max-width: 650px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
              .header { border-bottom: 2px solid #f59e0b; padding-bottom: 15px; margin-bottom: 20px; text-align: center; }
              .brand { font-size: 24px; font-weight: 800; color: #78350f; letter-spacing: -0.5px; }
              .subbrand { font-size: 13px; font-weight: 600; color: #d97706; text-transform: uppercase; letter-spacing: 1px; }
              .ref-banner { background: #fef3c7; border: 1.5px dashed #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
              .ref-title { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #92400e; letter-spacing: 1px; }
              .ref-code { font-size: 26px; font-family: monospace; font-weight: 900; color: #78350f; letter-spacing: 2px; margin: 4px 0; }
              .status-tag { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; background: #dcfce7; color: #166534; border: 1px solid #86efac; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
              .field-group { background: #fafaf9; border: 1px solid #e7e5e4; padding: 12px 15px; border-radius: 8px; }
              .field-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #b45309; letter-spacing: 0.5px; margin-bottom: 6px; border-bottom: 1px solid #e7e5e4; padding-bottom: 3px; }
              .full-width { grid-column: span 2; }
              .value { font-size: 13px; color: #292524; }
              .footer { margin-top: 30px; border-top: 1px solid #e7e5e4; padding-top: 15px; font-size: 11px; color: #78350f; text-align: center; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="ticket-box">
              <div class="header">
                <div class="brand">NILAI HARTA CONSULTANT SDN BHD</div>
                <div class="subbrand">Official Venue Reservation Ticket</div>
              </div>

              <div class="ref-banner">
                <div class="ref-title">Booking Ticket Reference ID</div>
                <div class="ref-code">${booking.referenceNumber}</div>
                <div class="status-tag">Status: ${booking.status.toUpperCase()}</div>
              </div>

              <div class="grid">
                <div class="field-group">
                  <div class="field-title">Customer Information</div>
                  <div class="value"><strong>${booking.customerName}</strong></div>
                  <div class="value">Email: ${booking.customerEmail}</div>
                  <div class="value">Phone: ${booking.customerPhone}</div>
                </div>

                <div class="field-group">
                  <div class="field-title">Venue & Event</div>
                  <div class="value"><strong>${booking.hallName}</strong></div>
                  <div class="value">Occasion: ${booking.eventType}</div>
                  <div class="value">Pax: ${booking.guestCount} Guests</div>
                </div>

                <div class="field-group full-width">
                  <div class="field-title">Schedule & Timing</div>
                  <div class="value"><strong>Event Date:</strong> ${booking.eventDate}</div>
                  <div class="value"><strong>Reserved Timing:</strong> ${booking.startTime} - ${booking.endTime} (${booking.durationHours} Total Hours)</div>
                </div>

                ${addonNames.length > 0 ? `
                  <div class="field-group full-width">
                    <div class="field-title">Selected Add-ons</div>
                    <div class="value">${addonNames.join(', ')}</div>
                  </div>
                ` : ''}

                <div class="field-group full-width">
                  <div class="field-title">Financial Summary</div>
                  <div class="value"><strong>Estimated Total:</strong> RM ${booking.estimatedTotal.toLocaleString()}</div>
                  <div class="value"><strong>Security Deposit:</strong> RM ${booking.depositAmount} (Payable upon hall key release)</div>
                </div>
              </div>

              <div class="footer">
                I-Madina Event Space • Tel: +60 3-8000 4255<br>
                Please present this Reference ID upon arrival or for booking inquiries.
              </div>
            </div>

            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
        return;
      }
    } catch (e) {
      console.error('Popup print window failed, falling back to window.print()', e);
    }
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/50 backdrop-blur-xs overflow-y-auto">
      <div 
        id="printable-ticket"
        className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto"
      >
        {/* Decorative Top Accent Bar */}
        <div className="h-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 shrink-0" />

        {/* Header Actions */}
        <div className="p-4 sm:px-6 sm:py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-amber-600 shrink-0" />
            <h2 className="font-serif font-bold text-stone-900 text-base sm:text-lg truncate">
              Official Venue Reservation Ticket
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 flex items-center justify-center transition-colors shrink-0 border border-stone-200"
            title="Close Ticket"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket Content Scrollable Area */}
        <div className="p-5 sm:p-7 space-y-5 bg-white text-stone-800 overflow-y-auto flex-1">
          
          {/* Company Branding & Ticket Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b border-stone-200 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-stone-950 font-bold shadow-xs shrink-0">
                <Building2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                  I-MADINA EVENT SPACE
                </h3>
                <p className="text-[11px] text-amber-800 font-semibold uppercase tracking-wider">
                  Venue Management • Official Pass
                </p>
                <p className="text-[10px] text-stone-500 mt-0.5">
                  Commercial Hall • Tel: +60 3-8000 4255
                </p>
              </div>
            </div>

            {/* Status Stamp */}
            <div className="flex flex-col items-start sm:items-end">
              <span className="text-[10px] uppercase font-semibold text-stone-500 tracking-wider">
                Booking Status
              </span>
              <div className="mt-1">
                {isConfirmed && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Confirmed & Approved
                  </span>
                )}
                {isPending && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Pending Manager Review
                  </span>
                )}
                {isDeclined && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 border border-red-300 text-xs font-bold uppercase tracking-wider">
                    Declined
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Clean Ticket ID Banner */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="space-y-1">
              <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">
                Official Booking & Admin Reference Ticket ID
              </span>
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <span className="font-mono text-2xl sm:text-3xl font-black text-stone-900 tracking-wider">
                  {booking.referenceNumber}
                </span>
                <button
                  onClick={handleCopyRef}
                  className="p-1.5 rounded-lg bg-white hover:bg-amber-100 text-amber-700 transition-colors border border-amber-200 print:hidden"
                  title="Copy Reference ID"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {copied && <p className="text-[10px] text-emerald-700 font-semibold print:hidden">Copied to clipboard!</p>}
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-amber-100 border border-amber-300 text-[11px] text-amber-900 font-bold">
              Verified Digital Pass
            </div>
          </div>

          {/* Ticket Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            
            {/* Box 1: Customer Info */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider block border-b border-stone-200 pb-1">
                Customer Information
              </span>
              <div className="space-y-1 text-stone-700">
                <p className="font-bold text-stone-900 text-sm">{booking.customerName}</p>
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  <span>{booking.customerEmail}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  <span>{booking.customerPhone}</span>
                </p>
              </div>
            </div>

            {/* Box 2: Hall & Event Info */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider block border-b border-stone-200 pb-1">
                Venue & Occasion
              </span>
              <div className="space-y-1 text-stone-700">
                <p className="font-bold text-amber-900 text-sm flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  {booking.hallName}
                </p>
                <p className="text-stone-800">
                  Occasion: <strong>{booking.eventType}</strong>
                </p>
                <p className="flex items-center gap-1 text-stone-700">
                  <Users className="w-3.5 h-3.5 text-stone-500" />
                  Expected Guests: <strong>{booking.guestCount} Pax</strong>
                </p>
              </div>
            </div>

            {/* Box 3: Schedule & Duration */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 sm:col-span-2">
              <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider block border-b border-stone-200 pb-1">
                Reservation Schedule
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase block font-semibold">Event Date</span>
                    <strong className="text-stone-900 text-xs">{booking.eventDate}</strong>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase block font-semibold">Time Slot Package</span>
                    <strong className="text-amber-800 text-xs uppercase">{booking.timeSlot}</strong>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase block font-semibold">Reserved Timing</span>
                    <strong className="text-stone-900 text-xs block">{booking.startTime} - {booking.endTime} ({booking.durationHours} hrs)</strong>
                    <span className="text-[10px] text-amber-800 font-medium">
                      Package: {booking.timeSlot === 'fullday' ? 'Full Day (09:00 - 18:00)' : booking.timeSlot === 'morning' ? 'Morning (09:00 - 13:00)' : 'Afternoon (14:00 - 18:00)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Box 4: Addons & Special Requests */}
            {(addonNames.length > 0 || booking.specialRequests) && (
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 sm:col-span-2">
                <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider block border-b border-stone-200 pb-1">
                  Selected Add-ons & Requests
                </span>
                {addonNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {addonNames.map((name, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-white text-stone-800 text-[11px] font-medium border border-stone-200">
                        ✓ {name}
                      </span>
                    ))}
                  </div>
                )}
                {booking.specialRequests && (
                  <p className="text-stone-700 text-[11px] italic bg-white p-2.5 rounded-xl border border-stone-200 mt-2">
                    "{booking.specialRequests}"
                  </p>
                )}
              </div>
            )}

            {/* Box 5: Pricing & Payment Summary */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3 sm:col-span-2">
              <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider block border-b border-amber-200 pb-1 flex items-center justify-between">
                <span>Financial Summary & Payment Status</span>
                {booking.paymentStatus === 'fully_paid' && (
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] uppercase font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Payment Confirmed (Paid in Full)
                  </span>
                )}
                {booking.paymentStatus === 'deposit_paid' && (
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[10px] uppercase font-bold flex items-center gap-1">
                    <Receipt className="w-3 h-3 text-amber-700" /> Deposit Payment Confirmed
                  </span>
                )}
                {(!booking.paymentStatus || booking.paymentStatus === 'unpaid') && (
                  <span className="bg-stone-100 text-stone-600 border border-stone-300 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                    Payment Unpaid
                  </span>
                )}
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block font-semibold">Estimated Total</span>
                  <span className="font-mono text-lg font-bold text-amber-900">RM {booking.estimatedTotal.toLocaleString()}</span>
                </div>

                <div>
                  <span className="text-[10px] text-stone-500 uppercase block font-semibold">Security Deposit</span>
                  <span className="font-mono text-sm font-bold text-emerald-700">RM {booking.depositAmount.toLocaleString()}</span>
                </div>

                <div>
                  <span className="text-[10px] text-stone-500 uppercase block font-semibold">Amount Received</span>
                  <span className="font-mono text-sm font-bold text-stone-900">
                    RM {(booking.paidAmount || 0).toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-stone-500 uppercase block font-semibold">Receipt Ref / Method</span>
                  <span className="font-mono text-xs font-bold text-amber-800 block truncate" title={booking.paymentReceiptRef || 'Pending'}>
                    {booking.paymentReceiptRef || 'N/A'}
                  </span>
                  <span className="text-[10px] text-stone-500 font-medium">{booking.paymentMethod || 'Unconfirmed'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Admin & Security Footnote */}
          <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-500">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Verified Hall Pass for <strong>I-Madina Event Space</strong>
              </span>
            </div>
            <div className="font-mono text-[10px] text-stone-500">
              Admin Ref: <strong className="text-amber-800">{booking.referenceNumber}</strong>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 print:hidden">
          <p className="text-[11px] text-stone-600 text-center sm:text-left">
            Present Ticket ID (Ref: <strong className="text-amber-800">{booking.referenceNumber}</strong>) to management for check-in.
          </p>
          <div className="flex flex-wrap items-center space-x-2 w-full sm:w-auto shrink-0 justify-end">
            <a
              href={`https://wa.me/601119602980?text=${encodeURIComponent(`🏛️ *I-MADINA EVENT SPACE BOOKING TICKET*
---------------------------------------
📌 *Ref No:* ${booking.referenceNumber}
🏢 *Hall:* ${booking.hallName}
👤 *Name:* ${booking.customerName}
📞 *Phone:* ${booking.customerPhone}
📅 *Event Date:* ${booking.eventDate}
⏰ *Time:* ${booking.startTime} - ${booking.endTime} (${booking.timeSlot.toUpperCase()})
🎯 *Type:* ${booking.eventType} | 👥 ${booking.guestCount} Pax
💰 *Estimated Total:* RM ${booking.estimatedTotal.toLocaleString()}
💳 *Deposit Required:* RM ${booking.depositAmount.toLocaleString()}
---------------------------------------`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp +601119602980</span>
            </a>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Ticket</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors border border-stone-200"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

