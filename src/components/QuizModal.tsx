import React, { useEffect, useMemo, useState } from "react";
import { X, ClipboardCheck, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, Loader2, Award } from "lucide-react";
import type { Quiz } from "../lib/types";

interface QuizModalProps {
  quiz: Quiz;
  onClose: () => void;
  onSubmit: (answers: number[], score: number, passed: boolean) => Promise<void> | void;
}

export default function QuizModal({ quiz, onClose, onSubmit }: QuizModalProps) {
  const total = quiz.questions.length;
  const [answers, setAnswers] = useState<number[]>(() => Array(total).fill(-1));
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(quiz.timeLimitMinutes > 0 ? quiz.timeLimitMinutes * 60 : 0);

  const answeredCount = answers.filter((a) => a >= 0).length;
  const allAnswered = answeredCount === total;
  const q = quiz.questions[current];

  const score = useMemo(() => {
    const correct = quiz.questions.reduce((n, ques, i) => n + (answers[i] === ques.correctIndex ? 1 : 0), 0);
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  }, [answers, quiz.questions, total]);

  const doSubmit = async () => {
    if (submitting || result) return;
    setSubmitting(true);
    const passed = score >= quiz.passingScore;
    try {
      await onSubmit(answers, score, passed);
      setResult({ score, passed });
    } finally {
      setSubmitting(false);
    }
  };

  // Countdown timer (auto-submits at zero)
  useEffect(() => {
    if (quiz.timeLimitMinutes <= 0 || result) return;
    if (secondsLeft <= 0) {
      void doSubmit();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, result]);

  const mmss = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  const setAnswer = (optIndex: number) =>
    setAnswers((prev) => prev.map((a, i) => (i === current ? optIndex : a)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-lani-navy/70 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-lani-navy">
              <ClipboardCheck size={18} className="text-lani-green" />
              {quiz.title}
            </h3>
            <p className="text-xs text-slate-500">{quiz.courseTitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {quiz.timeLimitMinutes > 0 && !result && (
              <span className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${secondsLeft <= 30 ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"}`}>
                <Clock size={13} /> {mmss}
              </span>
            )}
            <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-lani-navy">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Result screen */}
        {result ? (
          <div className="overflow-y-auto p-8 text-center">
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${result.passed ? "bg-lani-green/10 text-lani-green" : "bg-red-50 text-red-500"}`}>
              {result.passed ? <Award size={40} /> : <XCircle size={40} />}
            </div>
            <h4 className="mt-4 text-2xl font-extrabold text-lani-navy">{result.passed ? "Passed!" : "Not passed"}</h4>
            <p className="mt-1 text-sm text-slate-500">
              You scored <strong className="text-lani-navy">{result.score}%</strong> (pass mark {quiz.passingScore}%).
            </p>

            {/* Per-question review */}
            <div className="mt-6 space-y-3 text-left">
              {quiz.questions.map((ques, i) => {
                const chosen = answers[i];
                const correct = chosen === ques.correctIndex;
                return (
                  <div key={ques.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start gap-2">
                      {correct ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-lani-green" /> : <XCircle size={16} className="mt-0.5 shrink-0 text-red-500" />}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-lani-navy">{i + 1}. {ques.question}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Your answer: <span className={correct ? "font-semibold text-lani-green" : "font-semibold text-red-500"}>{chosen >= 0 ? ques.options[chosen] : "— (blank)"}</span>
                        </p>
                        {!correct && (
                          <p className="text-xs text-slate-500">Correct answer: <span className="font-semibold text-lani-navy">{ques.options[ques.correctIndex]}</span></p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={onClose} className="btn-primary mt-6 w-full justify-center">Finish</button>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="px-6 pt-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Question {current + 1} of {total}</span>
                <span>{answeredCount}/{total} answered</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-lani-green transition-all" style={{ width: `${((current + 1) / total) * 100}%` }} />
              </div>
            </div>

            {/* Question */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <p className="text-base font-bold text-lani-navy">{q?.question}</p>
              <div className="mt-4 grid gap-3">
                {q?.options.map((opt, oi) => {
                  const selected = answers[current] === oi;
                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => setAnswer(oi)}
                      className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm transition-all ${selected ? "border-lani-green bg-lani-green/5 text-lani-navy ring-1 ring-lani-green" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${selected ? "border-lani-green bg-lani-green text-white" : "border-slate-300 text-slate-400"}`}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="font-medium">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer nav */}
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                disabled={current === 0}
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                className="btn-secondary min-h-10 px-4 text-xs disabled:opacity-40"
              >
                <ChevronLeft size={15} /> Previous
              </button>

              {current < total - 1 ? (
                <button type="button" onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))} className="btn-primary min-h-10 px-4 text-xs">
                  Next <ChevronRight size={15} />
                </button>
              ) : (
                <button type="button" onClick={doSubmit} disabled={!allAnswered || submitting} className="btn-primary min-h-10 px-5 text-xs disabled:opacity-50" title={!allAnswered ? "Answer all questions first" : ""}>
                  {submitting ? <><Loader2 size={15} className="animate-spin" /> Submitting...</> : <>Submit Quiz</>}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
