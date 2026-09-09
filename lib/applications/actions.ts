"use server";

import { createClient } from "@/lib/supabase/server";
import { generateApplicationNo } from "@/lib/applications/generateApplicationNo";
import { extractResumeText, scoreResumeAgainstJob } from "@/lib/matching/scoreResume";
import type { Enums } from "@/types/database.types";
import { revalidatePath } from "next/cache";

export type SubmitApplicationInput = {
  jobId: string;
  jobNo: string;
  fullName: string;
  email: string;
  phone: string;
  linkedinUrl?: string;
  screeningAnswers: Record<string, string | boolean>;
  kvkkConsent: boolean;
  resumeBase64: string;
  resumeMime: string;
  resumeFileName: string;
};

export async function submitApplication(input: SubmitApplicationInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Başvuru yapmak için giriş yapmalısınız." };
  }

  if (!input.kvkkConsent) {
    return { error: "KVKK onayı olmadan başvuru gönderilemez." };
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("id, requirements")
    .eq("id", input.jobId)
    .single();

  if (!job) {
    return { error: "İlan bulunamadı." };
  }

  const resumeBuffer = Buffer.from(input.resumeBase64, "base64");
  const resumeExt = input.resumeFileName.split(".").pop() ?? "dat";
  const resumePath = `${user.id}/${input.jobNo}-${Date.now()}.${resumeExt}`;

  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(resumePath, resumeBuffer, { contentType: input.resumeMime, upsert: false });

  if (uploadError) {
    return { error: `CV yüklenemedi: ${uploadError.message}` };
  }

  const resumeText = await extractResumeText(resumeBuffer, input.resumeMime);
  const matchScore = resumeText
    ? scoreResumeAgainstJob(resumeText, job.requirements)
    : null;

  const applicationNo = generateApplicationNo();

  const { error: insertError } = await supabase.from("applications").insert({
    application_no: applicationNo,
    job_id: job.id,
    candidate_id: user.id,
    full_name: input.fullName,
    email: input.email,
    phone: input.phone,
    linkedin_url: input.linkedinUrl || null,
    resume_path: resumePath,
    resume_mime: input.resumeMime,
    match_score: matchScore,
    screening_answers: input.screeningAnswers,
    kvkk_consent: true,
    kvkk_consent_at: new Date().toISOString(),
    source: "website",
    stage: "ilk_basvuru",
  });

  if (insertError) {
    return { error: `Başvuru kaydedilemedi: ${insertError.message}` };
  }

  revalidatePath("/");
  revalidatePath(`/ilanlar/${input.jobNo}`);
  revalidatePath("/panel");

  return { error: null, applicationNo };
}

export async function updateApplicationStage(
  applicationId: string,
  stage: Enums<"application_stage">,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("applications")
    .update({ stage, last_activity_at: new Date().toISOString() })
    .eq("id", applicationId);

  revalidatePath("/panel");

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

export async function getResumeSignedUrl(resumePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("resumes")
    .createSignedUrl(resumePath, 60 * 10);

  if (error) return null;
  return data.signedUrl;
}
