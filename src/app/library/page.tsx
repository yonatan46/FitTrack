"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PageFrame } from "@/components/page-frame";
import { ExerciseDemo } from "@/components/exercise-demo";

type Exercise = {
  id: string;
  name: string;
  primary_muscle: string;
  secondary_muscles: string[] | null;
  equipment: string;
  equipment_name: string | null;
  difficulty: string;
  mechanic: string | null;
  instructions: string[] | null;
  image_url: string | null;
  image_url_2: string | null;
};

const MUSCLE_ORDER = ["chest", "back", "shoulders", "biceps", "triceps", "quads", "hamstrings", "glutes", "calves", "core", "traps", "forearms"];

export default function LibraryPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("all");
  const [active, setActive] = useState<Exercise | null>(null);

  useEffect(() => {
    createClient()
      .from("exercises")
      .select("id,name,primary_muscle,secondary_muscles,equipment,equipment_name,difficulty,mechanic,instructions,image_url,image_url_2")
      .order("name")
      .then(({ data }) => {
        setExercises((data as Exercise[]) ?? []);
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const muscles = useMemo(() => {
    const present = new Set(exercises.map((exercise) => exercise.primary_muscle));
    return [
      ...MUSCLE_ORDER.filter((item) => present.has(item)),
      ...[...present].filter((item) => !MUSCLE_ORDER.includes(item)).sort(),
    ];
  }, [exercises]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises
      .filter((exercise) => muscle === "all" || exercise.primary_muscle === muscle)
      .filter((exercise) =>
        !q || `${exercise.name} ${exercise.primary_muscle} ${(exercise.secondary_muscles ?? []).join(" ")} ${exercise.equipment_name ?? ""}`.toLowerCase().includes(q),
      );
  }, [exercises, muscle, query]);

  return (
    <PageFrame eyebrow="Discover movement" title="Exercise library">
      <div className="library-toolbar">
        <div className="search-field">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exercises, muscles, equipment" />
        </div>
        <select className="library-filter" value={muscle} onChange={(event) => setMuscle(event.target.value)} aria-label="Filter by muscle">
          <option value="all">All muscles</option>
          {muscles.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button className="icon-button" aria-label="Exercise filters"><SlidersHorizontal size={18} /></button>
      </div>

      <p className="library-count">{loaded ? `${filtered.length} exercise${filtered.length === 1 ? "" : "s"}` : "Loading library…"}</p>

      <div className="library-grid">
        {filtered.map((exercise) => (
          <button className="lib-card" key={exercise.id} onClick={() => setActive(exercise)}>
            <ExerciseDemo start={exercise.image_url} end={exercise.image_url_2} alt={exercise.name} size="card" interactive={false} />
            <div className="lib-card-body">
              <h3>{exercise.name}</h3>
              <p>{exercise.equipment_name || exercise.equipment.replace("_", " ")} · {exercise.difficulty}</p>
              <div className="chip-row">
                <span className="muscle-chip">{exercise.primary_muscle}</span>
                {exercise.mechanic && <span className="muscle-chip ghost">{exercise.mechanic}</span>}
              </div>
            </div>
          </button>
        ))}
      </div>

      {loaded && !filtered.length && (
        <p className="empty-state">No exercises match. Try a different muscle or search term — or run the Supabase exercise seed if the library is empty.</p>
      )}

      {active && (
        <div className="sheet-backdrop" onClick={() => setActive(null)}>
          <div className="exercise-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setActive(null)} aria-label="Close"><X size={18} /></button>
            <ExerciseDemo start={active.image_url} end={active.image_url_2} alt={active.name} size="detail" />
            <p className="eyebrow">{(active.equipment_name || active.equipment.replace("_", " "))} · {active.difficulty}{active.mechanic ? ` · ${active.mechanic}` : ""}</p>
            <h2 id="sheet-title">{active.name}</h2>
            <div className="chip-row">
              <span className="muscle-chip">{active.primary_muscle}</span>
              {(active.secondary_muscles ?? []).map((item) => <span key={item} className="muscle-chip ghost">{item}</span>)}
            </div>
            <h4>How to do it</h4>
            {active.instructions?.length
              ? <ol className="instr-list">{active.instructions.map((step, index) => <li key={index}>{step}</li>)}</ol>
              : <p className="instr-empty">No steps recorded for this exercise yet.</p>}
          </div>
        </div>
      )}
    </PageFrame>
  );
}
