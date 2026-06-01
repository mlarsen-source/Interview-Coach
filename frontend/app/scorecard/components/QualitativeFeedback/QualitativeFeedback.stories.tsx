import type { Meta, StoryObj } from "@storybook/react";

import { mockQualitativeFeedback } from "@/lib/interview-coach/mocks";

import { QualitativeFeedback } from "./QualitativeFeedback";

const meta: Meta<typeof QualitativeFeedback> = {
  title: "Scorecard/QualitativeFeedback",
  component: QualitativeFeedback,
};

export default meta;

type Story = StoryObj<typeof QualitativeFeedback>;

export const Loading: Story = {
  args: { loading: true },
};

export const Populated: Story = {
  args: { feedback: mockQualitativeFeedback },
};

export const Empty: Story = {
  args: { feedback: null },
};
