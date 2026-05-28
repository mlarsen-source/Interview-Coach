import type { Meta, StoryObj } from "@storybook/react";

import {
  mockDeliveryScores,
  mockModelAnswer,
  mockQualitativeFeedback,
  mockQuestion,
  mockTranscript,
  mockTranscriptScores,
} from "@/lib/interview-coach/mocks";

import { Scorecard } from "./Scorecard";

const meta: Meta<typeof Scorecard> = {
  title: "Scorecard/Scorecard",
  component: Scorecard,
};

export default meta;

type Story = StoryObj<typeof Scorecard>;

export const Empty: Story = {
  args: {},
};

export const PartialScoresOnly: Story = {
  args: {
    question: mockQuestion,
    transcript: mockTranscript,
    deliveryScores: mockDeliveryScores,
    transcriptScores: mockTranscriptScores,
  },
};

export const Full: Story = {
  args: {
    question: mockQuestion,
    transcript: mockTranscript,
    deliveryScores: mockDeliveryScores,
    transcriptScores: mockTranscriptScores,
    feedback: mockQualitativeFeedback,
    modelAnswer: mockModelAnswer,
  },
};

export const LoadingFeedback: Story = {
  args: {
    question: mockQuestion,
    transcript: mockTranscript,
    deliveryScores: mockDeliveryScores,
    transcriptScores: mockTranscriptScores,
    loadingFeedback: true,
  },
};
