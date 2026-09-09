import { createClient } from "@/lib/supabase/server";

export async function getActiveJobsWithCounts() {
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("is_active", true)
    .order("posted_at", { ascending: false });

  return jobs ?? [];
}

export async function getJobByNo(jobNo: string) {
  const supabase = await createClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("job_no", jobNo)
    .single();

  return job;
}
