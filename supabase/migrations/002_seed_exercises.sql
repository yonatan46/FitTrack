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

drop policy if exists "Authenticated users can read exercises" on public.exercises;
create policy "Authenticated users can read exercises"
  on public.exercises
  for select
  using (auth.uid() is not null);

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
