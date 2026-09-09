import { notFound, redirect } from "next/navigation";
import { getJobByNo } from "@/lib/jobs/queries";
import { getCurrentUserWithProfile } from "@/lib/auth/actions";
import { ApplicationWizard } from "@/components/wizard/ApplicationWizard";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ jobNo: string }>;
}) {
  const { jobNo } = await params;
  const job = await getJobByNo(jobNo);
  if (!job) notFound();

  const session = await getCurrentUserWithProfile();
  if (!session) redirect(`/giris?next=/basvuru/${jobNo}`);

  return (
    <ApplicationWizard
      job={{
        id: job.id,
        job_no: job.job_no,
        title: job.title,
        department: job.department,
        location: job.location,
        employment_type: job.employment_type,
        description: job.description,
        posted_at: job.posted_at,
        screening_questions: Array.isArray(job.screening_questions)
          ? (job.screening_questions as never as {
              id: string;
              label: string;
              type: "select" | "boolean";
              options?: string[];
            }[])
          : [],
      }}
      userId={session.user.id}
      defaultFullName={session.profile.full_name}
      defaultEmail={session.user.email ?? ""}
    />
  );
}
