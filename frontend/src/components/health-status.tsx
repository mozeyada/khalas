'use client';

import {useLocale, useTranslations} from 'next-intl';
import {useEffect, useState} from 'react';

import {apiBaseUrl} from '@/lib/api';

type HealthPayload = {
  success: boolean;
  data: {
    status: string;
    service: string;
  };
  error: string | null;
};

type HealthRequestState = 'loading' | 'success' | 'error';

export function HealthStatus() {
  const locale = useLocale();
  const t = useTranslations('HomePage.health');

  const [requestState, setRequestState] = useState<HealthRequestState>('loading');
  const [serviceName, setServiceName] = useState<string>('-');
  const [healthStatus, setHealthStatus] = useState<string>('-');
  const [checkedAt, setCheckedAt] = useState<string>('-');

  useEffect(() => {
    const controller = new AbortController();

    const formatTimestamp = () =>
      new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Africa/Cairo'
      }).format(new Date());

    async function loadHealthStatus() {
      setRequestState('loading');

      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/health`, {
          cache: 'no-store',
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error('Health check request failed.');
        }

        const payload = (await response.json()) as HealthPayload;

        setServiceName(payload.data.service);
        setHealthStatus(payload.data.status);
        setCheckedAt(formatTimestamp());
        setRequestState('success');
      } catch {
        setServiceName(t('unavailable'));
        setHealthStatus(t('unavailable'));
        setCheckedAt(formatTimestamp());
        setRequestState('error');
      }
    }

    void loadHealthStatus();

    return () => {
      controller.abort();
    };
  }, [locale, t]);

  const indicatorClassName =
    requestState === 'success'
      ? 'bg-emerald-400 shadow-[0_0_24px_rgba(74,222,128,0.55)]'
      : requestState === 'error'
        ? 'bg-rose-400 shadow-[0_0_24px_rgba(251,113,133,0.45)]'
        : 'bg-amber-300 shadow-[0_0_24px_rgba(252,211,77,0.45)]';

  const stateLabel =
    requestState === 'success'
      ? t('online')
      : requestState === 'error'
        ? t('offline')
        : t('loading');

  return (
    <div className="space-y-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-3">
        <span className={`h-3.5 w-3.5 rounded-full ${indicatorClassName}`} />
        <span className="text-lg font-semibold">{stateLabel}</span>
      </div>

      <dl className="grid gap-4 text-sm sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <dt className="mb-2 text-slate-400">{t('service')}</dt>
          <dd className="font-medium text-white">{serviceName}</dd>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <dt className="mb-2 text-slate-400">{t('status')}</dt>
          <dd className="font-medium text-white">{healthStatus}</dd>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <dt className="mb-2 text-slate-400">{t('checkedAt')}</dt>
          <dd className="font-medium text-white">{checkedAt}</dd>
        </div>
      </dl>
    </div>
  );
}

