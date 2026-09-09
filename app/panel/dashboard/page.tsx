import { redirect } from "next/navigation";
import { Users, TrendingUp, Gauge, CalendarClock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserWithProfile } from "@/lib/auth/actions";
import { formatStage } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getCurrentUserWithProfile();
  if (!session || !["yonetici", "mudur"].includes(session.profile.role)) {
    redirect("/panel");
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select("stage, match_score, created_at");

  const applications = data ?? [];
  const total = applications.length;
  const avgScore =
    total === 0
      ? 0
      : Math.round(
          applications.reduce((sum, a) => sum + (a.match_score ?? 0), 0) / total,
        );

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const last7Days = applications.filter(
    (a) => new Date(a.created_at).getTime() >= sevenDaysAgo,
  ).length;

  const stageOrder = ["ilk_basvuru", "telefon_gorusmesi", "teknik_mulakat", "teklif", "ise_alindi"];
  const stageCounts = stageOrder.map((stage) => ({
    stage,
    count: applications.filter((a) => a.stage === stage).length,
  }));
  const maxStageCount = Math.max(...stageCounts.map((s) => s.count), 1);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-slate-900">İK Dashboard</h1>
      <p className="mb-6 text-sm text-slate-500">
        Tüm ilanlardaki başvuruların güncel özeti.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Users} label="Toplam Başvuru" value={total.toString()} />
        <KpiCard icon={Gauge} label="Ortalama AI Uyum Skoru" value={avgScore.toString()} />
        <KpiCard icon={CalendarClock} label="Son 7 Gün Başvuru" value={last7Days.toString()} />
        <KpiCard
          icon={TrendingUp}
          label="İşe Alınan"
          value={(stageCounts.find((s) => s.stage === "ise_alindi")?.count ?? 0).toString()}
        />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-5 text-base font-semibold text-slate-900">Pipeline Dağılımı</h2>
        <div className="grid gap-3">
          {stageCounts.map(({ stage, count }) => (
            <div key={stage} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-sm text-slate-600">{formatStage(stage)}</span>
              <div className="h-3 flex-1 rounded-full bg-slate-100">
                <div
                  className="h-3 rounded-full bg-indigo-500"
                  style={{ width: `${(count / maxStageCount) * 100}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-sm font-medium text-slate-700">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}
