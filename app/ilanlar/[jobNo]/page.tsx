import { notFound } from "next/navigation";
import { MapPin, Users, CalendarDays, Building2, CheckCircle2 } from "lucide-react";
import { getJobByNo } from "@/lib/jobs/queries";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { formatDate, formatEmploymentType } from "@/lib/utils";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobNo: string }>;
}) {
  const { jobNo } = await params;
  const job = await getJobByNo(jobNo);

  if (!job) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone="indigo">{job.job_no}</Badge>
        <Badge tone="slate">{formatEmploymentType(job.employment_type)}</Badge>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{job.title}</h1>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Building2 className="h-4 w-4" /> {job.department}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4" /> {job.location}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-4 w-4" /> {job.applicant_count} başvuru
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4" /> {formatDate(job.posted_at)}
        </span>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 text-base font-semibold text-slate-900">İlan Detayı</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
          {job.description}
        </p>

        <h3 className="mt-6 mb-3 text-base font-semibold text-slate-900">Aranan Nitelikler</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {job.requirements.map((req) => (
            <li key={req} className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-500" />
              <span className="capitalize">{req}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="font-semibold text-slate-900">Bu pozisyona başvurmaya hazır mısınız?</p>
          <p className="text-sm text-slate-600">Başvuru formu ortalama 2 dakika sürer.</p>
        </div>
        <LinkButton href={`/basvuru/${job.job_no}`} size="lg" className="w-full sm:w-auto">
          Başvur
        </LinkButton>
      </div>
    </div>
  );
}
