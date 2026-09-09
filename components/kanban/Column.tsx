"use client";

import { useDroppable } from "@dnd-kit/core";
import { Card } from "./Card";
import type { KanbanApplication } from "./Board";

export function Column({
  id,
  title,
  applications,
  onSelect,
}: {
  id: string;
  title: string;
  applications: KanbanApplication[];
  onSelect: (application: KanbanApplication) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-slate-100/70">
      <div className="flex items-center justify-between px-3.5 py-3">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
          {applications.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[140px] flex-1 flex-col gap-2 rounded-b-xl px-2.5 pb-3 transition-colors ${
          isOver ? "bg-indigo-100/60" : ""
        }`}
      >
        {applications.map((app) => (
          <Card key={app.id} application={app} onClick={() => onSelect(app)} />
        ))}
        {applications.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-slate-400">Aday yok</p>
        )}
      </div>
    </div>
  );
}
