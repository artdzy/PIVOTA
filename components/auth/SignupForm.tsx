"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signUpCandidate } from "@/lib/auth/actions";

const schema = z
  .object({
    fullName: z.string().min(2, "Ad soyad gerekli"),
    email: z.string().email("Geçerli bir e-posta girin"),
    password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Şifreler eşleşmiyor",
    path: ["passwordConfirm"],
  });

type FormValues = z.infer<typeof schema>;

export function SignupForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ needsEmailConfirmation: boolean } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const result = await signUpCandidate({
      email: values.email,
      password: values.password,
      fullName: values.fullName,
    });

    if (result.error) {
      setServerError(result.error);
      return;
    }

    if (result.needsEmailConfirmation) {
      setSuccess({ needsEmailConfirmation: true });
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (success) {
    return (
      <div className="w-full max-w-sm text-center">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
        <h1 className="text-xl font-bold text-slate-900">Hesabınız oluşturuldu</h1>
        <p className="mt-2 text-sm text-slate-500">
          Giriş yapabilmek için e-postanıza gönderilen onay bağlantısına tıklayın.
        </p>
        <Link
          href="/giris"
          className="mt-6 inline-block font-medium text-indigo-600 hover:underline"
        >
          Giriş sayfasına dön
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold text-slate-900">Hesap Oluştur</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Bir aday hesabı oluşturarak ilanlara başvurabilirsiniz.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4" noValidate>
        <div>
          <Label htmlFor="fullName" required>
            Ad Soyad
          </Label>
          <Input id="fullName" autoComplete="name" {...register("fullName")} />
          <FieldError message={errors.fullName?.message} />
        </div>
        <div>
          <Label htmlFor="email" required>
            E-posta
          </Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="password" required>
            Şifre
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
          <FieldError message={errors.password?.message} />
        </div>
        <div>
          <Label htmlFor="passwordConfirm" required>
            Şifre (Tekrar)
          </Label>
          <Input
            id="passwordConfirm"
            type="password"
            autoComplete="new-password"
            {...register("passwordConfirm")}
          />
          <FieldError message={errors.passwordConfirm?.message} />
        </div>

        {serverError && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{serverError}</p>
        )}

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hesap Oluştur"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Zaten hesabınız var mı?{" "}
        <Link href="/giris" className="font-medium text-indigo-600 hover:underline">
          Giriş Yap
        </Link>
      </p>
    </div>
  );
}
