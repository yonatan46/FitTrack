"use client";

import { useEffect, useState } from "react";
import { Bell, LogOut, Moon, Save, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/app/actions";
import { PageFrame } from "@/components/page-frame";

export default function SettingsPage() {
  const [profile, setProfile] = useState({ display_name: "", training_days: 3, experience_level: "beginner", equipment_access: "full_gym" });
  const [saved, setSaved] = useState(false);
  useEffect(() => { createClient().from("user_preferences").select("display_name,training_days,experience_level,equipment_access").maybeSingle().then(({ data }) => data && setProfile(data)); }, []);
  async function save() { const { error } = await createClient().from("user_preferences").update(profile).eq("user_id", (await createClient().auth.getUser()).data.user?.id); if (!error) setSaved(true); }
  return <PageFrame eyebrow="Personalize your space" title="Settings"><div className="settings-grid"><section className="route-panel"><div className="section-heading"><div><p className="eyebrow">Profile</p><h3>Training preferences</h3></div><UserRound size={18} color="var(--lime)" /></div><div className="settings-form"><label>Display name<input value={profile.display_name} onChange={(event) => setProfile({ ...profile, display_name: event.target.value })} /></label><label>Training days<select value={profile.training_days} onChange={(event) => setProfile({ ...profile, training_days: Number(event.target.value) })}>{[2,3,4,5,6].map((days) => <option key={days} value={days}>{days} days per week</option>)}</select></label><label>Experience<select value={profile.experience_level} onChange={(event) => setProfile({ ...profile, experience_level: event.target.value })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label><label>Equipment<select value={profile.equipment_access} onChange={(event) => setProfile({ ...profile, equipment_access: event.target.value })}><option value="full_gym">Full gym</option><option value="home_basic">Home basics</option><option value="bodyweight">Bodyweight only</option></select></label><button className="primary-button" onClick={save}><Save size={16} />{saved ? "Saved" : "Save changes"}</button></div></section><section className="route-panel settings-options"><div className="setting-row"><div><strong>Dark gym mode</strong><span>Keep the interface low-glare for evening sessions.</span></div><Moon size={18} color="var(--lime)" /></div><div className="setting-row"><div><strong>Workout reminders</strong><span>Email and push reminders will appear here.</span></div><Bell size={18} color="var(--muted)" /></div><button className="danger-button" onClick={() => signOut()}><LogOut size={16} />Sign out</button></section></div></PageFrame>;
}
