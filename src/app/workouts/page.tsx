"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, Dumbbell, LoaderCircle, Play, TimerReset } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logWorkout } from "@/app/actions";
import { PageFrame } from "@/components/page-frame";

const starterExercises = [
  { name: "Barbell Bench Press", sets: 4, reps: "6–8", weight: 60 },
  { name: "Seated Cable Row", sets: 3, reps: "8–10", weight: 45 },
  { name: "Dumbbell Shoulder Press", sets: 3, reps: "10–12", weight: 16 },
];

export default function WorkoutsPage() {
  const [done, setDone] = useState<string[]>([]);
  const [history, setHistory] = useState<Array<{ id: string; title: string; session_date: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    createClient().from("workout_sessions").select("id,title,session_date").order("session_date", { ascending: false }).limit(8).then(({ data }) => setHistory(data || []));
  }, []);

  async function finish() {
    setSaving(true); setError("");
    try {
      await logWorkout("Upper body strength", starterExercises.flatMap((exercise) => Array.from({ length: exercise.sets }, (_, index) => ({ exercise_name: exercise.name, set_number: index + 1, reps: Number(exercise.reps.split("–")[0]), weight_kg: exercise.weight }))));
      setSaved(true);
      setHistory((items) => [{ id: crypto.randomUUID(), title: "Upper body strength", session_date: new Date().toISOString().slice(0, 10) }, ...items]);
    } catch (exception) { setError(exception instanceof Error ? exception.message : "Could not save this workout."); }
    finally { setSaving(false); }
  }

  return <PageFrame eyebrow="Training plan" title="My workouts"><div className="route-grid"><section className="route-panel workout-detail"><div className="route-panel-heading"><div><p className="eyebrow">Today&apos;s session</p><h2>Upper body strength</h2><span className="panel-meta"><Clock3 size={14} /> 45 min <Dumbbell size={14} /> 3 exercises</span></div><div className="workout-badge"><Play size={18} fill="currentColor" /></div></div><div className="full-exercise-list">{starterExercises.map((exercise) => <button className={`full-exercise ${done.includes(exercise.name) ? "is-done" : ""}`} key={exercise.name} onClick={() => setDone((items) => items.includes(exercise.name) ? items.filter((item) => item !== exercise.name) : [...items, exercise.name])}><span className="set-status">{done.includes(exercise.name) ? <Check size={16} /> : <span />}</span><span><strong>{exercise.name}</strong><small>{exercise.sets} sets · {exercise.reps} reps</small></span><b>{exercise.weight} kg</b></button>)}</div>{done.length === starterExercises.length && <button className="primary-button finish-workout" onClick={finish} disabled={saving || saved}>{saving ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}{saved ? "Workout saved" : "Finish workout"}</button>}{error && <p className="form-error workout-error">{error}</p>}</section><section className="route-panel"><div className="section-heading"><div><p className="eyebrow">Your record</p><h3>Recent sessions</h3></div><TimerReset size={18} color="var(--lime)" /></div>{history.length ? <div className="history-list">{history.map((session) => <div className="history-row" key={session.id}><div className="activity-icon green"><Check size={15} /></div><div><strong>{session.title}</strong><span>{session.session_date}</span></div></div>)}</div> : <p className="empty-state">No workouts logged yet. Complete today&apos;s session to start your history.</p>}</section></div></PageFrame>;
}
