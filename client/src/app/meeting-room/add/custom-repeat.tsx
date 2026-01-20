"use client";

import { useState } from "react";

type CustomRepeatModalProps = {
  open: boolean;
  onClose: () => void;
  onDone: (value: any) => void;
};

export default function CustomRepeatModal({
  open,
  onClose,
  onDone,
}: CustomRepeatModalProps) {
  const [interval, setInterval] = useState(1);
  const [frequency, setFrequency] = useState("week");
  const [days, setDays] = useState<string[]>(["tue"]);
  const [endType, setEndType] = useState<"on" | "after" | "never">("on");

  if (!open) return null;

  const toggleDay = (day: string) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        {/* Repeat every */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">Repeat every</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={interval}
              onChange={(e) => setInterval(+e.target.value)}
              className="w-20 rounded border px-2 py-1"
            />
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="rounded border px-2 py-1"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
        </div>

        {/* Repeat on */}
        {frequency === "week" && (
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">Repeat on</label>
            <div className="grid grid-cols-4 gap-2 text-sm">
              {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((day) => (
                <label key={day} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={days.includes(day)}
                    onChange={() => toggleDay(day)}
                  />
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Ends */}
        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium">Ends</label>

          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={endType === "on"}
                onChange={() => setEndType("on")}
              />
              On
              <input type="date" className="rounded border px-2 py-1" />
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={endType === "after"}
                onChange={() => setEndType("after")}
              />
              After
              <input
                type="number"
                min={1}
                className="w-20 rounded border px-2 py-1"
              />
              occurrences
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={endType === "never"}
                onChange={() => setEndType("never")}
              />
              Never
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded border px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onDone({ interval, frequency, days, endType });
              onClose();
            }}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
