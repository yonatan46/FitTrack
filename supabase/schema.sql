create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  height_cm numeric,
  current_weight_kg numeric,
  age integer,
  sex text check (sex in ('female', 'male', 'other', 'prefer_not_to_say')),
  goal_type text check (goal_type in ('lose_weight', 'gain_weight', 'gain_muscle', 'maintain', 'recomp')),
  target_weight_kg numeric,
  target_date date,
  activity_level text,
  experience_level text,
  training_days integer check (training_days between 2 and 6),
  session_minutes integer,
  equipment_access text,
  limitation_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.body_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
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
  user_id uuid not null references public.profiles(id) on delete cascade,
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

alter table public.profiles enable row level security;
alter table public.body_logs enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.session_sets enable row level security;

create policy "Users can manage their profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can manage their body logs" on public.body_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage their sessions" on public.workout_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage their session sets" on public.session_sets for all using (
  exists (select 1 from public.workout_sessions where id = session_id and user_id = auth.uid())
) with check (
  exists (select 1 from public.workout_sessions where id = session_id and user_id = auth.uid())
);
