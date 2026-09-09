import Link from "next/link";
import { CheckCircle2, Copy } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";

export default async function ApplicationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ no?: string }>;
}) {
  const { no } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle2 className="h-9 w-9 text-emerald-600" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">Başvurunuz alındı!</h1>
      <p className="mt-2 text-sm text-slate-500">
        Başvurunuz İK ekibimize iletildi. Süreçle ilgili gelişmeleri e-posta üzerinden
        paylaşacağız.
      </p>

      {no && (
        <div className="mt-6 w-full rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Başvuru Numaranız
          </p>
          <p className="mt-1.5 flex items-center justify-center gap-2 text-lg font-bold text-indigo-600">
            <Copy className="h-4 w-4" />
            {no}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Bu numarayı ileride başvurunuzu referans göstermek için saklayabilirsiniz.
          </p>
        </div>
      )}

      <LinkButton href="/" size="lg" className="mt-8">
        Diğer İlanlara Göz At
      </LinkButton>
      <Link href="/" className="mt-3 text-sm text-slate-400 hover:text-slate-600">
        Ana sayfaya dön
      </Link>
    </div>
  );
}
