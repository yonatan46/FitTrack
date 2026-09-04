create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Athlete',
  height_cm numeric,
  current_weight_kg numeric,
  age integer,
  sex text,
  goal_type text,
  target_weight_kg numeric,
  target_date date,
  activity_level text,
  experience_level text,
  training_days integer check (training_days between 2 and 6),
  session_minutes integer,
  equipment_access text,
  limitation_notes text,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  primary_muscle text not null,
  equipment text not null,
  difficulty text not null default 'beginner',
  cues text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  days_per_week integer not null check (days_per_week between 2 and 6),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.plan_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.workout_plans(id) on delete cascade,
  day_number integer not null,
  exercise_id uuid not null references public.exercises(id),
  sets integer not null default 3 check (sets > 0),
  rep_min integer not null default 8,
  rep_max integer not null default 12,
  rest_seconds integer not null default 90,
  sort_order integer not null default 0
);

create table public.body_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at date not null default current_date,
  weight_kg numeric not null check (weight_kg > 0),
  body_fat_percent numeric check (body_fat_percent between 0 and 100),
  waist_cm numeric,
  chest_cm numeric,
  arms_cm numeric,
  photo_path text,
  created_at timestamptz not null default now()
);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_date date not null default current_date,
  title text not null,
  duration_minutes integer,
  status text not null default 'completed' check (status in ('planned', 'in_progress', 'completed', 'skipped')),
  created_at timestamptz not null default now()
);

create table public.session_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_name text not null,
  set_number integer not null,
  reps integer not null check (reps > 0),
  weight_kg numeric not null default 0 check (weight_kg >= 0),
  rpe numeric check (rpe between 1 and 10),
  created_at timestamptz not null default now()
);

alter table public.body_logs enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.session_sets enable row level security;
alter table public.user_preferences enable row level security;
alter table public.workout_plans enable row level security;
alter table public.plan_exercises enable row level security;
alter table public.exercises enable row level security;

create policy "Users can manage their preferences" on public.user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage their body logs" on public.body_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage their sessions" on public.workout_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage their plans" on public.workout_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage exercises in their plans" on public.plan_exercises for all using (
  exists (select 1 from public.workout_plans where id = plan_id and user_id = auth.uid())
) with check (
  exists (select 1 from public.workout_plans where id = plan_id and user_id = auth.uid())
);
create policy "Authenticated users can read exercises" on public.exercises for select using (auth.uid() is not null);
create policy "Users can manage their session sets" on public.session_sets for all using (
  exists (select 1 from public.workout_sessions where id = session_id and user_id = auth.uid())
) with check (
  exists (select 1 from public.workout_sessions where id = session_id and user_id = auth.uid())
);
