"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

import styles from "./MicWaveform.module.css";

export type MicWaveformHandle = {
  drawWaveform: (samples: Float32Array, rms: number) => void;
};

export type MicWaveformProps = {
  active?: boolean;
  speechThreshold?: number;
};

const WAVE_COLOR_IDLE = "#6b7280";
const WAVE_COLOR_ACTIVE = "#22c55e";
const GRID_COLOR = "rgba(255, 255, 255, 0.08)";

export function paintMicWaveform(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  samples: Float32Array,
  rms: number,
  speechThreshold: number
): void {
  const speaking = rms >= speechThreshold;
  const midY = height / 2;

  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, midY);
  ctx.lineTo(width, midY);
  ctx.stroke();

  ctx.strokeStyle = speaking ? WAVE_COLOR_ACTIVE : WAVE_COLOR_IDLE;
  ctx.lineWidth = speaking ? 2 : 1.5;
  ctx.beginPath();

  const sliceWidth = width / samples.length;
  let x = 0;

  for (let i = 0; i < samples.length; i++) {
    const y = midY + samples[i] * (height * 0.42);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    x += sliceWidth;
  }

  ctx.stroke();
}

export const MicWaveform = forwardRef<MicWaveformHandle, MicWaveformProps>(function MicWaveform(
  { active = true, speechThreshold = 0.015 },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const speakingRef = useRef(false);
  const silentSamplesRef = useRef<Float32Array | null>(null);

  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }, []);

  useEffect(() => {
    syncCanvasSize();
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(syncCanvasSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [syncCanvasSize]);

  useEffect(() => {
    if (active) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    if (!silentSamplesRef.current) {
      silentSamplesRef.current = new Float32Array(512);
    }

    paintMicWaveform(
      ctx,
      canvas.clientWidth,
      canvas.clientHeight,
      silentSamplesRef.current,
      0,
      speechThreshold
    );
    speakingRef.current = false;
    containerRef.current?.setAttribute("data-speaking", "false");
  }, [active, speechThreshold]);

  useImperativeHandle(
    ref,
    () => ({
      drawWaveform(samples, rms) {
        if (!active) return;

        const canvas = canvasRef.current;
        const container = containerRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx || !container) return;

        paintMicWaveform(
          ctx,
          canvas.clientWidth,
          canvas.clientHeight,
          samples,
          rms,
          speechThreshold
        );

        const speaking = rms >= speechThreshold;
        if (speaking !== speakingRef.current) {
          speakingRef.current = speaking;
          container.setAttribute("data-speaking", speaking ? "true" : "false");
        }
      },
    }),
    [active, speechThreshold]
  );

  return (
    <div
      ref={containerRef}
      className={styles.root}
      data-active={active ? "true" : "false"}
      data-speaking="false"
      aria-live="polite"
    >
      <div className={styles.header}>
        <span className={styles.title}>Microphone</span>
        <span className={styles.statusIdle}>{active ? "Waiting for audio…" : "Inactive"}</span>
        <span className={styles.statusActive}>Receiving audio</span>
      </div>
      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      </div>
    </div>
  );
});
