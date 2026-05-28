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
    <div className="space-y-4 rounded-[2rem] border border-white/10 bg-slate-950/90 backdrop-blur-md p-6 text-slate-200 shadow-xl shadow-teal/5">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {locale === 'ar' ? 'حالة الاتصال' : 'Connection Status'}
        </span>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${indicatorClassName}`} />
          <span className="text-sm font-semibold">{stateLabel}</span>
        </div>
      </div>

      <div className="space-y-3.5 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">{t('service')}</span>
          <span className="text-sm font-semibold text-white">{serviceName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">{t('status')}</span>
          <span className="text-sm font-semibold text-white">{healthStatus}</span>
        </div>
        <div className="flex flex-col gap-1 pt-3 border-t border-white/5">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{t('checkedAt')}</span>
          <span className="text-sm font-semibold text-emerald-300/90" dir="ltr">{checkedAt}</span>
        </div>
      </div>
    </div>
  );
}

