import type { Meta, StoryObj } from "@storybook/react";

import { mockTranscriptScores } from "@/lib/interview-coach/mocks";

import { TranscriptFeedbackScores } from "./TranscriptFeedbackScores";

const meta: Meta<typeof TranscriptFeedbackScores> = {
  title: "Scorecard/TranscriptFeedbackScores",
  component: TranscriptFeedbackScores,
};

export default meta;

type Story = StoryObj<typeof TranscriptFeedbackScores>;

export const Loading: Story = {
  args: { loading: true },
};

export const Populated: Story = {
  args: { scores: mockTranscriptScores },
};

export const Empty: Story = {
  args: { scores: null },
};
