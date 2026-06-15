"use client";

import React, { useState, useEffect } from "react";
import { CloudSun, Search, Loader2, Wind, Droplets, Thermometer, CloudRain, Sun, CloudSnow, AlertCircle } from "lucide-react";

interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  humidity: number;
  wind: number;
  description: string;
}

// Sandbox weather simulation data
const SANDBOX_WEATHER: Record<string, WeatherData> = {
  dhaka: { city: "Dhaka", temp: 32, condition: "Sunny", humidity: 75, wind: 12, description: "Hot and humid with clear skies" },
  london: { city: "London", temp: 15, condition: "Rainy", humidity: 88, wind: 24, description: "Light drizzle and cool breezes" },
  "new york": { city: "New York", temp: 22, condition: "Cloudy", humidity: 60, wind: 16, description: "Partly cloudy with pleasant temperatures" },
  tokyo: { city: "Tokyo", temp: 19, condition: "Cloudy", humidity: 65, wind: 10, description: "Mostly overcast with mild winds" },
  sydney: { city: "Sydney", temp: 17, condition: "Sunny", humidity: 55, wind: 20, description: "Clear skies and breezy conditions" }
};

export default function WeatherWidget() {
  const [city, setCity] = useState("Dhaka");
  const [searchQuery, setSearchQuery] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isLive, setIsLive] = useState(false);

  // Load custom UI API Key if saved in localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem("openweather_api_key");
    const envKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "";
    if (savedKey) {
      setApiKey(savedKey);
      setIsLive(true);
    } else if (envKey) {
      setApiKey(envKey);
      setIsLive(true);
    }
  }, []);

  const fetchWeather = async (targetCity: string) => {
    setLoading(true);
    setError("");
    const query = targetCity.trim().toLowerCase();

    // Check if we should use Live OpenWeather API
    const activeKey = apiKey || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (activeKey) {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
            targetCity
          )}&units=metric&appid=${activeKey}`
        );
        if (!res.ok) {
          throw new Error("City not found in OpenWeather registry");
        }
        const data = await res.json();
        setWeather({
          city: data.name,
          temp: Math.round(data.main.temp),
          condition: data.weather[0].main,
          humidity: data.main.humidity,
          wind: Math.round(data.wind.speed * 3.6), // m/s to km/h
          description: data.weather[0].description
        });
        setIsLive(true);
      } catch (err: any) {
        setError(err.message || "Failed to load live weather");
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback sandbox simulation
      setTimeout(() => {
        const matched = Object.keys(SANDBOX_WEATHER).find((k) => k === query || k.includes(query) || query.includes(k));
        if (matched) {
          setWeather(SANDBOX_WEATHER[matched]);
        } else {
          // Generate realistic random weather for unknown cities
          const conditions = ["Sunny", "Cloudy", "Rainy", "Snowy"];
          const cond = conditions[Math.floor(Math.random() * conditions.length)];
          const randTemp = cond === "Sunny" ? 28 : cond === "Snowy" ? -2 : cond === "Rainy" ? 16 : 20;
          setWeather({
            city: targetCity.charAt(0).toUpperCase() + targetCity.slice(1),
            temp: randTemp + Math.floor(Math.random() * 6 - 3),
            condition: cond,
            humidity: 40 + Math.floor(Math.random() * 50),
            wind: 5 + Math.floor(Math.random() * 25),
            description: `Simulated sandbox data: ${cond.toLowerCase()} day.`
          });
        }
        setIsLive(false);
        setLoading(false);
      }, 400);
    }
  };

  useEffect(() => {
    fetchWeather(city);
  }, [city, apiKey]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setCity(searchQuery);
      fetchWeather(searchQuery);
      setSearchQuery("");
    }
  };

  const saveCustomApiKey = (key: string) => {
    setApiKey(key);
    if (key.trim()) {
      localStorage.setItem("openweather_api_key", key);
      setIsLive(true);
    } else {
      localStorage.removeItem("openweather_api_key");
      setIsLive(false);
    }
  };

  const getWeatherIcon = (cond: string) => {
    switch (cond.toLowerCase()) {
      case "sunny":
      case "clear":
        return <Sun className="w-12 h-12 text-amber-500 animate-pulse" />;
      case "rainy":
      case "rain":
      case "drizzle":
        return <CloudRain className="w-12 h-12 text-blue-400" />;
      case "snowy":
      case "snow":
        return <CloudSnow className="w-12 h-12 text-cyan-300" />;
      default:
        return <CloudSun className="w-12 h-12 text-zinc-400" />;
    }
  };

  const getWeatherGradient = (cond: string) => {
    switch (cond.toLowerCase()) {
      case "sunny":
      case "clear":
        return "from-amber-500/10 to-orange-600/5 dark:from-amber-950/20 dark:to-orange-950/5 border-amber-500/20";
      case "rainy":
      case "rain":
      case "drizzle":
        return "from-blue-500/10 to-accent/5 dark:from-blue-950/20 dark:to-accent/5 border-blue-500/20";
      case "snowy":
      case "snow":
        return "from-cyan-450/10 to-blue-500/5 dark:from-cyan-950/20 dark:to-blue-950/5 border-cyan-500/20";
      default:
        return "from-zinc-400/10 to-zinc-650/5 dark:from-zinc-900/20 dark:to-zinc-950/5 border-zinc-500/20";
    }
  };

  const themeGradient = weather ? getWeatherGradient(weather.condition) : "from-zinc-100 to-zinc-50 border-zinc-200";

  return (
    <div className={`glass-panel rounded-3xl p-6 flex flex-col h-[400px] bg-gradient-to-br ${themeGradient} transition-all glow-border`}>
      <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-3 mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Local Weather</h3>
            <p className="text-[9px] text-zinc-500">
              {isLive ? "✓ Live OpenWeather Node" : "Sandbox Simulation"}
            </p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4 shrink-0">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search city (e.g. London, Tokyo)..."
            className="w-full bg-zinc-50/80 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-650 focus:outline-none focus:border-amber-550 transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-xl active-scale text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0"
        >
          Go
        </button>
      </form>

      {/* Content area */}
      <div className="flex-1 flex flex-col justify-between">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-455" />
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{error}</p>
            <button
              onClick={() => fetchWeather(city)}
              className="mt-3 text-[10px] text-accent font-bold hover:underline cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : weather ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xl font-black text-zinc-900 dark:text-white">{weather.city}</h4>
                <p className="text-[10px] text-zinc-500 capitalize mt-0.5">{weather.description}</p>
              </div>
              {getWeatherIcon(weather.condition)}
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">
                {weather.temp}
              </span>
              <span className="text-2xl font-bold text-zinc-405 dark:text-zinc-500">°C</span>
            </div>

            {/* Extra metrics */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
              <div className="p-2 rounded-2xl bg-white/40 dark:bg-zinc-900/40 border border-white/20 dark:border-zinc-800/20 text-center">
                <Thermometer className="w-3.5 h-3.5 mx-auto text-orange-500 mb-1" />
                <span className="text-[9px] text-zinc-450 dark:text-zinc-500 block">Feels Like</span>
                <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 block">
                  {weather.temp}°C
                </span>
              </div>
              <div className="p-2 rounded-2xl bg-white/40 dark:bg-zinc-900/40 border border-white/20 dark:border-zinc-800/20 text-center">
                <Droplets className="w-3.5 h-3.5 mx-auto text-blue-405 mb-1" />
                <span className="text-[9px] text-zinc-450 dark:text-zinc-500 block">Humidity</span>
                <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 block">
                  {weather.humidity}%
                </span>
              </div>
              <div className="p-2 rounded-2xl bg-white/40 dark:bg-zinc-900/40 border border-white/20 dark:border-zinc-800/20 text-center">
                <Wind className="w-3.5 h-3.5 mx-auto text-teal-500 mb-1" />
                <span className="text-[9px] text-zinc-450 dark:text-zinc-500 block">Wind Speed</span>
                <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 block">
                  {weather.wind} km/h
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* API Key management */}
        <div className="mt-4 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50 shrink-0">
          <details className="group cursor-pointer">
            <summary className="text-[9px] font-bold text-accent select-none list-none flex items-center justify-between hover:underline">
              <span>{apiKey ? "Edit custom OpenWeather API Key" : "Add custom OpenWeather API Key"}</span>
              <span className="transition-transform group-open:rotate-180">▼</span>
            </summary>
            <div className="mt-2 flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => saveCustomApiKey(e.target.value)}
                placeholder="Enter OpenWeather API Key..."
                className="flex-1 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-[10px] text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none"
              />
              {apiKey && (
                <button
                  onClick={() => saveCustomApiKey("")}
                  className="px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
