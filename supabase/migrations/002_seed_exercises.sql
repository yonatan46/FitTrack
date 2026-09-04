insert into public.exercises (name, primary_muscle, equipment, difficulty, cues) values
  ('Barbell Bench Press', 'chest', 'full_gym', 'beginner', array['Brace your feet', 'Control the descent']),
  ('Seated Cable Row', 'back', 'full_gym', 'beginner', array['Keep your chest tall', 'Drive elbows back']),
  ('Dumbbell Shoulder Press', 'shoulders', 'full_gym', 'beginner', array['Keep wrists stacked', 'Press smoothly'])
on conflict (name) do nothing;
