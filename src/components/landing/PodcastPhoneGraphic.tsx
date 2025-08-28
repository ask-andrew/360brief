import React from 'react';

export function PodcastPhoneGraphic(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="300"
      height="600"
      viewBox="0 0 300 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      aria-labelledby="podcastTitle"
      {...props}
    >
      <title id="podcastTitle">360Brief Podcast Player</title>
      {/* Phone body */}
      <rect x="20" y="20" width="260" height="560" rx="40" fill="#0F172A" stroke="#1E293B" strokeWidth="2" />

      {/* Screen */}
      <rect x="30" y="40" width="240" height="520" rx="20" fill="#0F172A" />

      {/* Screen content container */}
      <rect x="40" y="60" width="220" height="440" rx="14" fill="#0B1220" />

      {/* Status bar */}
      <g opacity="0.9">
        <text x="50" y="84" fontFamily="Inter, sans-serif" fontSize="10" fill="#94A3B8">
          9:41
        </text>
        <g transform="translate(220,72)">
          <rect x="0" y="0" width="14" height="8" rx="2" stroke="#94A3B8" fill="none" strokeWidth="1" />
          <rect x="1.5" y="1.5" width="10" height="5" rx="1" fill="#94A3B8" />
        </g>
        <g transform="translate(200,72)">
          <rect x="0" y="0" width="14" height="8" rx="2" fill="#94A3B8" />
        </g>
        <g transform="translate(180,72)">
          <rect x="0" y="0" width="14" height="8" rx="2" fill="#94A3B8" />
        </g>
      </g>

      {/* Album art card */}
      <g>
        <rect x="55" y="96" width="190" height="190" rx="16" fill="url(#gradArt)" />
        {/* Subtle overlay and logo */}
        <rect x="55" y="96" width="190" height="190" rx="16" fill="#000" fillOpacity="0.12" />
        {/* Exact 360Brief logo (works inline) */}
        <image href="/images/360logo.svg" x="90" y="131" width="120" height="120" preserveAspectRatio="xMidYMid meet" />
      </g>

      {/* Episode title and show name */}
      <text x="60" y="312" fontFamily="Inter, sans-serif" fontSize="14" fill="#E5E7EB" fontWeight={600 as any}>
        Multiply Time: Inbox to Insight
      </text>
      <text x="60" y="332" fontFamily="Inter, sans-serif" fontSize="12" fill="#9CA3AF">
        360Brief • Executive Signals
      </text>

      {/* Progress bar with knob */}
      <rect x="60" y="360" width="180" height="4" rx="2" fill="#1F2937" />
      <rect x="60" y="360" width="84" height="4" rx="2" fill="#0EA5E9" />
      <circle cx="144" cy="362" r="6" fill="#0EA5E9" stroke="#93C5FD" strokeWidth="1" />
      <text x="60" y="378" fontFamily="Inter, sans-serif" fontSize="11" fill="#9CA3AF">
        1:24
      </text>
      <text x="240" y="378" textAnchor="end" fontFamily="Inter, sans-serif" fontSize="11" fill="#9CA3AF">
        4:37
      </text>

      {/* Playback controls */}
      <g transform="translate(60,400)">
        {/* Back 15 */}
        <circle cx="30" cy="30" r="22" fill="#111827" />
        <path d="M38 22L22 30L38 38V22Z" fill="#9CA3AF" />
      </g>
      <g transform="translate(120,392)">
        {/* Play/Pause */}
        <circle cx="30" cy="38" r="30" fill="#0EA5E9" />
        <rect x="22" y="24" width="6" height="28" rx="2" fill="#0B1220" />
        <rect x="32" y="24" width="6" height="28" rx="2" fill="#0B1220" />
      </g>
      <g transform="translate(180,400)">
        {/* Forward 15 */}
        <circle cx="30" cy="30" r="22" fill="#111827" />
        <path d="M22 22L38 30L22 38V22Z" fill="#9CA3AF" />
      </g>

      {/* Phone notch */}
      <rect x="120" y="20" width="60" height="20" rx="10" fill="#0F172A" />
      <rect x="125" y="25" width="50" height="10" rx="5" fill="#1E293B" />

      {/* Side buttons */}
      <rect x="280" y="80" width="15" height="60" rx="5" fill="#1E293B" />
      <rect x="280" y="160" width="15" height="100" rx="5" fill="#1E293B" />
      <rect x="5" y="100" width="15" height="40" rx="5" fill="#1E293B" />

      {/* Screen reflection */}
      <path d="M270 40L40 40L40 60L270 60L270 40Z" fill="white" fillOpacity="0.03" />
      <path d="M40 40L40 60L30 60L30 40L40 40Z" fill="white" fillOpacity="0.05" />
      <path d="M40 40L30 40L30 50L40 50L40 40Z" fill="white" fillOpacity="0.02" />

      {/* Gradients */}
      <defs>
        <linearGradient id="gradArt" x1="55" y1="96" x2="245" y2="286" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5" />
          <stop offset="1" stopColor="#EC4899" />
        </linearGradient>
      </defs>
    </svg>
  );
}
