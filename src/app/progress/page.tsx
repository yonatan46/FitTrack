"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, CalendarDays, Scale, TrendingDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logBodyWeight } from "@/app/actions";
import { PageFrame } from "@/components/page-frame";

export default function ProgressPage() {
  const [logs, setLogs] = useState<Array<{ id: string; weight_kg: number; logged_at: string }>>([]);
  useEffect(() => { createClient().from("body_logs").select("id,weight_kg,logged_at").order("logged_at", { ascending: false }).limit(30).then(({ data }) => setLogs(data || [])); }, []);
  const newest = logs[0]?.weight_kg;
  const oldest = logs.at(-1)?.weight_kg;
  return <PageFrame eyebrow="Your data" title="Progress"><div className="route-grid"><section className="route-panel progress-hero"><div><p className="eyebrow">Weight trend</p><h2>{newest ? `${newest} kg` : "No weigh-ins yet"}</h2><p>{newest && oldest ? `${Math.abs(newest - oldest).toFixed(1)} kg ${newest <= oldest ? "down" : "up"} across your logged entries.` : "Log your first weigh-in to start seeing your trend."}</p></div><div className="large-trend"><TrendingDown size={28} /></div></section><section className="route-panel"><div className="section-heading"><div><p className="eyebrow">Check in</p><h3>Log body weight</h3></div><Scale size={19} color="var(--lime)" /></div><form className="progress-form" action={logBodyWeight}><label>Weight in kilograms<input name="weight_kg" type="number" min="1" step="0.1" required placeholder="82.4" /></label><button className="primary-button" type="submit">Save weigh-in <ArrowDownRight size={16} /></button></form></section><section className="route-panel full-width"><div className="section-heading"><div><p className="eyebrow">History</p><h3>Recent weigh-ins</h3></div><CalendarDays size={18} color="var(--muted)" /></div>{logs.length ? <div className="weight-history">{logs.map((log) => <div key={log.id}><span>{log.logged_at}</span><strong>{log.weight_kg} kg</strong></div>)}</div> : <p className="empty-state">Your saved weigh-ins will appear here.</p>}</section></div></PageFrame>;
}
