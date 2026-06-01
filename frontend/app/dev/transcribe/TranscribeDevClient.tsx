"use client";

import { useCallback, useRef, useState } from "react";
import styles from "./TranscribeDevClient.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
// Emit a chunk every N milliseconds while recording.
const CHUNK_INTERVAL_MS = 15_000;

interface Segment {
  start: number;
  end: number;
  text: string;
  arousal: number;
  dominance: number;
  valence: number;
}

interface ChunkEntry {
  id: number;
  sentAt: string;
  byteSize: number;
  status: "pending" | "done" | "error";
  segments: Segment[];
  error?: string;
}

export default function TranscribeDevClient() {
  const [recording, setRecording] = useState(false);
  const [chunks, setChunks] = useState<ChunkEntry[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunkIdRef = useRef(0);
  // Accumulate all raw blobs so each send is a valid, complete WebM file.
  const accumulatedRef = useRef<Blob[]>([]);

  const sendChunk = useCallback(async (blob: Blob, id: number) => {
    const form = new FormData();
    form.append("file", blob, `chunk-${id}.webm`);

    setChunks((prev) => prev.map((c) => (c.id === id ? { ...c, status: "pending" } : c)));

    try {
      const res = await fetch(`${API_BASE}/speech/transcribe`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      const segments: Segment[] = await res.json();
      setChunks((prev) => prev.map((c) => (c.id === id ? { ...c, status: "done", segments } : c)));
    } catch (err) {
      setChunks((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "error", error: String(err) } : c))
      );
    }
  }, []);

  const start = useCallback(async () => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      alert("Microphone access denied.");
      return;
    }

    const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
    mediaRecorderRef.current = mr;
    setChunks([]);
    chunkIdRef.current = 0;
    accumulatedRef.current = [];

    mr.ondataavailable = (e) => {
      if (e.data.size === 0) return;
      accumulatedRef.current.push(e.data);
      // Send the full accumulated audio so Groq always receives a valid WebM file.
      const fullBlob = new Blob(accumulatedRef.current, { type: "audio/webm" });
      const id = ++chunkIdRef.current;
      const entry: ChunkEntry = {
        id,
        sentAt: new Date().toLocaleTimeString(),
        byteSize: fullBlob.size,
        status: "pending",
        segments: [],
      };
      setChunks((prev) => [...prev, entry]);
      sendChunk(fullBlob, id);
    };

    mr.start(CHUNK_INTERVAL_MS);
    setRecording(true);
  }, [sendChunk]);

  const stop = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    setRecording(false);
  }, []);

  const sentPanel = chunks.map((c) => (
    <div key={c.id} className={styles.chunkEntry}>
      <div className={styles.chunkLabel}>
        Chunk {c.id} — {c.sentAt} — {(c.byteSize / 1024).toFixed(1)} KB
      </div>
      {c.status === "pending" && <div className={styles.chunkPending}>⏳ waiting…</div>}
      {c.status === "error" && <div className={styles.chunkError}>✗ {c.error}</div>}
      {c.status === "done" && <div>{c.segments.length} segment(s) returned</div>}
    </div>
  ));

  // Always show segments from the latest chunk that has returned results.
  const latestDone = [...chunks].reverse().find((c) => c.status === "done");
  const resultPanel = (latestDone?.segments ?? []).map((seg, i) => (
    <div key={i} className={styles.segment}>
      <div className={styles.segmentTime}>
        {seg.start.toFixed(2)}s – {seg.end.toFixed(2)}s
      </div>
      <div className={styles.segmentText}>{seg.text}</div>
      <div className={styles.scores}>
        <span>A {seg.arousal.toFixed(2)}</span>
        <span>D {seg.dominance.toFixed(2)}</span>
        <span>V {seg.valence.toFixed(2)}</span>
      </div>
    </div>
  ));

  return (
    <div className={styles.page}>
      <h1>Dev — Transcribe + Emotion</h1>
      <p>
        Chunks audio every {CHUNK_INTERVAL_MS / 1000}s and sends each to{" "}
        <code>POST /speech/transcribe</code> while you speak. Results appear as each chunk returns.
      </p>

      <div className={styles.controls}>
        <button className={styles.startBtn} onClick={start} disabled={recording}>
          Start Interview
        </button>
        <button className={styles.stopBtn} onClick={stop} disabled={!recording}>
          Stop
        </button>
        <span className={recording ? styles.recording : styles.status}>
          {recording ? "● Recording" : "Idle"}
        </span>
      </div>

      <div className={styles.columns}>
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Sent chunks</div>
          {sentPanel.length === 0 ? (
            <div className={styles.empty}>Nothing sent yet</div>
          ) : (
            sentPanel
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTitle}>Returned segments</div>
          {resultPanel.length === 0 ? (
            <div className={styles.empty}>No results yet</div>
          ) : (
            resultPanel
          )}
        </div>
      </div>
    </div>
  );
}
