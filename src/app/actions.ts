"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LoggedSet } from "@/lib/workout";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/* ------------------------------------------------------------------ */
/*  Starter plan templates                                            */
/* ------------------------------------------------------------------ */

type TemplateDay = { focus: string; exercises: string[] };
type Template = { name: string; days: TemplateDay[] };

const TEMPLATES: Record<string, Template> = {
  full_gym: {
    name: "Full-body strength",
    days: [
      { focus: "Push", exercises: ["Barbell Bench Press", "Dumbbell Shoulder Press", "Cable Triceps Pushdown"] },
      { focus: "Pull", exercises: ["Lat Pulldown", "Seated Cable Row", "Dumbbell Biceps Curl"] },
      { focus: "Legs", exercises: ["Back Squat", "Romanian Deadlift", "Leg Press"] },
      { focus: "Full body", exercises: ["Barbell Bench Press", "Pull Up", "Walking Lunges"] },
      { focus: "Upper", exercises: ["Dumbbell Shoulder Press", "Lat Pulldown", "Cable Triceps Pushdown"] },
      { focus: "Lower", exercises: ["Back Squat", "Romanian Deadlift", "Walking Lunges"] },
    ],
  },
  home_basic: {
    name: "Home dumbbell plan",
    days: [
      { focus: "Upper", exercises: ["Dumbbell Shoulder Press", "Dumbbell Biceps Curl", "Push Up"] },
      { focus: "Lower", exercises: ["Walking Lunges", "Romanian Deadlift", "Push Up"] },
      { focus: "Full body", exercises: ["Push Up", "Dumbbell Biceps Curl", "Walking Lunges"] },
      { focus: "Upper", exercises: ["Dumbbell Shoulder Press", "Pull Up", "Dumbbell Biceps Curl"] },
      { focus: "Lower", exercises: ["Walking Lunges", "Romanian Deadlift", "Push Up"] },
      { focus: "Full body", exercises: ["Push Up", "Pull Up", "Walking Lunges"] },
    ],
  },
  bodyweight: {
    name: "Bodyweight strength",
    days: [
      { focus: "Push", exercises: ["Push Up", "Walking Lunges", "Pull Up"] },
      { focus: "Pull", exercises: ["Pull Up", "Push Up", "Walking Lunges"] },
      { focus: "Full body", exercises: ["Push Up", "Pull Up", "Walking Lunges"] },
      { focus: "Full body", exercises: ["Walking Lunges", "Push Up", "Pull Up"] },
      { focus: "Push", exercises: ["Push Up", "Walking Lunges", "Pull Up"] },
      { focus: "Pull", exercises: ["Pull Up", "Push Up", "Walking Lunges"] },
    ],
  },
};

function clampTrainingDays(value: number) {
  if (!Number.isFinite(value)) return 3;
  return Math.min(6, Math.max(2, Math.round(value)));
}

