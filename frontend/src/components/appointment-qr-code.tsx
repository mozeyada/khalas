'use client';

import {useEffect, useState} from 'react';
import QRCode from 'react-qr-code';
import {useTranslations} from 'next-intl';
import {ApiError} from '@/lib/api';

type QRPayload = {
  appointment_id: string;
  patient_id: string;
  slot_datetime: string;
  signature: string;
};

async function bffGetQR(appointmentId: string): Promise<QRPayload> {
  const res = await fetch(`/api/proxy/appointments/${appointmentId}/qr`, {cache: 'no-store'});
  if (!res.ok) {
    const errBody = (await res.json()) as {error?: string};
    throw new ApiError(errBody.error ?? 'Failed to get QR code.', res.status);
  }
  const data = (await res.json()) as {data: QRPayload};
  return data.data; // The backend might just return QRPayload directly or wrap in ApiResponse. Wait, the endpoint returns QRPayload directly.
}

export function AppointmentQRCode({appointmentId}: {appointmentId: string}) {
  const t = useTranslations('ConfirmationPage.qr');
  const [payload, setPayload] = useState<QRPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/proxy/appointments/${appointmentId}/qr`, {cache: 'no-store'});
        if (!res.ok) throw new Error('Failed to load QR');
        // Check if wrapped in data or not
        const json = await res.json();
        setPayload(json.data ?? json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading QR');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [appointmentId]);

  if (loading) {
    return <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-ink/20 bg-black/5 text-sm text-ink/50">{t('loading')}</div>;
  }

  if (error || !payload) {
    return <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-rose-200 bg-rose-50 text-sm text-rose-500">{t('unavailable')}</div>;
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://khalas.app';
  const qrString = `${baseUrl}/admin/check-in?appointment=${payload.appointment_id}&sig=${encodeURIComponent(payload.signature)}`;

  return (
    <div className="flex flex-col items-center space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <div className="rounded-xl bg-white p-2">
        <QRCode value={qrString} size={180} level="M" />
      </div>
      <p className="text-center text-xs text-ink/60">
        {t('instruction')}
      </p>
    </div>
  );
}
