import { useEffect, useId, useState } from "react";
import type { ReactNode } from "react";
import { validDate } from "../lib/plan";
export function NumberField({
  label,
  displayLabel,
  value,
  onChange,
  min = 0,
  max = 100000,
  unit = "hours",
  integer = false,
}: {
  label: string;
  displayLabel?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  unit?: string;
  integer?: boolean;
}) {
  const id = useId(),
    [draft, setDraft] = useState(String(value)),
    [error, setError] = useState("");
  useEffect(() => {
    setDraft(String(value));
    setError("");
  }, [value]);
  return (
    <div className="field">
      <label htmlFor={id}>{displayLabel ?? label}</label>
      <div className="input-unit">
        <input
          id={id}
          aria-label={displayLabel ? label : undefined}
          type="number"
          inputMode={integer ? "numeric" : "decimal"}
          step={integer ? 1 : "any"}
          min={min}
          max={max}
          value={draft}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => {
            const raw = e.target.value,
              n = Number(raw);
            setDraft(raw);
            if (
              !raw.trim() ||
              !Number.isFinite(n) ||
              n < min ||
              n > max ||
              (integer && !Number.isInteger(n))
            )
              setError(
                `Enter ${integer ? "a whole number" : "a number"} from ${min} to ${max}. This edit has not been applied.`,
              );
            else {
              setError("");
              onChange(n);
            }
          }}
        />
        <span>{unit}</span>
      </div>
      {error && (
        <small id={`${id}-error`} className="field-error">
          {error}
        </small>
      )}
    </div>
  );
}
export function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState("");
  useEffect(() => {
    setDraft(value);
    setError("");
  }, [value]);
  return (
    <div className="field custom-name">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        maxLength={80}
        value={draft}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => {
          setDraft(e.target.value);
          if (!e.target.value.trim())
            setError("Enter a category name. This edit has not been applied.");
          else {
            setError("");
            onChange(e.target.value);
          }
        }}
      />
      {error && (
        <small id={`${id}-error`} className="field-error">
          {error}
        </small>
      )}
    </div>
  );
}
export function SelectField({
  label,
  value,
  onChange,
  children,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={hint ? `${id}-help` : undefined}
      >
        {children}
      </select>
      {hint && <small id={`${id}-help`}>{hint}</small>}
    </div>
  );
}
export function DateField({
  label,
  value,
  onChange,
  min,
  max,
  optional = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
  optional?: boolean;
}) {
  const id = useId(),
    [draft, setDraft] = useState(value),
    [error, setError] = useState("");
  useEffect(() => {
    setDraft(value);
    setError("");
  }, [value]);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="date"
        value={draft}
        min={min}
        max={max}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => {
          const date = e.target.value;
          setDraft(date);
          if (
            (!date && !optional) ||
            (date &&
              (!validDate(date) || (min && date < min) || (max && date > max)))
          )
            setError(
              "Choose a valid date in the allowed year. This edit has not been applied.",
            );
          else {
            setError("");
            onChange(date);
          }
        }}
      />
      {error && (
        <small id={`${id}-error`} className="field-error">
          {error}
        </small>
      )}
    </div>
  );
}
export function Notice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "warning" | "success";
}) {
  return (
    <div
      className={`notice ${tone}`}
      role={tone === "warning" ? "status" : undefined}
    >
      {children}
    </div>
  );
}
