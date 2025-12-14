"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Mode = "on" | "after" | "never";

export default function RadioTestPage() {
  const [mode, setMode] = useState<Mode>("on");
  const [endDate, setEndDate] = useState("");
  const [occurrences, setOccurrences] = useState(1);

  const handleModeChange = (value: string) => {
    const v = value as Mode;
    setMode(v);

    // Reset irrelevant values when switching options
    if (v === "on") {
      setOccurrences(1);
    } else if (v === "after") {
      setEndDate("");
    } else if (v === "never") {
      setEndDate("");
      setOccurrences(1);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-6">
      <div className="w-full max-w-lg space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold text-slate-900">
          Recurrence &ldquo;Ends&rdquo; – RadioGroup Test
        </h1>
        <p className="text-sm text-slate-600">
          This page tests using the shared <code>RadioGroup</code> component.
        </p>

        {/* The "Ends" block */}
        <section className="space-y-3">
          <p className="text-sm font-medium text-slate-800">Ends</p>

          <RadioGroup
            value={mode}
            onValueChange={handleModeChange}
            className="space-y-3"
          >
            {/* On [date] */}
            <div className="flex flex-wrap items-center gap-3">
              <RadioGroupItem id="ends-on" value="on" />
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="ends-on"
                  className="mr-1 text-sm text-slate-800"
                >
                  On
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={mode !== "on"}
                  className=""
                />
              </div>
            </div>

            {/* After [N] Occurrences */}
            <div className="flex flex-wrap items-center gap-3">
              <RadioGroupItem id="ends-after" value="after" />
              <Label
                htmlFor="ends-after"
                className="mr-1 text-sm text-slate-800"
              >
                After
              </Label>

              <Input
                type="number"
                min={1}
                value={occurrences}
                onChange={(e) =>
                  setOccurrences(Math.max(1, Number(e.target.value) || 1))
                }
                disabled={mode !== "after"}
                className="w-16"
              />

              <span className="text-sm text-slate-700">Occurrences</span>
            </div>

            {/* Never */}
            <div className="flex items-center gap-3">
              <RadioGroupItem id="ends-never" value="never" />
              <Label htmlFor="ends-never" className="text-sm text-slate-800">
                Never
              </Label>
            </div>
          </RadioGroup>
        </section>

        {/* Debug preview of current state */}
        <section className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <p className="mb-1 font-semibold">Current state</p>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify({ mode, endDate, occurrences }, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  );
}
