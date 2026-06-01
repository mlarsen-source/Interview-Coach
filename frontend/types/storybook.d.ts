declare module "@storybook/react" {
  export type Meta<T = unknown> = {
    title?: string;
    component?: T;
  };

  export type StoryObj<T = unknown> = {
    args?: Partial<T>;
  };
}
