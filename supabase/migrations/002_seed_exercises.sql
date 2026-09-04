create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  primary_muscle text not null,
  equipment text not null,
  difficulty text not null default 'beginner',
  cues text[] not null default '{}',
  created_at timestamptz not null default now()
);

insert into public.exercises (name, primary_muscle, equipment, difficulty, cues) values
  ('Barbell Bench Press', 'chest', 'full_gym', 'beginner', array['Brace your feet', 'Control the descent']),
  ('Seated Cable Row', 'back', 'full_gym', 'beginner', array['Keep your chest tall', 'Drive elbows back']),
  ('Dumbbell Shoulder Press', 'shoulders', 'full_gym', 'beginner', array['Keep wrists stacked', 'Press smoothly'])
on conflict (name) do nothing;
