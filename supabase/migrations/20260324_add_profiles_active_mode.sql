begin;

do $$
begin
    if not exists (
        select 1
        from pg_type
        where typname = 'account_mode_enum'
    ) then
        create type account_mode_enum as enum ('freelancer', 'client');
    end if;
end $$;

alter table public.profiles
    add column if not exists active_mode account_mode_enum;

update public.profiles
set active_mode = case
    when user_type = 'freelancer' then 'freelancer'::account_mode_enum
    when user_type = 'both' then coalesce(active_mode, 'client'::account_mode_enum)
    else 'client'::account_mode_enum
end
where active_mode is null;

commit;
