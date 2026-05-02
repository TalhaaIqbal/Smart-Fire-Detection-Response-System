import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  Thermometer,
  Droplets,
  Wind,
  Activity,
  Bell,
  ShieldCheck,
  AlertTriangle,
  Siren,
  RefreshCw,
  Wifi,
  WifiOff,
  Cpu,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://gradually-grain-gaming.ngrok-free.dev";

const STATUS = {
  Normal: {
    label: "Normal",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    glow: "shadow-emerald-200/70",
    icon: ShieldCheck,
    message: "Environment is stable. No fire risk detected.",
  },
  Warning: {
    label: "Warning",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    glow: "shadow-amber-200/70",
    icon: AlertTriangle,
    message: "Abnormal readings detected. Monitor carefully.",
  },
  Fire: {
    label: "Fire",
    badge: "bg-red-100 text-red-700 border-red-200",
    glow: "shadow-red-200/70",
    icon: Siren,
    message: "Critical fire condition detected. Response activated.",
  },
};

const initialReadings = [
  {
    time: "--:--",
    smoke: 0,
    temperature: 0,
    humidity: 0,
    flame: 0,
    status: "Normal",
    confidence: 0,
  },
];

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function normalizeBackendResult(result) {
  const input = result?.input || {};

  return {
    time: formatTime(),
    smoke: Number(input.smoke ?? 0),
    flame: Number(input.flame ?? 0),
    temperature: Number(input.temperature ?? 0),
    humidity: Number(input.humidity ?? 0),
    status: result?.label || "Normal",
    confidence: Number(result?.confidence ?? 0),
  };
}

