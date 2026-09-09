-- applications tablosu RLS ile korunduğu için anonim landing page ziyaretçileri
-- başvuru sayısını göremiyordu. jobs.applicant_count herkese açık (jobs zaten
-- is_active=true için herkese okunur) ve trigger ile senkron tutulur.
alter table public.jobs add column applicant_count integer not null default 0;

create or replace function public.sync_job_applicant_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.jobs set applicant_count = applicant_count + 1 where id = new.job_id;
  elsif (tg_op = 'DELETE') then
    update public.jobs set applicant_count = applicant_count - 1 where id = old.job_id;
  elsif (tg_op = 'UPDATE' and new.job_id is distinct from old.job_id) then
    update public.jobs set applicant_count = applicant_count - 1 where id = old.job_id;
    update public.jobs set applicant_count = applicant_count + 1 where id = new.job_id;
  end if;
  return null;
end;
$$;

create trigger applications_sync_job_count
  after insert or delete or update of job_id on public.applications
  for each row execute function public.sync_job_applicant_count();

update public.jobs j set applicant_count = (
  select count(*) from public.applications a where a.job_id = j.id
);
