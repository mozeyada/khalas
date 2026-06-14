'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import QRCode from 'react-qr-code';
import { X, Printer, Loader2, Link as LinkIcon, FileCheck2, Presentation, Smartphone } from 'lucide-react';
import { getProviderVenues } from '@/lib/api';
import { PublicVenue } from '@/lib/types';

type VenueQrModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type PrintSize = 'a4' | 'a5' | 'desk';

export function VenueQrModal({ isOpen, onClose }: VenueQrModalProps) {
  const locale = useLocale();
  const [venue, setVenue] = useState<PublicVenue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printSize, setPrintSize] = useState<PrintSize>('a4');

  useEffect(() => {
    if (!isOpen) return;

    async function loadVenue() {
      setIsLoading(true);
      setError(null);
      try {
        const venues = await getProviderVenues();
        if (venues.length === 0) {
          throw new Error('No venues found. Please create a clinic profile first.');
        }
        setVenue(venues[0]); // We use their primary venue
      } catch (err: any) {
        setError(err.message || 'Failed to load clinic data.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadVenue();
  }, [isOpen]);

  if (!isOpen) return null;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://khalas.app';
  const qrUrl = venue ? `${baseUrl}/${locale}/${venue.slug}` : '';

  const handlePrint = () => {
    window.print();
  };

  const isRTL = locale === 'ar';

  return (
    <>
      {/* ── Print-only Styles ─────────────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{__html: `
        @page {
          size: ${printSize === 'a4' ? 'A4' : printSize === 'a5' ? 'A5' : '100mm 150mm'};
          margin: 0;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-qr-section, #printable-qr-section * {
            visibility: visible;
          }
          #printable-qr-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 2rem;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          .print-hide {
            display: none !important;
          }
          .print-text-white {
            color: white !important;
          }
          .print-qr-container {
            background: white !important;
            padding: 1.5rem !important;
            border-radius: 1.5rem !important;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5) !important;
          }
        }
      `}} />

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 print-hide" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <h2 className="text-xl font-black text-slate-900">
              {locale === 'ar' ? 'رمز الحجز الذكي للعيادة' : 'Smart Clinic Booking QR'}
            </h2>
            <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors active:scale-95">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="flex py-20 items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
              </div>
            ) : venue && (
              <div className="flex flex-col items-center">
                
                {/* Size Selection Tabs */}
                <div className="mb-8 flex w-full gap-2 rounded-2xl bg-slate-100 p-1.5 print-hide">
                  <button
                    onClick={() => setPrintSize('a4')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${printSize === 'a4' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <FileCheck2 className="h-4 w-4" />
                    A4 Poster
                  </button>
                  <button
                    onClick={() => setPrintSize('a5')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${printSize === 'a5' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Presentation className="h-4 w-4" />
                    A5 Flyer
                  </button>
                  <button
                    onClick={() => setPrintSize('desk')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${printSize === 'desk' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Smartphone className="h-4 w-4" />
                    Desk Tent
                  </button>
                </div>

                {/* Preview Area */}
                <div className="relative mb-8 w-full overflow-hidden rounded-3xl bg-slate-900 p-8 text-center print-hide shadow-inner border border-slate-800">
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
                    <div className="h-32 w-32 rounded-full bg-teal-500/50 blur-[50px]" />
                  </div>
                  
                  <div className="relative z-10 flex flex-col items-center">
                    <h3 className="text-xl font-black text-white mb-1">
                      {locale === 'ar' ? venue.name_ar : venue.name_en}
                    </h3>
                    <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-6">
                      {locale === 'ar' ? 'امسح الرمز للحجز فوراً' : 'Scan to Book Instantly'}
                    </p>

                    <div className="rounded-2xl bg-white p-3 shadow-xl ring-4 ring-white/10">
                      <QRCode value={qrUrl} size={140} level="H" fgColor="#0f172a" />
                    </div>
                  </div>
                </div>

                {/* Printable Section (Hidden in UI, Shown in Print) */}
                <div id="printable-qr-section" className="hidden flex-col items-center justify-center text-center">
                  <div className="mb-12 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 text-white shadow-2xl">
                    <span className="text-4xl font-black print-text-white">خ</span>
                  </div>

                  <h3 className="text-5xl font-black mb-4 print-text-white" style={{color: 'white'}}>
                    {locale === 'ar' ? venue.name_ar : venue.name_en}
                  </h3>
                  <p className="text-xl font-bold uppercase tracking-[0.2em] mb-16 print-text-white" style={{color: '#2dd4bf'}}>
                    {locale === 'ar' ? 'امسح الرمز باستخدام كاميرا هاتفك للحجز فوراً' : 'Scan with your camera to book instantly'}
                  </p>

                  <div className="print-qr-container mb-12">
                    <QRCode value={qrUrl} size={printSize === 'desk' ? 200 : 320} level="H" fgColor="#0f172a" />
                  </div>
                  
                  <div className="flex items-center gap-3 opacity-60">
                    <div className="h-px w-12 bg-white/30" />
                    <p className="text-sm font-semibold tracking-widest print-text-white uppercase" style={{color: 'white'}}>
                      Powered by Khalas
                    </p>
                    <div className="h-px w-12 bg-white/30" />
                  </div>
                </div>

                <div className="grid w-full grid-cols-2 gap-3 print-hide">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(qrUrl);
                      alert(locale === 'ar' ? 'تم نسخ الرابط!' : 'Link copied!');
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                  >
                    <LinkIcon className="h-4 w-4" />
                    {locale === 'ar' ? 'نسخ الرابط' : 'Copy Link'}
                  </button>
                  
                  <button
                    onClick={handlePrint}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition-all hover:bg-teal-700 hover:shadow-teal-600/40 active:scale-[0.98]"
                  >
                    <Printer className="h-4 w-4" />
                    {locale === 'ar' ? 'طباعة الرمز' : 'Print Poster'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
