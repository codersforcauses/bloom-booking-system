// src/stories/alert-dialog.stories.tsx

import type { Meta, StoryObj } from "@storybook/nextjs";
import React, { useEffect, useState } from "react";

import { AlertDialog } from "@/components/alert-dialog";

const meta: Meta = {
  title: "UI/AlertDialog",
  argTypes: {
    open: { control: "boolean" },
    variant: {
      control: "select",
      options: ["success", "error", "confirm", "info"],
    },
    showIcon: { control: "boolean" },
    title: { control: "text" },
    description: { control: "text" },
  },
};

export default meta;

type Story = StoryObj;

/* ----------------------------
   Interactive
---------------------------- */

type InteractiveArgs = {
  open: boolean;
  variant: "success" | "error" | "confirm" | "info";
  showIcon: boolean;
  title?: string;
  description?: string;
  asyncConfirm: boolean;
};

export const Interactive: StoryObj<InteractiveArgs> = {
  args: {
    open: true,
    variant: "success",
    showIcon: true,
    title: "Saved",
    description: "Your changes have been saved.",
    asyncConfirm: false,
  },
  argTypes: {
    asyncConfirm: { control: "boolean" },
  },
  render: (args) => {
    const Wrapper = () => {
      const [open, setOpen] = useState(args.open);

      // keep local state in sync when toggling controls
      useEffect(() => setOpen(args.open), [args.open]);

      const onClose = () => setOpen(false);

      const onConfirm = args.asyncConfirm
        ? async () => {
            await new Promise((r) => setTimeout(r, 1200));
          }
        : () => {};

      return (
        <AlertDialog
          open={open}
          variant={args.variant}
          showIcon={args.showIcon}
          title={args.title}
          description={args.description}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      );
    };

    return <Wrapper />;
  },
};

/* ----------------------------
   Long values preset
---------------------------- */

export const LongValues: Story = {
  args: {
    variant: "error",
  },

  name: "Long values",

  render: () => (
    <AlertDialog
      open={true}
      variant="confirm"
      showIcon={true}
      title="Confirm action — Extremely long title to test wrapping, alignment, and header spacing across multiple lines"
      description={
        "This is a very long description intended to test text wrapping, line height, spacing, and overall layout behaviour.\n\nIt includes multiple paragraphs, explicit line breaks, and enough content to simulate a real-world message with context, consequences, and instructions. Please confirm you understand what will happen before proceeding."
      }
      onClose={() => {}}
      onConfirm={async () => {
        await new Promise((r) => setTimeout(r, 1500));
      }}
    />
  ),
};
