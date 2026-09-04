"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Bell, LoaderCircle, LogOut, Moon, RotateCcw, Save, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { regeneratePlan, saveSettings, signOut } from "@/app/actions";
import { PageFrame } from "@/components/page-frame";

type Prefs = {
  display_name: string;
  goal_type: string;
  target_weight_kg: number | null;
  training_days: number;
  experience_level: string;
  equipment_access: string;
};

const DEFAULTS: Prefs = {
  display_name: "",
  goal_type: "maintain",
  target_weight_kg: null,
  training_days: 3,
  experience_level: "beginner",
  equipment_access: "full_gym",
};

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    createClient()
      .from("user_preferences")
      .select("display_name,goal_type,target_weight_kg,training_days,experience_level,equipment_access")
      .maybeSingle()
      .then(({ data }) => setPrefs({ ...DEFAULTS, ...(data ?? {}) }));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await saveSettings(new FormData(event.currentTarget));
      setSaved(true);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Could not save your settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      await regeneratePlan();
      window.location.href = "/workouts";
    } catch {
      setRegenerating(false);
    }
  }

  return (
    <PageFrame eyebrow="Personalize your space" title="Settings">
      <div className="settings-grid">
        <section className="route-panel">
          <div className="section-heading">
            <div><p className="eyebrow">Profile</p><h3>Training preferences</h3></div>
            <UserRound size={18} color="var(--lime)" />
          </div>

          {!prefs ? (
            <p className="empty-state">Loading…</p>
          ) : (
            <form className="settings-form" onSubmit={handleSubmit}>
              <label>Display name
                <input name="display_name" defaultValue={prefs.display_name} placeholder="Athlete" />
              </label>
              <label>Goal
                <select name="goal_type" defaultValue={prefs.goal_type}>
                  <option value="lose_weight">Lose weight</option>
                  <option value="gain_weight">Gain weight</option>
                  <option value="gain_muscle">Gain muscle</option>
                  <option value="maintain">Maintain</option>
                  <option value="recomp">Recomp</option>
                </select>
              </label>
              <label>Target weight (kg)
                <input name="target_weight_kg" type="number" min="1" step="0.1" defaultValue={prefs.target_weight_kg ?? ""} placeholder="78.2" />
              </label>
              <label>Training days
                <select name="training_days" defaultValue={String(prefs.training_days)}>
                  {[2, 3, 4, 5, 6].map((days) => <option key={days} value={days}>{days} days per week</option>)}
                </select>
              </label>
              <label>Experience
                <select name="experience_level" defaultValue={prefs.experience_level}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
              <label>Equipment
                <select name="equipment_access" defaultValue={prefs.equipment_access}>
                  <option value="full_gym">Full gym</option>
                  <option value="home_basic">Home basics</option>
                  <option value="bodyweight">Bodyweight only</option>
                </select>
              </label>
              <p className="empty-state">Changing training days or equipment rebuilds your plan to match.</p>
              <div className="settings-actions">
                <button className="primary-button" type="submit" disabled={saving}>
                  {saving ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}
                  {saved ? "Saved" : "Save changes"}
                </button>
                <button className="ghost-button" type="button" onClick={handleRegenerate} disabled={regenerating}>
                  {regenerating ? <LoaderCircle size={14} className="spin" /> : <RotateCcw size={14} />}
                  Regenerate plan
                </button>
              </div>
              {error && <p className="form-error">{error}</p>}
            </form>
          )}
        </section>

        <section className="route-panel settings-options">
          <div className="setting-row">
            <div><strong>Dark gym mode</strong><span>The interface stays low-glare for evening sessions.</span></div>
            <Moon size={18} color="var(--lime)" />
          </div>
          <div className="setting-row">
            <div><strong>Workout reminders</strong><span>Email and push reminders will appear here.</span></div>
            <Bell size={18} color="var(--muted)" />
          </div>
          <button className="danger-button" onClick={() => signOut()}><LogOut size={16} />Sign out</button>
        </section>
      </div>
    </PageFrame>
  );
}
