import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useRef } from "react";

import {
  MicWaveform,
  paintMicWaveform,
  type MicWaveformHandle,
  type MicWaveformProps,
} from "./MicWaveform";

const meta: Meta = {
  title: "Interview/MicWaveform",
  component: MicWaveform,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 560, padding: 24, background: "#18181b" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<MicWaveformProps>;

function SilentDemo() {
  const ref = useRef<MicWaveformHandle>(null);

  useEffect(() => {
    const samples = new Float32Array(512);
    ref.current?.drawWaveform(samples, 0);
  }, []);

  return <MicWaveform ref={ref} active speechThreshold={0.015} />;
}

function AnimatedSpeechDemo({ amplitude }: { amplitude: number }) {
  const ref = useRef<MicWaveformHandle>(null);
  const samplesRef = useRef(new Float32Array(512));

  useEffect(() => {
    let frame = 0;
    let raf = 0;
    const tick = () => {
      frame += 1;
      const samples = samplesRef.current;
      for (let i = 0; i < samples.length; i++) {
        const t = (i / samples.length) * Math.PI * 8 + frame * 0.12;
        samples[i] = Math.sin(t) * amplitude;
      }
      const rms = Math.sqrt(
        samples.reduce((sum, value) => sum + value * value, 0) / samples.length
      );
      ref.current?.drawWaveform(samples, rms);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [amplitude]);

  return <MicWaveform ref={ref} active speechThreshold={0.015} />;
}

function PaintHelperDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    paintMicWaveform(ctx, canvas.width, canvas.height, new Float32Array(512), 0, 0.015);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={560}
      height={72}
      style={{ width: "100%", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}
    />
  );
}

export const Silent: Story = {
  render: () => <SilentDemo />,
};

export const ActiveSpeech: Story = {
  render: () => <AnimatedSpeechDemo amplitude={0.35} />,
};

export const Inactive: Story = {
  args: {
    active: false,
  },
};

export const PaintHelperFlatLine: Story = {
  render: () => <PaintHelperDemo />,
};
