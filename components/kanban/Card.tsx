"use client";

import { useDraggable } from "@dnd-kit/core";
import { Globe, Users2 } from "lucide-react";
import { ScoreBadge } from "@/components/ui/Badge";
import { LinkedInIcon } from "@/components/ui/icons";
import { formatRelativeDate } from "@/lib/utils";
import type { KanbanApplication } from "./Board";

export function Card({
  application,
  onClick,
  overlay,
}: {
  application: KanbanApplication;
  onClick?: () => void;
  overlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition active:cursor-grabbing ${
        isDragging && !overlay ? "opacity-40" : "hover:border-indigo-300"
      } ${overlay ? "rotate-2 shadow-lg" : ""}`}
    >
      <p className="text-sm font-semibold text-slate-800">{application.full_name}</p>
      <p className="mt-0.5 truncate text-xs text-slate-500">{application.jobTitle}</p>
      <div className="mt-2.5 flex items-center justify-between">
        <ScoreBadge score={application.match_score} />
        {application.source === "linkedin" ? (
          <LinkedInIcon className="h-3.5 w-3.5 shrink-0 fill-slate-400" />
        ) : application.source === "referans" ? (
          <Users2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        ) : (
          <Globe className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        )}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        {formatRelativeDate(application.last_activity_at)}
      </p>
    </div>
  );
}
