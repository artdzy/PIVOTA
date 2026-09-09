import { cn } from "@/lib/utils";

type Tone = "slate" | "indigo" | "green" | "amber" | "rose";

const toneClasses: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700",
  indigo: "bg-indigo-100 text-indigo-700",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
};

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return <Badge tone="slate">Manuel inceleme</Badge>;
  }
  const tone: Tone = score >= 75 ? "green" : score >= 50 ? "amber" : "rose";
  return <Badge tone={tone}>AI Uyum: {score}</Badge>;
}
