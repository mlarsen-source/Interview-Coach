import type { Meta, StoryObj } from "@storybook/react";

import { mockModelAnswer } from "@/lib/interview-coach/mocks";

import { ModelAnswer } from "./ModelAnswer";

const meta: Meta<typeof ModelAnswer> = {
  title: "Scorecard/ModelAnswer",
  component: ModelAnswer,
};

export default meta;

type Story = StoryObj<typeof ModelAnswer>;

export const Loading: Story = {
  args: { loading: true },
};

export const Populated: Story = {
  args: { modelAnswer: mockModelAnswer },
};

export const Empty: Story = {
  args: { modelAnswer: null },
};
