"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, FileDown, Calendar } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { ScoreBadge, Badge } from "@/components/ui/Badge";
import { LinkedInIcon } from "@/components/ui/icons";
import { formatDate, formatStage } from "@/lib/utils";
import { getResumeSignedUrl } from "@/lib/applications/actions";
import type { KanbanApplication } from "./Board";

export function DetailPanel({
  application,
  onClose,
}: {
  application: KanbanApplication | null;
  onClose: () => void;
}) {
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  useEffect(() => {
    setResumeUrl(null);
    if (application?.resume_path) {
      getResumeSignedUrl(application.resume_path).then(setResumeUrl);
    }
  }, [application?.resume_path]);

  return (
    <Sheet open={!!application} onClose={onClose} title={application?.full_name ?? ""}>
      {application && (
        <div className="grid gap-5">
          <div>
            <Badge tone="indigo">{application.application_no}</Badge>
            <p className="mt-2 text-sm text-slate-500">
              {application.jobTitle} · {application.jobNo}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ScoreBadge score={application.match_score} />
            <Badge>{formatStage(application.stage)}</Badge>
          </div>

          <div className="grid gap-2 text-sm text-slate-600">
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" />
              {application.email}
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate-400" />
              {application.phone}
            </p>
            {application.linkedin_url && (
              <p className="flex items-center gap-2">
                <LinkedInIcon className="h-4 w-4 fill-slate-400" />
                <a
                  href={application.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  {application.linkedin_url}
                </a>
              </p>
            )}
            <p className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              Başvuru: {formatDate(application.created_at)}
            </p>
          </div>

          {resumeUrl && (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-slate-100 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              <FileDown className="h-4 w-4" /> CV&apos;yi Görüntüle
            </a>
          )}

          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-800">Eleme Cevapları</h4>
            <div className="grid gap-1.5 text-sm">
              {Object.entries(application.screening_answers).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-600"
                >
                  <span>{key}</span>
                  <span className="font-medium text-slate-800">
                    {typeof value === "boolean" ? (value ? "Evet" : "Hayır") : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}
