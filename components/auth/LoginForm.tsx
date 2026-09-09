"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GoogleIcon, LinkedInIcon } from "@/components/ui/icons";
import { signInWithUsername } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  username: z.string().min(1, "Kullanıcı adı gerekli"),
  password: z.string().min(1, "Şifre gerekli"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [serverError, setServerError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<"google" | "linkedin_oidc" | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const result = await signInWithUsername(values.username, values.password);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function handleOAuth(provider: "google" | "linkedin_oidc") {
    setOauthLoading(provider);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${next}` },
    });
    if (error) {
      setServerError(
        "SSO sağlayıcısı henüz yapılandırılmadı. Lütfen kullanıcı adı/şifre ile giriş yapın.",
      );
      setOauthLoading(null);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold text-slate-900">Giriş Yap</h1>
      <p className="mt-1.5 text-sm text-slate-500">Pivota İşe Alım paneline erişin.</p>

      <div className="mt-6 grid gap-2.5">
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          disabled={oauthLoading !== null}
          className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {oauthLoading === "google" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          Google ile giriş yap
        </button>
        <button
          type="button"
          onClick={() => handleOAuth("linkedin_oidc")}
          disabled={oauthLoading !== null}
          className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-[#0A66C2] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0958a8] disabled:opacity-60"
        >
          {oauthLoading === "linkedin_oidc" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LinkedInIcon />
          )}
          LinkedIn ile giriş yap
        </button>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs font-medium text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        VEYA KULLANICI ADIYLA
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <div>
          <Label htmlFor="username" required>
            Kullanıcı adı
          </Label>
          <Input
            id="username"
            placeholder="aday / uzman / yonetici / mudur"
            autoComplete="username"
            {...register("username")}
          />
          <FieldError message={errors.username?.message} />
        </div>
        <div>
          <Label htmlFor="password" required>
            Şifre
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          <FieldError message={errors.password?.message} />
        </div>

        {serverError && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{serverError}</p>
        )}

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Giriş Yap"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Hesabınız yok mu?{" "}
        <Link href="/kayit" className="font-medium text-indigo-600 hover:underline">
          Hesap Oluştur
        </Link>
      </p>
    </div>
  );
}

