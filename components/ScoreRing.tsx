"use client";

import { useId } from "react";
import type { ScoreTone } from "@/lib/score";

const TONE_COLORS: Record<ScoreTone, string> = {
  good: "#3a5bc7",
  neutral: "#a17b24",
  bad: "#b8432e",
  unknown: "#8b8577",
};

export default function ScoreRing({
  score,
  tone,
  size = 96,
  stroke = 7,
}: {
  score: number;
  tone: ScoreTone;
  size?: number;
  stroke?: number;
}) {
  const gradId = useId();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = tone === "unknown" ? 0 : score / 100;
  const color = TONE_COLORS[tone];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c99ea" />
            <stop offset="100%" stopColor="#2c49a8" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e0dcd1"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone === "good" ? `url(#${gradId})` : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-semibold leading-none"
          style={{ color, fontSize: size * 0.3 }}
        >
          {tone === "unknown" ? "\u2014" : score}
        </span>
        {size >= 80 && (
          <span className="mt-1 text-[10px] uppercase tracking-wider text-mute">
            score
          </span>
        )}
      </div>
    </div>
  );
}
