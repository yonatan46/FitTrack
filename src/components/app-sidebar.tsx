"use client";

import { BarChart3, Dumbbell, Home, LayoutGrid, LogOut, Settings2, UserRound, Zap } from "lucide-react";
import { signOut } from "@/app/actions";
import Link from "next/link";

export function AppSidebar() {
  return <>
    <aside className="sidebar">
      <Link className="brand" href="/"><div className="brand-mark"><Zap size={17} fill="currentColor" /></div><span>fittrack<span className="brand-accent">pro</span></span></Link>
      <nav className="side-nav" aria-label="Primary navigation">
        <Link className="nav-item" href="/"><Home size={18} />Overview</Link>
        <Link className="nav-item" href="/workouts"><Dumbbell size={18} />My workouts</Link>
        <Link className="nav-item" href="/progress"><BarChart3 size={18} />Progress</Link>
        <Link className="nav-item" href="/library"><LayoutGrid size={18} />Exercise library</Link>
      </nav>
      <div className="sidebar-bottom">
        <Link className="nav-item" href="/settings"><Settings2 size={18} />Settings</Link>
        <button className="nav-item sign-out-link" onClick={() => signOut()}><LogOut size={18} />Sign out</button>
      </div>
    </aside>
    <nav className="mobile-nav"><Link href="/"><Home size={19} /><span>Home</span></Link><Link href="/workouts"><Dumbbell size={19} /><span>Train</span></Link><Link className="mobile-add" href="/workouts"><Dumbbell size={21} /></Link><Link href="/progress"><BarChart3 size={19} /><span>Progress</span></Link><Link href="/settings"><UserRound size={19} /><span>Profile</span></Link></nav>
  </>;
}
