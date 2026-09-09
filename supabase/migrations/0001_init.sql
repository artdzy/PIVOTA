-- Pivota ATS — initial schema, RLS, seed data
create extension if not exists pgcrypto;

-- ── Enums ────────────────────────────────────────────────────────────────
create type public.user_role as enum ('aday','uzman','yonetici','mudur');
create type public.application_stage as enum ('ilk_basvuru','telefon_gorusmesi','teknik_mulakat','teklif','ise_alindi');
create type public.employment_type as enum ('tam_zamanli','yari_zamanli','uzaktan','hibrit','staj');

-- ── Tables ───────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  role public.user_role not null default 'aday',
  created_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  job_no text unique not null,
  title text not null,
  department text not null,
  location text not null,
  employment_type public.employment_type not null default 'tam_zamanli',
  description text not null,
  requirements text[] not null default '{}',
  screening_questions jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  posted_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  application_no text unique not null,
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text not null,
  linkedin_url text,
  resume_path text,
  resume_mime text,
  match_score int,
  screening_answers jsonb not null default '{}'::jsonb,
  kvkk_consent boolean not null default false,
  kvkk_consent_at timestamptz,
  source text not null default 'website',
  stage public.application_stage not null default 'ilk_basvuru',
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);

create index applications_job_id_idx on public.applications (job_id);
create index applications_candidate_id_idx on public.applications (candidate_id);

-- ── Helper: current user's role (security definer avoids RLS recursion) ───
create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;

create policy "profiles_select_own_or_staff" on public.profiles
  for select using (id = auth.uid() or public.current_user_role() in ('uzman','yonetici','mudur'));

create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

create policy "jobs_read" on public.jobs
  for select using (is_active = true or public.current_user_role() in ('uzman','yonetici','mudur'));

create policy "jobs_staff_write" on public.jobs
  for all using (public.current_user_role() in ('uzman','yonetici','mudur'))
  with check (public.current_user_role() in ('uzman','yonetici','mudur'));

create policy "applications_select_own_or_staff" on public.applications
  for select using (candidate_id = auth.uid() or public.current_user_role() in ('uzman','yonetici','mudur'));

create policy "applications_insert_own" on public.applications
  for insert with check (candidate_id = auth.uid());

create policy "applications_staff_update" on public.applications
  for update using (public.current_user_role() in ('uzman','yonetici','mudur'));

grant usage on schema public to anon, authenticated;
grant select on public.jobs to anon, authenticated;
grant select, insert, update on public.applications to authenticated;
grant select, insert, update on public.profiles to authenticated;

-- ── Storage: resumes bucket ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

create policy "resumes_candidate_upload_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "resumes_candidate_read_own_or_staff" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'resumes' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.current_user_role() in ('uzman','yonetici','mudur')
    )
  );

-- ── Seed: 4 test users (username-based login via synthetic @pivota.local email) ─
do $$
declare
  v_user record;
  v_user_id uuid;
begin
  for v_user in
    select * from (values
      ('aday', 'aday@pivota.local', 'Ayşe Kandemir', 'aday'),
      ('uzman', 'uzman@pivota.local', 'Elif Uzman', 'uzman'),
      ('yonetici', 'yonetici@pivota.local', 'Mert Yönetici', 'yonetici'),
      ('mudur', 'mudur@pivota.local', 'Kaan Müdür', 'mudur')
    ) as t(username, email, full_name, role)
  loop
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      v_user.email, crypt('password1', gen_salt('bf')), now(),
      now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
      '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id, v_user_id::text,
      jsonb_build_object('sub', v_user_id::text, 'email', v_user.email),
      'email', now(), now(), now()
    );

    insert into public.profiles (id, username, full_name, role)
    values (v_user_id, v_user.username, v_user.full_name, v_user.role::public.user_role);
  end loop;
end $$;

