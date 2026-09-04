"use client";

import { BarChart3, Dumbbell, Home, LayoutGrid, LogOut, Settings2, UserRound, Zap } from "lucide-react";
import { signOut } from "@/app/actions";

export function AppSidebar() {
  return <>
    <aside className="sidebar">
      <a className="brand" href="/"><div className="brand-mark"><Zap size={17} fill="currentColor" /></div><span>fittrack<span className="brand-accent">pro</span></span></a>
      <nav className="side-nav" aria-label="Primary navigation">
        <a className="nav-item" href="/"><Home size={18} />Overview</a>
        <a className="nav-item" href="/workouts"><Dumbbell size={18} />My workouts</a>
        <a className="nav-item" href="/progress"><BarChart3 size={18} />Progress</a>
        <a className="nav-item" href="/library"><LayoutGrid size={18} />Exercise library</a>
      </nav>
      <div className="sidebar-bottom">
        <a className="nav-item" href="/settings"><Settings2 size={18} />Settings</a>
        <button className="nav-item sign-out-link" onClick={() => signOut()}><LogOut size={18} />Sign out</button>
      </div>
    </aside>
    <nav className="mobile-nav"><a href="/"><Home size={19} /><span>Home</span></a><a href="/workouts"><Dumbbell size={19} /><span>Train</span></a><a className="mobile-add" href="/workouts"><Dumbbell size={21} /></a><a href="/progress"><BarChart3 size={19} /><span>Progress</span></a><a href="/settings"><UserRound size={19} /><span>Profile</span></a></nav>
  </>;
}
