"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { logBodyWeight, logWorkout, savePreferences, signOut } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  Dumbbell,
  Flame,
  Footprints,
  Home,
  LayoutGrid,
  LoaderCircle,
  MoreHorizontal,
  Play,
  Plus,
  Settings2,
  TimerReset,
  Trophy,
  UserRound,
  X,
  Zap,
} from "lucide-react";

type Profile = {
  display_name: string | null;
  current_weight_kg: number | null;
  target_weight_kg: number | null;
  goal_type: string | null;
  onboarding_complete: boolean | null;
};

type ExerciseRef = { name: string; primary_muscle: string };

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

type SessionRow = {
  id: string;
  title: string;
  session_date: string;
  session_sets: { exercise_name: string; weight_kg: number; reps: number; set_number: number }[] | null;
};

const MUSCLE_CODE: Record<string, string> = {
  chest: "CH", back: "BK", shoulders: "SH", legs: "LG", hamstrings: "HM", arms: "AR",
};

const GOAL_LABEL: Record<string, string> = {
  lose_weight: "Losing weight", gain_weight: "Gaining weight", gain_muscle: "Building muscle",
  maintain: "Maintaining", recomp: "Recomposition",
};

function localIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfWeek(now: Date) {
  const d = new Date(now);
  const monday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - monday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function firstExercise(value: PlanExerciseRow["exercises"]): ExerciseRef | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [planName, setPlanName] = useState("Your plan");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [planExercises, setPlanExercises] = useState<PlanExerciseRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [weightLogs, setWeightLogs] = useState<Array<{ weight_kg: number; logged_at: string }>>([]);
  const [workoutCount, setWorkoutCount] = useState(0);

  const [completed, setCompleted] = useState<string[]>([]);
  const [timer, setTimer] = useState(0);
  const [timerOpen, setTimerOpen] = useState(false);
  const [workoutLogged, setWorkoutLogged] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loggingWorkout, setLoggingWorkout] = useState(false);
  const [weightLogOpen, setWeightLogOpen] = useState(false);
  const [panel, setPanel] = useState<"help" | "notifications" | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("user_preferences").select("display_name,current_weight_kg,target_weight_kg,goal_type,onboarding_complete").maybeSingle(),
      supabase.from("body_logs").select("weight_kg,logged_at").order("logged_at", { ascending: false }).limit(30),
      supabase.from("workout_sessions").select("id,title,session_date,session_sets(exercise_name,weight_kg,reps,set_number)").eq("status", "completed").order("session_date", { ascending: false }).limit(30),
      supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("status", "completed"),
      supabase.from("workout_plans").select("name,days_per_week,created_at,plan_exercises(day_number,day_focus,sets,rep_min,rep_max,rest_seconds,sort_order,exercises(name,primary_muscle))").eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]).then(([prefs, logs, sess, count, plan]) => {
      setProfile((prefs.data as Profile) ?? null);
      setWeightLogs(logs.data ?? []);
      setSessions((sess.data as SessionRow[]) ?? []);
      setWorkoutCount(count.count ?? 0);
      const planData = plan.data as { name?: string; days_per_week?: number; plan_exercises?: PlanExerciseRow[] } | null;
      if (planData) {
        setPlanName(planData.name ?? "Your plan");
        setDaysPerWeek(planData.days_per_week ?? 3);
        setPlanExercises(planData.plan_exercises ?? []);
      }
      setProfileLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!timer) return;
    const interval = window.setInterval(() => setTimer((value) => Math.max(value - 1, 0)), 1000);
    return () => window.clearInterval(interval);
  }, [timer]);

  const dayNumbers = useMemo(
    () => [...new Set(planExercises.map((row) => row.day_number))].sort((a, b) => a - b),
    [planExercises],
  );
  const todayDay = dayNumbers.length ? dayNumbers[workoutCount % dayNumbers.length] : 1;

  const todayFocus = useMemo(() => {
    const row = planExercises.find((item) => item.day_number === todayDay);
    return row?.day_focus?.trim() || planName;
  }, [planExercises, todayDay, planName]);
  const focusUsesAmp = todayFocus.includes(" & ");
  const focusWords = focusUsesAmp ? todayFocus.split(" & ") : todayFocus.split(" ");

  const todayExercises = useMemo(() => {
    return planExercises
      .filter((row) => row.day_number === todayDay)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((row) => {
        const ref = firstExercise(row.exercises);
        const name = ref?.name ?? "Exercise";
        const muscle = ref?.primary_muscle ?? "";
        let lastWeight = 0;
        for (const session of sessions) {
          const matches = (session.session_sets ?? []).filter((set) => set.exercise_name === name);
          if (matches.length) {
            lastWeight = Math.max(...matches.map((set) => set.weight_kg));
            break;
          }
        }
        return {
          name,
          muscle,
          code: MUSCLE_CODE[muscle] ?? (muscle || "EX").slice(0, 2).toUpperCase(),
          sets: row.sets,
          repMin: row.rep_min,
          repRange: `${row.rep_min}–${row.rep_max}`,
          restSeconds: row.rest_seconds,
          lastWeight,
        };
      });
  }, [planExercises, todayDay, sessions]);

  const estimatedMinutes = useMemo(
    () => Math.max(1, Math.round(todayExercises.reduce((total, ex) => total + ex.sets * (ex.restSeconds + 40), 0) / 60)),
    [todayExercises],
  );

  const week = useMemo(() => {
    const start = startOfWeek(new Date());
    const todayIso = localIso(new Date());
    const doneDates = new Set(sessions.map((session) => session.session_date));
    const letters = ["M", "T", "W", "T", "F", "S", "S"];
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const iso = localIso(date);
      let state: "done" | "today" | "planned" | "rest";
      if (doneDates.has(iso)) state = "done";
      else if (iso === todayIso) state = "today";
      else if (index < daysPerWeek) state = "planned";
      else state = "rest";
      return { day: letters[index], date: String(date.getDate()), state, key: iso };
    });
  }, [sessions, daysPerWeek]);

  const sessionsThisWeek = useMemo(() => {
    const weekStart = localIso(startOfWeek(new Date()));
    return sessions.filter((session) => session.session_date >= weekStart).length;
  }, [sessions]);

  const weightTrend = useMemo(() => {
    const points = [...weightLogs].reverse();
    if (points.length < 2) return null;
    const values = points.map((point) => point.weight_kg);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const y = (weight: number) => (max === min ? 27 : 6 + (1 - (weight - min) / (max - min)) * 42);
    const coords = points.map((_, index) => (points.length === 1 ? 0 : (index / (points.length - 1)) * 300));
    const d = coords.map((x, index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y(values[index]).toFixed(1)}`).join(" ");
    return { d, lastX: coords[coords.length - 1], lastY: y(values[values.length - 1]), delta: values[values.length - 1] - values[0] };
  }, [weightLogs]);

  const toggleExercise = (name: string) => {
    setCompleted((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));
    const exercise = todayExercises.find((item) => item.name === name);
    if (exercise && !completed.includes(name)) {
      setTimer(exercise.restSeconds || 90);
      setTimerOpen(true);
    }
  };

  const finishWorkout = async () => {
    if (!todayExercises.length || completed.length !== todayExercises.length || loggingWorkout || workoutLogged) return;
    setLoggingWorkout(true);
    setSaveError("");
    try {
      const sets = todayExercises.flatMap((exercise) =>
        Array.from({ length: exercise.sets }, (_, index) => ({
          exercise_name: exercise.name,
          set_number: index + 1,
          reps: exercise.repMin || 8,
          weight_kg: exercise.lastWeight || 0,
        })),
      );
      await logWorkout(planName, sets, estimatedMinutes);
      setWorkoutLogged(true);
      setWorkoutCount((count) => count + 1);
      setSessions((prev) => [
        { id: crypto.randomUUID(), title: planName, session_date: localIso(new Date()), session_sets: sets },
        ...prev,
      ]);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save workout.");
    } finally {
      setLoggingWorkout(false);
    }
  };

  const formatTimer = (value: number) =>
    `${Math.floor(value / 60).toString().padStart(2, "0")}:${(value % 60).toString().padStart(2, "0")}`;

  const name = profile?.display_name || "Athlete";
  const initials = name.slice(0, 2).toUpperCase();

  if (!profileLoaded) return <main className="auth-shell"><LoaderCircle className="spin" color="var(--lime)" /></main>;

  if (!profile?.onboarding_complete) {
    return (
      <main className="onboarding-backdrop">
        <section className="onboarding-card">
          <p className="eyebrow">First, make it yours</p>
          <h2>Tell us where you&apos;re starting.</h2>
          <p>We&apos;ll use this to build your first training plan and pace-to-goal estimate.</p>
          <form action={savePreferences}>
            <div className="onboarding-grid">
              <label>Name<input name="display_name" required placeholder="Jordan" /></label>
              <label>Current weight (kg)<input name="current_weight_kg" type="number" min="1" step="0.1" required placeholder="82.4" /></label>
              <label>Goal<select name="goal_type" defaultValue="gain_muscle"><option value="lose_weight">Lose weight</option><option value="gain_weight">Gain weight</option><option value="gain_muscle">Gain muscle</option><option value="maintain">Maintain</option><option value="recomp">Recomp</option></select></label>
              <label>Target weight (kg)<input name="target_weight_kg" type="number" min="1" step="0.1" placeholder="78.2" /></label>
              <label>Training days<select name="training_days" defaultValue="3"><option value="2">2 days</option><option value="3">3 days</option><option value="4">4 days</option><option value="5">5 days</option><option value="6">6 days</option></select></label>
              <label>Experience<select name="experience_level" defaultValue="beginner"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
              <label>Equipment<select name="equipment_access" defaultValue="full_gym"><option value="full_gym">Full gym</option><option value="home_basic">Home basics</option><option value="bodyweight">Bodyweight only</option></select></label>
            </div>
            <button className="primary-button onboarding-submit" type="submit">Build my starting plan <ArrowUpRight size={16} /></button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Zap size={17} fill="currentColor" /></div><span>fittrack<span className="brand-accent">pro</span></span></div>
        <nav className="side-nav" aria-label="Primary navigation">
          <Link className="nav-item active" href="/"><Home size={18} />Overview</Link>
          <Link className="nav-item" href="/workouts"><Dumbbell size={18} />My workouts</Link>
          <Link className="nav-item" href="/progress"><BarChart3 size={18} />Progress</Link>
          <Link className="nav-item" href="/library"><LayoutGrid size={18} />Exercise library</Link>
        </nav>
        <div className="sidebar-bottom">
          <Link className="nav-item" href="/settings"><Settings2 size={18} />Settings</Link>
          <button className="profile-chip" onClick={() => setProfileModalOpen(true)}><div className="avatar">{initials}</div><div><strong>{name}</strong><span>View account</span></div><MoreHorizontal size={17} /></button>
        </div>
      </aside>

      <section className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">{new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date())}</p>
            <h1>Good to see you, {name} <span className="wave">✦</span></h1>
          </div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Help" onClick={() => setPanel(panel === "help" ? null : "help")}><CircleHelp size={19} /></button>
            <button className="icon-button notification" aria-label="Notifications" onClick={() => { setHasNotifications(false); setPanel(panel === "notifications" ? null : "notifications"); }}><Bell size={19} />{hasNotifications && <i />}</button>
            <button className="profile-menu-button" onClick={() => setProfileModalOpen(true)} title="Open profile"><div className="avatar avatar-top">{initials}</div></button>
          </div>
        </header>

        {panel && (
          <section className="quick-panel">
            <div className="quick-panel-head"><strong>{panel === "help" ? "FitTrack help" : "Notifications"}</strong><button onClick={() => setPanel(null)} aria-label="Close panel"><X size={15} /></button></div>
            {panel === "help"
              ? <p>Tap an exercise to mark it complete, then choose <strong>Finish workout</strong> to save your session. Head to <strong>My workouts</strong> to log each set with weight and reps, and <strong>Progress</strong> to track body weight.</p>
              : <p className="empty-state">You&apos;re all caught up. New reminders and milestones will appear here.</p>}
          </section>
        )}
        {profileModalOpen && (
          <section className="profile-popover" role="dialog" aria-modal="false" aria-labelledby="profile-modal-title">
            <button className="modal-close" onClick={() => setProfileModalOpen(false)} aria-label="Close profile"><X size={18} /></button>
            <div className="modal-avatar">{initials}</div>
            <p className="eyebrow">Your account</p>
            <h2 id="profile-modal-title">{name}</h2>
            <p className="modal-copy">{profile?.goal_type ? `${GOAL_LABEL[profile.goal_type] ?? "Training"} · ${planName}` : "Manage your training preferences and account."}</p>
            <Link className="primary-button modal-settings" href="/settings" onClick={() => setProfileModalOpen(false)}><Settings2 size={16} />Open settings</Link>
            <button className="modal-signout" onClick={() => signOut()}>Sign out</button>
          </section>
        )}

        <div className="content-grid">
          <div className="primary-column">
            <section className="hero-panel">
              <div className="hero-copy">
                <div className="section-kicker"><span className="live-dot" />Today&apos;s workout · Day {todayDay}</div>
                <h2>{focusWords[0]}<br /><em>{focusWords.slice(1).join(focusUsesAmp ? " & " : " ") || "session"}</em></h2>
                <p>{todayExercises.length ? `${todayExercises.length} exercises · ${planName}` : "Generate a plan to see today's session."}</p>
                <button className="primary-button" onClick={() => document.getElementById("workout")?.scrollIntoView({ behavior: "smooth" })}><Play size={16} fill="currentColor" />Start workout <ArrowUpRight size={16} /></button>
              </div>
              <div className="hero-art">
                <div className="ring ring-one" /><div className="ring ring-two" />
                <div className="hero-stat"><strong>{String(todayExercises.length).padStart(2, "0")}</strong><span>exercises</span></div>
                <div className="hero-stat second"><strong>{estimatedMinutes}<span>m</span></strong><span>estimated</span></div>
              </div>
            </section>

            <section className="section-block" id="workout">
              <div className="section-heading">
                <div><p className="eyebrow">Day {todayDay} · {planName}</p><h3>{todayFocus}</h3></div>
                <Link className="text-button" href="/workouts">Open full plan <ChevronRight size={15} /></Link>
              </div>
              {todayExercises.length ? (
                <>
                  <div className="exercise-list">
                    {todayExercises.map((exercise) => {
                      const isDone = completed.includes(exercise.name);
                      return (
                        <button className={`exercise-row ${isDone ? "is-done" : ""}`} key={exercise.name} onClick={() => toggleExercise(exercise.name)}>
                          <div className="exercise-icon">{isDone ? <Check size={18} /> : exercise.code}</div>
                          <div className="exercise-info"><strong>{exercise.name}</strong><span>{exercise.sets} sets · {exercise.repRange} reps</span></div>
                          <div className="exercise-load"><span>Last time</span><strong>{exercise.lastWeight ? `${exercise.lastWeight} kg` : "—"}</strong></div>
                          <div className="row-check">{isDone ? <Check size={15} /> : <Plus size={16} />}</div>
                        </button>
                      );
                    })}
                  </div>
                  <Link className="add-exercise" href="/library"><Plus size={16} /> Browse exercise library</Link>
                  {completed.length === todayExercises.length && (
                    <>
                      <button className="primary-button finish-workout" onClick={finishWorkout} disabled={loggingWorkout || workoutLogged}>
                        {loggingWorkout ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}
                        {workoutLogged ? "Workout saved" : "Finish workout"}
                      </button>
                      {saveError && <p className="form-error workout-error">{saveError}</p>}
                    </>
                  )}
                </>
              ) : (
                <p className="empty-state">No plan exercises yet. Open <Link className="text-button" href="/settings" style={{ display: "inline-flex" }}>Settings</Link> to regenerate your plan, or run the Supabase exercise seed first.</p>
              )}
            </section>

            <section className="section-block progress-block" id="progress">
              <div className="section-heading">
                <div><p className="eyebrow">Consistency</p><h3>This week</h3></div>
                <span className="muted-label">{sessionsThisWeek} of {daysPerWeek} sessions</span>
              </div>
              <div className="week-strip">
                {week.map((item) => (
                  <div className={`day ${item.state}`} key={item.key}>
                    <span>{item.day}</span><strong>{item.date}</strong>
                    <i>{item.state === "done" ? <Check size={13} /> : item.state === "today" ? <span /> : null}</i>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="secondary-column">
            <section className="metric-card pace-card">
              <div className="card-top">
                <div><p className="eyebrow">Goal pace</p><h3>{profile?.target_weight_kg ? "On track" : "Add a target"}</h3></div>
                <div className="pace-icon"><ArrowUpRight size={18} /></div>
              </div>
              <div className="pace-number">
                <strong>{profile?.current_weight_kg && profile?.target_weight_kg ? `${(profile.current_weight_kg - profile.target_weight_kg).toFixed(1)}` : "—"}</strong>
                <span>kg to goal</span>
              </div>
              <div className="pace-bar"><span /></div>
              <div className="pace-meta">
                <span>{profile?.current_weight_kg ? `${profile.current_weight_kg} kg now` : "No weight yet"}</span>
                <span>{profile?.target_weight_kg ? `Target ${profile.target_weight_kg} kg` : "Set target"}</span>
              </div>
              <p className="supporting-copy">Log your weight regularly and FitTrack replaces this estimate with your <strong>actual trend</strong>.</p>
              <Link className="card-link" href="/progress">View progress <ChevronRight size={15} /></Link>
            </section>

            <section className="metric-card stats-card">
              <div className="card-top">
                <div><p className="eyebrow">Your momentum</p><h3>{workoutCount ? "Looking strong" : "Start your streak"}</h3></div>
                <Flame className="flame" size={20} fill="currentColor" />
              </div>
              <div className="stat-grid">
                <div><strong>{workoutCount}</strong><span>workouts</span></div>
                <div><strong>{weightLogs.length}</strong><span>weigh-ins</span></div>
                <div><strong>{completed.length}<span>/{todayExercises.length || 0}</span></strong><span>today</span></div>
              </div>
              <div className="mini-chart">
                <div className="chart-label">
                  <span>Weight trend</span>
                  <span>{weightTrend ? `${weightTrend.delta > 0 ? "+" : ""}${weightTrend.delta.toFixed(1)} kg` : "No trend yet"} <small>logged</small></span>
                </div>
                <svg viewBox="0 0 300 54" preserveAspectRatio="none" role="img" aria-label="Weight trend">
                  <path d={weightTrend?.d ?? "M0 30 L300 30"} fill="none" stroke="currentColor" strokeWidth="2.5" />
                  {weightTrend && <circle cx={weightTrend.lastX} cy={weightTrend.lastY} r="3.5" fill="currentColor" />}
                </svg>
              </div>
            </section>

            <section className="metric-card nutrition-card">
              <div className="card-top">
                <div><p className="eyebrow">Body check-in</p><h3>{profile?.current_weight_kg || "—"} <small>kg current</small></h3></div>
                <button className="pace-icon" onClick={() => setWeightLogOpen(!weightLogOpen)} aria-label="Log body weight"><Plus size={18} /></button>
              </div>
              {weightLogOpen ? (
                <form className="weight-form" action={logBodyWeight} onSubmit={() => setWeightLogOpen(false)}>
                  <input name="weight_kg" type="number" step="0.1" min="1" placeholder="82.4" required />
                  <button className="primary-button" type="submit">Save weight</button>
                </form>
              ) : (
                <>
                  <div className="macro-bars">
                    <div><span>Latest weigh-in <b>{weightLogs[0]?.logged_at || "Not logged"}</b></span><i><b style={{ width: weightLogs.length ? "78%" : "8%" }} /></i></div>
                    <div><span>Goal target <b>{profile?.target_weight_kg ? `${profile.target_weight_kg} kg` : "Not set"}</b></span><i><b style={{ width: profile?.target_weight_kg ? "62%" : "8%" }} /></i></div>
                  </div>
                  <button className="card-link" onClick={() => setWeightLogOpen(true)}>Log today&apos;s weight <ChevronRight size={15} /></button>
                </>
              )}
            </section>

            <section className="activity-panel">
              <div className="section-heading">
                <div><p className="eyebrow">Recent wins</p><h3>Activity</h3></div>
                <Link className="more-button" href="/workouts" aria-label="View workout activity"><MoreHorizontal size={18} /></Link>
              </div>
              <div className="activity-item">
                <div className="activity-icon yellow"><Trophy size={15} /></div>
                <div><strong>{workoutCount ? "Workout logged" : "Your first workout is waiting"}</strong><span>{workoutCount ? `${workoutCount} completed session${workoutCount === 1 ? "" : "s"}` : "Complete today's plan to begin"}</span></div>
                <time>{workoutCount ? "Saved" : "Today"}</time>
              </div>
              <div className="activity-item">
                <div className="activity-icon green"><Footprints size={15} /></div>
                <div><strong>Progress tracking</strong><span>{weightLogs.length ? `${weightLogs.length} weigh-in${weightLogs.length === 1 ? "" : "s"} recorded` : "Log your first weigh-in"}</span></div>
                <Link className="activity-action" href="/progress">Open</Link>
              </div>
            </section>
          </aside>
        </div>
      </section>

      <nav className="mobile-nav">
        <Link className="active" href="/"><Home size={19} /><span>Home</span></Link>
        <Link href="/workouts"><Dumbbell size={19} /><span>Train</span></Link>
        <Link className="mobile-add" href="/workouts"><Plus size={23} /></Link>
        <Link href="/progress"><BarChart3 size={19} /><span>Progress</span></Link>
        <Link href="/settings"><UserRound size={19} /><span>Profile</span></Link>
      </nav>
      {timerOpen && (
        <div className="timer-pill">
          <TimerReset size={16} /><span>Rest timer</span><strong>{formatTimer(timer)}</strong>
          <button onClick={() => { setTimer(0); setTimerOpen(false); }} aria-label="Close timer"><X size={15} /></button>
        </div>
      )}
    </main>
  );
}
