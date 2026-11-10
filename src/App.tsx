import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Calculator,
  Check,
  GraduationCap,
  Moon,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";
import { MotionConfig } from "motion/react";
import { calculate } from "./lib/calculations";
import {
  createState,
  defaultPlan,
  parseState,
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  PREVIOUS_STORAGE_KEY,
  MIN_SELECTABLE_YEAR,
  MAX_SELECTABLE_YEAR,
} from "./lib/plan";
import type { AnnualPlan, SavedState } from "./lib/types";
import Dashboard from "./components/Dashboard";
import Planner from "./components/Planner";
import SimpleCalculator from "./components/SimpleCalculator";
import EightBall from "./components/EightBall";
import Settings from "./components/Settings";
import { Notice } from "./components/Fields";

const tabs = [
  { label: "Simple Calculator", icon: Calculator },
  { label: "Refined Calculator", icon: CalendarDays },
  { label: "PD Magic 8-Ball", icon: Sparkles },
] as const;

function loadState(): {
  state: SavedState;
  recovery: boolean;
  message: string;
} {
  let raw: string | null;
  try {
    raw =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem(PREVIOUS_STORAGE_KEY) ??
      localStorage.getItem(LEGACY_STORAGE_KEY);
  } catch {
    return {
      state: createState(),
      recovery: false,
      message:
        "Browser storage is unavailable. Work in this session and export JSON to keep a backup.",
    };
  }
  if (!raw) return { state: createState(), recovery: false, message: "" };
  try {
    return { state: parseState(raw, true), recovery: false, message: "" };
  } catch {
    return {
      state: createState(),
      recovery: true,
      message:
        "The saved plan could not be validated. It has been left untouched. Use Settings to import a valid backup or confirm a reset before saving new plans.",
    };
  }
}
export default function App() {
  const [initial] = useState(loadState),
    [state, setState] = useState(initial.state),
    [recovery, setRecovery] = useState(initial.recovery),
    [storageMessage, setStorageMessage] = useState(initial.message),
    [saved, setSaved] = useState(false),
    [active, setActive] = useState(0),
    [showResults, setShowResults] = useState(false),
    [settings, setSettings] = useState(false);
  const [systemDark, setSystemDark] = useState(
    () => matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const plan = state.plans[state.activeYear],
    result = useMemo(() => calculate(plan), [plan]),
    dark = state.theme === "dark" || (state.theme === "system" && systemDark);
  useEffect(() => {
    const query = matchMedia("(prefers-color-scheme: dark)"),
      change = () => setSystemDark(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  useEffect(() => {
    if (recovery) return;
    setSaved(false);
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        setStorageMessage("");
        setSaved(true);
      } catch {
        setStorageMessage(
          "Your browser could not save this plan. Export JSON to keep a backup; edits remain in this session.",
        );
        setSaved(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [state, recovery]);
  useEffect(() => {
    const flush = () => {
      if (!recovery) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
          /* Visible storage warning covers unavailable storage. */
        }
      }
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [state, recovery]);
  const settingsTrigger = useRef<HTMLButtonElement>(null);
  const closeSettings = () => {
    setSettings(false);
    requestAnimationFrame(() => settingsTrigger.current?.focus());
  };
  const selectTab = (index: number) => {
    setActive(index);
    if (index <= 1) setShowResults(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const changePlan = (p: AnnualPlan) =>
    setState((s) => ({ ...s, plans: { ...s.plans, [p.year]: p } }));
  const changeYear = (year: number) => {
    setShowResults(false);
    setState((s) => ({
      ...s,
      activeYear: year,
      plans: { ...s.plans, [year]: s.plans[year] ?? defaultPlan(year) },
    }));
  };
  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <div className="header-wrap">
        <header className="app-header">
          <a
            className="brand"
            href="#main"
            onClick={() => selectTab(0)}
            aria-label="AnnualPDHours calculator"
          >
            <span className="brand-mark">
              <GraduationCap size={23} />
            </span>
            <span>
              Annual<span className="brand-accent">PD</span>Hours
              <small>MAKE ROOM TO GROW</small>
            </span>
          </a>
          <div className="header-actions">
            <span className="save-status" role="status">
              {saved ? <Check size={14} /> : <ShieldCheck size={14} />}
              {recovery
                ? "Recovery needed"
                : saved
                  ? "Saved in this browser"
                  : "Unsaved changes"}
            </span>
            <label className="year-select">
              <span className="sr-only">Active plan year</span>
              <CalendarDays size={16} />
              <select
                value={state.activeYear}
                onChange={(e) => changeYear(Number(e.target.value))}
              >
                {Array.from(
                  { length: MAX_SELECTABLE_YEAR - MIN_SELECTABLE_YEAR + 1 },
                  (_, i) => MIN_SELECTABLE_YEAR + i,
                ).map((year) => (
                  <option key={year}>{year}</option>
                ))}
              </select>
            </label>
            <button
              className="icon-button"
              aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
              onClick={() =>
                setState((s) => ({ ...s, theme: dark ? "light" : "dark" }))
              }
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              ref={settingsTrigger}
              className="icon-button"
              aria-label="Open settings and backups"
              onClick={() => setSettings(true)}
            >
              <SettingsIcon size={19} />
            </button>
          </div>
        </header>
        <div className="nav-wrap">
          <nav aria-label="Primary navigation">
            {tabs.map(({ label, icon: Icon }, i) => (
              <button
                key={label}
                aria-current={active === i ? "page" : undefined}
                onClick={() => selectTab(i)}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </nav>
          <span className="nav-note">
            <span className="online-dot" /> A thoughtful plan for your time
          </span>
        </div>
      </div>
      <div className="app-shell">
        <main id="main" tabIndex={-1}>
          {active === 0 && (
            <SimpleCalculator
              key={plan.year}
              plan={plan}
              onChange={changePlan}
              onRefine={(next) => {
                changePlan(next);
                selectTab(1);
              }}
            />
          )}
          {storageMessage && (
            <Notice tone="warning">
              {storageMessage}{" "}
              <button className="text-button" onClick={() => setSettings(true)}>
                Open Settings
              </button>
            </Notice>
          )}
          {active === 1 && showResults && (
            <Dashboard
              plan={plan}
              result={result}
              onPlan={() => selectTab(1)}
            />
          )}
          {active === 1 && !showResults && (
            <Planner
              key={plan.year}
              plan={plan}
              result={result}
              onChange={changePlan}
              onCalculate={() => {
                setShowResults(true);
                window.scrollTo({ top: 0, behavior: "instant" });
                requestAnimationFrame(() =>
                  document.getElementById("main")?.focus(),
                );
              }}
            />
          )}
          {active === 2 && <EightBall result={result} />}
        </main>
        <footer>
          <span>
            <ShieldCheck size={14} /> Private by design. Saved only in this
            browser.
          </span>
          <span>
            Built for growth ·{" "}
            <a
              href="https://github.com/LukeK980/AnnualPDHours"
              target="_blank"
              rel="noreferrer"
            >
              Open source ↗
            </a>
          </span>
        </footer>
      </div>
      {settings && (
        <Settings
          state={state}
          onClose={closeSettings}
          onTheme={(theme) => setState((s) => ({ ...s, theme }))}
          onImport={(s) => {
            setState(s);
            setShowResults(false);
            setRecovery(false);
            setStorageMessage("");
          }}
          onReset={() => {
            changePlan(defaultPlan(state.activeYear));
            setShowResults(false);
            setRecovery(false);
            setStorageMessage("");
          }}
        />
      )}
    </MotionConfig>
  );
}
