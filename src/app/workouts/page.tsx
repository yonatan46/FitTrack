"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clock3, Dumbbell, HelpCircle, LoaderCircle, Play, RotateCcw, TimerReset } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logWorkout, regeneratePlan } from "@/app/actions";
import type { LoggedSet } from "@/lib/workout";
import { PageFrame } from "@/components/page-frame";
import { ExerciseSheet } from "@/components/exercise-sheet";

type ExerciseRef = {
  name: string;
  primary_muscle: string;
  image_url: string | null;
  image_url_2: string | null;
  instructions: string[] | null;
};

type PlanExerciseRow = {
  day_number: number;
  day_focus: string | null;
  sets: number;
  rep_min: number;
  rep_max: number;
  rest_seconds: number;
  sort_order: number;
  exercises: ExerciseRef | ExerciseRef[] | null;
};

type HistoryRow = {
  id: string;
  title: string;
  session_date: string;
  duration_minutes: number | null;
  session_sets: { weight_kg: number; reps: number }[] | null;
};

type SetEntry = { weight: string; reps: string; done: boolean };

function firstExercise(value: PlanExerciseRow["exercises"]): ExerciseRef | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default function WorkoutsPage() {
  const [loaded, setLoaded] = useState(false);
  const [planName, setPlanName] = useState("Your plan");
  const [rows, setRows] = useState<PlanExerciseRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [activeDay, setActiveDay] = useState(1);
  const [entries, setEntries] = useState<Record<string, SetEntry[]>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [howto, setHowto] = useState<ExerciseRef | null>(null);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("workout_plans").select("name,plan_exercises(day_number,day_focus,sets,rep_min,rep_max,rest_seconds,sort_order,exercises(name,primary_muscle,image_url,image_url_2,instructions))").eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("workout_sessions").select("id,title,session_date,duration_minutes,session_sets(weight_kg,reps)").eq("status", "completed").order("session_date", { ascending: false }).limit(10),
      supabase.from("workout_sessions").select("session_sets(exercise_name,weight_kg)").eq("status", "completed").order("session_date", { ascending: false }).limit(20),
    ]).then(([plan, hist, recent]) => {
      const planData = plan.data as { name?: string; plan_exercises?: PlanExerciseRow[] } | null;
      const planRows = planData?.plan_exercises ?? [];
      setPlanName(planData?.name ?? "Your plan");
      setRows(planRows);
      setHistory((hist.data as HistoryRow[]) ?? []);

      const lastWeight = new Map<string, number>();
      for (const session of (recent.data as { session_sets: { exercise_name: string; weight_kg: number }[] | null }[] | null) ?? []) {
        for (const set of session.session_sets ?? []) {
          if (!lastWeight.has(set.exercise_name)) lastWeight.set(set.exercise_name, set.weight_kg);
        }
      }

      const seeded: Record<string, SetEntry[]> = {};
      for (const row of planRows) {
        const ref = firstExercise(row.exercises);
        if (!ref) continue;
        const weight = lastWeight.get(ref.name);
        seeded[`${row.day_number}:${ref.name}`] = Array.from({ length: row.sets }, () => ({
          weight: weight ? String(weight) : "",
          reps: String(row.rep_min),
          done: false,
        }));
      }
      setEntries(seeded);

      const days = [...new Set(planRows.map((row) => row.day_number))].sort((a, b) => a - b);
      if (days.length) {
        // Monday = Day 1; default to today's day, or Day 1 if today is a rest day.
        const weekdayIndex = (new Date().getDay() + 6) % 7;
        setActiveDay(weekdayIndex < days.length ? days[weekdayIndex] : days[0]);
      }
      setLoaded(true);
    });
  }, []);

  const days = useMemo(() => [...new Set(rows.map((row) => row.day_number))].sort((a, b) => a - b), [rows]);

  const dayExercises = useMemo(
    () => rows.filter((row) => row.day_number === activeDay).sort((a, b) => a.sort_order - b.sort_order),
    [rows, activeDay],
  );

  const focusByDay = useMemo(() => {
    const map = new Map<number, string>();
    for (const row of rows) {
      if (row.day_focus && !map.has(row.day_number)) map.set(row.day_number, row.day_focus);
    }
    return map;
  }, [rows]);
  const dayFocus = focusByDay.get(activeDay) ?? `Day ${activeDay}`;

  const updateEntry = (key: string, index: number, patch: Partial<SetEntry>) => {
    setEntries((current) => {
      const list = current[key] ? [...current[key]] : [];
      list[index] = { ...list[index], ...patch };
      return { ...current, [key]: list };
    });
    setSaved(false);
  };

  const doneSets = useMemo(() => {
    let count = 0;
    let volume = 0;
    for (const row of dayExercises) {
      const ref = firstExercise(row.exercises);
      if (!ref) continue;
      for (const entry of entries[`${row.day_number}:${ref.name}`] ?? []) {
        if (entry.done) {
          count += 1;
          volume += (Number(entry.weight) || 0) * (Number(entry.reps) || 0);
        }
      }
    }
    return { count, volume };
  }, [dayExercises, entries]);

  async function finish() {
    setSaving(true);
    setError("");
    try {
      const sets: LoggedSet[] = [];
      for (const row of dayExercises) {
        const ref = firstExercise(row.exercises);
        if (!ref) continue;
        const list = entries[`${row.day_number}:${ref.name}`] ?? [];
        list.forEach((entry, index) => {
          if (!entry.done) return;
          sets.push({
            exercise_name: ref.name,
            set_number: index + 1,
            reps: Number(entry.reps) || row.rep_min,
            weight_kg: Number(entry.weight) || 0,
          });
        });
      }
      if (!sets.length) {
        setError("Mark at least one set as done before finishing.");
        setSaving(false);
        return;
      }
      const title = `${planName} · Day ${activeDay}`;
      await logWorkout(title, sets);
      setSaved(true);
      setHistory((items) => [
        { id: crypto.randomUUID(), title, session_date: new Date().toISOString().slice(0, 10), duration_minutes: null, session_sets: sets.map((set) => ({ weight_kg: set.weight_kg, reps: set.reps })) },
        ...items,
      ]);
      setEntries((current) => {
        const next = { ...current };
        for (const row of dayExercises) {
          const ref = firstExercise(row.exercises);
          if (!ref) continue;
          const key = `${row.day_number}:${ref.name}`;
          next[key] = (next[key] ?? []).map((entry) => ({ ...entry, done: false }));
        }
        return next;
      });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Could not save this workout.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      await regeneratePlan();
      window.location.reload();
    } catch {
      setRegenerating(false);
    }
  }

  return (
    <PageFrame eyebrow="Training plan" title="My workouts">
      <div className="route-grid">
        <section className="route-panel workout-detail">
          <div className="route-panel-heading">
            <div>
              <p className="eyebrow">Day {activeDay} · {planName}</p>
              <h2>{dayFocus}</h2>
              <span className="panel-meta"><Clock3 size={14} /> {dayExercises.length} exercises <Dumbbell size={14} /> {dayExercises.reduce((total, row) => total + row.sets, 0)} sets</span>
            </div>
            <div className="workout-badge"><Play size={18} fill="currentColor" /></div>
          </div>

          {!loaded ? (
            <p className="empty-state">Loading your plan…</p>
          ) : !dayExercises.length ? (
            <p className="empty-state">No plan yet. Generate one below (make sure the Supabase exercise seed has been run).</p>
          ) : (
            <>
              {days.length > 1 && (
                <div className="day-tabs">
                  {days.map((day) => (
                    <button key={day} className={`day-tab ${day === activeDay ? "active" : ""}`} onClick={() => setActiveDay(day)}>Day {day}</button>
                  ))}
                </div>
              )}

              <div className="set-logger">
                {dayExercises.map((row) => {
                  const ref = firstExercise(row.exercises);
                  if (!ref) return null;
                  const key = `${row.day_number}:${ref.name}`;
                  const list = entries[key] ?? [];
                  const allDone = list.length > 0 && list.every((entry) => entry.done);
                  return (
                    <div key={key} className={`logger-exercise ${allDone ? "is-done" : ""}`}>
                      <div className="logger-head">
                        <div>
                          <strong>{ref.name}</strong>
                          <small>{ref.primary_muscle} · target {row.sets}×{row.rep_min}–{row.rep_max} · rest {row.rest_seconds}s</small>
                        </div>
                        <button className="howto-button" aria-label={`How to do ${ref.name}`} onClick={() => setHowto(ref)}>
                          <HelpCircle size={15} />
                        </button>
                        <button
                          className={`set-toggle ${allDone ? "on" : ""}`}
                          aria-label={allDone ? "Clear all sets" : "Mark all sets done"}
                          onClick={() => setEntries((current) => ({
                            ...current,
                            [key]: (current[key] ?? []).map((entry) => ({ ...entry, done: !allDone })),
                          }))}
                        >
                          <Check size={15} />
                        </button>
                      </div>
                      <div className="set-rows">
                        {list.map((entry, index) => (
                          <div className="set-row" key={index}>
                            <span>SET {index + 1}</span>
                            <div className="set-field">
                              <input inputMode="decimal" placeholder="0" value={entry.weight} onChange={(event) => updateEntry(key, index, { weight: event.target.value })} aria-label={`${ref.name} set ${index + 1} weight in kg`} />
                              <span>kg</span>
                            </div>
                            <div className="set-field">
                              <input inputMode="numeric" placeholder="0" value={entry.reps} onChange={(event) => updateEntry(key, index, { reps: event.target.value })} aria-label={`${ref.name} set ${index + 1} reps`} />
                              <span>reps</span>
                            </div>
                            <button className={`set-check ${entry.done ? "on" : ""}`} aria-label={`Mark ${ref.name} set ${index + 1} done`} onClick={() => updateEntry(key, index, { done: !entry.done })}>
                              <Check size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="session-summary">
                <div><strong>{doneSets.count}</strong><span>sets done</span></div>
                <div><strong>{Math.round(doneSets.volume).toLocaleString()}</strong><span>kg volume</span></div>
                <div><strong>{dayExercises.reduce((total, row) => total + row.sets, 0)}</strong><span>sets planned</span></div>
              </div>

              <button className="primary-button finish-workout" onClick={finish} disabled={saving || !doneSets.count}>
                {saving ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}
                {saved ? "Workout saved" : "Finish workout"}
              </button>
              {error && <p className="form-error workout-error">{error}</p>}
            </>
          )}
        </section>

        <section className="route-panel">
          <div className="section-heading">
            <div><p className="eyebrow">Your record</p><h3>Recent sessions</h3></div>
            <TimerReset size={18} color="var(--lime)" />
          </div>
          {history.length ? (
            <div className="history-list">
              {history.map((session) => {
                const setCount = session.session_sets?.length ?? 0;
                const volume = (session.session_sets ?? []).reduce((total, set) => total + set.weight_kg * set.reps, 0);
                return (
                  <div className="history-row" key={session.id}>
                    <div className="activity-icon green"><Check size={15} /></div>
                    <div>
                      <strong>{session.title}</strong>
                      <span>{session.session_date} · {setCount} sets{volume ? ` · ${Math.round(volume).toLocaleString()} kg` : ""}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty-state">No workouts logged yet. Finish a session to start your history.</p>
          )}

          <div className="settings-actions">
            <button className="ghost-button" onClick={handleRegenerate} disabled={regenerating}>
              {regenerating ? <LoaderCircle size={14} className="spin" /> : <RotateCcw size={14} />}
              Regenerate plan
            </button>
          </div>
        </section>
      </div>

      {howto && <ExerciseSheet exercise={howto} onClose={() => setHowto(null)} />}
    </PageFrame>
  );
}
