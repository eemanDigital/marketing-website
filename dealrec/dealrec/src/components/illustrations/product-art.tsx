import type { SVGProps } from "react";

type ArtProps = SVGProps<SVGSVGElement> & { title?: string };

function SvgBase({
  title,
  children,
  ...props
}: ArtProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : "presentation"}
      aria-label={title}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function ShieldDocumentArt(props: ArtProps) {
  return (
    <SvgBase title={props.title ?? "Secured agreement"} {...props}>
      <defs>
        <linearGradient id="sd-violet" x1="40" y1="20" x2="130" y2="140" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C9B8FF" />
          <stop offset="1" stopColor="#7C5CFF" />
        </linearGradient>
        <linearGradient id="sd-paper" x1="70" y1="35" x2="120" y2="130" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F1EDFF" />
        </linearGradient>
        <linearGradient id="sd-sky" x1="95" y1="95" x2="125" y2="130" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BFE6FF" />
          <stop offset="1" stopColor="#2E97D6" />
        </linearGradient>
        <filter id="sd-shadow" x="20" y="10" width="120" height="150" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#3B2B7A" floodOpacity="0.18" />
        </filter>
      </defs>
      <g filter="url(#sd-shadow)">
        <path d="M80 18L126 36V78C126 106.5 106.8 128.2 80 142C53.2 128.2 34 106.5 34 78V36L80 18Z" fill="url(#sd-violet)" />
        <path d="M80 18L126 36V78C126 106.5 106.8 128.2 80 142C53.2 128.2 34 106.5 34 78V36L80 18Z" stroke="#FFFFFF" strokeOpacity="0.35" />
      </g>
      <rect x="58" y="44" width="44" height="60" rx="8" fill="url(#sd-paper)" />
      <rect x="66" y="56" width="22" height="4" rx="2" fill="#CFC6E8" />
      <rect x="66" y="66" width="28" height="4" rx="2" fill="#E3DEF2" />
      <rect x="66" y="76" width="24" height="4" rx="2" fill="#E3DEF2" />
      <rect x="66" y="86" width="18" height="4" rx="2" fill="#E3DEF2" />
      <circle cx="104" cy="106" r="16" fill="url(#sd-sky)" />
      <path d="M97 106.5L102 111.5L112 100.5" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </SvgBase>
  );
}

export function SealedDocumentArt(props: ArtProps) {
  return (
    <SvgBase title={props.title ?? "Sealed document"} {...props}>
      <defs>
        <linearGradient id="seal-doc" x1="45" y1="20" x2="120" y2="145" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#EAF7FF" />
        </linearGradient>
        <linearGradient id="seal-badge" x1="88" y1="88" x2="128" y2="128" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9FD8FF" />
          <stop offset="1" stopColor="#2E97D6" />
        </linearGradient>
        <filter id="seal-shadow" x="30" y="15" width="110" height="140" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#155E8A" floodOpacity="0.16" />
        </filter>
      </defs>
      <g filter="url(#seal-shadow)">
        <rect x="44" y="24" width="64" height="94" rx="12" fill="url(#seal-doc)" />
      </g>
      <path d="M92 24H108V40H92V24Z" fill="#D7EAF8" />
      <rect x="56" y="48" width="30" height="5" rx="2.5" fill="#CFE3F2" />
      <rect x="56" y="60" width="40" height="5" rx="2.5" fill="#E3EEF7" />
      <rect x="56" y="72" width="36" height="5" rx="2.5" fill="#E3EEF7" />
      <rect x="56" y="84" width="26" height="5" rx="2.5" fill="#E3EEF7" />
      <circle cx="108" cy="108" r="18" fill="url(#seal-badge)" />
      <path d="M100 108.5L106 114.5L117 102.5" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="108" cy="108" r="11" stroke="white" strokeOpacity="0.5" strokeWidth="2" />
    </SvgBase>
  );
}

export function PadlockArt(props: ArtProps) {
  return (
    <SvgBase title={props.title ?? "Secure"} {...props}>
      <defs>
        <linearGradient id="lock-body" x1="50" y1="70" x2="110" y2="130" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D8CCFF" />
          <stop offset="1" stopColor="#7C5CFF" />
        </linearGradient>
      </defs>
      <rect x="36" y="42" width="88" height="88" rx="28" fill="#F3EFFf" />
      <path d="M58 78V66C58 53.85 67.85 44 80 44C92.15 44 102 53.85 102 66V78" stroke="#A892FF" strokeWidth="8" strokeLinecap="round" />
      <rect x="52" y="74" width="56" height="44" rx="14" fill="url(#lock-body)" />
      <circle cx="80" cy="94" r="5" fill="white" />
      <rect x="77.5" y="94" width="5" height="12" rx="2.5" fill="white" />
    </SvgBase>
  );
}

export function HashBlockArt(props: ArtProps) {
  return (
    <SvgBase title={props.title ?? "Hash record"} {...props}>
      <defs>
        <linearGradient id="hash-a" x1="30" y1="30" x2="130" y2="130" gradientUnits="userSpaceOnUse">
          <stop stopColor="#DFF1FF" />
          <stop offset="1" stopColor="#7CC6F2" />
        </linearGradient>
      </defs>
      <rect x="28" y="28" width="104" height="104" rx="28" fill="url(#hash-a)" />
      <rect x="48" y="50" width="64" height="12" rx="6" fill="white" fillOpacity="0.85" />
      <rect x="48" y="70" width="44" height="12" rx="6" fill="white" fillOpacity="0.7" />
      <rect x="48" y="90" width="54" height="12" rx="6" fill="white" fillOpacity="0.7" />
      <text x="58" y="114" fill="#155E8A" fontSize="14" fontWeight="700" fontFamily="ui-monospace, monospace">SHA-256</text>
    </SvgBase>
  );
}

export function QrSealArt(props: ArtProps) {
  return (
    <SvgBase title={props.title ?? "QR seal"} {...props}>
      <defs>
        <linearGradient id="qr-bg" x1="30" y1="30" x2="130" y2="130" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE3F1" />
          <stop offset="1" stopColor="#F3A6CE" />
        </linearGradient>
      </defs>
      <rect x="28" y="28" width="104" height="104" rx="28" fill="url(#qr-bg)" />
      <rect x="50" y="50" width="60" height="60" rx="10" fill="white" />
      <rect x="58" y="58" width="16" height="16" rx="3" fill="#912D62" />
      <rect x="86" y="58" width="16" height="16" rx="3" fill="#912D62" />
      <rect x="58" y="86" width="16" height="16" rx="3" fill="#912D62" />
      <rect x="80" y="80" width="8" height="8" rx="2" fill="#D95797" />
      <rect x="92" y="80" width="10" height="8" rx="2" fill="#D95797" />
      <rect x="80" y="92" width="10" height="10" rx="2" fill="#D95797" />
      <rect x="94" y="94" width="8" height="8" rx="2" fill="#912D62" />
    </SvgBase>
  );
}