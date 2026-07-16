type EmojiCueProps = {
  symbol: string;
  variant?: "inline" | "section";
  className?: string;
};

export function EmojiCue({ symbol, variant = "inline", className = "" }: EmojiCueProps) {
  const classes = ["emoji-cue", `emoji-cue--${variant}`, className].filter(Boolean).join(" ");
  return <span className={classes} aria-hidden="true">{symbol}</span>;
}
