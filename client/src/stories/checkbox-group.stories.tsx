// CheckboxGroup.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs";
import React, { useState } from "react";

import { CheckboxGroup, CheckboxItem } from "@/components/checkbox-group";

const meta: Meta<typeof CheckboxGroup> = {
  title: "Components/CheckboxGroup",
  component: CheckboxGroup,
};

export default meta;

type Story = StoryObj<typeof CheckboxGroup>;

export const Interactive: Story = {
  render: () => (
    <div style={{ padding: 16 }}>
      <CheckboxGroupWrapper />
    </div>
  ),
};

function CheckboxGroupWrapper() {
  const [value, setValue] = useState<string[]>(["apple"]);

  return (
    <CheckboxGroup value={value} onValueChange={setValue}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <CheckboxItem value="apple" />
        <label htmlFor="apple">Apple</label>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <CheckboxItem value="banana" />
        <label htmlFor="banana">Banana</label>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <CheckboxItem value="cherry" />
        <label htmlFor="cherry">Cherry</label>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
        Selected: {value.length ? value.join(", ") : "(none)"}
      </div>
    </CheckboxGroup>
  );
}
