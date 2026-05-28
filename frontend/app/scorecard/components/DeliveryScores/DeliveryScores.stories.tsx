import type { Meta, StoryObj } from "@storybook/react";

import { mockDeliveryScores } from "@/lib/interview-coach/mocks";

import { DeliveryScores } from "./DeliveryScores";

const meta: Meta<typeof DeliveryScores> = {
  title: "Scorecard/DeliveryScores",
  component: DeliveryScores,
};

export default meta;

type Story = StoryObj<typeof DeliveryScores>;

export const Loading: Story = {
  args: { loading: true },
};

export const Populated: Story = {
  args: { scores: mockDeliveryScores },
};

export const Empty: Story = {
  args: { scores: null },
};
