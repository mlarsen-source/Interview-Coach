declare module "@storybook/react" {
  import type { ReactNode } from "react";

  export type Meta<T = unknown> = {
    title?: string;
    component?: T;
    decorators?: Array<(Story: () => ReactNode) => ReactNode>;
  };

  export type StoryObj<T = unknown> = {
    args?: Partial<T>;
    render?: () => ReactNode;
  };
}
