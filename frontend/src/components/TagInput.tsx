import { X } from "lucide-react";
import { useState } from "react";

interface TagInputProps {
  id: string;
  label: string;
  hint: string;
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}

const clean = (value: string) => value.trim().replace(/\s+/g, " ");

export function TagInput({ id, label, hint, value, onChange, error }: TagInputProps) {
  const [draft, setDraft] = useState("");
  const addTag = (candidate: string) => {
    const tag = clean(candidate);
    if (!tag || value.some((item) => item.toLowerCase() === tag.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  };
  const removeTag = (tag: string) => onChange(value.filter((item) => item !== tag));

  return <div>
    <label htmlFor={id} className="field-label">{label}</label>
    <div className={`tag-input ${error ? "tag-input-error" : ""}`} onClick={() => document.getElementById(id)?.focus()}>
      {value.map((tag) => <span className="tag" key={tag}>{tag}<button type="button" aria-label={`Remove ${tag}`} onClick={(event) => { event.stopPropagation(); removeTag(tag); }}><X size={13} /></button></span>)}
      <input id={id} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); addTag(draft); } if (event.key === "Backspace" && !draft && value.length) removeTag(value.at(-1) as string); }} onBlur={() => addTag(draft)} placeholder={value.length ? "Add another" : "Type and press Enter"} />
    </div>
    <p className="field-hint">{hint}</p>
    {error && <p className="field-error">{error}</p>}
  </div>;
}
