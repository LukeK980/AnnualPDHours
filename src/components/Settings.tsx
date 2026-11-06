import { useEffect, useRef, useState } from "react";
import { Download, RotateCcw, Upload, X } from "lucide-react";
import type { SavedState, Theme } from "../lib/types";
import { Notice, SelectField } from "./Fields";
import { parseState } from "../lib/plan";

export default function Settings({
  state,
  onClose,
  onTheme,
  onImport,
  onReset,
}: {
  state: SavedState;
  onClose: () => void;
  onTheme: (t: Theme) => void;
  onImport: (s: SavedState) => void;
  onReset: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    file = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{
      text: string;
      error: boolean;
    } | null>(null),
    [confirm, setConfirm] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  const exportPlan = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `AnnualPDHours-${state.activeYear}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage({
      text: "Backup downloaded. It includes all saved years and your theme.",
      error: false,
    });
  };
  return (
    <dialog
      ref={dialog}
      className="settings-dialog"
      aria-labelledby="settings-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="settings-content">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR BROWSER, YOUR PLAN</p>
            <h2 id="settings-title">Settings & backups</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close settings"
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </div>
        <SelectField
          label="Appearance"
          value={state.theme}
          onChange={(v) => onTheme(v as Theme)}
        >
          <option value="system">Follow system</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </SelectField>
        <div className="settings-section">
          <h3>Take your plans with you</h3>
          <p>
            Export all saved years as JSON. Importing replaces your browser
            plans after validation.
          </p>
          <div className="button-row">
            <button className="button secondary" onClick={exportPlan}>
              <Download size={16} /> Export JSON
            </button>
            <button
              className="button secondary"
              onClick={() => file.current?.click()}
            >
              <Upload size={16} /> Import JSON
            </button>
          </div>
          <input
            ref={file}
            className="sr-only"
            type="file"
            accept=".json,application/json"
            aria-label="Import plan JSON file"
            onChange={async (e) => {
              const chosen = e.target.files?.[0];
              e.target.value = "";
              if (!chosen) return;
              try {
                if (chosen.size > 1_000_000)
                  throw new Error("Plan file exceeds the 1 MB limit.");
                const imported = parseState(await chosen.text());
                onImport(imported);
                setMessage({
                  text: `Imported ${Object.keys(imported.plans).length} saved plan(s). Active year: ${imported.activeYear}.`,
                  error: false,
                });
                setConfirm(false);
              } catch (error) {
                setMessage({
                  text:
                    error instanceof Error
                      ? error.message
                      : "Could not read the plan file.",
                  error: true,
                });
              }
            }}
          />
        </div>
        <div className="settings-section">
          <h3>Start fresh</h3>
          <p>
            Reset this year's plan to defaults. Other saved years and your theme
            are preserved.
          </p>
          {confirm ? (
            <Notice tone="warning">
              <strong>Reset your {state.activeYear} plan?</strong>
              <p>
                This clears this year's inputs. Export a backup first if needed.
              </p>
              <div className="button-row">
                <button
                  className="button danger"
                  onClick={() => {
                    onReset();
                    setConfirm(false);
                    setMessage({
                      text: "This year was reset to defaults.",
                      error: false,
                    });
                  }}
                >
                  Reset this year
                </button>
                <button
                  className="button secondary"
                  onClick={() => setConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </Notice>
          ) : (
            <button
              className="button secondary"
              onClick={() => setConfirm(true)}
            >
              <RotateCcw size={16} /> Reset to defaults
            </button>
          )}
        </div>
        {message && (
          <div role="status">
            <Notice tone={message.error ? "warning" : "success"}>
              {message.text}
            </Notice>
          </div>
        )}
        <div className="privacy-box">
          <strong>Saved only in this browser.</strong>
          <p>
            No account, analytics, backend, or personal-data requests. Clearing
            browser storage deletes plans. JSON backups let you move between
            devices.
          </p>
        </div>
        <a
          className="source-link"
          href="https://github.com/LukeK980/AnnualPDHours"
          target="_blank"
          rel="noreferrer"
        >
          View the open-source project ↗
        </a>
      </div>
    </dialog>
  );
}
