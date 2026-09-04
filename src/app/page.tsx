"use client";

import { useEffect, useState } from "react";
import { logBodyWeight, logWorkout, savePreferences, signOut } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
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
  Utensils,
  X,
  Zap,
} from "lucide-react";

const week = [
  { day: "M", date: "12", state: "done" },
  { day: "T", date: "13", state: "done" },
  { day: "W", date: "14", state: "today" },
  { day: "T", date: "15", state: "planned" },
  { day: "F", date: "16", state: "planned" },
  { day: "S", date: "17", state: "rest" },
  { day: "S", date: "18", state: "rest" },
];

const exercises = [
  { name: "Barbell Bench Press", detail: "4 sets · 6–8 reps", load: "60 kg", status: "ready", icon: "BP" },
  { name: "Seated Cable Row", detail: "3 sets · 8–10 reps", load: "45 kg", status: "ready", icon: "CR" },
  { name: "Dumbbell Shoulder Press", detail: "3 sets · 10–12 reps", load: "16 kg", status: "ready", icon: "SP" },
];

export default function HomePage() {
  const [completed, setCompleted] = useState<string[]>([]);
  const [timer, setTimer] = useState(0);
  const [timerOpen, setTimerOpen] = useState(false);
  const [profile, setProfile] = useState<{ display_name: string; current_weight_kg: number | null; target_weight_kg: number | null } | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [workoutLogged, setWorkoutLogged] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loggingWorkout, setLoggingWorkout] = useState(false);
  const [weightLogOpen, setWeightLogOpen] = useState(false);
  const [weightLogs, setWeightLogs] = useState<Array<{ weight_kg: number; logged_at: string }>>([]);
  const [workoutCount, setWorkoutCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("user_preferences").select("display_name,current_weight_kg,target_weight_kg").maybeSingle(),
      supabase.from("body_logs").select("weight_kg,logged_at").order("logged_at", { ascending: false }).limit(30),
      supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("status", "completed"),
    ]).then(([preferences, logs, sessions]) => {
      setProfile(preferences.data);
      setWeightLogs(logs.data || []);
      setWorkoutCount(sessions.count || 0);
      setProfileLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!timer) return;
    const interval = window.setInterval(() => setTimer((value) => Math.max(value - 1, 0)), 1000);
    return () => window.clearInterval(interval);
  }, [timer]);

  const toggleExercise = (name: string) => {
    const next = completed.includes(name) ? completed.filter((item) => item !== name) : [...completed, name];
    setCompleted(next);
    setTimer(90);
    setTimerOpen(true);
  };

  const finishWorkout = async () => {
    if (completed.length !== exercises.length || loggingWorkout || workoutLogged) return;
    setLoggingWorkout(true);
    setSaveError("");
    try {
      await logWorkout("Upper body strength", exercises.map((exercise, index) => ({ exercise_name: exercise.name, set_number: index + 1, reps: 8, weight_kg: Number.parseInt(exercise.load, 10) })));
      setWorkoutLogged(true);
      setWorkoutCount((count) => count + 1);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save workout.");
    } finally {
      setLoggingWorkout(false);
    }
  };

  const formatTimer = (value: number) => `${Math.floor(value / 60).toString().padStart(2, "0")}:${(value % 60).toString().padStart(2, "0")}`;

  if (!profileLoaded) return <main className="auth-shell"><LoaderCircle className="spin" color="var(--lime)" /></main>;

  if (!profile) return <main className="onboarding-backdrop"><section className="onboarding-card"><p className="eyebrow">First, make it yours</p><h2>Tell us where you&apos;re starting.</h2><p>We&apos;ll use this to make your first training plan and pace-to-goal estimate.</p><form action={savePreferences}><div className="onboarding-grid"><label>Name<input name="display_name" required placeholder="Jordan" /></label><label>Current weight (kg)<input name="current_weight_kg" type="number" min="1" step="0.1" required placeholder="82.4" /></label><label>Goal<select name="goal_type" defaultValue="maintain"><option value="lose_weight">Lose weight</option><option value="gain_weight">Gain weight</option><option value="gain_muscle">Gain muscle</option><option value="maintain">Maintain</option><option value="recomp">Recomp</option></select></label><label>Target weight (kg)<input name="target_weight_kg" type="number" min="1" step="0.1" placeholder="78.2" /></label><label>Training days<select name="training_days" defaultValue="3"><option value="2">2 days</option><option value="3">3 days</option><option value="4">4 days</option><option value="5">5 days</option><option value="6">6 days</option></select></label><label>Experience<select name="experience_level" defaultValue="beginner"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label></div><button className="primary-button onboarding-submit" type="submit">Build my starting plan <ArrowUpRight size={16} /></button></form></section></main>;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Zap size={17} fill="currentColor" /></div><span>fittrack<span className="brand-accent">pro</span></span></div>
        <nav className="side-nav" aria-label="Primary navigation">
          <a className="nav-item active" href="#dashboard"><Home size={18} />Overview</a>
          <a className="nav-item" href="#workout"><Dumbbell size={18} />My workouts</a>
          <a className="nav-item" href="#progress"><BarChart3 size={18} />Progress</a>
          <a className="nav-item" href="#library"><LayoutGrid size={18} />Exercise library</a>
        </nav>
        <div className="sidebar-bottom">
          <a className="nav-item" href="#settings"><Settings2 size={18} />Settings</a>
          <div className="profile-chip"><div className="avatar">JS</div><div><strong>Jordan Smith</strong><span>Intermediate</span></div><MoreHorizontal size={17} /></div>
        </div>
      </aside>

      <section className="main-content" id="dashboard">
        <header className="topbar"><div><p className="eyebrow">{new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date())}</p><h1>Good morning, {profile?.display_name || "Athlete"} <span className="wave">✦</span></h1></div><div className="top-actions"><button className="icon-button" aria-label="Help"><CircleHelp size={19} /></button><button className="icon-button notification" aria-label="Notifications"><Bell size={19} /><i /></button><button className="profile-menu-button" onClick={() => signOut()} title="Sign out"><div className="avatar avatar-top">{(profile?.display_name || "A").slice(0, 2).toUpperCase()}</div></button></div></header>

        <div className="content-grid">
          <div className="primary-column">
            <section className="hero-panel">
              <div className="hero-copy"><div className="section-kicker"><span className="live-dot" />Today&apos;s workout</div><h2>Upper body<br /><em>strength</em></h2><p>Build power across your chest, back, and shoulders.</p><button className="primary-button" onClick={() => document.getElementById("workout")?.scrollIntoView({ behavior: "smooth" })}><Play size={16} fill="currentColor" />Start workout <ArrowUpRight size={16} /></button></div>
              <div className="hero-art"><div className="ring ring-one" /><div className="ring ring-two" /><div className="hero-stat"><strong>04</strong><span>exercises</span></div><div className="hero-stat second"><strong>45<span>m</span></strong><span>estimated</span></div></div>
            </section>

            <section className="section-block" id="workout"><div className="section-heading"><div><p className="eyebrow">Your plan</p><h3>Upper body strength</h3></div><button className="text-button">View full plan <ChevronRight size={15} /></button></div><div className="exercise-list">{exercises.map((exercise) => { const isDone = completed.includes(exercise.name); return <button className={`exercise-row ${isDone ? "is-done" : ""}`} key={exercise.name} onClick={() => toggleExercise(exercise.name)}><div className="exercise-icon">{isDone ? <Check size={18} /> : exercise.icon}</div><div className="exercise-info"><strong>{exercise.name}</strong><span>{exercise.detail}</span></div><div className="exercise-load"><span>Last time</span><strong>{exercise.load}</strong></div><div className="row-check">{isDone ? <Check size={15} /> : <Plus size={16} />}</div></button>; })}</div><button className="add-exercise"><Plus size={16} /> Add exercise</button>{completed.length === exercises.length && <><button className="primary-button finish-workout" onClick={finishWorkout} disabled={loggingWorkout || workoutLogged}>{loggingWorkout ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}{workoutLogged ? "Workout saved" : "Finish workout"}</button>{saveError && <p className="form-error workout-error">{saveError}</p>}</>}</section>

            <section className="section-block progress-block" id="progress"><div className="section-heading"><div><p className="eyebrow">Consistency</p><h3>This week</h3></div><span className="muted-label">2 of 4 sessions</span></div><div className="week-strip">{week.map((item) => <div className={`day ${item.state}`} key={`${item.day}-${item.date}`}><span>{item.day}</span><strong>{item.date}</strong><i>{item.state === "done" ? <Check size={13} /> : item.state === "today" ? <span /> : null}</i></div>)}</div></section>
          </div>

          <aside className="secondary-column">
            <section className="metric-card pace-card"><div className="card-top"><div><p className="eyebrow">Goal pace</p><h3>{profile?.target_weight_kg ? "On track" : "Add a target"}</h3></div><div className="pace-icon"><ArrowUpRight size={18} /></div></div><div className="pace-number"><strong>{profile?.current_weight_kg && profile?.target_weight_kg ? `−${Math.abs(profile.current_weight_kg - profile.target_weight_kg).toFixed(1)}` : "—"}</strong><span>kg to goal</span></div><div className="pace-bar"><span /></div><div className="pace-meta"><span>{profile?.current_weight_kg ? `${profile.current_weight_kg} kg` : "No weight yet"}</span><span>{profile?.target_weight_kg ? `Target ${profile.target_weight_kg} kg` : "Set target"}</span></div><p className="supporting-copy">Log your weight regularly and FitTrack will replace this estimate with your actual trend.</p><button className="card-link">View progress <ChevronRight size={15} /></button></section>

            <section className="metric-card stats-card"><div className="card-top"><div><p className="eyebrow">Your momentum</p><h3>{workoutCount ? "Looking strong" : "Start your streak"}</h3></div><Flame className="flame" size={20} fill="currentColor" /></div><div className="stat-grid"><div><strong>{workoutCount}</strong><span>workouts</span></div><div><strong>{weightLogs.length}</strong><span>weigh-ins</span></div><div><strong>{completed.length}<span>/3</span></strong><span>today</span></div></div><div className="mini-chart"><div className="chart-label"><span>Weight trend</span><span>{weightLogs.length > 1 ? `${(weightLogs[0].weight_kg - weightLogs[weightLogs.length - 1].weight_kg).toFixed(1)} kg` : "No trend yet"} <small>logged</small></span></div><svg viewBox="0 0 300 54" preserveAspectRatio="none" role="img" aria-label="Weight trend"><path d="M0 35 C25 28, 33 38, 55 31 S81 36, 103 27 S130 34, 152 22 S172 28, 197 25 S220 31, 244 20 S273 25, 300 15" fill="none" stroke="currentColor" strokeWidth="2.5" /><circle cx="300" cy="15" r="3.5" fill="currentColor" /></svg></div></section>

            <section className="metric-card nutrition-card"><div className="card-top"><div><p className="eyebrow">Body check-in</p><h3>{profile?.current_weight_kg || "—"} <small>kg current</small></h3></div><button className="pace-icon" onClick={() => setWeightLogOpen(!weightLogOpen)} aria-label="Log body weight"><Plus size={18} /></button></div>{weightLogOpen ? <form className="weight-form" action={logBodyWeight} onSubmit={() => setWeightLogOpen(false)}><input name="weight_kg" type="number" step="0.1" min="1" placeholder="82.4" required /><button className="primary-button" type="submit">Save weight</button></form> : <><div className="macro-bars"><div><span>Latest weigh-in <b>{weightLogs[0]?.logged_at || "Not logged"}</b></span><i><b style={{ width: weightLogs.length ? "78%" : "8%" }} /></i></div><div><span>Goal target <b>{profile?.target_weight_kg ? `${profile.target_weight_kg} kg` : "Not set"}</b></span><i><b style={{ width: profile?.target_weight_kg ? "62%" : "8%" }} /></i></div></div><button className="card-link" onClick={() => setWeightLogOpen(true)}>Log today&apos;s weight <ChevronRight size={15} /></button></>}</section>

            <section className="activity-panel"><div className="section-heading"><div><p className="eyebrow">Recent wins</p><h3>Activity</h3></div><button className="more-button" aria-label="More activity"><MoreHorizontal size={18} /></button></div><div className="activity-item"><div className="activity-icon yellow"><Trophy size={15} /></div><div><strong>New personal best</strong><span>Bench press · 60 kg × 8</span></div><time>Today</time></div><div className="activity-item"><div className="activity-icon green"><Footprints size={15} /></div><div><strong>Workout complete</strong><span>Lower body · 42 min</span></div><time>Yesterday</time></div></section>
          </aside>
        </div>
      </section>

      <nav className="mobile-nav"><a className="active" href="#dashboard"><Home size={19} /><span>Home</span></a><a href="#workout"><Dumbbell size={19} /><span>Train</span></a><a className="mobile-add" href="#workout"><Plus size={23} /></a><a href="#progress"><BarChart3 size={19} /><span>Progress</span></a><a href="#settings"><UserRound size={19} /><span>Profile</span></a></nav>
      {timerOpen && <div className="timer-pill"><TimerReset size={16} /><span>Rest timer</span><strong>{formatTimer(timer)}</strong><button onClick={() => { setTimer(0); setTimerOpen(false); }} aria-label="Close timer"><X size={15} /></button></div>}
    </main>
  );
}
