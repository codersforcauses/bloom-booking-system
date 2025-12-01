"use client";

import { useState } from "react";

export type EndsMode = "on" | "after" | "never";

export interface EndsState {
  mode: EndsMode;
  endDate: string;
  occurrences: number;
}

interface EndsControlProps {
  value?: EndsState;
  onChange?: (value: EndsState) => void;
}

export function EndsControl({ value, onChange }: EndsControlProps) {
  const [state, setState] = useState<EndsState>(
    value ?? {
      mode: "on",
      endDate: "",
      occurrences: 1,
    },
  );

  const update = (patch: Partial<EndsState>) => {
    const next = { ...state, ...patch };
    setState(next);
    onChange?.(next);
  };

  const rowBase =
    "flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 transition-colors cursor-pointer";

  const rowSelected =
    "bg-indigo-50/70 border-indigo-200 shadow-[0_1px_0_rgba(148,163,184,0.5)]";

  const rowHover = "hover:bg-slate-50";

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm sm:p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Ends
      </p>

      <div className="space-y-2">
        {/* --- On [date] --- */}
        <label
          className={[
            rowBase,
            rowHover,
            state.mode === "on" ? rowSelected : "",
          ].join(" ")}
        >
          <input
            type="radio"
            name="ends"
            className="h-4 w-4 shrink-0 accent-indigo-600"
            checked={state.mode === "on"}
            onChange={() => update({ mode: "on" })}
          />
          <span className="mr-1 text-slate-700">On</span>
          <input
            type="date"
            className="ml-1 min-w-[170px] rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-[0_2px_0_rgba(148,163,184,0.5)] outline-none focus:border-indigo-400 disabled:bg-slate-100 disabled:text-slate-400"
            value={state.endDate}
            onChange={(e) => update({ endDate: e.target.value })}
            disabled={state.mode !== "on"}
          />
        </label>

        {/* --- After [N] occurrences --- */}
        <label
          className={[
            rowBase,
            rowHover,
            state.mode === "after" ? rowSelected : "",
          ].join(" ")}
        >
          <input
            type="radio"
            name="ends"
            className="h-4 w-4 shrink-0 accent-indigo-600"
            checked={state.mode === "after"}
            onChange={() => update({ mode: "after" })}
          />
          <span className="mr-1 text-slate-700">After</span>
          <input
            type="number"
            min={1}
            className="w-16 rounded-md border border-slate-200 bg-slate-100 px-3 py-1.5 text-center text-sm text-slate-700 shadow-[0_2px_0_rgba(148,163,184,0.4)] outline-none focus:border-indigo-400 disabled:opacity-60"
            value={state.occurrences}
            onChange={(e) =>
              update({
                occurrences: Math.max(1, Number(e.target.value) || 1),
              })
            }
            disabled={state.mode !== "after"}
          />
          <span className="ml-1 text-slate-600">Occurrences</span>
        </label>

        {/* --- Never --- */}
        <label
          className={[
            rowBase,
            rowHover,
            state.mode === "never" ? rowSelected : "",
          ].join(" ")}
        >
          <input
            type="radio"
            name="ends"
            className="h-4 w-4 shrink-0 accent-indigo-600"
            checked={state.mode === "never"}
            onChange={() => update({ mode: "never" })}
          />
          <span className="text-slate-700">Never</span>
        </label>
      </div>
    </div>
  );
}
