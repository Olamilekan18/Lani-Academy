// ---------------------------------------------------------------------------
// LANI "Ask AI" course assistant — service layer.
//
// This is intentionally a thin, swappable stub. When the model (Gemini or
// whatever we settle on) and its API key are ready, implement `callModel`
// below and everything else — the UI, message history, course context — keeps
// working unchanged.
// ---------------------------------------------------------------------------

export interface AskAIMessage {
  role: "user" | "assistant";
  content: string;
}

/** Context passed to the assistant so answers stay grounded in the course. */
export interface AskCourseContext {
  courseTitle: string;
  courseCode?: string;
  moduleTitle?: string;
  lessonTitle?: string;
  shortDescription?: string;
  outcomes?: string[];
}

// Set VITE_AI_API_KEY (and optionally VITE_AI_MODEL) in your env once a
// provider is connected. Until then the assistant runs in preview mode.
const AI_API_KEY = (import.meta as any).env?.VITE_AI_API_KEY as string | undefined;
export const AI_MODEL = ((import.meta as any).env?.VITE_AI_MODEL as string | undefined) || "gemini";
export const AI_ENABLED = Boolean(AI_API_KEY);

/** Build the system prompt from the course context. */
export function buildSystemPrompt(ctx: AskCourseContext): string {
  const lines = [
    "You are the LANI Academy study assistant. Help the learner understand this course.",
    "Be concise, encouraging, and accurate. If you are unsure, say so.",
    `Course: ${ctx.courseTitle}${ctx.courseCode ? ` (${ctx.courseCode})` : ""}.`,
  ];
  if (ctx.moduleTitle) lines.push(`Current module: ${ctx.moduleTitle}.`);
  if (ctx.lessonTitle) lines.push(`Current lesson: ${ctx.lessonTitle}.`);
  if (ctx.shortDescription) lines.push(`Overview: ${ctx.shortDescription}`);
  if (ctx.outcomes?.length) lines.push(`Learning outcomes: ${ctx.outcomes.join("; ")}.`);
  return lines.join("\n");
}

/**
 * The single integration point. Replace the body with a real model call, e.g.:
 *
 *   const res = await fetch(`https://.../models/${AI_MODEL}:generateContent?key=${AI_API_KEY}`, {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ system: buildSystemPrompt(ctx), contents: [...history, question] }),
 *   });
 *   const json = await res.json();
 *   return json.candidates[0].content.parts[0].text;
 */
async function callModel(
  _question: string,
  _ctx: AskCourseContext,
  _history: AskAIMessage[]
): Promise<string> {
  throw new Error("AI model not implemented yet");
}

/** Public entry point used by the UI. Falls back to a preview reply. */
export async function askCourseQuestion(
  question: string,
  ctx: AskCourseContext,
  history: AskAIMessage[] = []
): Promise<string> {
  if (AI_ENABLED) {
    try {
      return await callModel(question, ctx, history);
    } catch (err) {
      console.error("Ask AI model call failed:", err);
      // fall through to preview reply
    }
  }
  return previewReply(question, ctx);
}

function previewReply(question: string, ctx: AskCourseContext): string {
  const where = ctx.lessonTitle
    ? `"${ctx.lessonTitle}"${ctx.moduleTitle ? ` in ${ctx.moduleTitle}` : ""}`
    : ctx.courseTitle;
  return [
    `I'm the LANI AI study assistant for ${where}.`,
    "",
    `You asked: "${question.trim()}"`,
    "",
    "The AI model isn't connected yet, so this is a preview. Once it's wired up, " +
      "I'll answer using this course's content — explaining concepts, summarising " +
      "lessons, quizzing you, and pointing you to the right materials.",
  ].join("\n");
}
