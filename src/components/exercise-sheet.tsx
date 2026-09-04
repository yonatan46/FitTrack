"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { ExerciseDemo } from "./exercise-demo";

export type SheetExercise = {
  name: string;
  primary_muscle?: string | null;
  secondary_muscles?: string[] | null;
  equipment?: string | null;
  equipment_name?: string | null;
  difficulty?: string | null;
  mechanic?: string | null;
  instructions?: string[] | null;
  image_url: string | null;
  image_url_2: string | null;
};

/** In-app exercise detail: the two-frame demo + numbered instructions. */
export function ExerciseSheet({ exercise, onClose }: { exercise: SheetExercise; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const meta = [
    exercise.equipment_name || exercise.equipment?.replace("_", " "),
    exercise.difficulty,
    exercise.mechanic,
  ].filter(Boolean).join(" · ");

  const secondary = exercise.secondary_muscles ?? [];

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="exercise-sheet" role="dialog" aria-modal="true" aria-labelledby="exercise-sheet-title" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <ExerciseDemo start={exercise.image_url} end={exercise.image_url_2} alt={exercise.name} size="detail" />
        {meta && <p className="eyebrow">{meta}</p>}
        <h2 id="exercise-sheet-title">{exercise.name}</h2>
        {(exercise.primary_muscle || secondary.length > 0) && (
          <div className="chip-row">
            {exercise.primary_muscle && <span className="muscle-chip">{exercise.primary_muscle}</span>}
            {secondary.map((item) => <span key={item} className="muscle-chip ghost">{item}</span>)}
          </div>
        )}
        <h4>How to do it</h4>
        {exercise.instructions?.length
          ? <ol className="instr-list">{exercise.instructions.map((step, index) => <li key={index}>{step}</li>)}</ol>
          : <p className="instr-empty">No steps recorded for this exercise yet.</p>}
      </div>
    </div>
  );
}
