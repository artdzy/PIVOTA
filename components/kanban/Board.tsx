"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Column } from "./Column";
import { Card } from "./Card";
import { DetailPanel } from "./DetailPanel";
import { updateApplicationStage } from "@/lib/applications/actions";
import type { Enums } from "@/types/database.types";

const STAGES: { id: Enums<"application_stage">; label: string }[] = [
  { id: "ilk_basvuru", label: "İlk Başvuru" },
  { id: "telefon_gorusmesi", label: "Telefon Görüşmesi" },
  { id: "teknik_mulakat", label: "Teknik Mülakat" },
  { id: "teklif", label: "Teklif" },
  { id: "ise_alindi", label: "İşe Alındı" },
];

export type KanbanApplication = {
  id: string;
  application_no: string;
  full_name: string;
  stage: Enums<"application_stage">;
  match_score: number | null;
  source: string;
  last_activity_at: string;
  created_at: string;
  email: string;
  phone: string;
  linkedin_url: string | null;
  resume_path: string | null;
  screening_answers: Record<string, string | boolean>;
  jobTitle: string;
  jobNo: string;
};

export function Board({ initialApplications }: { initialApplications: KanbanApplication[] }) {
  const [applications, setApplications] = useState(initialApplications);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<KanbanApplication | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const newStage = over.id as Enums<"application_stage">;
    const appId = active.id as string;
    const current = applications.find((a) => a.id === appId);
    if (!current || current.stage === newStage) return;

    setApplications((prev) =>
      prev.map((a) =>
        a.id === appId
          ? { ...a, stage: newStage, last_activity_at: new Date().toISOString() }
          : a,
      ),
    );
    void updateApplicationStage(appId, newStage);
  }

  const activeApp = applications.find((a) => a.id === activeId) ?? null;
  const selectedLive = selected
    ? (applications.find((a) => a.id === selected.id) ?? null)
    : null;

  return (
    <>
      <DndContext
        id="pivota-kanban"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(e.active.id as string)}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <Column
              key={stage.id}
              id={stage.id}
              title={stage.label}
              applications={applications.filter((a) => a.stage === stage.id)}
              onSelect={setSelected}
            />
          ))}
        </div>
        <DragOverlay>{activeApp ? <Card application={activeApp} overlay /> : null}</DragOverlay>
      </DndContext>

      <DetailPanel application={selectedLive} onClose={() => setSelected(null)} />
    </>
  );
}
