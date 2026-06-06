"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  INTRO_QUESTION,
  MAX_INTERVIEW_QUESTIONS,
  pickRandomQuestion,
  type InterviewQuestion,
} from "@/lib/prompts/questions";
import { INTERVIEWERS, DEFAULT_INTERVIEWER, type Interviewer } from "@/lib/prompts/interviewers";
import { MicWaveform, type MicWaveformHandle } from "@/app/components/MicWaveform/MicWaveform";
import { ScorecardPanel } from "@/app/scorecard/ScorecardPanel";
import { SessionScorecardPanel } from "@/app/scorecard/SessionScorecardPanel";
import { buildReviewContext } from "@/lib/interview-coach/sessionAdapter";
import type {
  FeedbackMode,
  ReviewContextPayload,
  SessionReviewPayload,
} from "@/lib/interview-coach/types";
import styles from "./InterviewClient.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const CHUNK_INTERVAL_MS = 15_000;
const SILENCE_THRESHOLD = 0.015;
const SILENCE_BEFORE_PROMPT_MS = 3_000;
const SILENCE_AFTER_PROMPT_MS = 8_000;

type Stage = "idle" | "playing" | "recording" | "processing" | "done" | "finished";

interface Segment {
  start: number;
  end: number;
  text: string;
  arousal: number;
  dominance: number;
  valence: number;
}

function upsertAnswer(
  answers: ReviewContextPayload[],
  next: ReviewContextPayload
): ReviewContextPayload[] {
  const rest = answers.filter((a) => a.question.id !== next.question.id);
  return [...rest, next];
}

function buildIntro(interviewer: Interviewer): string {
  return `Hi there, welcome. I'm ${interviewer.name}, ${interviewer.title}. Thank you so much for coming in today — we're really glad to have you. Let's go ahead and get started.`;
}

async function speakWithGroq(text: string, voice: string, signal: AbortSignal): Promise<void> {
  const res = await fetch(`${API_BASE}/speech/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice }),
    signal,
  });
  if (!res.ok) throw new Error(`TTS ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Audio playback failed"));
    };
    audio.play();
  });
}

