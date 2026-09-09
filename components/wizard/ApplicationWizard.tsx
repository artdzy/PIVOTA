"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  Save,
} from "lucide-react";
import { Input, Label, FieldError, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LinkedInIcon } from "@/components/ui/icons";
import { Checkbox } from "@/components/ui/Checkbox";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { submitApplication } from "@/lib/applications/actions";
import { saveDraft, loadDraft, clearDraft, type WizardDraft } from "@/lib/wizard/draft";
import { formatDate, formatEmploymentType } from "@/lib/utils";

type ScreeningQuestion = {
  id: string;
  label: string;
  type: "select" | "boolean";
  options?: string[];
};

type WizardJob = {
  id: string;
  job_no: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string;
  posted_at: string;
  screening_questions: ScreeningQuestion[];
};

type FormValues = {
  fullName: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  screeningAnswers: Record<string, string | boolean>;
};

const STEP_LABELS = [
  "İlan Özeti",
  "Kişisel Bilgiler",
  "CV Yükleme",
  "Ön İzleme",
  "KVKK Onayı",
];

const ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_MB = 5;

export function ApplicationWizard({
  job,
  userId,
  defaultFullName,
  defaultEmail,
}: {
  job: WizardJob;
  userId: string;
  defaultFullName: string;
  defaultEmail: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [kvkkConsent, setKvkkConsent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      fullName: defaultFullName,
      email: defaultEmail,
      phone: "",
      linkedinUrl: "",
      screeningAnswers: {},
    },
  });

  useEffect(() => {
    const draft = loadDraft(job.job_no, userId);
    if (draft) {
      setValue("fullName", draft.fullName);
      setValue("email", draft.email);
      setValue("phone", draft.phone);
      setValue("linkedinUrl", draft.linkedinUrl);
      setValue("screeningAnswers", draft.screeningAnswers);
      setStep(Math.min(draft.step, 3));
      setDraftRestored(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persistDraft(currentStep: number) {
    const values = getValues();
    const draft: WizardDraft = {
      step: currentStep,
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      linkedinUrl: values.linkedinUrl,
      screeningAnswers: values.screeningAnswers,
      savedAt: new Date().toISOString(),
    };
    saveDraft(job.job_no, userId, draft);
  }

  async function goNext() {
    if (step === 2) {
      const valid = await trigger(["fullName", "email", "phone"]);
      const answers = getValues("screeningAnswers");
      const allAnswered = job.screening_questions.every(
        (q) => answers[q.id] !== undefined && answers[q.id] !== "",
      );
      if (!valid || !allAnswered) {
        if (!allAnswered) setSubmitError("Lütfen tüm eleme sorularını yanıtlayın.");
        return;
      }
      setSubmitError(null);
    }
    if (step === 3 && !resumeFile) {
      setFileError("Devam etmek için CV yüklemelisiniz.");
      return;
    }
    setStep((s) => Math.min(s + 1, 5));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  function handleSaveAndContinueLater() {
    persistDraft(step);
    router.push("/");
  }

  function validateAndSetFile(file: File) {
    if (!ALLOWED_MIME.includes(file.type)) {
      setFileError("Sadece PDF, JPEG veya Word (.doc/.docx) dosyaları kabul edilir.");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setFileError(`Dosya boyutu ${MAX_FILE_MB}MB'ı geçemez.`);
      return;
    }
    setFileError(null);
    setResumeFile(file);
  }

  function fillFromLinkedin() {
    setValue("linkedinUrl", "https://linkedin.com/in/ornek-aday");
    if (!getValues("phone")) setValue("phone", "+90 555 123 45 67");
  }

  async function onFinalSubmit() {
    if (!resumeFile) {
      setFileError("CV dosyası bulunamadı, lütfen tekrar yükleyin.");
      setStep(3);
      return;
    }
    if (!kvkkConsent) {
      setSubmitError("Devam etmek için KVKK onayı vermelisiniz.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const base64 = await fileToBase64(resumeFile);
      const values = getValues();
      const result = await submitApplication({
        jobId: job.id,
        jobNo: job.job_no,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        linkedinUrl: values.linkedinUrl,
        screeningAnswers: values.screeningAnswers,
        kvkkConsent: true,
        resumeBase64: base64,
        resumeMime: resumeFile.type,
        resumeFileName: resumeFile.name,
      });

      if (result.error || !result.applicationNo) {
        setSubmitError(result.error ?? "Başvuru gönderilemedi, lütfen tekrar deneyin.");
        setIsSubmitting(false);
        return;
      }

      clearDraft(job.job_no, userId);
      router.push(`/basvuru/${job.job_no}/basarili?no=${result.applicationNo}`);
    } catch {
      setSubmitError("Beklenmeyen bir hata oluştu, lütfen tekrar deneyin.");
      setIsSubmitting(false);
    }
  }

  const values = watch();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <ProgressBar step={step} totalSteps={5} labels={STEP_LABELS} />
      </div>

      {draftRestored && step < 4 && (
        <div className="mb-6 rounded-lg bg-indigo-50 px-3.5 py-2.5 text-sm text-indigo-700">
          Kaldığınız yerden devam ediyorsunuz — önceki taslağınız yüklendi.
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        {step === 1 && (
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="indigo">{job.job_no}</Badge>
              <Badge tone="slate">{formatEmploymentType(job.employment_type)}</Badge>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{job.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {job.department} · {job.location} · İlan tarihi {formatDate(job.posted_at)}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{job.description}</p>
            <p className="mt-6 text-sm text-slate-500">
              Bu başvuru formu 5 adımdan oluşur ve ortalama 2 dakika sürer. İstediğiniz an
              &quot;Kaydet ve Sonra Devam Et&quot; ile ara verebilirsiniz.
            </p>
            <Button size="lg" className="mt-6 w-full" onClick={() => setStep(2)}>
              Başla
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Kişisel Bilgiler</h2>
            <div>
              <Label htmlFor="fullName" required>
                Ad Soyad
              </Label>
              <Input
                id="fullName"
                {...register("fullName", { required: "Ad soyad gerekli" })}
              />
              <FieldError message={errors.fullName?.message} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="email" required>
                  E-posta
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email", { required: "E-posta gerekli" })}
                />
                <FieldError message={errors.email?.message} />
              </div>
              <div>
                <Label htmlFor="phone" required>
                  Telefon
                </Label>
                <Input
                  id="phone"
                  placeholder="+90 5xx xxx xx xx"
                  {...register("phone", { required: "Telefon gerekli" })}
                />
                <FieldError message={errors.phone?.message} />
              </div>
            </div>
            <div>
              <Label htmlFor="linkedinUrl">LinkedIn Profili (opsiyonel)</Label>
              <Input
                id="linkedinUrl"
                placeholder="https://linkedin.com/in/..."
                {...register("linkedinUrl")}
              />
            </div>

            <h3 className="mt-2 text-sm font-semibold text-slate-900">Eleme Soruları</h3>
            {job.screening_questions.map((q) => (
              <div key={q.id}>
                <Label required>{q.label}</Label>
                {q.type === "select" ? (
                  <Select
                    value={(values.screeningAnswers[q.id] as string) ?? ""}
                    onChange={(e) =>
                      setValue(`screeningAnswers.${q.id}`, e.target.value, {
                        shouldDirty: true,
                      })
                    }
                  >
                    <option value="" disabled>
                      Seçiniz
                    </option>
                    {q.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    {["Evet", "Hayır"].map((opt) => {
                      const boolVal = opt === "Evet";
                      const selected = values.screeningAnswers[q.id] === boolVal;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setValue(`screeningAnswers.${q.id}`, boolVal, {
                              shouldDirty: true,
                            })
                          }
                          className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                            selected
                              ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                              : "border-slate-300 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {submitError && <p className="text-sm text-rose-600">{submitError}</p>}
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-4">
            <h2 className="text-lg font-semibold text-slate-900">CV Yükleme</h2>
            <button
              type="button"
              onClick={fillFromLinkedin}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#0A66C2] px-3.5 py-2 text-sm font-medium text-[#0A66C2] hover:bg-[#0A66C2]/5"
            >
              <LinkedInIcon className="h-4 w-4 fill-[#0A66C2]" />
              LinkedIn ile Doldur
            </button>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const file = e.dataTransfer.files?.[0];
                if (file) validateAndSetFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
                dragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-300 hover:bg-slate-50"
              }`}
            >
              <UploadCloud className="h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium text-slate-700">
                Dosyayı sürükleyip bırakın veya seçmek için tıklayın
              </p>
              <p className="text-xs text-slate-400">PDF, JPEG, DOC, DOCX — maks. {MAX_FILE_MB}MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) validateAndSetFile(file);
                }}
              />
            </div>

            {resumeFile && (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <span className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  {resumeFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => setResumeFile(null)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <FieldError message={fileError ?? undefined} />
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Ön İzleme</h2>
            <SummaryRow label="Ad Soyad" value={values.fullName} />
            <SummaryRow label="E-posta" value={values.email} />
            <SummaryRow label="Telefon" value={values.phone} />
            <SummaryRow label="LinkedIn" value={values.linkedinUrl || "—"} />
            <SummaryRow label="CV" value={resumeFile?.name ?? "—"} />
            {job.screening_questions.map((q) => (
              <SummaryRow
                key={q.id}
                label={q.label}
                value={formatAnswer(values.screeningAnswers[q.id])}
              />
            ))}
          </div>
        )}

        {step === 5 && (
          <div className="grid gap-4">
            <h2 className="text-lg font-semibold text-slate-900">KVKK Onayı</h2>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-600">
              6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında; bu
              başvuru formunda paylaştığım ad-soyad, iletişim bilgileri, özgeçmiş ve eleme
              sorularına verdiğim cevaplar dahil kişisel verilerimin, Pivota tarafından işe alım
              sürecinin yürütülmesi amacıyla <strong>işlenmesine, Pivota&apos;nın sözleşmeli
              bulut sunucularında (Supabase altyapısı) saklanmasına</strong> ve ilgili İK
              ekipleriyle paylaşılmasına açık rızam ile onay veriyorum. Verilerim, başvuru
              sürecinin sona ermesinden itibaren mevzuatın öngördüğü süre boyunca saklanacak ve
              sonrasında silinecek veya anonim hale getirilecektir.
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-700">
              <Checkbox
                checked={kvkkConsent}
                onChange={(e) => setKvkkConsent(e.target.checked)}
              />
              Yukarıdaki KVKK Aydınlatma Metni&apos;ni okudum, kişisel verilerimin işlenmesine ve
              sunucularda saklanmasına onay veriyorum.
            </label>
            {submitError && <p className="text-sm text-rose-600">{submitError}</p>}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div>
          {step > 1 && step < 5 && (
            <Button variant="ghost" onClick={goBack}>
              Geri
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {step > 1 && step < 5 && (
            <Button variant="secondary" onClick={handleSaveAndContinueLater}>
              <Save className="h-4 w-4" />
              Kaydet, Sonra Devam Et
            </Button>
          )}
          {step < 5 && step > 1 && (
            <Button onClick={goNext}>Devam Et</Button>
          )}
          {step === 5 && (
            <Button onClick={onFinalSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Başvuruyu Gönder
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2.5 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}

function formatAnswer(value: string | boolean | undefined): string {
  if (value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  return value;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
