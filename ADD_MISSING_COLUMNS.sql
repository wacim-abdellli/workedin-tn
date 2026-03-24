-- =====================================================
-- KHEDMA.TN - Emergency Auth/Profile Repair
-- Run this in Supabase SQL Editor if Google signup/login
-- fails with "Database error saving new user"
-- =====================================================

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

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists cin_verified boolean not null default false;
alter table public.profiles add column if not exists cin_submitted boolean not null default false;
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.profiles add column if not exists active_mode account_mode_enum;

drop trigger if exists on_auth_user_created on auth.users;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    raw_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
    locale_value text;
    preferred_language_value language_enum := 'ar';
    generated_name text;
begin
    locale_value := lower(
        coalesce(
            nullif(raw_meta->>'preferred_language', ''),
            nullif(raw_meta->>'locale', ''),
            'ar'
        )
    );

    if locale_value like 'fr%' then
        preferred_language_value := 'fr';
    elsif locale_value like 'en%' then
        preferred_language_value := 'en';
    else
        preferred_language_value := 'ar';
    end if;

    generated_name := trim(
        coalesce(
            nullif(raw_meta->>'full_name', ''),
            nullif(raw_meta->>'name', ''),
            nullif(concat_ws(' ', raw_meta->>'given_name', raw_meta->>'family_name'), ''),
            nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
            'New user'
        )
    );

    insert into public.profiles (
        id,
        email,
        full_name,
        phone,
        avatar_url,
        preferred_language,
        onboarding_completed
    )
    values (
        new.id,
        new.email,
        generated_name,
        new.phone,
        coalesce(nullif(raw_meta->>'avatar_url', ''), nullif(raw_meta->>'picture', '')),
        preferred_language_value,
        false
    )
    on conflict (id) do update
    set
        email = coalesce(excluded.email, public.profiles.email),
        full_name = case
            when public.profiles.full_name is null or btrim(public.profiles.full_name) = '' then excluded.full_name
            else public.profiles.full_name
        end,
        phone = coalesce(public.profiles.phone, excluded.phone),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
        preferred_language = coalesce(public.profiles.preferred_language, excluded.preferred_language);

    return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

update public.profiles as p
set
    email = coalesce(p.email, u.email),
    full_name = case
        when p.full_name is null or btrim(p.full_name) = '' then trim(
            coalesce(
                nullif(u.raw_user_meta_data->>'full_name', ''),
                nullif(u.raw_user_meta_data->>'name', ''),
                nullif(concat_ws(' ', u.raw_user_meta_data->>'given_name', u.raw_user_meta_data->>'family_name'), ''),
                nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
                'New user'
            )
        )
        else p.full_name
    end,
    avatar_url = coalesce(
        p.avatar_url,
        nullif(u.raw_user_meta_data->>'avatar_url', ''),
        nullif(u.raw_user_meta_data->>'picture', '')
    )
from auth.users as u
where u.id = p.id;

insert into public.profiles (
    id,
    email,
    full_name,
    phone,
    avatar_url,
    preferred_language,
    onboarding_completed
)
select
    u.id,
    u.email,
    trim(
        coalesce(
            nullif(u.raw_user_meta_data->>'full_name', ''),
            nullif(u.raw_user_meta_data->>'name', ''),
            nullif(concat_ws(' ', u.raw_user_meta_data->>'given_name', u.raw_user_meta_data->>'family_name'), ''),
            nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
            'New user'
        )
    ),
    u.phone,
    coalesce(nullif(u.raw_user_meta_data->>'avatar_url', ''), nullif(u.raw_user_meta_data->>'picture', '')),
    case
        when lower(coalesce(nullif(u.raw_user_meta_data->>'preferred_language', ''), nullif(u.raw_user_meta_data->>'locale', ''), 'ar')) like 'fr%' then 'fr'::language_enum
        when lower(coalesce(nullif(u.raw_user_meta_data->>'preferred_language', ''), nullif(u.raw_user_meta_data->>'locale', ''), 'ar')) like 'en%' then 'en'::language_enum
        else 'ar'::language_enum
    end,
    false
from auth.users as u
left join public.profiles as p on p.id = u.id
where p.id is null;

update public.profiles
set active_mode = case
    when user_type = 'freelancer' then 'freelancer'::account_mode_enum
    when user_type = 'both' then coalesce(active_mode, 'client'::account_mode_enum)
    else 'client'::account_mode_enum
end
where active_mode is null;

commit;

select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
order by ordinal_position;

select 'Auth/profile repair applied successfully.' as status;
