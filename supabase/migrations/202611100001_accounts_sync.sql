-- Each account owns a private collection. Clients can only write through the
-- revision-checked RPC, so stale devices cannot silently replace newer work.
create table public.oftly_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);
create table public.oftly_items (
  user_id uuid not null references public.oftly_accounts(user_id) on delete cascade,
  kind text not null check (kind in ('decks','notes','cards','reviews','settings','suggestions','media','plan')),
  id text not null check (length(id) between 1 and 250),
  data jsonb,
  revision bigint not null,
  primary key (user_id, kind, id),
  check (data is null or (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 2097152))
);
create index oftly_items_revision on public.oftly_items(user_id, revision);
alter table public.oftly_accounts enable row level security;
alter table public.oftly_items enable row level security;
revoke all on public.oftly_accounts, public.oftly_items from anon, authenticated;
grant select on public.oftly_accounts, public.oftly_items to authenticated;
create policy "Read own account" on public.oftly_accounts for select to authenticated using ((select auth.uid()) = user_id);
create policy "Read own items" on public.oftly_items for select to authenticated using ((select auth.uid()) = user_id);

create function public.oftly_pull(after_revision bigint default 0) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); rev bigint; result jsonb;
begin
  if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  insert into public.oftly_accounts(user_id) values(uid) on conflict do nothing;
  select revision into rev from public.oftly_accounts where user_id=uid for share;
  select coalesce(jsonb_agg(jsonb_build_object('kind',kind,'id',id,'data',data)), '[]'::jsonb)
  into result from public.oftly_items where user_id=uid and revision > after_revision;
  return jsonb_build_object('revision',rev,'items',result);
end;
$$;
create function public.oftly_push(expected_revision bigint, changes jsonb) returns bigint
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); rev bigint; entry jsonb; total_size bigint;
begin
  if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if jsonb_typeof(changes) <> 'array' or jsonb_array_length(changes) > 660100 or octet_length(changes::text) > 52428800 then
    raise exception 'Collection exceeds sync limit';
  end if;
  insert into public.oftly_accounts(user_id) values(uid) on conflict do nothing;
  select revision into rev from public.oftly_accounts where user_id=uid for update;
  if rev <> expected_revision then raise exception 'OFTLY_CONFLICT' using errcode='40001'; end if;
  if jsonb_array_length(changes)=0 then return rev; end if;
  rev := rev + 1;
  for entry in select value from jsonb_array_elements(changes) loop
    if entry->>'kind' is null or entry->>'id' is null or not(entry ? 'data') then raise exception 'Invalid change'; end if;
    insert into public.oftly_items(user_id,kind,id,data,revision)
      values(uid,entry->>'kind',entry->>'id',nullif(entry->'data','null'::jsonb),rev)
      on conflict(user_id,kind,id) do update set data=excluded.data,revision=excluded.revision;
  end loop;
  select coalesce(sum(octet_length(data::text) + case when kind='media' then greatest(0,(data->>'size')::bigint) else 0 end),0)
  into total_size from public.oftly_items where user_id=uid;
  if total_size > 47185920 or (select count(*) from public.oftly_items where user_id=uid)>700000 then
    raise exception 'Collection exceeds 45 MB sync limit';
  end if;
  update public.oftly_accounts set revision=rev,updated_at=now() where user_id=uid;
  return rev;
end;
$$;
revoke all on function public.oftly_pull(bigint),public.oftly_push(bigint,jsonb) from public, anon;
grant execute on function public.oftly_pull(bigint),public.oftly_push(bigint,jsonb) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('oftly-media','oftly-media',false,47185920,array['image/png','image/jpeg','image/gif','image/webp','image/avif','audio/mpeg','audio/ogg','audio/wav','audio/mp4','audio/x-wav','application/octet-stream'])
on conflict(id) do nothing;
create policy "Read own private media" on storage.objects for select to authenticated using
  (bucket_id='oftly-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Upload own private media" on storage.objects for insert to authenticated with check
  (bucket_id='oftly-media' and (storage.foldername(name))[1]=(select auth.uid())::text
   and name ~ '^[0-9a-f-]{36}/[0-9a-f]{64}$');
-- Immutable content-addressed uploads: no UPDATE policy and no public bucket.
