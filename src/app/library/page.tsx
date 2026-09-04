"use client";

import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PageFrame } from "@/components/page-frame";

type Exercise = { id: string; name: string; primary_muscle: string; equipment: string; difficulty: string; cues: string[] };

export default function LibraryPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState("");
  useEffect(() => { createClient().from("exercises").select("id,name,primary_muscle,equipment,difficulty,cues").order("name").then(({ data }) => setExercises(data || [])); }, []);
  const filtered = exercises.filter((exercise) => `${exercise.name} ${exercise.primary_muscle} ${exercise.equipment}`.toLowerCase().includes(query.toLowerCase()));
  return <PageFrame eyebrow="Discover movement" title="Exercise library"><div className="library-toolbar"><div className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exercises, muscles, equipment" /></div><button className="icon-button"><SlidersHorizontal size={18} /></button></div><div className="library-grid">{filtered.map((exercise) => <article className="exercise-card" key={exercise.id}><div className="exercise-card-art"><span>{exercise.primary_muscle.slice(0, 2).toUpperCase()}</span><button aria-label={`Save ${exercise.name}`}><Star size={16} /></button></div><div className="exercise-card-copy"><div><p className="eyebrow">{exercise.equipment.replace("_", " ")} · {exercise.difficulty}</p><h3>{exercise.name}</h3></div><p>{exercise.cues?.join(" · ")}</p></div></article>)}</div>{!filtered.length && <p className="empty-state">No exercises found. Run the Supabase exercise seed migration first.</p>}</PageFrame>;
}
