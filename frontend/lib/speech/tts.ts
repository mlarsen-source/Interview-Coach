const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Groq Orpheus TTS input limit (https://console.groq.com/docs/text-to-speech/orpheus). */
export const GROQ_TTS_MAX_CHARS = 200;

/** Split long text into chunks that fit Groq's TTS character limit. */
export function splitTextForTts(text: string, maxChars = GROQ_TTS_MAX_CHARS): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= maxChars) return [trimmed];

  const chunks: string[] = [];
  let remaining = trimmed;

  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      chunks.push(remaining);
      break;
    }

    let sliceEnd = maxChars;
    const window = remaining.slice(0, maxChars);
    const sentenceBreak = Math.max(
      window.lastIndexOf(". "),
      window.lastIndexOf("! "),
      window.lastIndexOf("? ")
    );
    if (sentenceBreak >= maxChars * 0.35) {
      sliceEnd = sentenceBreak + 1;
    } else {
      const spaceBreak = window.lastIndexOf(" ");
      if (spaceBreak > 0) sliceEnd = spaceBreak;
    }

    const chunk = remaining.slice(0, sliceEnd).trim();
    if (!chunk) {
      chunks.push(remaining.slice(0, maxChars));
      remaining = remaining.slice(maxChars).trimStart();
      continue;
    }

    chunks.push(chunk);
    remaining = remaining.slice(sliceEnd).trimStart();
  }

  return chunks;
}

async function playWavBlob(blob: Blob, signal: AbortSignal): Promise<void> {
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    const cleanup = () => {
      signal.removeEventListener("abort", onAbort);
      URL.revokeObjectURL(url);
    };
    const onAbort = () => {
      audio.pause();
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort);
    audio.onended = () => {
      cleanup();
      resolve();
    };
    audio.onerror = () => {
      cleanup();
      reject(new Error("Audio playback failed"));
    };
    void audio.play().catch((err) => {
      cleanup();
      reject(err);
    });
  });
}

async function fetchTtsAudio(text: string, voice: string, signal: AbortSignal): Promise<Blob> {
  const res = await fetch(`${API_BASE}/speech/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice }),
    signal,
  });
  if (!res.ok) throw new Error(`TTS ${res.status}`);
  return res.blob();
}

/**
 * Fetch WAV audio from POST /speech/tts and play it to completion (or until aborted).
 * Long text is split into ≤200-character chunks and played sequentially.
 */
export async function speakWithGroq(
  text: string,
  voice: string,
  signal: AbortSignal
): Promise<void> {
  const chunks = splitTextForTts(text);
  for (const chunk of chunks) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const blob = await fetchTtsAudio(chunk, voice, signal);
    await playWavBlob(blob, signal);
  }
}