/** Build a fresh workout plan for the user from their equipment + training-day preferences. */
async function createPlanForUser(
  supabase: ServerClient,
  userId: string,
  equipmentAccess: string,
  trainingDays: number,
) {
  const template = TEMPLATES[equipmentAccess] ?? TEMPLATES.full_gym;
  const daysPerWeek = clampTrainingDays(trainingDays);
  const activeDays = template.days.slice(0, Math.min(daysPerWeek, template.days.length));

  const wantedNames = [...new Set(activeDays.flatMap((day) => day.exercises))];
  const { data: exerciseRows, error: exerciseError } = await supabase
    .from("exercises")
    .select("id,name")
    .in("name", wantedNames);
  if (exerciseError) throw new Error(exerciseError.message);

  const idByName = new Map<string, string>();
  for (const row of (exerciseRows ?? []) as Array<{ id: string; name: string }>) {
    idByName.set(row.name, row.id);
  }

  const { data: plan, error: planError } = await supabase
    .from("workout_plans")
    .insert({ user_id: userId, name: template.name, days_per_week: daysPerWeek, active: true })
    .select("id")
    .single();
  if (planError) throw new Error(planError.message);

  const planExercises = activeDays.flatMap((day, dayIndex) =>
    day.exercises
      .map((name, position) => {
        const exerciseId = idByName.get(name);
        if (!exerciseId) return null;
        const isCompound = position === 0;
        return {
          plan_id: plan.id as string,
          day_number: dayIndex + 1,
          exercise_id: exerciseId,
          sets: isCompound ? 4 : 3,
          rep_min: isCompound ? 5 : 8,
          rep_max: isCompound ? 8 : 12,
          rest_seconds: isCompound ? 120 : 90,
          sort_order: position,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null),
  );

  if (planExercises.length) {
    const { error: planExerciseError } = await supabase.from("plan_exercises").insert(planExercises);
    if (planExerciseError) throw new Error(planExerciseError.message);
  }

  return plan.id as string;
}

/* ------------------------------------------------------------------ */
/*  Auth                                                              */
/* ------------------------------------------------------------------ */

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth");
}

/* ------------------------------------------------------------------ */
/*  Onboarding + preferences                                          */
/* ------------------------------------------------------------------ */

export async function savePreferences(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const trainingDays = clampTrainingDays(Number(formData.get("training_days") || 3));
  const equipmentAccess = String(formData.get("equipment_access") || "full_gym");
  const currentWeight = Number(formData.get("current_weight_kg"));
  const targetWeightRaw = formData.get("target_weight_kg");

  const values = {
    user_id: user.id,
    display_name: String(formData.get("display_name") || "Athlete").trim() || "Athlete",
    current_weight_kg: Number.isFinite(currentWeight) && currentWeight > 0 ? currentWeight : null,
    goal_type: String(formData.get("goal_type") || "maintain"),
    target_weight_kg: targetWeightRaw && Number(targetWeightRaw) > 0 ? Number(targetWeightRaw) : null,
    target_date: String(formData.get("target_date") || "") || null,
    training_days: trainingDays,
    experience_level: String(formData.get("experience_level") || "beginner"),
    equipment_access: equipmentAccess,
    onboarding_complete: true,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("user_preferences").upsert(values);
  if (error) throw new Error(error.message);

  // Seed the first weigh-in so progress has a starting point.
  if (values.current_weight_kg) {
    await supabase.from("body_logs").upsert(
      { user_id: user.id, weight_kg: values.current_weight_kg, logged_at: new Date().toISOString().slice(0, 10) },
      { onConflict: "user_id,logged_at", ignoreDuplicates: true },
    );
  }

  // Replace any existing plan so onboarding is always idempotent.
  await supabase.from("workout_plans").delete().eq("user_id", user.id);
  await createPlanForUser(supabase, user.id, equipmentAccess, trainingDays);

  revalidatePath("/", "layout");
  redirect("/");
}

export async function saveSettings(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const trainingDays = clampTrainingDays(Number(formData.get("training_days") || 3));
  const equipmentAccess = String(formData.get("equipment_access") || "full_gym");

  const { data: existing } = await supabase
    .from("user_preferences")
    .select("training_days,equipment_access")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("user_preferences").update({
    display_name: String(formData.get("display_name") || "Athlete").trim() || "Athlete",
    training_days: trainingDays,
    experience_level: String(formData.get("experience_level") || "beginner"),
    equipment_access: equipmentAccess,
    goal_type: String(formData.get("goal_type") || "maintain"),
    target_weight_kg: formData.get("target_weight_kg") && Number(formData.get("target_weight_kg")) > 0
      ? Number(formData.get("target_weight_kg"))
      : null,
    updated_at: new Date().toISOString(),
  }).eq("user_id", user.id);
  if (error) throw new Error(error.message);

  // If the training structure changed, rebuild the plan to match.
  if (existing && (existing.training_days !== trainingDays || existing.equipment_access !== equipmentAccess)) {
    await supabase.from("workout_plans").delete().eq("user_id", user.id);
    await createPlanForUser(supabase, user.id, equipmentAccess, trainingDays);
  }

  revalidatePath("/", "layout");
}

export async function regeneratePlan() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("training_days,equipment_access")
    .eq("user_id", user.id)
    .maybeSingle();

  await supabase.from("workout_plans").delete().eq("user_id", user.id);
  await createPlanForUser(supabase, user.id, prefs?.equipment_access ?? "full_gym", prefs?.training_days ?? 3);

  revalidatePath("/", "layout");
}

/* ------------------------------------------------------------------ */
/*  Workout + body logging                                            */
/* ------------------------------------------------------------------ */

export async function logWorkout(title: string, sets: LoggedSet[], durationMinutes?: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  if (!sets.length) throw new Error("Log at least one set before finishing.");

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      title,
      status: "completed",
      duration_minutes: Number.isFinite(durationMinutes) ? durationMinutes : null,
    })
    .select("id")
    .single();
  if (sessionError) throw new Error(sessionError.message);

  const rows = sets.map((set) => ({
    session_id: session.id as string,
    exercise_name: set.exercise_name,
    set_number: set.set_number,
    reps: Math.max(1, Math.round(set.reps) || 1),
    weight_kg: Math.max(0, Number.isFinite(set.weight_kg) ? set.weight_kg : 0),
    rpe: set.rpe ?? null,
  }));

  const { error } = await supabase.from("session_sets").insert(rows);
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}

export async function logBodyWeight(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  const weight = Number(formData.get("weight_kg"));
  if (!Number.isFinite(weight) || weight <= 0) throw new Error("Enter a valid weight.");

  const { error } = await supabase.from("body_logs").upsert(
    { user_id: user.id, weight_kg: weight, logged_at: new Date().toISOString().slice(0, 10) },
    { onConflict: "user_id,logged_at" },
  );
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}
