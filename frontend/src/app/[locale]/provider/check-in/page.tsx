'use client';

import {useEffect, useState} from 'react';
import {useSearchParams, useRouter} from 'next/navigation';
import {CheckCircle2, Loader2, ArrowRight, UserCheck} from 'lucide-react';

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
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-slate-950 p-6 font-sans" dir="rtl">
      {/* ── Background Elements ── */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="absolute h-[50vh] w-[50vh] rounded-full bg-teal-500/20 blur-[120px]" />
        <div className="absolute h-[60vh] w-[60vh] translate-x-1/2 translate-y-1/4 rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-xl">
          {!success ? (
            <div className="flex flex-col items-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-400 to-emerald-600 shadow-lg shadow-teal-500/30">
                <UserCheck className="h-10 w-10 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="mb-3 text-3xl font-black tracking-tight text-white">تسجيل الحضور</h1>
              <p className="mb-10 text-slate-400">يرجى تأكيد وصول المُراجع للعيادة لتمكينه من الدخول.</p>
              
              {error && (
                <div className="mb-8 w-full animate-in zoom-in-95 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300 flex items-start text-right backdrop-blur-md">
                  <span>{error}</span>
                </div>
              )}
              
              <button
                onClick={handleCheckIn}
                disabled={loading}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-900 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 hover:bg-slate-100"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>تأكيد الحضور الآن</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:-translate-x-1 rotate-180" />
                  </>
                )}
              </button>
              
              <button 
                onClick={() => router.push('/ar/provider/dashboard')}
                className="mt-6 text-sm font-semibold text-slate-400 transition-colors hover:text-white"
              >
                إلغاء والعودة للوحة التحكم
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
              <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl shadow-emerald-500/30">
                <CheckCircle2 className="h-14 w-14 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="mb-3 text-3xl font-black tracking-tight text-white">تم تأكيد الحضور بنجاح!</h1>
              <p className="mb-6 text-slate-400">تم تسجيل وصول المُراجع للعيادة. يمكنه الدخول الآن.</p>
              
              <div className="flex items-center gap-2 mt-4 text-emerald-400 text-sm font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-400 dot-pulse" />
                جاري العودة للوحة التحكم...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
