'use client';

import {useEffect, useState} from 'react';
import {useSearchParams, useRouter} from 'next/navigation';

export default function CheckInPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const appointmentId = searchParams.get('appointment');
  const patientId = searchParams.get('patient');
  const slotStr = searchParams.get('slot');
  const sig = searchParams.get('sig');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckIn = async () => {
    if (!appointmentId || !patientId || !slotStr || !sig) {
      setError("Invalid QR code data. Missing required fields.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/appointments/${appointmentId}/check-in`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          appointment_id: appointmentId,
          patient_id: patientId,
          slot_datetime: slotStr,
          signature: sig
        })
      });
      
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || payload.detail || "Failed to check in");
      }
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/ar/provider/dashboard');
      }, 3000);
      
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center p-6 bg-slate-50 font-sans" dir="rtl">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl text-center flex flex-col items-center border border-slate-100">
        {!success ? (
          <>
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 ring-8 ring-teal-50/50">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
            </div>
            <h1 className="mb-3 text-2xl font-bold tracking-tight text-slate-900">تسجيل حضور المريض</h1>
            <p className="mb-8 text-base text-slate-500">يرجى تأكيد وصول المريض للعيادة.</p>
            
            {error && (
              <div className="mb-6 w-full rounded-xl bg-rose-50 p-4 text-sm text-rose-600 border border-rose-100 flex items-start text-right">
                <svg className="w-5 h-5 mr-0 ml-2 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>{error}</span>
              </div>
            )}
            
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="w-full rounded-xl bg-teal-600 py-4 font-semibold text-white shadow-lg shadow-teal-600/20 transition-all hover:bg-teal-700 hover:shadow-teal-600/40 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري المعالجة...
                </span>
              ) : "تأكيد الحضور"}
            </button>
            <button 
              onClick={() => router.push('/ar/provider/dashboard')}
              className="mt-4 w-full py-3 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              إلغاء والعودة
            </button>
          </>
        ) : (
          <>
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-500 animate-[bounce_1s_ease-in-out_infinite]">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900">تم تأكيد الحضور!</h1>
            <p className="mb-4 text-base text-slate-500">تم تسجيل وصول المريض بنجاح.</p>
            <div className="w-12 h-1 bg-slate-100 rounded-full mb-4"></div>
            <p className="text-sm text-slate-400">جاري العودة للوحة التحكم...</p>
          </>
        )}
      </div>
    </div>
  );
}
