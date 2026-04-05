import { Droplets, Wind, Thermometer, MapPin, RefreshCw } from "lucide-react";
import { useWeather, WeatherState } from "@/hooks/useWeather";

/* ─── Theme config ───────────────────────────────── */
type Theme = {
  bg: string;
  accent: string;
  text: string;
  subtext: string;
  statBg: string;
};

const THEMES: Record<WeatherState, Theme> = {
  sunny: {
    bg: "linear-gradient(135deg, #FFF7E6 0%, #FFE9A0 45%, #87CEEB 100%)",
    accent: "#E8A020",
    text: "#1A3A4A",
    subtext: "#4A6070",
    statBg: "rgba(255,255,255,0.45)",
  },
  cloudy: {
    bg: "linear-gradient(135deg, #E8EEF4 0%, #C9D8E8 50%, #B8CCE0 100%)",
    accent: "#5A7A9A",
    text: "#1A2A3A",
    subtext: "#4A6070",
    statBg: "rgba(255,255,255,0.40)",
  },
  rainy: {
    bg: "linear-gradient(135deg, #F5F0E8 0%, #E8E0C8 45%, #C8D8B8 100%)",
    accent: "#556B2F",
    text: "#1A2A1A",
    subtext: "#4A5A3A",
    statBg: "rgba(255,255,255,0.45)",
  },
  night: {
    bg: "linear-gradient(135deg, #0D1B2A 0%, #1A2D4A 50%, #243B55 100%)",
    accent: "#7BA7D4",
    text: "#E8F0F8",
    subtext: "#A0B8C8",
    statBg: "rgba(255,255,255,0.10)",
  },
  snowy: {
    bg: "linear-gradient(135deg, #EAF4FF 0%, #D0E8F8 50%, #B8D8F0 100%)",
    accent: "#4A8AB0",
    text: "#1A2A3A",
    subtext: "#3A5A6A",
    statBg: "rgba(255,255,255,0.50)",
  },
  storm: {
    bg: "linear-gradient(135deg, #1A1A2E 0%, #2A2A4E 50%, #16213E 100%)",
    accent: "#9B8EC4",
    text: "#E0D8F0",
    subtext: "#A098C0",
    statBg: "rgba(255,255,255,0.10)",
  },
};

/* ─── SVG Illustrations ──────────────────────────── */
function SunIllustration() {
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" fill="none" className="opacity-90 block">
      {/* Glow */}
      <circle cx="72" cy="62" r="34" fill="#FFD54F" opacity="0.25" />
      {/* Body */}
      <circle cx="72" cy="62" r="24" fill="#FFD54F" />
      <circle cx="72" cy="62" r="18" fill="#FFCA28" />
      {/* Rays */}
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
        const r = Math.PI * deg / 180;
        const x1 = 72 + Math.cos(r) * 28;
        const y1 = 62 + Math.sin(r) * 28;
        const x2 = 72 + Math.cos(r) * 38;
        const y2 = 62 + Math.sin(r) * 38;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFB300" strokeWidth={i % 2 === 0 ? 3 : 2} strokeLinecap="round" />;
      })}
    </svg>
  );
}

function RainIllustration() {
  return (
    <svg width="120" height="110" viewBox="0 0 120 110" fill="none" className="opacity-95 block">
      {/* Umbrella canopy */}
      <path d="M20 54 Q60 14 100 54" fill="#7B9E6B" />
      <path d="M20 54 Q60 20 100 54" fill="none" stroke="#5A7A4A" strokeWidth="2" />
      {/* Canopy segments */}
      <path d="M40 40 Q60 16 80 40" fill="none" stroke="#6B8A5B" strokeWidth="1.5" opacity="0.6" />
      <path d="M60 14 L60 54" fill="none" stroke="#5A7A4A" strokeWidth="1.5" opacity="0.6" />
      {/* Handle */}
      <line x1="60" y1="54" x2="60" y2="88" stroke="#5A7A4A" strokeWidth="3" strokeLinecap="round" />
      <path d="M60 88 Q60 98 50 98 Q42 98 42 90" fill="none" stroke="#5A7A4A" strokeWidth="3" strokeLinecap="round" />
      {/* Rain drops */}
      {[[25,72],[40,80],[55,68],[72,78],[88,70],[100,82],[15,88],[105,65]].map(([x,y], i) => (
        <ellipse key={i} cx={x} cy={y} rx={2} ry={4} fill="#7BA7CC" opacity={0.7} />
      ))}
    </svg>
  );
}

function NightIllustration() {
  return (
    <svg width="120" height="110" viewBox="0 0 120 110" fill="none" className="opacity-90 block">
      {/* Moon */}
      <circle cx="78" cy="50" r="26" fill="#2A4060" />
      <circle cx="90" cy="38" r="22" fill="#0D1B2A" />
      {/* Stars */}
      {[[20,20],[35,35],[15,55],[45,15],[10,40],[55,55],[30,65],[50,70]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.5 : 1.5} fill="white" opacity={0.6 + (i % 3) * 0.2} />
      ))}
      {/* Twinkling star */}
      <path d="M30 25 L31.5 28 L35 28 L32.5 30 L33.5 33.5 L30 31.5 L26.5 33.5 L27.5 30 L25 28 L28.5 28Z" fill="white" opacity="0.9" />
    </svg>
  );
}

