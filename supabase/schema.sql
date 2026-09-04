create table if not exists public.user_preferences (
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

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  primary_muscle text not null,
  equipment text not null,
  difficulty text not null default 'beginner',
  cues text[] not null default '{}',
  image_url text,
  video_url text,
  created_at timestamptz not null default now()
);

alter table public.exercises add column if not exists image_url text;
alter table public.exercises add column if not exists video_url text;
alter table public.exercises enable row level security;

insert into public.exercises (name, primary_muscle, equipment, difficulty, cues, image_url, video_url) values
  ('Barbell Bench Press', 'chest', 'full_gym', 'beginner', array['Brace your feet', 'Control the descent'], 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80', 'https://www.youtube.com/results?search_query=barbell+bench+press+form'),
  ('Seated Cable Row', 'back', 'full_gym', 'beginner', array['Keep your chest tall', 'Drive elbows back'], 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80', 'https://www.youtube.com/results?search_query=seated+cable+row+form'),
  ('Dumbbell Shoulder Press', 'shoulders', 'full_gym', 'beginner', array['Keep wrists stacked', 'Press smoothly'], 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80', 'https://www.youtube.com/results?search_query=dumbbell+shoulder+press+form'),
  ('Back Squat', 'legs', 'full_gym', 'intermediate', array['Brace before descending', 'Drive through mid-foot'], 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80', 'https://www.youtube.com/results?search_query=barbell+back+squat+form'),
  ('Romanian Deadlift', 'hamstrings', 'full_gym', 'intermediate', array['Hinge at the hips', 'Keep the bar close'], 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80', 'https://www.youtube.com/results?search_query=romanian+deadlift+form'),
  ('Walking Lunges', 'legs', 'full_gym', 'beginner', array['Keep your torso tall', 'Control each step'], 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80', 'https://www.youtube.com/results?search_query=walking+lunges+form'),
  ('Pull Up', 'back', 'bodyweight', 'intermediate', array['Start from a dead hang', 'Pull elbows down'], 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80', 'https://www.youtube.com/results?search_query=pull+up+proper+form'),
  ('Push Up', 'chest', 'bodyweight', 'beginner', array['Keep your body straight', 'Lower with control'], 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80', 'https://www.youtube.com/results?search_query=push+up+proper+form'),
  ('Lat Pulldown', 'back', 'full_gym', 'beginner', array['Lead with your elbows', 'Avoid swinging'], 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80', 'https://www.youtube.com/results?search_query=lat+pulldown+form'),
  ('Leg Press', 'legs', 'full_gym', 'beginner', array['Keep your lower back supported', 'Do not lock your knees'], 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80', 'https://www.youtube.com/results?search_query=leg+press+form'),
  ('Dumbbell Biceps Curl', 'arms', 'home_basic', 'beginner', array['Keep elbows still', 'Squeeze at the top'], 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80', 'https://www.youtube.com/results?search_query=dumbbell+biceps+curl+form'),
  ('Cable Triceps Pushdown', 'arms', 'full_gym', 'beginner', array['Keep shoulders down', 'Lock out smoothly'], 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80', 'https://www.youtube.com/results?search_query=cable+triceps+pushdown+form')
on conflict (name) do update set
  primary_muscle = excluded.primary_muscle,
  equipment = excluded.equipment,
  difficulty = excluded.difficulty,
  cues = excluded.cues,
  image_url = excluded.image_url,
  video_url = excluded.video_url;

create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  days_per_week integer not null check (days_per_week between 2 and 6),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.plan_exercises (
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

create table if not exists public.body_logs (
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

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_date date not null default current_date,
  title text not null,
  duration_minutes integer,
  status text not null default 'completed' check (status in ('planned', 'in_progress', 'completed', 'skipped')),
  created_at timestamptz not null default now()
);

create table if not exists public.session_sets (
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

drop policy if exists "Users can manage their preferences" on public.user_preferences;
drop policy if exists "Users can manage their body logs" on public.body_logs;
drop policy if exists "Users can manage their sessions" on public.workout_sessions;
drop policy if exists "Users can manage their plans" on public.workout_plans;
drop policy if exists "Users can manage exercises in their plans" on public.plan_exercises;
drop policy if exists "Authenticated users can read exercises" on public.exercises;
drop policy if exists "Users can manage their session sets" on public.session_sets;

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
