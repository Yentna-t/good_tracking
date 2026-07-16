import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmojiCue } from "./EmojiCue";

describe("EmojiCue", () => {
  it("renders a decorative emoji without changing the accessible label", () => {
    render(<h2><EmojiCue symbol="⚡" variant="section" /><span>Energy balance</span></h2>);

    expect(screen.getByText("⚡")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("heading", { name: "Energy balance" })).toBeInTheDocument();
  });
});
