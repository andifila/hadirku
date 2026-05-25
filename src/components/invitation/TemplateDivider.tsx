"use client";

import { Heart } from "lucide-react";
import { TEMPLATE_EXTRAS } from "./template-config";

export function TemplateDivider({ templateSlug, color, borderColor }: {
  templateSlug: string; color: string; borderColor: string;
}) {
  const extra = TEMPLATE_EXTRAS[templateSlug] ?? TEMPLATE_EXTRAS["rustic-gold"];
  switch (extra.divider) {
    case "geometric":
      return (
        <div className="flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: borderColor }} />
          <div className="h-2 w-2 rotate-45" style={{ background: color }} />
          <div className="h-px flex-1" style={{ background: borderColor }} />
        </div>
      );
    case "dots":
      return (
        <div className="flex items-center gap-2">
          <div className="h-px flex-1" style={{ background: borderColor }} />
          <span className="h-1 w-1 rounded-full" style={{ background: color }} />
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
          <span className="h-1 w-1 rounded-full" style={{ background: color }} />
          <div className="h-px flex-1" style={{ background: borderColor }} />
        </div>
      );
    case "floral":
      return (
        <div className="flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: borderColor }} />
          <Heart className="h-3.5 w-3.5 flex-shrink-0" style={{ color }} fill="currentColor" />
          <div className="h-px flex-1" style={{ background: borderColor }} />
        </div>
      );
    case "diamond":
    default:
      return (
        <div className="flex items-center gap-4">
          <div className="h-px flex-1" style={{ background: borderColor }} />
          <Heart className="h-4 w-4 flex-shrink-0" style={{ color }} fill="currentColor" />
          <div className="h-px flex-1" style={{ background: borderColor }} />
        </div>
      );
  }
}