export default function InterviewClient() {
  const [interviewer, setInterviewer] = useState<Interviewer>(DEFAULT_INTERVIEWER);
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>("perQuestion");
  const [question, setQuestion] = useState<InterviewQuestion | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [stage, setStage] = useState<Stage>("idle");
  const [showQuestion, setShowQuestion] = useState(false);
  const [showDonePrompt, setShowDonePrompt] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [savedAnswers, setSavedAnswers] = useState<ReviewContextPayload[]>([]);
  const [reviewContext, setReviewContext] = useState<ReviewContextPayload | null>(null);
  const [sessionPayload, setSessionPayload] = useState<SessionReviewPayload | null>(null);
  const [statusText, setStatusText] = useState(
    "Select your interviewer, feedback timing, and press Start Interview."
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const accumulatedRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSpokeRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const usedIdsRef = useRef<Set<number>>(new Set());
  const pendingEndRef = useRef(false);
  const questionRef = useRef<InterviewQuestion | null>(null);
  const savedAnswersRef = useRef<ReviewContextPayload[]>([]);
  const waveformRef = useRef<MicWaveformHandle>(null);

  useEffect(() => {
    questionRef.current = question;
  }, [question]);

  useEffect(() => {
    savedAnswersRef.current = savedAnswers;
  }, [savedAnswers]);

  const newAbort = useCallback((): AbortSignal => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    return ctrl.signal;
  }, []);

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const resetInterview = useCallback(() => {
    abortRef.current?.abort();
    clearTimers();
    pendingEndRef.current = false;
    usedIdsRef.current.clear();
    setQuestion(null);
    setQuestionNumber(0);
    setSegments([]);
    setSavedAnswers([]);
    setReviewContext(null);
    setSessionPayload(null);
    setShowQuestion(false);
    setShowDonePrompt(false);
    setStage("idle");
    setStatusText("Select your interviewer, feedback timing, and press Start Interview.");
  }, [clearTimers]);

  const finishInterview = useCallback(
    (answers: ReviewContextPayload[]) => {
      abortRef.current?.abort();
      clearTimers();
      pendingEndRef.current = false;

      if (feedbackMode === "endOfInterview" && answers.length > 0) {
        setSavedAnswers(answers);
        setSessionPayload({ answers });
        setReviewContext(null);
        setShowQuestion(false);
        setStage("finished");
        setStatusText("Interview complete. Review your session feedback below.");
        return;
      }

      resetInterview();
      if (answers.length > 0) {
        setStatusText("Interview ended.");
      }
    },
    [clearTimers, feedbackMode, resetInterview]
  );

  const stopRecording = useCallback(() => {
    clearTimers();
    setShowDonePrompt(false);
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
  }, [clearTimers]);

  const sendAudio = useCallback(
    async (blob: Blob) => {
      setStage("processing");
      setStatusText("Transcribing and scoring your answer…");
      const ext = blob.type.includes("mp4") ? ".mp4" : blob.type.includes("ogg") ? ".ogg" : ".webm";
      const form = new FormData();
      form.append("file", blob, `answer${ext}`);
      const signal = newAbort();
      const activeQuestion = questionRef.current;
      try {
        const res = await fetch(`${API_BASE}/speech/transcribe`, {
          method: "POST",
          body: form,
          signal,
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const data: Segment[] = await res.json();
        setSegments(data);

        if (pendingEndRef.current && activeQuestion) {
          const answers = upsertAnswer(
            savedAnswersRef.current,
            buildReviewContext(activeQuestion, data)
          );
          finishInterview(answers);
          return;
        }

        setStage("done");
        setStatusText("Answer received. Review your response or move to the next question.");
      } catch (err) {
        pendingEndRef.current = false;
        setStatusText(`Error: ${err}. Try again.`);
        setStage("idle");
      }
    },
    [finishInterview, newAbort]
  );

  const startRecording = useCallback(async () => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      alert("Microphone access denied.");
      setStage("idle");
      return;
    }

    accumulatedRef.current = [];
    hasSpokeRef.current = false;
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
    const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    mediaRecorderRef.current = mr;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const buf = new Float32Array(analyser.fftSize);

    const showPrompt = () => {
      setShowDonePrompt(true);
      setStatusText("It looks like you've paused. Are you finished answering?");
      autoStopTimerRef.current = setTimeout(() => stopRecording(), SILENCE_AFTER_PROMPT_MS);
    };

    const checkSilence = () => {
      if (!audioCtxRef.current) return;
      analyser.getFloatTimeDomainData(buf);
      const rms = Math.sqrt(buf.reduce((s, v) => s + v * v, 0) / buf.length);
      waveformRef.current?.drawWaveform(buf, rms);
      if (rms >= SILENCE_THRESHOLD) {
        hasSpokeRef.current = true;
        setShowDonePrompt(false);
        clearTimers();
        setStatusText('Recording… press "I\'m Done Answering" when finished.');
      } else if (hasSpokeRef.current && !silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(showPrompt, SILENCE_BEFORE_PROMPT_MS);
      }
      rafRef.current = requestAnimationFrame(checkSilence);
    };
    rafRef.current = requestAnimationFrame(checkSilence);

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) accumulatedRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(accumulatedRef.current, { type: mimeType || "audio/webm" });
      if (blob.size > 0) sendAudio(blob);
    };

    mr.start(CHUNK_INTERVAL_MS);
    setStage("recording");
    setStatusText('Recording… press "I\'m Done Answering" when finished.');
  }, [sendAudio, stopRecording, clearTimers]);

  const startInterview = useCallback(async () => {
    usedIdsRef.current.clear();
    pendingEndRef.current = false;
    setSavedAnswers([]);
    setReviewContext(null);
    setSessionPayload(null);
    const signal = newAbort();
    const firstQuestion = INTRO_QUESTION;
    setQuestion(firstQuestion);
    setQuestionNumber(1);
    setSegments([]);
    setShowQuestion(false);
    setStage("playing");
    setStatusText(`${interviewer.name} is introducing themselves…`);

    try {
      await speakWithGroq(buildIntro(interviewer), interviewer.voice, signal);
      setStatusText(`${interviewer.name} is asking the first question…`);
      await speakWithGroq(firstQuestion.text, interviewer.voice, signal);
    } catch {
      setStatusText("Could not load audio — check the backend is running.");
      setStage("idle");
      return;
    }

    setShowQuestion(true);
    startRecording();
  }, [interviewer, newAbort, startRecording]);

  const commitCurrentAnswer = useCallback((): ReviewContextPayload[] => {
    if (!question || segments.length === 0) return savedAnswers;
    return upsertAnswer(savedAnswers, buildReviewContext(question, segments));
  }, [question, segments, savedAnswers]);

  const nextQuestion = useCallback(async () => {
    const answers = commitCurrentAnswer();
    setSavedAnswers(answers);
    stopRecording();
    const signal = newAbort();
    const next = pickRandomQuestion(usedIdsRef.current);
    setQuestion(next);
    setQuestionNumber((n) => n + 1);
    setSegments([]);
    setReviewContext(null);
    setShowQuestion(false);
    setShowDonePrompt(false);
    setStage("playing");
    setStatusText(`${interviewer.name} is asking the next question…`);

    try {
      await speakWithGroq(next.text, interviewer.voice, signal);
    } catch {
      setStatusText("Could not load audio — check the backend is running.");
      setStage("idle");
      return;
    }

    setShowQuestion(true);
    startRecording();
  }, [commitCurrentAnswer, interviewer, newAbort, stopRecording, startRecording]);

  const endInterview = useCallback(() => {
    if (stage === "recording") {
      pendingEndRef.current = true;
      stopRecording();
      setStatusText("Finishing your answer…");
      return;
    }

    if (stage === "processing") {
      pendingEndRef.current = true;
      setStatusText("Finishing your answer…");
      return;
    }

    if (stage === "playing") {
      abortRef.current?.abort();
    }

    finishInterview(commitCurrentAnswer());
  }, [commitCurrentAnswer, finishInterview, stage, stopRecording]);

  const viewFeedback = useCallback(() => {
    if (!question || segments.length === 0) return;
    setReviewContext(buildReviewContext(question, segments));
  }, [question, segments]);

  const dismissFeedback = useCallback(() => {
    setReviewContext(null);
  }, []);

  const interviewActive = stage !== "idle" && stage !== "finished";
  const hasMoreQuestions = questionNumber < MAX_INTERVIEW_QUESTIONS;
  const showPerQuestionFeedback = feedbackMode === "perQuestion" && stage === "done";

  const dotClass = [
    styles.dot,
    stage === "playing" ? styles.playing : "",
    stage === "recording" ? styles.recording : "",
    stage === "processing" ? styles.processing : "",
    stage === "done" || stage === "finished" ? styles.done : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.meta}>
          <span>Interview Coach</span>
          {questionNumber > 0 && stage !== "finished" && (
            <>
              <span>·</span>
              <span>
                Question {questionNumber} of {MAX_INTERVIEW_QUESTIONS}
              </span>
            </>
          )}
        </div>

        {showQuestion && question && <p className={styles.question}>{question.text}</p>}

        {stage === "playing" && !showQuestion && (
          <p className={styles.questionPlaceholder}>{interviewer.name} is speaking…</p>
        )}

        <div className={styles.interviewerRow}>
          <label className={styles.interviewerLabel} htmlFor="interviewer-select">
            Interviewer
          </label>
          <select
            id="interviewer-select"
            className={styles.interviewerSelect}
            value={interviewer.voice}
            onChange={(e) => {
              const found = INTERVIEWERS.find((i) => i.voice === e.target.value);
              if (found) setInterviewer(found);
            }}
            disabled={stage !== "idle"}
          >
            {INTERVIEWERS.map((i) => (
              <option key={i.voice} value={i.voice}>
                {i.name} — {i.title}
              </option>
            ))}
          </select>
        </div>

        <fieldset className={styles.feedbackModeFieldset} disabled={stage !== "idle"}>
          <legend className={styles.feedbackModeLegend}>Feedback timing</legend>
          <label className={styles.feedbackModeOption}>
            <input
              type="radio"
              name="feedback-mode"
              value="perQuestion"
              checked={feedbackMode === "perQuestion"}
              onChange={() => setFeedbackMode("perQuestion")}
            />
            After each question
          </label>
          <label className={styles.feedbackModeOption}>
            <input
              type="radio"
              name="feedback-mode"
              value="endOfInterview"
              checked={feedbackMode === "endOfInterview"}
              onChange={() => setFeedbackMode("endOfInterview")}
            />
            At end of interview
          </label>
        </fieldset>

        <div className={styles.divider} />

        <div className={styles.statusRow}>
          <span className={dotClass} />
          <span>{statusText}</span>
        </div>

        {stage === "recording" && (
          <MicWaveform ref={waveformRef} active speechThreshold={SILENCE_THRESHOLD} />
        )}

        {showDonePrompt && (
          <div className={styles.donePrompt}>
            <span>It looks like you&apos;ve paused. Are you finished answering?</span>
            <div className={styles.promptActions}>
              <button className={styles.btnDanger} onClick={stopRecording}>
                Yes, I&apos;m Done
              </button>
              <button
                className={styles.btnSecondary}
                onClick={() => {
                  clearTimers();
                  setShowDonePrompt(false);
                  setStatusText("Recording… continue when ready.");
                }}
              >
                Keep Going
              </button>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          {stage === "idle" && (
            <button className={styles.btnPrimary} onClick={startInterview}>
              Start Interview
            </button>
          )}

          {stage === "recording" && !showDonePrompt && (
            <button className={styles.btnDanger} onClick={stopRecording}>
              I&apos;m Done Answering
            </button>
          )}

          {stage === "done" && (
            <>
              {hasMoreQuestions && (
                <button className={styles.btnPrimary} onClick={nextQuestion}>
                  Next Question
                </button>
              )}
              {showPerQuestionFeedback && (
                <button
                  className={styles.btnSecondary}
                  onClick={reviewContext ? dismissFeedback : viewFeedback}
                  disabled={segments.length === 0}
                >
                  {reviewContext ? "Hide Feedback" : "View Feedback"}
                </button>
              )}
            </>
          )}

          {interviewActive && (
            <button className={styles.btnSecondary} onClick={endInterview}>
              End Interview
            </button>
          )}

          {stage === "finished" && (
            <button className={styles.btnPrimary} onClick={resetInterview}>
              Start New Interview
            </button>
          )}
        </div>

        {segments.length > 0 && stage !== "finished" && (
          <>
            <div className={styles.divider} />
            <div className={styles.segments}>
              {segments.map((seg, i) => (
                <div key={i} className={styles.segment}>
                  <div className={styles.segmentTime}>
                    {seg.start.toFixed(2)}s – {seg.end.toFixed(2)}s
                  </div>
                  <div>{seg.text}</div>
                  <div className={styles.segmentScores}>
                    <span>A {seg.arousal.toFixed(2)}</span>
                    <span>D {seg.dominance.toFixed(2)}</span>
                    <span>V {seg.valence.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {reviewContext && (
          <>
            <div className={styles.divider} />
            <ScorecardPanel sessionInput={reviewContext} showShellBadge={false} />
          </>
        )}

        {sessionPayload && stage === "finished" && (
          <>
            <div className={styles.divider} />
            <SessionScorecardPanel sessionInput={sessionPayload} />
          </>
        )}
      </div>
    </div>
  );
}
