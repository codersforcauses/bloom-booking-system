"use client";

import { useState } from "react";

import { EndsControl } from "@/components/ui/radio";

type EndsState = {
  mode: "on" | "after" | "never";
  endDate: string;
  occurrences: number;
};

export default function Page() {
  const [ends, setEnds] = useState<EndsState>({
    mode: "on",
    endDate: "",
    occurrences: 1,
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-8">
      <div className="w-full max-w-md space-y-6">
        {/* EndsControl Component */}
        <EndsControl
          value={ends}
          onChange={(v) => {
            console.log("Ends changed:", v);
            setEnds(v);
          }}
        />

        {/* Live State Preview */}
        <div className="rounded-md bg-slate-800 p-3 text-xs text-slate-100">
          <p className="mb-2 font-semibold">Current Value:</p>
          <pre>{JSON.stringify(ends, null, 2)}</pre>
        </div>
      </div>
    </main>
  );
}