function StatCard({ title, value, unit, icon: Icon, hint }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="rounded-3xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">{title}</p>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900">
                  {value}
                </span>
                {unit && (
                  <span className="mb-1 text-sm font-semibold text-slate-500">
                    {unit}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-400">{hint}</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <Icon size={22} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatusHero({ latest, connected }) {
  const config = STATUS[latest.status] || STATUS.Normal;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45 }}
      className={`rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur-xl ${config.glow}`}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          <motion.div
            animate={latest.status === "Fire" ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={{
              repeat: latest.status === "Fire" ? Infinity : 0,
              duration: 1.1,
            }}
            className="rounded-3xl bg-slate-950 p-5 text-white shadow-lg"
          >
            <Icon size={34} />
          </motion.div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                Smart Fire Detection
              </h1>
              <span className={`rounded-full border px-3 py-1 text-sm font-bold ${config.badge}`}>
                {config.label}
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
              {config.message} Latest ML confidence: {Math.round(latest.confidence * 100)}%.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex">
          <div className="rounded-2xl bg-slate-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Device
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-800">
              <Cpu size={15} /> ESP32_FB01
            </p>
          </div>
          <div className="rounded-2xl bg-slate-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Connection
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-800">
              {connected ? <Wifi size={15} /> : <WifiOff size={15} />}
              {connected ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl">
      <div className="p-5">
        <div className="mb-4">
          <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="h-72">{children}</div>
      </div>
    </div>
  );
}

export default function SmartFireDashboard() {
  const [readings, setReadings] = useState(initialReadings);
  const [connected, setConnected] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const latest = readings[readings.length - 1];

  const eventLog = useMemo(
    () => readings.filter((item) => item.status !== "Normal").slice(-6).reverse(),
    [readings]
  );

  const fireCount = useMemo(
    () => readings.filter((item) => item.status === "Fire").length,
    [readings]
  );

  const warningCount = useMemo(
    () => readings.filter((item) => item.status === "Warning").length,
    [readings]
  );

  const fetchBackendLatest = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`http://127.0.0.1:8000/latest`);
      console.log(response.data);

      const result = response.data;
      const next = normalizeBackendResult(result);

      setReadings((current) => {
        const last = current[current.length - 1];
        const isDuplicate =
          last.smoke === next.smoke &&
          last.flame === next.flame &&
          last.temperature === next.temperature &&
          last.humidity === next.humidity &&
          last.status === next.status;

        if (isDuplicate && current.length > 1) {
          return current;
        }

        return [...current.slice(-11), next];
      });

      setConnected(true);
    } catch (err) {
      console.error("Failed to fetch latest prediction:", err);
      setConnected(false);
      setError("Could not connect to FastAPI /latest. Check backend, ngrok, CORS, and .env URL.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackendLatest();
  }, [fetchBackendLatest]);

  useEffect(() => {
    if (!autoRefresh) return undefined;

    const interval = setInterval(() => {
      fetchBackendLatest();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchBackendLatest]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/40 to-red-50 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/70 px-3 py-1 text-sm font-bold text-orange-700 shadow-sm backdrop-blur">
              <Flame size={16} /> IO4041 IoT Semester Project
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              Fire Response Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-slate-500">
              Live monitoring for smoke, flame, temperature, humidity, ML classification, and emergency response status.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setAutoRefresh((value) => !value)}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Activity size={18} />
              {autoRefresh ? "Live Mode On" : "Live Mode Off"}
            </button>

            <button
              type="button"
              onClick={fetchBackendLatest}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              {loading ? "Refreshing" : "Refresh"}
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <StatusHero latest={latest} connected={connected} />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Smoke Level" value={latest.smoke} unit="ADC" icon={Wind} hint="MQ-2 sensor reading" />
          <StatCard title="Flame Sensor" value={latest.flame === 1 ? "Detected" : "Clear"} icon={Flame} hint="Digital flame status" />
          <StatCard title="Temperature" value={latest.temperature} unit="°C" icon={Thermometer} hint="DHT22 temperature" />
          <StatCard title="Humidity" value={latest.humidity} unit="%" icon={Droplets} hint="DHT22 humidity" />
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ChartCard title="Smoke & Temperature Trend" subtitle="Updates every 10 seconds from ThingSpeak / FastAPI">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={readings} margin={{ top: 10, right: 20, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="smoke" strokeWidth={3} dot={false} name="Smoke" />
                  <Line type="monotone" dataKey="temperature" strokeWidth={3} dot={false} name="Temperature" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard title="Prediction Confidence" subtitle="Latest ML confidence trend">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={readings} margin={{ top: 10, right: 20, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="statusFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopOpacity={0.35} />
                    <stop offset="95%" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Area type="monotone" dataKey="confidence" strokeWidth={3} fill="url(#statusFill)" name="Confidence" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl xl:col-span-2">
            <div className="p-5">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Event Log</h2>
                  <p className="text-sm text-slate-500">Recent Warning and Fire classifications</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                  {eventLog.length} active records
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Smoke</th>
                      <th className="px-4 py-3">Flame</th>
                      <th className="px-4 py-3">Temp</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white/60">
                    {eventLog.length > 0 ? (
                      eventLog.map((event, index) => (
                        <tr key={`${event.time}-${index}`} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-semibold text-slate-700">{event.time}</td>
                          <td className="px-4 py-3">{event.smoke}</td>
                          <td className="px-4 py-3">{event.flame === 1 ? "Yes" : "No"}</td>
                          <td className="px-4 py-3">{event.temperature}°C</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS[event.status]?.badge || STATUS.Normal.badge}`}>
                              {event.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold">{Math.round(event.confidence * 100)}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                          No warning or fire events detected yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-slate-950 text-white shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold">Response System</h2>
                  <p className="mt-1 text-sm text-slate-400">Actuator and alert status</p>
                </div>
                <Bell className="text-orange-300" />
              </div>

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-sm text-slate-400">Buzzer</p>
                  <p className="mt-1 text-xl font-black">{latest.status === "Fire" ? "Active" : "Standby"}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-sm text-slate-400">Relay + DC Fan</p>
                  <p className="mt-1 text-xl font-black">{latest.status === "Fire" ? "Running" : "Off"}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-sm text-slate-400">Alerts</p>
                  <p className="mt-1 text-xl font-black">{latest.status === "Fire" ? "Sent" : "Waiting"}</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-white p-4 text-slate-950">
                <p className="text-sm font-bold text-slate-500">Session Summary</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-3xl font-black">{warningCount}</p>
                    <p className="text-xs font-semibold text-slate-500">Warnings</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black">{fireCount}</p>
                    <p className="text-xs font-semibold text-slate-500">Fire Events</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
