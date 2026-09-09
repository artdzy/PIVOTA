-- handle_new_user ve sync_job_applicant_count sadece trigger tarafından çağrılmalı;
-- doğrudan PostgREST RPC üzerinden (anon/authenticated) çağrılabilir olmaları güvenlik
-- danışmanında uyarıya yol açtı. Trigger'lar bu REVOKE'tan etkilenmeden çalışmaya devam eder.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sync_job_applicant_count() from public, anon, authenticated;
