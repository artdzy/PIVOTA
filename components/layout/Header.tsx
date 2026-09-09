import Link from "next/link";
import { Briefcase, LayoutDashboard, KanbanSquare } from "lucide-react";
import { getCurrentUserWithProfile } from "@/lib/auth/actions";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { formatRole } from "@/lib/utils";

export async function Header() {
  const session = await getCurrentUserWithProfile();
  const isStaff =
    session && ["uzman", "yonetici", "mudur"].includes(session.profile.role);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Briefcase className="h-4.5 w-4.5" />
          </span>
          Pivota
          <span className="hidden text-sm font-normal text-slate-400 sm:inline">
            İşe Alım
          </span>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2">
          {isStaff && (
            <>
              <Link
                href="/panel"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                <KanbanSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Pipeline</span>
              </Link>
              {(session!.profile.role === "yonetici" ||
                session!.profile.role === "mudur") && (
                <Link
                  href="/panel/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              )}
            </>
          )}

          {session ? (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-800">
                  {session.profile.full_name}
                </p>
                <p className="text-xs text-slate-400">{formatRole(session.profile.role)}</p>
              </div>
              <SignOutButton />
            </div>
          ) : (
            <Link
              href="/giris"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Giriş Yap
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
