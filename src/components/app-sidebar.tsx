"use client";

import { BarChart3, Dumbbell, Home, LayoutGrid, LogOut, Plus, Settings2, UserRound, Zap } from "lucide-react";
import { signOut } from "@/app/actions";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/workouts", label: "My workouts", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/library", label: "Exercise library", icon: LayoutGrid },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <aside className="sidebar">
        <Link className="brand" href="/"><div className="brand-mark"><Zap size={17} fill="currentColor" /></div><span>fittrack<span className="brand-accent">pro</span></span></Link>
        <nav className="side-nav" aria-label="Primary navigation">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} className={`nav-item ${isActive(href) ? "active" : ""}`} href={href}>
              <Icon size={18} />{label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link className={`nav-item ${isActive("/settings") ? "active" : ""}`} href="/settings"><Settings2 size={18} />Settings</Link>
          <button className="nav-item sign-out-link" onClick={() => signOut()}><LogOut size={18} />Sign out</button>
        </div>
      </aside>
      <nav className="mobile-nav">
        <Link className={isActive("/") ? "active" : ""} href="/"><Home size={19} /><span>Home</span></Link>
        <Link className={isActive("/workouts") ? "active" : ""} href="/workouts"><Dumbbell size={19} /><span>Train</span></Link>
        <Link className="mobile-add" href="/workouts"><Plus size={21} /></Link>
        <Link className={isActive("/progress") ? "active" : ""} href="/progress"><BarChart3 size={19} /><span>Progress</span></Link>
        <Link className={isActive("/settings") ? "active" : ""} href="/settings"><UserRound size={19} /><span>Profile</span></Link>
      </nav>
    </>
  );
}
