-- Collab — The Open Co-op Collaboration Site
-- Run this in the Supabase SQL Editor to set up the database

-- Members (synced from OC, enriched by onboarding)
create table members (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  oc_slug text,
  oc_tier text,
  avatar_url text,
  bio text,
  phone text,
  joined_at timestamp with time zone default now(),

  -- Onboarding responses
  interests text[],
  skills text[],
  time_commitment text,
  show_contact_details boolean default true,
  onboarding_completed boolean default false,

  -- Social links stored as JSONB array: [{ "label": "Twitter", "url": "..." }, ...]
  links jsonb default '[]'::jsonb,

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Tasks (things members can do)
create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  url text,
  category text not null, -- 'universal', 'product', 'governance', 'outreach', 'business'
  source text default 'manual', -- 'manual' or 'github'
  github_issue_url text,
  github_issue_number int,
  is_active boolean default true,
  is_universal boolean default false,
  is_persistent boolean default false, -- never removed from list even after completion
  sort_order int default 0,
  created_at timestamp with time zone default now()
);

-- Task completions (member checked off a task)
create table task_completions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) not null,
  task_id uuid references tasks(id) not null,
  completed_at timestamp with time zone default now(),
  unique(member_id, task_id)
);

-- Contributions (free-form "I did..." entries)
create table contributions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) not null,
  description text not null,
  mentioned_members uuid[],
  created_at timestamp with time zone default now()
);

-- Help requests ("I need help with...")
create table help_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) not null,
  description text not null,
  is_resolved boolean default false,
  resolved_by uuid references members(id),
  created_at timestamp with time zone default now(),
  resolved_at timestamp with time zone
);

-- Help replies ("I can help")
create table help_replies (
  id uuid primary key default gen_random_uuid(),
  help_request_id uuid references help_requests(id) not null,
  member_id uuid references members(id) not null,
  created_at timestamp with time zone default now(),
  unique(help_request_id, member_id)
);

-- Feedback
create table feedback (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id),
  email text,
  category text, -- 'collab', 'planet', 'governance', 'other'
  message text not null,
  created_at timestamp with time zone default now()
);

-- Enable real-time subscriptions
alter publication supabase_realtime add table task_completions;
alter publication supabase_realtime add table contributions;
alter publication supabase_realtime add table help_requests;
alter publication supabase_realtime add table help_replies;

-- Auto-update updated_at on members
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger members_updated_at
  before update on members
  for each row execute function update_updated_at();

-- Seed universal tasks
insert into tasks (title, description, url, category, is_universal, is_persistent, sort_order) values
  ('Join The Open Co-op Signal group', null, 'https://signal.group/#CjQKIJwCI3LV2CPO8ghXXLwZtUvnp5M8yD08ELtXdkRIWOAEEhC78Ge_s-QrxzdY9AptQCJg', 'universal', true, false, 1),
  ('Download and read the Member Handbook', null, '/The-Open-Co-op-Group-Handbook.pdf', 'universal', true, false, 2),
  ('Familiarise yourself with the Docs', null, 'https://docs.open.coop/', 'universal', true, false, 3),
  ('Check out the latest posts on the Blog', null, 'https://open.coop/blog/', 'universal', true, false, 4),
  ('Check out our Google Docs for more background', null, 'https://drive.google.com/drive/folders/0B5qDh_FMmLtONEFsYWc3Ql9YUWc?resourcekey=0-halS3Ugoii3XhLi8SNrSWQ&usp=sharing', 'universal', true, false, 5),
  ('Email 3 people you trust to join The Open Co-op', null, 'mailto:?subject=Invitation%20to%20Collaboration&body=Hi%0A%0AI%27ve%20joined%20The%20Open%20Co-op%20to%20help%20catalyse%20the%20collaborative%2C%20regenerative%20economy.%0A%0AOur%20mission%20is%20to%20co-create%20PLANET%20%E2%80%94%20a%20member-owned%20co-operating%20system%20to%20support%20collaboration%20at%20scale.%0A%0AWe%27re%20a%20really%20friendly%2C%20collaborative%20bunch%20and%20would%20love%20to%20have%20you%20on%20board.%20Check%20out%20https%3A%2F%2Fcollab.open.coop%2F%20for%20more%20background%20and%20how%20to%20join.%0A%0AI%20really%20hope%20you%20can%20join%20us%20-%20together%20we%20are%20stronger.', 'universal', true, false, 6),
  ('Share about PLANET and The Open Co-op on social media', null, null, 'universal', true, false, 7),
  ('Browse the PLANET specs on GitHub and add comments or improvements', null, 'https://github.com/The-Open-Co-op/planet/tree/main/specs', 'universal', true, true, 8),
  ('Check out the PLANET Roadmap on GitHub and comment on or sign up for a task', null, 'https://github.com/orgs/The-Open-Co-op/projects/1', 'universal', true, true, 9);

-- Row-level security
alter table members enable row level security;
alter table tasks enable row level security;
alter table task_completions enable row level security;
alter table contributions enable row level security;
alter table help_requests enable row level security;
alter table help_replies enable row level security;
alter table feedback enable row level security;

-- Service role can do everything (our API routes use service role key)
-- No anon access needed since all data access goes through our API
create policy "Service role full access" on members for all using (true) with check (true);
create policy "Service role full access" on tasks for all using (true) with check (true);
create policy "Service role full access" on task_completions for all using (true) with check (true);
create policy "Service role full access" on contributions for all using (true) with check (true);
create policy "Service role full access" on help_requests for all using (true) with check (true);
create policy "Service role full access" on help_replies for all using (true) with check (true);
create policy "Service role full access" on feedback for all using (true) with check (true);
