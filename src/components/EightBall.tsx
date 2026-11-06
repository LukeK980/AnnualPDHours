import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { classicAnswers, smartAnswer } from "../lib/eightBall";
import type { CalculationResult } from "../lib/types";
import { hours } from "../lib/format";

export default function EightBall({ result }: { result: CalculationResult }) {
  const [mode, setMode] = useState<"classic" | "smart">("classic"),
    [question, setQuestion] = useState(""),
    [answer, setAnswer] = useState(""),
    [answerMode, setAnswerMode] = useState(mode),
    [shaking, setShaking] = useState(false);
  const reduced = useReducedMotion(),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const shake = () => {
    if (shaking) return;
    const response =
      mode === "smart"
        ? smartAnswer(question, result)
        : classicAnswers[Math.floor(Math.random() * classicAnswers.length)];
    setShaking(true);
    setAnswer("");
    timer.current = setTimeout(
      () => {
        setAnswer(response);
        setAnswerMode(mode);
        setShaking(false);
      },
      reduced ? 0 : 850,
    );
  };
  return (
    <div className="eight-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">A LITTLE WISDOM. A LITTLE WHIMSY.</p>
          <h1>
            Ask the PD universe<span className="heading-dot">.</span>
          </h1>
          <p>Big learning plans? A little perspective is just a shake away.</p>
        </div>
      </div>
      <div className="eight-layout">
        <section className="ball-stage">
          <div className="orbital orbit-one" />
          <div className="orbital orbit-two" />
          <span className="star star-one">✦</span>
          <span className="star star-two">✧</span>
          <span className="star star-three">✦</span>
          <motion.div
            className="magic-ball"
            role="img"
            aria-label={
              shaking
                ? "Magic 8-Ball is shaking"
                : "Professional development Magic 8-Ball"
            }
            animate={
              shaking && !reduced
                ? {
                    rotate: [0, -12, 10, -9, 7, -4, 0],
                    x: [0, -12, 12, -8, 8, 0],
                  }
                : { rotate: 0, x: 0 }
            }
            transition={{ duration: 0.8 }}
          >
            <div className="ball-eight">8</div>
            <div className="ball-window">
              <span>{shaking ? "✦" : "PD"}</span>
            </div>
          </motion.div>
          <div className="ball-shadow" />
          <span className="stage-label">YOUR NEXT CHAPTER LOOKS BRIGHT</span>
        </section>
        <section className="card eight-controls">
          <div className="mode-switch" role="group" aria-label="Answer mode">
            <button
              aria-pressed={mode === "classic"}
              onClick={() => setMode("classic")}
              disabled={shaking}
            >
              Classic Mode
            </button>
            <button
              aria-pressed={mode === "smart"}
              onClick={() => setMode("smart")}
              disabled={shaking}
            >
              <Sparkles size={15} /> Smart Mode
            </button>
          </div>
          <p className="mode-description">
            {mode === "smart"
              ? "Calculated answers using your annual plan. No external AI."
              : "Playful answers from the universe. For entertainment only."}
          </p>
          <div className="capacity-chip">
            <Sparkles size={17} />
            <span>Available non-billable hours</span>
            <strong>{hours(result.availableNonBillableHours)} h</strong>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              shake();
            }}
          >
            <label htmlFor="pd-question">What would you like to know?</label>
            <input
              id="pd-question"
              type="text"
              maxLength={300}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Can I attend a 24-hour conference?"
              disabled={shaking}
            />
            <button
              className="button primary shake-button"
              type="submit"
              disabled={shaking || !question.trim()}
            >
              <Sparkles size={18} />
              {shaking ? "Consulting the universe…" : "Shake the 8-Ball"}
            </button>
          </form>
          <div className="suggestions">
            <span>NEED A LITTLE INSPIRATION?</span>
            {[
              "Can I attend a 24-hour conference?",
              "How many PD hours do I have?",
              "What is my weekly billable requirement?",
            ].map((q) => (
              <button
                key={q}
                disabled={shaking}
                onClick={() => {
                  setQuestion(q);
                  document.getElementById("pd-question")?.focus();
                }}
              >
                {q}
                <ArrowUpRight size={15} />
              </button>
            ))}
          </div>
          <div
            className={`answer-box ${answer ? "has-answer" : ""}`}
            aria-live="polite"
            aria-atomic="true"
            aria-busy={shaking}
          >
            {answer ? (
              <>
                <span className="eyebrow">
                  {answerMode === "smart"
                    ? "CALCULATED FROM YOUR PLAN"
                    : "JUST FOR FUN"}
                </span>
                <p>{answer}</p>
              </>
            ) : (
              <p>
                {shaking
                  ? "A moment of cosmic contemplation…"
                  : "Ask a question and give it a shake. Your answer will appear here."}
              </p>
            )}
          </div>
          <p className="small-note">
            Smart Mode uses estimated remaining non-billable availability after
            taken hours and future plans. It does not reserve event dates or
            grant company approval. Answers reflect the plan when you shake;
            shake again after changes.
          </p>
        </section>
      </div>
    </div>
  );
}
