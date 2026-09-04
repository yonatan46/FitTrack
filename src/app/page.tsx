"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!timer) return;
    const interval = window.setInterval(() => setTimer((value) => Math.max(value - 1, 0)), 1000);
    return () => window.clearInterval(interval);
  }, [timer]);

  const toggleExercise = (name: string) => {
    setCompleted((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
    setTimer(90);
    setTimerOpen(true);
  };

  const formatTimer = (value: number) => `${Math.floor(value / 60).toString().padStart(2, "0")}:${(value % 60).toString().padStart(2, "0")}`;

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
        <header className="topbar"><div><p className="eyebrow">Wednesday, October 14, 2026</p><h1>Good morning, Jordan <span className="wave">✦</span></h1></div><div className="top-actions"><button className="icon-button" aria-label="Help"><CircleHelp size={19} /></button><button className="icon-button notification" aria-label="Notifications"><Bell size={19} /><i /></button><div className="avatar avatar-top">JS</div></div></header>

        <div className="content-grid">
          <div className="primary-column">
            <section className="hero-panel">
              <div className="hero-copy"><div className="section-kicker"><span className="live-dot" />Today&apos;s workout</div><h2>Upper body<br /><em>strength</em></h2><p>Build power across your chest, back, and shoulders.</p><button className="primary-button" onClick={() => document.getElementById("workout")?.scrollIntoView({ behavior: "smooth" })}><Play size={16} fill="currentColor" />Start workout <ArrowUpRight size={16} /></button></div>
              <div className="hero-art"><div className="ring ring-one" /><div className="ring ring-two" /><div className="hero-stat"><strong>04</strong><span>exercises</span></div><div className="hero-stat second"><strong>45<span>m</span></strong><span>estimated</span></div></div>
            </section>

            <section className="section-block" id="workout"><div className="section-heading"><div><p className="eyebrow">Your plan</p><h3>Upper body strength</h3></div><button className="text-button">View full plan <ChevronRight size={15} /></button></div><div className="exercise-list">{exercises.map((exercise) => { const isDone = completed.includes(exercise.name); return <button className={`exercise-row ${isDone ? "is-done" : ""}`} key={exercise.name} onClick={() => toggleExercise(exercise.name)}><div className="exercise-icon">{isDone ? <Check size={18} /> : exercise.icon}</div><div className="exercise-info"><strong>{exercise.name}</strong><span>{exercise.detail}</span></div><div className="exercise-load"><span>Last time</span><strong>{exercise.load}</strong></div><div className="row-check">{isDone ? <Check size={15} /> : <Plus size={16} />}</div></button>; })}</div><button className="add-exercise"><Plus size={16} /> Add exercise</button></section>

            <section className="section-block progress-block" id="progress"><div className="section-heading"><div><p className="eyebrow">Consistency</p><h3>This week</h3></div><span className="muted-label">2 of 4 sessions</span></div><div className="week-strip">{week.map((item) => <div className={`day ${item.state}`} key={`${item.day}-${item.date}`}><span>{item.day}</span><strong>{item.date}</strong><i>{item.state === "done" ? <Check size={13} /> : item.state === "today" ? <span /> : null}</i></div>)}</div></section>
          </div>

          <aside className="secondary-column">
            <section className="metric-card pace-card"><div className="card-top"><div><p className="eyebrow">Goal pace</p><h3>On track</h3></div><div className="pace-icon"><ArrowUpRight size={18} /></div></div><div className="pace-number"><strong>−4.2</strong><span>kg to goal</span></div><div className="pace-bar"><span /></div><div className="pace-meta"><span>82.4 kg</span><span>Target 78.2 kg</span></div><p className="supporting-copy">Your trend is right where it needs to be. Keep this rhythm and you&apos;ll reach your goal by <strong>Dec 18.</strong></p><button className="card-link">View progress <ChevronRight size={15} /></button></section>

            <section className="metric-card stats-card"><div className="card-top"><div><p className="eyebrow">Your momentum</p><h3>Looking strong</h3></div><Flame className="flame" size={20} fill="currentColor" /></div><div className="stat-grid"><div><strong>12</strong><span>day streak</span></div><div><strong>86<span>%</span></strong><span>adherence</span></div><div><strong>24</strong><span>workouts</span></div></div><div className="mini-chart"><div className="chart-label"><span>Weight trend</span><span>−0.8 kg <small>this month</small></span></div><svg viewBox="0 0 300 54" preserveAspectRatio="none" role="img" aria-label="Weight trend gradually moving down"><path d="M0 15 C25 8, 33 23, 55 20 S81 29, 103 22 S130 31, 152 29 S172 37, 197 29 S220 36, 244 33 S273 40, 300 35" fill="none" stroke="currentColor" strokeWidth="2.5" /><circle cx="300" cy="35" r="3.5" fill="currentColor" /></svg></div></section>

            <section className="metric-card nutrition-card"><div className="card-top"><div><p className="eyebrow">Today&apos;s fuel</p><h3>1,840 <small>/ 2,100 kcal</small></h3></div><Utensils size={19} /></div><div className="macro-bars"><div><span>Protein <b>138g</b></span><i><b style={{ width: "78%" }} /></i></div><div><span>Carbs <b>190g</b></span><i><b style={{ width: "62%" }} /></i></div><div><span>Fats <b>54g</b></span><i><b style={{ width: "48%" }} /></i></div></div></section>

            <section className="activity-panel"><div className="section-heading"><div><p className="eyebrow">Recent wins</p><h3>Activity</h3></div><button className="more-button" aria-label="More activity"><MoreHorizontal size={18} /></button></div><div className="activity-item"><div className="activity-icon yellow"><Trophy size={15} /></div><div><strong>New personal best</strong><span>Bench press · 60 kg × 8</span></div><time>Today</time></div><div className="activity-item"><div className="activity-icon green"><Footprints size={15} /></div><div><strong>Workout complete</strong><span>Lower body · 42 min</span></div><time>Yesterday</time></div></section>
          </aside>
        </div>
      </section>

      <nav className="mobile-nav"><a className="active" href="#dashboard"><Home size={19} /><span>Home</span></a><a href="#workout"><Dumbbell size={19} /><span>Train</span></a><a className="mobile-add" href="#workout"><Plus size={23} /></a><a href="#progress"><BarChart3 size={19} /><span>Progress</span></a><a href="#settings"><UserRound size={19} /><span>Profile</span></a></nav>
      {timerOpen && <div className="timer-pill"><TimerReset size={16} /><span>Rest timer</span><strong>{formatTimer(timer)}</strong><button onClick={() => { setTimer(0); setTimerOpen(false); }} aria-label="Close timer"><X size={15} /></button></div>}
    </main>
  );
}
