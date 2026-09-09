import { cn } from "@/lib/utils";

export function ProgressBar({
  step,
  totalSteps,
  labels,
}: {
  step: number;
  totalSteps: number;
  labels: string[];
}) {
  return (
    <div>
      <div className="flex h-1.5 w-full gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-full transition-colors",
              i < step ? "bg-indigo-600" : "bg-slate-200",
            )}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>
          Adım {step}/{totalSteps}
        </span>
        <span className="font-medium text-indigo-600">{labels[step - 1]}</span>
      </div>
    </div>
  );
}
