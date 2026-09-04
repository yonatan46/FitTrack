"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}

export async function savePreferences(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  const values = {
    user_id: user.id,
    display_name: String(formData.get("display_name") || "Athlete"),
    current_weight_kg: Number(formData.get("current_weight_kg")),
    goal_type: String(formData.get("goal_type") || "maintain"),
    target_weight_kg: formData.get("target_weight_kg") ? Number(formData.get("target_weight_kg")) : null,
    target_date: String(formData.get("target_date") || "") || null,
    training_days: Number(formData.get("training_days") || 3),
    experience_level: String(formData.get("experience_level") || "beginner"),
    equipment_access: String(formData.get("equipment_access") || "full_gym"),
    onboarding_complete: true,
  };
  const { error } = await supabase.from("user_preferences").upsert(values);
  if (error) throw new Error(error.message);
  const exerciseNames = ["Barbell Bench Press", "Seated Cable Row", "Dumbbell Shoulder Press"];
  const { data: exerciseRows, error: exerciseError } = await supabase.from("exercises").select("id,name").in("name", exerciseNames);
  if (exerciseError) throw new Error(exerciseError.message);
  const { data: plan, error: planError } = await supabase.from("workout_plans").insert({ user_id: user.id, name: "Upper body strength", days_per_week: values.training_days }).select("id").single();
  if (planError) throw new Error(planError.message);
  const planExercises = (exerciseRows || []).map((exercise, index) => ({ plan_id: plan.id, day_number: 1, exercise_id: exercise.id, sets: index === 0 ? 4 : 3, rep_min: index === 0 ? 6 : 8, rep_max: index === 0 ? 8 : 12, rest_seconds: 90, sort_order: index }));
  const { error: planExerciseError } = await supabase.from("plan_exercises").insert(planExercises);
  if (planExerciseError) throw new Error(planExerciseError.message);
  revalidatePath("/");
  redirect("/");
}

export async function logWorkout(title: string, sets: Array<{ exercise_name: string; set_number: number; reps: number; weight_kg: number }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  const { data: session, error: sessionError } = await supabase.from("workout_sessions").insert({ user_id: user.id, title, status: "completed" }).select("id").single();
  if (sessionError) throw new Error(sessionError.message);
  const { error } = await supabase.from("session_sets").insert(sets.map((set) => ({ ...set, session_id: session.id })));
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function logBodyWeight(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  const weight = Number(formData.get("weight_kg"));
  if (!Number.isFinite(weight) || weight <= 0) throw new Error("Enter a valid weight.");
  const { error } = await supabase.from("body_logs").insert({ user_id: user.id, weight_kg: weight, logged_at: new Date().toISOString().slice(0, 10) });
  if (error) throw new Error(error.message);
  revalidatePath("/");
}
