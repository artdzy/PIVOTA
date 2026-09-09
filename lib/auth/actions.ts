"use server";

import { createClient } from "@/lib/supabase/server";

export async function signInWithUsername(username: string, password: string) {
  const supabase = await createClient();
  const email = `${username.trim().toLowerCase()}@pivota.local`;
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Kullanıcı adı veya şifre hatalı." };
  }
  return { error: null };
}

export async function signUpCandidate(input: {
  email: string;
  password: string;
  fullName: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { full_name: input.fullName } },
  });

  if (error) {
    return { error: error.message, needsEmailConfirmation: false };
  }

  return { error: null, needsEmailConfirmation: !data.session };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function getCurrentUserWithProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile ? { user, profile } : null;
}
