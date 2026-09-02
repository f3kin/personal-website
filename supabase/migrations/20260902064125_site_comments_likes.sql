-- Named comments and anonymous likes for finlayekins.com/writing/<slug> pages.
-- Additive only: two new tables, no changes to anything else in this project.
--
-- Both tables key on `slug` (the Beehiiv post slug used in the URL) rather
-- than a Beehiiv post id, since the site itself only ever has the slug to
-- hand when rendering a writing page.
--
-- RLS on, no policies: the app reads and writes with the service_role key
-- (bypasses RLS) from server-side API routes only. The anon key, if ever
-- exposed to this project, can see nothing. Matches the pattern used by
-- finlay-dashboard's migration 005 (enable_rls).

create table site_comments (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  author_name text not null,
  author_email text,
  body text not null,
  hidden boolean not null default false,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index idx_site_comments_slug on site_comments(slug, created_at);

alter table site_comments enable row level security;

create table site_likes (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  visitor_id text not null,
  ip_hash text,
  created_at timestamptz not null default now(),
  unique (slug, visitor_id)
);

create index idx_site_likes_slug on site_likes(slug);

alter table site_likes enable row level security;

-- Moderation one-liners (run via `supabase db query --linked "<sql>"`):
--   Hide a comment:  update site_comments set hidden = true where id = '<uuid>';
--   Delete a comment: delete from site_comments where id = '<uuid>';
