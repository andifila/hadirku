export type TemplateExtra = {
  divider: "line" | "diamond" | "dots" | "floral" | "geometric";
  headingWeight: 700 | 600;
  headingLetterSpacing: string;
  bgPattern: string;
  countdownStyle: "text" | "box" | "pill";
  heroSeparator: "heart" | "line" | "star" | "bloom";
  sectionOrnament: "line" | "diamond" | "leaf" | "crown" | "bloom";
};

export type TemplateTheme = {
  primary: string;
  muted: string;
  border: string;
  gradient: string;
};

export const TEMPLATE_EXTRAS: Record<string, TemplateExtra> = {
  "garden-bloom":   { divider: "floral",    headingWeight: 600, headingLetterSpacing: "0em",    bgPattern: "none", countdownStyle: "box",  heroSeparator: "bloom", sectionOrnament: "leaf"    },
  "rustic-gold":    { divider: "diamond",   headingWeight: 700, headingLetterSpacing: "-0.01em", bgPattern: "none", countdownStyle: "box",  heroSeparator: "heart", sectionOrnament: "diamond" },
  "modern-minimal": { divider: "geometric", headingWeight: 700, headingLetterSpacing: "-0.02em", bgPattern: "none", countdownStyle: "text", heroSeparator: "line",  sectionOrnament: "line"    },
  "royal-elegance": { divider: "dots",      headingWeight: 700, headingLetterSpacing: "0.01em",  bgPattern: "none", countdownStyle: "pill", heroSeparator: "star",  sectionOrnament: "crown"   },
  "floral-dream":   { divider: "floral",    headingWeight: 600, headingLetterSpacing: "0.01em",  bgPattern: "none", countdownStyle: "pill", heroSeparator: "bloom", sectionOrnament: "bloom"   },
};

export const TEMPLATE_THEMES: Record<string, TemplateTheme> = {
  "garden-bloom":   { primary: "#4a7c59", muted: "#e4ede6", border: "#b8d4be", gradient: "linear-gradient(135deg, #4a7c59 0%, #3a6347 100%)" },
  "rustic-gold":    { primary: "#b08d57", muted: "#ece8e0", border: "#e0dbd2", gradient: "linear-gradient(135deg, #b08d57 0%, #9a7040 100%)" },
  "modern-minimal": { primary: "#1a1a1a", muted: "#f0f0f0", border: "#dcdcdc", gradient: "linear-gradient(135deg, #333333 0%, #1a1a1a 100%)" },
  "royal-elegance": { primary: "#6b35a3", muted: "#ede8f5", border: "#c8b0e8", gradient: "linear-gradient(135deg, #6b35a3 0%, #582d8a 100%)" },
  "floral-dream":   { primary: "#c06080", muted: "#f5e8ee", border: "#e8b8c8", gradient: "linear-gradient(135deg, #c06080 0%, #a84e6b 100%)" },
};

export function resolveTheme(templateSlug: string | null | undefined, primaryColor?: string | null): TemplateTheme {
  const base = TEMPLATE_THEMES[templateSlug ?? "rustic-gold"] ?? TEMPLATE_THEMES["rustic-gold"];
  return primaryColor ? { ...base, primary: primaryColor } : base;
}

export function resolveExtra(templateSlug: string | null | undefined): TemplateExtra {
  return TEMPLATE_EXTRAS[templateSlug ?? "rustic-gold"] ?? TEMPLATE_EXTRAS["rustic-gold"];
}
