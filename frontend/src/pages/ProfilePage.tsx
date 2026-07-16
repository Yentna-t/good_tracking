import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, BookOpen, CheckCircle2, LoaderCircle, Save, ShieldCheck, Sparkles, Target } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { TagInput } from "../components/TagInput";
import { getProfile, ProfileApiError, saveProfile } from "../lib/profileApi";
import type { HealthProfile } from "../types/profile";

const profileSchema = z.object({
  age: z.number({ invalid_type_error: "Enter your age" }).int("Use a whole number").min(13, "Age must be at least 13").max(100, "Age must be 100 or less"),
  gender: z.enum(["male", "female", "other"], { required_error: "Select a gender" }),
  height_cm: z.number({ invalid_type_error: "Enter your height" }).min(100, "Height must be at least 100 cm").max(250, "Height must be 250 cm or less"),
  weight_kg: z.number({ invalid_type_error: "Enter your weight" }).min(30, "Weight must be at least 30 kg").max(300, "Weight must be 300 kg or less"),
  goal: z.enum(["lose_weight", "maintain_weight", "gain_weight", "gain_muscle"], { required_error: "Select a health goal" }),
  activity_level: z.enum(["sedentary", "light", "moderate", "active", "very_active"], { required_error: "Select your activity level" }),
  diet_type: z.enum(["balanced", "vegetarian", "vegan", "keto", "halal", "other"], { required_error: "Select your diet type" }),
  allergies: z.array(z.string()),
  avoided_foods: z.array(z.string()),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
const defaults: ProfileFormValues = { age: undefined as unknown as number, gender: "other", height_cm: undefined as unknown as number, weight_kg: undefined as unknown as number, goal: "maintain_weight", activity_level: "moderate", diet_type: "balanced", allergies: [], avoided_foods: [] };
const goalOptions = [["lose_weight", "Lose weight", "Create a sustainable calorie deficit"], ["maintain_weight", "Maintain weight", "Keep your current weight steady"], ["gain_weight", "Gain weight", "Build toward a healthy weight increase"], ["gain_muscle", "Gain muscle", "Support training and muscle growth"]] as const;
const normalizeList = (items: string[]) => Array.from(new Map(items.map((item) => [item.trim().toLowerCase(), item.trim()])).values()).filter(Boolean);

function FieldError({ message }: { message?: string }) { return message ? <p className="field-error">{message}</p> : null; }

export function ProfilePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isExistingProfile, setIsExistingProfile] = useState(false);
  const hasLoadedProfile = useRef(false);
  const { register, control, reset, handleSubmit, setError, formState: { errors, isDirty } } = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema), defaultValues: defaults });

  const loadProfile = useCallback(async () => {
    setIsLoading(true); setLoadError("");
    try {
      const profile = await getProfile();
      if (profile) { reset(profile); setIsExistingProfile(true); } else { reset(defaults); setIsExistingProfile(false); }
    } catch { setLoadError("We could not load your health profile. Please try again."); }
    finally { setIsLoading(false); }
  }, [reset]);
  useEffect(() => {
    if (hasLoadedProfile.current) return;
    hasLoadedProfile.current = true;
    void loadProfile();
  }, [loadProfile]);

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSaving(true); setSubmitError("");
    try {
      const payload: HealthProfile = { ...values, allergies: normalizeList(values.allergies), avoided_foods: normalizeList(values.avoided_foods) };
      const saved = await saveProfile(payload);
      navigate("/dashboard", { state: { justSaved: true, profile: saved } });
    } catch (error) {
      if (error instanceof ProfileApiError) {
        Object.entries(error.fieldErrors).forEach(([field, message]) => { if (field in defaults) setError(field as keyof ProfileFormValues, { message }); });
        setSubmitError(error.status === 422 ? "Please review the highlighted fields." : error.message);
      } else setSubmitError("We could not save your profile. Please try again.");
    } finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="state-card"><LoaderCircle className="spin" size={28} /><h1>Loading your profile</h1><p>Getting your latest health information...</p></div>;
  if (loadError) return <div className="state-card"><div className="state-icon error"><ShieldCheck size={24} /></div><h1>Profile unavailable</h1><p>{loadError}</p><button className="button primary" type="button" onClick={() => void loadProfile()}>Retry <ArrowRight size={16} /></button></div>;

  return <div className="page-width">
    <div className="page-heading"><div><span className="eyebrow">YOUR FOUNDATION</span><h1>{isExistingProfile ? "Update your health profile" : "Set up your health profile"}</h1><p>Tell us a little about yourself so AICT can personalize your health journey.</p></div><div className="heading-badge"><Sparkles size={16} /> Personalized by your data</div></div>
    <div className="profile-layout"><div className="profile-form-column"><form onSubmit={handleSubmit(onSubmit)} noValidate>
      <section className="form-card"><div className="card-heading"><div className="card-number">01</div><div><h2>Personal information</h2><p>Basic information helps us understand your starting point.</p></div></div><div className="form-grid four-columns">
        <div><label className="field-label" htmlFor="age">Age</label><input id="age" className={`text-input ${errors.age ? "input-error" : ""}`} type="number" min="13" max="100" {...register("age", { valueAsNumber: true })} placeholder="e.g. 28" /><FieldError message={errors.age?.message} /></div>
        <div><label className="field-label" htmlFor="gender">Gender</label><select id="gender" className={`text-input ${errors.gender ? "input-error" : ""}`} {...register("gender")}><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select><FieldError message={errors.gender?.message} /></div>
        <div><label className="field-label" htmlFor="height_cm">Height <span>(cm)</span></label><input id="height_cm" className={`text-input ${errors.height_cm ? "input-error" : ""}`} type="number" min="100" max="250" step="0.1" {...register("height_cm", { valueAsNumber: true })} placeholder="e.g. 170" /><FieldError message={errors.height_cm?.message} /></div>
        <div><label className="field-label" htmlFor="weight_kg">Weight <span>(kg)</span></label><input id="weight_kg" className={`text-input ${errors.weight_kg ? "input-error" : ""}`} type="number" min="30" max="300" step="0.1" {...register("weight_kg", { valueAsNumber: true })} placeholder="e.g. 72.5" /><FieldError message={errors.weight_kg?.message} /></div>
      </div></section>
      <section className="form-card"><div className="card-heading"><div className="card-number">02</div><div><h2>Health goal</h2><p>Choose the direction that best matches what you want to achieve.</p></div></div><div className="goal-grid">{goalOptions.map(([value, label, description]) => <label className="goal-option" key={value}><input type="radio" value={value} {...register("goal")} /><span className="goal-radio" /><span><strong>{label}</strong><small>{description}</small></span></label>)}</div><FieldError message={errors.goal?.message} /></section>
      <section className="form-card"><div className="card-heading"><div className="card-number">03</div><div><h2>Daily preferences</h2><p>These choices help us tailor future recommendations.</p></div></div><div className="form-grid two-columns">
        <div><label className="field-label" htmlFor="activity_level">Activity level</label><select id="activity_level" className={`text-input ${errors.activity_level ? "input-error" : ""}`} {...register("activity_level")}><option value="sedentary">Sedentary — little exercise</option><option value="light">Light — 1–2 days per week</option><option value="moderate">Moderate — 3–5 days per week</option><option value="active">Active — 6–7 days per week</option><option value="very_active">Very active — hard training</option></select><FieldError message={errors.activity_level?.message} /></div>
        <div><label className="field-label" htmlFor="diet_type">Diet type</label><select id="diet_type" className={`text-input ${errors.diet_type ? "input-error" : ""}`} {...register("diet_type")}><option value="balanced">Balanced</option><option value="vegetarian">Vegetarian</option><option value="vegan">Vegan</option><option value="keto">Keto</option><option value="halal">Halal</option><option value="other">Other</option></select><FieldError message={errors.diet_type?.message} /></div>
      </div></section>
      <section className="form-card"><div className="card-heading"><div className="card-number">04</div><div><h2>Food preferences</h2><p>Optional — add foods that AICT should know about.</p></div></div><div className="form-grid two-columns"><Controller name="allergies" control={control} render={({ field }) => <TagInput id="allergies" label="Allergies" hint="Add each allergy separately." value={field.value} onChange={field.onChange} error={errors.allergies?.message} />} /><Controller name="avoided_foods" control={control} render={({ field }) => <TagInput id="avoided_foods" label="Foods to avoid" hint="Add foods you do not eat or prefer to avoid." value={field.value} onChange={field.onChange} error={errors.avoided_foods?.message} />} /></div></section>
      {submitError && <div className="alert error-alert" role="alert">{submitError}</div>}
      <div className="form-actions"><span className="privacy-note"><ShieldCheck size={16} /> Your information stays private and is used to personalize your experience.</span><button className="button primary" type="submit" disabled={isSaving}>{isSaving ? <><LoaderCircle className="spin" size={17} /> Saving...</> : <><Save size={17} /> {isDirty || !isExistingProfile ? "Save profile" : "Save changes"}</>}</button></div>
    </form></div><aside className="profile-sidebar"><section className="profile-side-card green-side-card"><div className="side-card-icon"><Target size={18} /></div><span className="eyebrow">PROFILE SETUP</span><h2>Your starting point</h2><p>Complete your profile once and AICT will use it to personalize future tracking.</p><div className="setup-progress"><span><b>1</b> Personal details</span><CheckCircle2 size={16} /></div><div className="setup-progress muted"><span><b>2</b> Calorie targets</span><small>Next phase</small></div><div className="setup-progress muted"><span><b>3</b> Daily tracking</span><small>Next phase</small></div></section><section className="profile-side-card"><div className="side-card-title"><BookOpen size={17} /><h2>What happens next?</h2></div><p>After saving, you will see a dashboard ready for calorie targets, macro planning and health diary features.</p><div className="side-tip"><Sparkles size={15} /><span>AI recommendations are estimates and do not replace professional advice.</span></div></section></aside></div>
  </div>;
}
