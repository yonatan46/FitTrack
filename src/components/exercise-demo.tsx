"use client";

import { useEffect, useState } from "react";

/**
 * Two-frame exercise demo (start position + end position) that alternates to
 * fake a GIF. Images are served locally from /public/exercises.
 *
 * `interactive` (default true) makes the frame tap-to-pause. Set it to false
 * when the demo sits inside another button (e.g. a library card).
 */
export function ExerciseDemo({
  start,
  end,
  alt,
  size = "card",
  interactive = true,
}: {
  start: string | null;
  end: string | null;
  alt: string;
  size?: "card" | "detail";
  interactive?: boolean;
}) {
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(true);
  const animated = !!start && !!end && end !== start;
  const canToggle = animated && interactive;

  useEffect(() => {
    if (!animated || !playing) return;
    const id = window.setInterval(() => setPhase((value) => (value === 0 ? 1 : 0)), 1150);
    return () => window.clearInterval(id);
  }, [animated, playing]);

  if (!start) {
    return (
      <div className={`exercise-demo is-${size} is-empty`} aria-label={alt}>
        <span>{alt.slice(0, 2).toUpperCase()}</span>
      </div>
    );
  }

  return (
    <div
      className={`exercise-demo is-${size}`}
      onClick={canToggle ? () => setPlaying((value) => !value) : undefined}
      role={canToggle ? "button" : undefined}
      tabIndex={canToggle ? 0 : undefined}
      onKeyDown={canToggle ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setPlaying((value) => !value);
        }
      } : undefined}
      aria-label={canToggle ? `${alt} — tap to ${playing ? "pause" : "play"}` : alt}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={start} alt={alt} loading="lazy" decoding="async" />
      {animated && end && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={end} alt="" aria-hidden="true" style={{ opacity: phase === 1 ? 1 : 0 }} />
      )}
      {animated && <span className="demo-tag">{canToggle && !playing ? "❚❚ paused" : "● demo"}</span>}
    </div>
  );
}
