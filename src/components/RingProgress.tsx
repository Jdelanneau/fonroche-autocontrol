"use client";

import { useId } from "react";

export function RingProgress({
  percent,
  size = 46,
  strokeWidth = 4
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
}) {
  const gradId = `gradSun-${useId()}`;
  const r = (size - strokeWidth) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - (percent || 0) / 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block shrink-0">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFB238" />
          <stop offset="100%" stopColor="#FF7A3D" />
        </linearGradient>
      </defs>
      <circle cx={c} cy={c} r={r} fill="none" stroke="#333C44" strokeWidth={strokeWidth} />
      <circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference.toFixed(1)}
        strokeDashoffset={offset.toFixed(1)}
        transform={`rotate(-90 ${c} ${c})`}
      />
      <text
        x={c}
        y={c + 4}
        textAnchor="middle"
        fontSize={size * 0.26}
        fill="#F4F6F7"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {percent || 0}%
      </text>
    </svg>
  );
}
