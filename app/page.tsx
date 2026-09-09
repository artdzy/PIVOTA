import Link from "next/link";
import { MapPin, Users, CalendarDays, ArrowRight } from "lucide-react";
import { getActiveJobsWithCounts } from "@/lib/jobs/queries";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatEmploymentType } from "@/lib/utils";

export default async function LandingPage() {
  const jobs = await getActiveJobsWithCounts();

  return (
    <div>
      <section className="border-b border-slate-200 bg-gradient-to-b from-indigo-50 to-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Pivota Kariyer
          </p>
          <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            İK teknolojilerine tutkulu insanlarla birlikte büyüyoruz
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-600">
            Açık pozisyonlarımızı inceleyin, 2 dakikadan kısa sürede başvurunuzu tamamlayın.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Açık Pozisyonlar ({jobs.length})
          </h2>
        </div>

        <div className="grid gap-4">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/ilanlar/${job.job_no}`}
              className="group flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-md sm:flex-row sm:items-center sm:p-6"
            >
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge tone="indigo">{job.job_no}</Badge>
                  <Badge tone="slate">{formatEmploymentType(job.employment_type)}</Badge>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600">
                  {job.title}
                </h3>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {job.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-4 w-4" /> {job.applicant_count} başvuru
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" /> {formatDate(job.posted_at)}
                  </span>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 group-hover:bg-indigo-600 group-hover:text-white sm:self-auto">
                İlanı İncele
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
