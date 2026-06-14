'use client';

import {useEffect, useRef, useState} from 'react';
import {useLocale} from 'next-intl';
import {useParams, useRouter} from 'next/navigation';
import {
  Upload, FileText, Image, X, CheckCircle2, Loader2,
  ArrowLeft, Stethoscope, AlertCircle, Paperclip
} from 'lucide-react';

import {useSession} from '@/components/session-provider';
import {SiteShell} from '@/components/site-shell';
import {getDossier, upsertDossier, deleteDossierFile, DossierFile} from '@/lib/api';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function DossierPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.appointmentId as string;
  const {isAuthenticated, isReady, user} = useSession();

  const [chiefComplaintAr, setChiefComplaintAr] = useState('');
  const [chiefComplaintEn, setChiefComplaintEn] = useState('');
  const [files, setFiles] = useState<DossierFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAr = locale === 'ar';

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.push(`/${locale}/auth/login?redirect=/${locale}/dashboard/dossier/${appointmentId}`);
      return;
    }
    // Load existing dossier
    getDossier(appointmentId).then(d => {
      if (d) {
        setChiefComplaintAr(d.chief_complaint_ar || '');
        setChiefComplaintEn(d.chief_complaint_en || '');
        setFiles(d.files || []);
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [isReady, isAuthenticated, appointmentId, locale, router]);

  async function handleFileAdd(rawFiles: FileList | null) {
    if (!rawFiles) return;
    const MAX_FILES = 5;
    const remaining = MAX_FILES - files.length;
    if (remaining <= 0) {
      setError(isAr ? 'الحد الأقصى 5 ملفات.' : 'Maximum 5 files allowed.');
      return;
    }
    setError(null);
    const toAdd = Array.from(rawFiles).slice(0, remaining);
    const newFiles: DossierFile[] = [];
    for (const file of toAdd) {
      if (file.size > 5 * 1024 * 1024) {
        setError(isAr ? `الملف "${file.name}" يتجاوز 5 ميجا.` : `File "${file.name}" exceeds 5 MB.`);
        continue;
      }
      const b64 = await fileToBase64(file);
      newFiles.push({
        filename: file.name,
        file_type: file.type,
        file_data_base64: b64,
        label: '',
        uploaded_at: new Date().toISOString(),
      });
    }
    setFiles(prev => [...prev, ...newFiles]);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    handleFileAdd(e.dataTransfer.files);
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }

  function updateFileLabel(index: number, label: string) {
    setFiles(prev => prev.map((f, i) => i === index ? {...f, label} : f));
  }

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      await upsertDossier(appointmentId, {
        chief_complaint_ar: chiefComplaintAr || undefined,
        chief_complaint_en: chiefComplaintEn || undefined,
        files: files.length > 0 ? files : undefined,
      });
      setSuccess(true);
      setTimeout(() => router.push(`/${locale}/dashboard`), 1500);
    } catch (e: any) {
      setError(e.message || (isAr ? 'حدث خطأ، حاول مرة أخرى.' : 'Something went wrong, please try again.'));
    } finally {
      setIsSaving(false);
    }
  }

  if (!isReady || isLoading) {
    return (
      <SiteShell title={isAr ? 'ملفك الطبي' : 'Your Medical File'}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell title={isAr ? 'جهّز ملفك للطبيب' : 'Prepare Your File for the Doctor'}>
      <div className="mx-auto max-w-xl space-y-6">

        {/* Header */}
        <div>
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {isAr ? 'رجوع' : 'Back'}
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
              <Stethoscope className="h-5 w-5 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-black text-zinc-900">
                {isAr ? 'جهّز ملفك للطبيب' : 'Prepare Your File for the Doctor'}
              </h1>
              <p className="text-sm text-zinc-500">
                {isAr
                  ? 'ارفع تحاليلك وأشعتك حتى يراجعها الدكتور قبل موعدك'
                  : 'Upload your labs & scans so your doctor can review them before your visit'}
              </p>
            </div>
          </div>
        </div>

        {/* Chief Complaint */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-widest">
            {isAr ? 'سبب الزيارة' : 'Chief Complaint'}
          </h2>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-zinc-500">بالعربية</span>
              <textarea
                dir="rtl"
                value={chiefComplaintAr}
                onChange={e => setChiefComplaintAr(e.target.value)}
                rows={3}
                placeholder="اكتب سبب زيارتك للدكتور، الأعراض، ومدتها..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:bg-white focus:border-brand hover:border-zinc-300 placeholder:text-zinc-400"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-zinc-500">In English</span>
              <textarea
                dir="ltr"
                value={chiefComplaintEn}
                onChange={e => setChiefComplaintEn(e.target.value)}
                rows={3}
                placeholder="Describe your symptoms, when they started, and any relevant history..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:bg-white focus:border-brand hover:border-zinc-300 placeholder:text-zinc-400"
              />
            </label>
          </div>
        </div>

        {/* File Upload */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-widest">
              {isAr ? 'المرفقات' : 'Attachments'}
            </h2>
            <span className="text-xs text-zinc-400 font-medium">{files.length}/5</span>
          </div>

          {/* Drop Zone */}
          {files.length < 5 && (
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 transition-all ${
                isDragging
                  ? 'border-brand bg-brand/5 scale-[1.01]'
                  : 'border-zinc-200 bg-zinc-50 hover:border-brand/50 hover:bg-brand/5'
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-zinc-200 shadow-sm">
                <Upload className="h-6 w-6 text-zinc-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-zinc-700">
                  {isAr ? 'اضغط لرفع ملف أو اسحبه هنا' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {isAr ? 'صور، PDF — حتى 5 ميجا للملف' : 'Images, PDF — up to 5 MB each'}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                onChange={e => handleFileAdd(e.target.files)}
              />
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => {
                const isImage = f.file_type.startsWith('image/');
                return (
                  <div key={i} className="group flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-zinc-100 shadow-sm">
                      {isImage
                        ? <Image className="h-5 w-5 text-blue-500" />
                        : <FileText className="h-5 w-5 text-rose-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-800">{f.filename}</p>
                      <input
                        type="text"
                        value={f.label || ''}
                        onChange={e => updateFileLabel(i, e.target.value)}
                        placeholder={isAr ? 'وصف الملف (اختياري)...' : 'Label (optional)...'}
                        className="mt-1 w-full rounded-lg border border-transparent bg-transparent px-0 text-xs text-zinc-500 outline-none focus:border-zinc-200 focus:bg-white focus:px-2 transition-all placeholder:text-zinc-400"
                      />
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="shrink-0 rounded-lg p-1 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSave}
          disabled={isSaving || success || (!chiefComplaintAr && !chiefComplaintEn && files.length === 0)}
          className={`group flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
            success
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-brand text-white hover:bg-brand-hover shadow-md shadow-brand/20'
          }`}
        >
          {isSaving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : success ? (
            <>
              <CheckCircle2 className="h-5 w-5" />
              {isAr ? 'تم الحفظ بنجاح!' : 'Saved successfully!'}
            </>
          ) : (
            <>
              <Paperclip className="h-4 w-4" />
              {isAr ? 'أرسل ملفك للطبيب' : 'Send to Doctor'}
            </>
          )}
        </button>

        {/* Trust note */}
        <p className="text-center text-xs text-zinc-400">
          {isAr
            ? '🔒 ملفاتك خاصة ولا يراها إلا طبيبك.'
            : '🔒 Your files are private and only visible to your doctor.'}
        </p>
      </div>
    </SiteShell>
  );
}
