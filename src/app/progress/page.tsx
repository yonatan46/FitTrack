"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, CalendarDays, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logBodyWeight } from "@/app/actions";
import { PageFrame } from "@/components/page-frame";

type Log = { id: string; weight_kg: number; logged_at: string };

const W = 600;
const H = 150;
const PAD = 10;

export default function ProgressPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    createClient()
      .from("body_logs")
      .select("id,weight_kg,logged_at")
      .order("logged_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setLogs((data as Log[]) ?? []);
        setLoaded(true);
      });
  }, []);

  const asc = useMemo(() => [...logs].reverse(), [logs]);
  const newest = asc.at(-1)?.weight_kg;
  const oldest = asc[0]?.weight_kg;
  const delta = newest != null && oldest != null ? newest - oldest : null;

  const chart = useMemo(() => {
    if (asc.length < 2) return null;
    const values = asc.map((log) => log.weight_kg);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const x = (index: number) => PAD + (index / (asc.length - 1)) * (W - PAD * 2);
    const y = (value: number) => PAD + (1 - (value - min) / span) * (H - PAD * 2);
    const points = asc.map((log, index) => ({ x: x(index), y: y(log.weight_kg) }));
    const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
    const area = `${line} L${points[points.length - 1].x.toFixed(1)} ${H - PAD} L${points[0].x.toFixed(1)} ${H - PAD} Z`;
    return { line, area, points, min, max };
  }, [asc]);

  return (
    <PageFrame eyebrow="Your data" title="Progress">
      <div className="route-grid">
        <section className="route-panel progress-hero">
          <div>
            <p className="eyebrow">Weight trend</p>
            <h2>{newest != null ? `${newest} kg` : "No weigh-ins yet"}</h2>
            <p>
              {delta != null
                ? `${Math.abs(delta).toFixed(1)} kg ${delta <= 0 ? "down" : "up"} across ${asc.length} logged ${asc.length === 1 ? "entry" : "entries"}.`
                : "Log your first weigh-in to start seeing your trend."}
            </p>
          </div>
          <div className="large-trend">{delta != null && delta > 0 ? <TrendingUp size={28} /> : <TrendingDown size={28} />}</div>
        </section>

        <section className="route-panel">
          <div className="section-heading">
            <div><p className="eyebrow">Check in</p><h3>Log body weight</h3></div>
            <Scale size={19} color="var(--lime)" />
          </div>
          <form className="progress-form" action={logBodyWeight}>
            <label>Weight in kilograms
              <input name="weight_kg" type="number" min="1" step="0.1" required placeholder="82.4" />
            </label>
            <button className="primary-button" type="submit">Save weigh-in <ArrowDownRight size={16} /></button>
          </form>
        </section>

        <section className="route-panel full-width">
          <div className="section-heading">
            <div><p className="eyebrow">Visualized</p><h3>Weight over time</h3></div>
            <CalendarDays size={18} color="var(--muted)" />
          </div>
          {chart ? (
            <div className="trend-chart">
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Body weight over time">
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--lime)" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="var(--lime)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map((fraction) => (
                  <line key={fraction} className="grid-line" x1={PAD} x2={W - PAD} y1={PAD + fraction * (H - PAD * 2)} y2={PAD + fraction * (H - PAD * 2)} />
                ))}
                <path className="trend-area" d={chart.area} />
                <path className="trend-stroke" d={chart.line} />
                {chart.points.map((point, index) => (
                  <circle key={index} className="trend-dot" cx={point.x} cy={point.y} r={index === chart.points.length - 1 ? 4 : 2.5} />
                ))}
              </svg>
              <div className="trend-axis">
                <span>{asc[0].logged_at}</span>
                <span>{chart.min.toFixed(1)}–{chart.max.toFixed(1)} kg</span>
                <span>{asc.at(-1)?.logged_at}</span>
              </div>
            </div>
          ) : (
            <p className="empty-state">{loaded ? "Log at least two weigh-ins to see your chart." : "Loading…"}</p>
          )}
        </section>

        <section className="route-panel full-width">
          <div className="section-heading">
            <div><p className="eyebrow">History</p><h3>Recent weigh-ins</h3></div>
            <CalendarDays size={18} color="var(--muted)" />
          </div>
          {logs.length ? (
            <div className="weight-history">
              {logs.map((log) => (
                <div key={log.id}><span>{log.logged_at}</span><strong>{log.weight_kg} kg</strong></div>
              ))}
            </div>
          ) : (
            <p className="empty-state">Your saved weigh-ins will appear here.</p>
          )}
        </section>
      </div>
    </PageFrame>
  );
}
