import { createClient } from "@/lib/supabase/server";
import { Board } from "@/components/kanban/Board";
import type { Enums } from "@/types/database.types";

export default async function PanelPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select("*, jobs(title, job_no)")
    .order("last_activity_at", { ascending: false });

  const applications = (data ?? []).map((a) => ({
    id: a.id,
    application_no: a.application_no,
    full_name: a.full_name,
    stage: a.stage as Enums<"application_stage">,
    match_score: a.match_score,
    source: a.source,
    last_activity_at: a.last_activity_at,
    created_at: a.created_at,
    email: a.email,
    phone: a.phone,
    linkedin_url: a.linkedin_url,
    resume_path: a.resume_path,
    screening_answers: (a.screening_answers ?? {}) as Record<string, string | boolean>,
    jobTitle: (a.jobs as { title: string; job_no: string } | null)?.title ?? "—",
    jobNo: (a.jobs as { title: string; job_no: string } | null)?.job_no ?? "—",
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Aday Pipeline</h1>
      <p className="mb-6 text-sm text-slate-500">
        Kartları sürükleyerek aşama güncelleyin, bir karta tıklayarak detayları görün.
      </p>
      <Board initialApplications={applications} />
    </div>
  );
}
