'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import QRCode from 'react-qr-code';
import { X, Printer, Loader2, Link as LinkIcon } from 'lucide-react';
import { getProviderVenues } from '@/lib/api';
import { PublicVenue } from '@/lib/types';

type VenueQrModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function VenueQrModal({ isOpen, onClose }: VenueQrModalProps) {
  const locale = useLocale();
  const [venue, setVenue] = useState<PublicVenue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <>
      {/* ── Print-only Styles ─────────────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{__html: `
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
            width: 100%;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 2rem;
            background: white !important;
          }
          .print-hide {
            display: none !important;
          }
        }
      `}} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 print-hide">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-sm overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
            <h2 className="text-base font-bold text-ink">
              {locale === 'ar' ? 'رمز حجز العيادة' : 'Clinic Booking QR'}
            </h2>
            <button onClick={onClose} className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-ink transition-colors active:scale-95">
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
              <div className="flex py-16 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--text-1)]" />
              </div>
            ) : venue && (
              <div className="flex flex-col items-center text-center">
                <div id="printable-qr-section" className="flex flex-col items-center w-full">
                  {/* Brand header for the printed page */}
                  <div className="mb-6 hidden print:flex items-center justify-center w-full">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-ink text-white text-xl font-bold">
                      خ
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-black mb-2">
                    {locale === 'ar' ? venue.name_ar : venue.name_en}
                  </h3>
                  <p className="text-sm font-semibold text-black/60 uppercase tracking-widest mb-8">
                    {locale === 'ar' ? 'امسح الرمز للحجز فوراً' : 'Scan to Book Instantly'}
                  </p>

                  <div className="rounded-md border-[10px] border-ink p-4 w-full max-w-[280px] bg-white shadow-sm">
                    <QRCode value={qrUrl} size={256} level="H" style={{ width: '100%', height: 'auto' }} fgColor="#0F172A" />
                  </div>
                  
                  <p className="mt-8 text-xs font-medium text-black/40 tracking-wider">
                    Powered by Khalas
                  </p>
                </div>

                <div className="mt-8 grid w-full gap-3 print-hide">
                  <button
                    onClick={handlePrint}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-ink px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-95 shadow-sm"
                  >
                    <Printer className="h-4 w-4" />
                    {locale === 'ar' ? 'طباعة الرمز' : 'Print QR Code'}
                  </button>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(qrUrl);
                      alert(locale === 'ar' ? 'تم نسخ الرابط!' : 'Link copied!');
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-50 border border-zinc-200 px-6 py-2.5 text-sm font-semibold text-ink transition-all hover:bg-zinc-100 active:scale-95"
                  >
                    <LinkIcon className="h-4 w-4" />
                    {locale === 'ar' ? 'نسخ الرابط' : 'Copy Booking Link'}
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
