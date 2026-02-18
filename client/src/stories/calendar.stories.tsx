// src/stories/calendar.stories.tsx

import type { Meta, StoryObj } from "@storybook/nextjs";
import React, { useMemo, useState } from "react";
import type { DateRange, Matcher } from "react-day-picker";

import { Calendar } from "@/components/calendar";

const meta: Meta = {
  title: "Form/Calendar",
};

export default meta;

type Story = StoryObj;

/* ----------------------------
   Utils
---------------------------- */

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/* ----------------------------
   Interactive
---------------------------- */

type InteractiveArgs = {
  mode: "single" | "range";
  captionLayout: "label" | "dropdown";
  showOutsideDays: boolean;
  buttonVariant: "ghost" | "outline" | "text" | "confirm" | "warning" | "login";
  disableWeekends: boolean;
  disablePastDates: boolean;
  numberOfMonths: 1 | 2;
};

export const Interactive: StoryObj<InteractiveArgs> = {
  name: "Single",
  args: {
    mode: "single",
    captionLayout: "label",
    showOutsideDays: true,
    buttonVariant: "ghost",
    disableWeekends: false,
    disablePastDates: false,
    numberOfMonths: 1,
  },
  argTypes: {
    mode: { control: "radio", options: ["single", "range"] },
    captionLayout: { control: "radio", options: ["label", "dropdown"] },
    showOutsideDays: { control: "boolean" },
    buttonVariant: {
      control: "select",
      options: ["ghost", "outline", "text", "confirm", "warning", "login"],
    },
    disableWeekends: { control: "boolean" },
    disablePastDates: { control: "boolean" },
    numberOfMonths: { control: "radio", options: [1, 2] },
  },
  render: (args) => {
    const Wrapper = () => {
      const today = useMemo(() => startOfDay(new Date()), []);
      const [selectedSingle, setSelectedSingle] = useState<Date | undefined>(
        today,
      );
      const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(
        {
          from: today,
          to: addDays(today, 3),
        },
      );

      const disabled: Matcher[] = [];

      if (args.disablePastDates) {
        disabled.push({ before: today });
      }

      if (args.disableWeekends) {
        disabled.push((date: Date) => {
          const day = date.getDay();
          return day === 0 || day === 6; // Sun/Sat
        });
      }

      return (
        <div className="p-8">
          <div className="w-fit rounded-xl border bg-white">
            {args.mode === "single" ? (
              <Calendar
                mode="single"
                selected={selectedSingle}
                onSelect={setSelectedSingle}
                captionLayout={args.captionLayout}
                showOutsideDays={args.showOutsideDays}
                buttonVariant={args.buttonVariant}
                numberOfMonths={args.numberOfMonths}
                disabled={disabled.length ? disabled : undefined}
                initialFocus
              />
            ) : (
              <Calendar
                mode="range"
                selected={selectedRange}
                onSelect={setSelectedRange}
                captionLayout={args.captionLayout}
                showOutsideDays={args.showOutsideDays}
                buttonVariant={args.buttonVariant}
                numberOfMonths={args.numberOfMonths}
                disabled={disabled.length ? disabled : undefined}
                initialFocus
              />
            )}
          </div>

          <div className="mt-6 w-fit rounded-md border bg-white p-3 text-xs text-gray-600">
            <div className="font-semibold text-gray-800">Selected</div>
            <pre className="mt-2 whitespace-pre-wrap">
              {args.mode === "single"
                ? JSON.stringify(
                    { selected: selectedSingle?.toISOString?.() ?? null },
                    null,
                    2,
                  )
                : JSON.stringify(
                    {
                      from: selectedRange?.from?.toISOString?.() ?? null,
                      to: selectedRange?.to?.toISOString?.() ?? null,
                    },
                    null,
                    2,
                  )}
            </pre>
          </div>
        </div>
      );
    };

    return <Wrapper />;
  },
};

/* ----------------------------
   Long / Edge cases
---------------------------- */

export const LongEdgeCases: Story = {
  name: "Range",
  render: () => {
    const Wrapper = () => {
      const today = startOfDay(new Date());

      const [range, setRange] = useState<DateRange | undefined>({
        from: addDays(today, -5),
        to: addDays(today, 18),
      });

      const disabled: Matcher[] = [
        // past dates disabled (common booking constraint)
        { before: today },
        // random block-out dates to show disabled styling
        addDays(today, 2),
        addDays(today, 7),
        addDays(today, 11),
      ];

      return (
        <div className="p-8">
          <div className="w-fit rounded-xl border bg-white">
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              captionLayout="dropdown"
              showOutsideDays={true}
              buttonVariant="outline"
              numberOfMonths={2}
              disabled={disabled}
              initialFocus
            />
          </div>

          <div className="mt-6 w-fit rounded-md border bg-white p-3 text-xs text-gray-600">
            <div className="font-semibold text-gray-800">Selected range</div>
            <pre className="mt-2 whitespace-pre-wrap">
              {JSON.stringify(
                {
                  from: range?.from?.toISOString?.() ?? null,
                  to: range?.to?.toISOString?.() ?? null,
                },
                null,
                2,
              )}
            </pre>
          </div>
        </div>
      );
    };

    return <Wrapper />;
  },
};