-- ── Seed: 4 job postings ────────────────────────────────────────────────
insert into public.jobs (id, job_no, title, department, location, employment_type, description, requirements, screening_questions, posted_at) values
(
  '10000000-0000-0000-0000-000000000001', 'PVT-2026-001', 'Kıdemli Frontend Geliştirici', 'Mühendislik', 'İstanbul (Hibrit)', 'hibrit',
  'Pivota ürün ekibinde React ve Next.js tabanlı İK ürünlerimizi geliştirecek, kullanıcı deneyimine önem veren bir Kıdemli Frontend Geliştirici arıyoruz. Bileşen mimarisi, performans ve erişilebilirlik konularında sorumluluk alacaksınız.',
  array['react','next.js','typescript','tailwind','frontend','javascript','performans','erişilebilirlik'],
  '[{"id":"deneyim","label":"Kaç yıl frontend geliştirme deneyiminiz var?","type":"select","options":["0-1","1-3","3-5","5+"]},{"id":"next","label":"Next.js ile production projede çalıştınız mı?","type":"boolean"},{"id":"konum","label":"İstanbul ofisine haftada 2 gün gelebilir misiniz?","type":"boolean"}]'::jsonb,
  now() - interval '6 days'
),
(
  '10000000-0000-0000-0000-000000000002', 'PVT-2026-002', 'İnsan Kaynakları Uzmanı', 'İnsan Kaynakları', 'İstanbul (Ofis)', 'tam_zamanli',
  'İşe alım süreçlerini uçtan uca yönetecek, aday deneyimini iyileştirecek ve İK operasyonlarına destek verecek bir İnsan Kaynakları Uzmanı arıyoruz.',
  array['işe alım','insan kaynakları','aday deneyimi','mülakat','özlük','ik'],
  '[{"id":"deneyim","label":"İşe alım alanında kaç yıl deneyiminiz var?","type":"select","options":["0-1","1-3","3-5","5+"]},{"id":"ats","label":"Bir ATS/İK yazılımı kullandınız mı?","type":"boolean"}]'::jsonb,
  now() - interval '3 days'
),
(
  '10000000-0000-0000-0000-000000000003', 'PVT-2026-003', 'Backend Geliştirici (Node.js/PostgreSQL)', 'Mühendislik', 'Uzaktan', 'uzaktan',
  'API tasarımı, veritabanı modelleme ve ölçeklenebilir servisler geliştirme konusunda deneyimli bir Backend Geliştirici arıyoruz. Node.js ve PostgreSQL ile çalışacaksınız.',
  array['node.js','postgresql','api','backend','sql','typescript','mikroservis'],
  '[{"id":"deneyim","label":"Kaç yıl backend geliştirme deneyiminiz var?","type":"select","options":["0-1","1-3","3-5","5+"]},{"id":"sql","label":"PostgreSQL ile production deneyiminiz var mı?","type":"boolean"},{"id":"uzaktan","label":"Tam zamanlı uzaktan çalışmaya uygun musunuz?","type":"boolean"}]'::jsonb,
  now() - interval '12 days'
),
(
  '10000000-0000-0000-0000-000000000004', 'PVT-2026-004', 'Ürün Pazarlama Uzmanı', 'Pazarlama', 'İstanbul (Hibrit)', 'hibrit',
  'Pivota''nın ürün konumlandırmasını, lansman stratejilerini ve içerik üretimini yönetecek bir Ürün Pazarlama Uzmanı arıyoruz.',
  array['pazarlama','ürün pazarlama','içerik','marka','b2b saas','lansman'],
  '[{"id":"deneyim","label":"Kaç yıl pazarlama deneyiminiz var?","type":"select","options":["0-1","1-3","3-5","5+"]},{"id":"saas","label":"B2B SaaS alanında çalıştınız mı?","type":"boolean"}]'::jsonb,
  now() - interval '1 day'
);

-- ── Seed: dummy applications so applicant counts aren't zero ───────────
insert into public.applications (application_no, job_id, full_name, email, phone, linkedin_url, match_score, screening_answers, kvkk_consent, kvkk_consent_at, source, stage, created_at, last_activity_at) values
('PVT-APP-000001', '10000000-0000-0000-0000-000000000001', 'Deniz Aksoy', 'deniz.aksoy@example.com', '+90 532 111 22 33', 'https://linkedin.com/in/denizaksoy', 82, '{"deneyim":"3-5","next":true,"konum":true}'::jsonb, true, now() - interval '5 days', 'linkedin', 'teknik_mulakat', now() - interval '5 days', now() - interval '1 days'),
('PVT-APP-000002', '10000000-0000-0000-0000-000000000001', 'Selin Kara', 'selin.kara@example.com', '+90 532 222 33 44', null, 64, '{"deneyim":"1-3","next":true,"konum":false}'::jsonb, true, now() - interval '4 days', 'website', 'ilk_basvuru', now() - interval '4 days', now() - interval '4 days'),
('PVT-APP-000003', '10000000-0000-0000-0000-000000000001', 'Barış Yıldız', 'baris.yildiz@example.com', '+90 532 333 44 55', 'https://linkedin.com/in/barisyildiz', 45, '{"deneyim":"0-1","next":false,"konum":true}'::jsonb, true, now() - interval '2 days', 'referans', 'ilk_basvuru', now() - interval '2 days', now() - interval '2 days'),
('PVT-APP-000004', '10000000-0000-0000-0000-000000000002', 'Zeynep Çelik', 'zeynep.celik@example.com', '+90 533 111 22 33', 'https://linkedin.com/in/zeynepcelik', 91, '{"deneyim":"5+","ats":true}'::jsonb, true, now() - interval '3 days', 'linkedin', 'teklif', now() - interval '3 days', now()),
('PVT-APP-000005', '10000000-0000-0000-0000-000000000002', 'Emre Doğan', 'emre.dogan@example.com', '+90 533 222 33 44', null, 58, '{"deneyim":"1-3","ats":false}'::jsonb, true, now() - interval '1 days', 'website', 'telefon_gorusmesi', now() - interval '1 days', now() - interval '12 hours'),
('PVT-APP-000006', '10000000-0000-0000-0000-000000000003', 'Onur Şahin', 'onur.sahin@example.com', '+90 534 111 22 33', 'https://linkedin.com/in/onursahin', 88, '{"deneyim":"5+","sql":true,"uzaktan":true}'::jsonb, true, now() - interval '9 days', 'linkedin', 'ise_alindi', now() - interval '9 days', now() - interval '2 days'),
('PVT-APP-000007', '10000000-0000-0000-0000-000000000003', 'Ceren Aydın', 'ceren.aydin@example.com', '+90 534 222 33 44', null, 71, '{"deneyim":"3-5","sql":true,"uzaktan":true}'::jsonb, true, now() - interval '6 days', 'website', 'teknik_mulakat', now() - interval '6 days', now() - interval '1 days'),
('PVT-APP-000008', '10000000-0000-0000-0000-000000000004', 'Gökhan Polat', 'gokhan.polat@example.com', '+90 535 111 22 33', 'https://linkedin.com/in/gokhanpolat', 76, '{"deneyim":"3-5","saas":true}'::jsonb, true, now() - interval '18 hours', 'referans', 'ilk_basvuru', now() - interval '18 hours', now() - interval '18 hours');
