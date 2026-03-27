begin;

alter table public.profiles
  add column if not exists client_onboarding_completed boolean not null default false,
  add column if not exists freelancer_onboarding_completed boolean not null default false;

-- Legacy users who completed onboarding before workspace flags existed should keep access.
update public.profiles
set
  client_onboarding_completed = true,
  freelancer_onboarding_completed = true
where onboarding_completed = true
  and coalesce(client_onboarding_completed, false) = false
  and coalesce(freelancer_onboarding_completed, false) = false;

alter table public.profiles
  alter column user_type drop default;

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
        user_type,
        email,
        full_name,
        phone,
        avatar_url,
        preferred_language,
        onboarding_completed,
        client_onboarding_completed,
        freelancer_onboarding_completed
    )
    values (
        new.id,
        null,
        new.email,
        generated_name,
        new.phone,
        coalesce(nullif(raw_meta->>'avatar_url', ''), nullif(raw_meta->>'picture', '')),
        preferred_language_value,
        false,
        false,
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

insert into public.profiles (
    id,
    user_type,
    email,
    full_name,
    phone,
    avatar_url,
    preferred_language,
    onboarding_completed,
    client_onboarding_completed,
    freelancer_onboarding_completed
)
select
    u.id,
    null,
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
    false,
    false,
    false
from auth.users as u
left join public.profiles as p on p.id = u.id
where p.id is null;

commit;