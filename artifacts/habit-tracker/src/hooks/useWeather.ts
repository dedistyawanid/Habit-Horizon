import { useState, useEffect } from "react";

export type WeatherState = "sunny" | "cloudy" | "rainy" | "night" | "snowy" | "storm";

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windKph: number;
  code: number;
  description: string;
  state: WeatherState;
  city: string;
  isDay: boolean;
}

/* Open-Meteo WMO weather codes → description */
function describeCode(code: number): string {
  if (code === 0)               return "Clear sky";
  if (code <= 3)                return "Partly cloudy";
  if (code <= 48)               return "Foggy";
  if (code <= 55)               return "Drizzle";
  if (code <= 67)               return "Rain";
  if (code <= 77)               return "Snow";
  if (code <= 82)               return "Rain showers";
  if (code <= 86)               return "Snow showers";
  if (code === 95)              return "Thunderstorm";
  return "Storm";
}

function getState(code: number, isDay: boolean): WeatherState {
  if (!isDay) return "night";
  if (code === 0) return "sunny";
  if (code <= 3)  return "cloudy";
  if (code <= 48) return "cloudy";
  if (code <= 67) return "rainy";
  if (code <= 77) return "snowy";
  if (code <= 82) return "rainy";
  return "storm";
}

const LS_KEY = "dedi_weather_cache";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 min

function readCache(): WeatherData | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data as WeatherData;
  } catch { return null; }
}

function writeCache(data: WeatherData) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ data, ts: Date.now() })); }
  catch { /* ignore */ }
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(readCache);
  const [loading, setLoading] = useState(!readCache());
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    const cached = readCache();
    if (cached) { setWeather(cached); setLoading(false); return; }

    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const [wxRes, geoRes] = await Promise.all([
            fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
              `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day` +
              `&wind_speed_unit=kmh&timezone=auto`
            ),
            fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
            ).catch(() => null),
          ]);

          if (!wxRes.ok) throw new Error("Weather fetch failed");
          const wxJson = await wxRes.json();
          const cur = wxJson.current;

          let city = "Your location";
          if (geoRes?.ok) {
            const geoJson = await geoRes.json();
            city =
              geoJson.address?.city ||
              geoJson.address?.town ||
              geoJson.address?.village ||
              geoJson.address?.county ||
              city;
          }

          const code   = cur.weather_code ?? 0;
          const isDay  = cur.is_day === 1;
          const data: WeatherData = {
            temp:        Math.round(cur.temperature_2m),
            feelsLike:   Math.round(cur.apparent_temperature),
            humidity:    Math.round(cur.relative_humidity_2m),
            windKph:     Math.round(cur.wind_speed_10m),
            code,
            description: describeCode(code),
            state:       getState(code, isDay),
            city,
            isDay,
          };
          writeCache(data);
          setWeather(data);
        } catch (e) {
          setError("Could not fetch weather");
        } finally {
          setLoading(false);
        }
      },
      () => { setError("Location permission denied"); setLoading(false); },
      { timeout: 8000 }
    );
  }, []);

  return { weather, loading, error };
}