function CloudIllustration() {
  return (
    <svg width="130" height="90" viewBox="0 0 130 90" fill="none" className="opacity-80 block">
      <ellipse cx="70" cy="65" rx="50" ry="22" fill="white" opacity="0.7" />
      <ellipse cx="55" cy="58" rx="30" ry="20" fill="white" opacity="0.8" />
      <ellipse cx="80" cy="52" rx="28" ry="22" fill="white" opacity="0.85" />
      <ellipse cx="65" cy="48" rx="24" ry="18" fill="white" opacity="0.9" />
    </svg>
  );
}

function StormIllustration() {
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" fill="none" className="opacity-90 block">
      <ellipse cx="60" cy="40" rx="38" ry="20" fill="#3A3A5E" opacity="0.8" />
      <ellipse cx="50" cy="35" rx="28" ry="16" fill="#4A4A6E" opacity="0.9" />
      {/* Lightning bolt */}
      <path d="M62 42 L50 68 L60 64 L48 90 L72 58 L60 62Z" fill="#FFD700" opacity="0.95" />
      {/* Rain */}
      {[[35,72],[48,82],[72,75],[85,68]].map(([x,y],i) => (
        <ellipse key={i} cx={x} cy={y} rx={1.5} ry={4} fill="#7BA7CC" opacity={0.6} />
      ))}
    </svg>
  );
}

function SnowyIllustration() {
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" fill="none" className="opacity-80 block">
      <ellipse cx="60" cy="38" rx="36" ry="18" fill="white" opacity="0.6" />
      <ellipse cx="50" cy="32" rx="26" ry="16" fill="white" opacity="0.75" />
      {/* Snowflakes */}
      {[[30,62],[50,72],[68,58],[82,70],[20,78],[90,80]].map(([x,y],i) => (
        <g key={i}>
          <line x1={x-6} y1={y} x2={x+6} y2={y} stroke="#A0C8E8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1={x} y1={y-6} x2={x} y2={y+6} stroke="#A0C8E8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1={x-4} y1={y-4} x2={x+4} y2={y+4} stroke="#A0C8E8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1={x+4} y1={y-4} x2={x-4} y2={y+4} stroke="#A0C8E8" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

const ILLUSTRATIONS: Record<WeatherState, () => JSX.Element> = {
  sunny: SunIllustration,
  cloudy: CloudIllustration,
  rainy: RainIllustration,
  night: NightIllustration,
  snowy: SnowyIllustration,
  storm: StormIllustration,
};

/* ─── Main Component ─────────────────────────────── */
export function WeatherCard() {
  const { weather, loading, error } = useWeather();

  if (error) return null;

  if (loading || !weather) {
    return (
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: 28,
          background: "linear-gradient(135deg, #F0EDE8 0%, #E5E0D8 100%)",
          border: "1px solid #E5E0D8",
          minHeight: 120,
        }}
      >
        <div className="p-5 flex items-center gap-3">
          <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
          <span className="text-xs text-muted-foreground">Fetching weather…</span>
        </div>
      </div>
    );
  }

  const theme = THEMES[weather.state];
  const Illustration = ILLUSTRATIONS[weather.state];

  return (
    <div
      className="relative overflow-hidden transition-all duration-700"
      style={{
        borderRadius: 28,
        background: theme.bg,
        minHeight: 128,
      }}
    >
      {/* Illustration — explicit z=0 so content always renders above */}
      <div style={{ position: "absolute", bottom: 0, right: 0, zIndex: 0, pointerEvents: "none" }}>
        <Illustration />
      </div>

      {/* Content — explicit z=10 */}
      <div className="relative p-5 flex items-start justify-between" style={{ minHeight: 128, zIndex: 10 }}>
        {/* Left: location + stats */}
        <div className="flex flex-col justify-between h-full gap-3">
          {/* Location */}
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 shrink-0" style={{ color: theme.subtext }} />
            <p className="text-xs font-semibold truncate max-w-[130px]" style={{ color: theme.subtext }}>
              {weather.city}
            </p>
          </div>

          {/* Description + feels like */}
          <div>
            <p className="text-base font-bold leading-tight" style={{ color: theme.text }}>
              {weather.description}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: theme.subtext }}>
              Feels like {weather.feelsLike}°C
            </p>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-xl"
              style={{ background: theme.statBg }}
            >
              <Droplets className="w-3 h-3" style={{ color: theme.accent }} />
              <span className="text-[11px] font-semibold" style={{ color: theme.text }}>
                {weather.humidity}%
              </span>
            </div>
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-xl"
              style={{ background: theme.statBg }}
            >
              <Wind className="w-3 h-3" style={{ color: theme.accent }} />
              <span className="text-[11px] font-semibold" style={{ color: theme.text }}>
                {weather.windKph} km/h
              </span>
            </div>
          </div>
        </div>

        {/* Right: Large temperature */}
        <div className="flex flex-col items-end shrink-0 pr-2">
          <div className="flex items-start leading-none">
            <span
              className="font-black"
              style={{
                fontSize: 64,
                lineHeight: 1,
                color: theme.text,
                letterSpacing: "-0.04em",
                textShadow: weather.state === "night" ? "0 2px 12px rgba(0,0,0,0.4)" : "none",
              }}
            >
              {weather.temp}
            </span>
            <span
              className="font-bold mt-2 ml-1"
              style={{ fontSize: 22, color: theme.subtext }}
            >
              °C
            </span>
          </div>
          <div
            className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-lg"
            style={{ background: theme.statBg }}
          >
            <Thermometer className="w-3 h-3" style={{ color: theme.accent }} />
            <span className="text-[10px] font-semibold" style={{ color: theme.subtext }}>
              {weather.isDay ? "Daytime" : "Nighttime"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
