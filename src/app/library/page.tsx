"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Search, SlidersHorizontal, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PageFrame } from "@/components/page-frame";

type Exercise = { id: string; name: string; primary_muscle: string; equipment: string; difficulty: string; cues: string[]; image_url: string | null; video_url: string | null };

export default function LibraryPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("all");
  useEffect(() => { createClient().from("exercises").select("id,name,primary_muscle,equipment,difficulty,cues,image_url,video_url").order("name").then(({ data }) => setExercises(data || [])); }, []);
  const filtered = exercises.filter((exercise) => muscle === "all" || exercise.primary_muscle === muscle).filter((exercise) => `${exercise.name} ${exercise.primary_muscle} ${exercise.equipment}`.toLowerCase().includes(query.toLowerCase()));
  const muscles = [...new Set(exercises.map((exercise) => exercise.primary_muscle))];
  return <PageFrame eyebrow="Discover movement" title="Exercise library"><div className="library-toolbar"><div className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exercises, muscles, equipment" /></div><select className="library-filter" value={muscle} onChange={(event) => setMuscle(event.target.value)} aria-label="Filter by muscle"><option value="all">All muscles</option>{muscles.map((item) => <option key={item} value={item}>{item}</option>)}</select><button className="icon-button" aria-label="Exercise filters"><SlidersHorizontal size={18} /></button></div><p className="library-count">{filtered.length} exercises available</p><div className="library-grid">{filtered.map((exercise) => <article className="exercise-card" key={exercise.id}><div className="exercise-card-art" style={exercise.image_url ? { backgroundImage: `linear-gradient(180deg, rgba(13,16,12,.08), rgba(13,16,12,.75)), url(${exercise.image_url})` } : undefined}><span>{exercise.primary_muscle.slice(0, 2).toUpperCase()}</span><button aria-label={`Save ${exercise.name}`}><Star size={16} /></button></div><div className="exercise-card-copy"><div><p className="eyebrow">{exercise.equipment.replace("_", " ")} · {exercise.difficulty}</p><h3>{exercise.name}</h3></div><p>{exercise.cues?.join(" · ")}</p><a className="demo-link" href={exercise.video_url || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.name} form`)}`} target="_blank" rel="noreferrer">Watch form demo <ExternalLink size={13} /></a></div></article>)}</div>{!filtered.length && <p className="empty-state">No exercises found. Run the Supabase exercise seed migration first.</p>}</PageFrame>;
}
