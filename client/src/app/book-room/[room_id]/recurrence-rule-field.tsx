"use client";

import { useState } from "react";
import { rrulestr } from "rrule";

import CustomRepeatModal from "@/app/(admin)/meeting-room/add/custom-repeat";
import { type CustomRepeatValue } from "@/app/(admin)/meeting-room/add/schemas";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RecurrenceRuleFieldProps = {
  onChange: (rrule: string) => void;
  defaultRRule?: string;
};

function buildRrule(value: CustomRepeatValue): string {
  const freqMap: Record<string, string> = {
    day: "DAILY",
    week: "WEEKLY",
    month: "MONTHLY",
  };
  const freq = freqMap[value.frequency];
  if (!freq) return "";

  let rrule = `FREQ=${freq}`;

  if (value.interval && value.interval !== "1") {
    rrule += `;INTERVAL=${value.interval}`;
  }

  if (value.frequency === "week" && value.days?.length) {
    const dayMap: Record<string, string> = {
      mon: "MO",
      tue: "TU",
      wed: "WE",
      thu: "TH",
      fri: "FR",
      sat: "SA",
      sun: "SU",
    };
    const byday = value.days.map((d) => dayMap[d] || d).join(",");
    rrule += `;BYDAY=${byday}`;
  }

  if (value.endType === "on" && value.endDate) {
    const endDateStr =
      value.endDate.toISOString().split("T")[0].replace(/-/g, "") + "T000000Z";
    rrule += `;UNTIL=${endDateStr}`;
  } else if (value.endType === "after" && value.occurrences) {
    rrule += `;COUNT=${value.occurrences}`;
  }

  return rrule;
}

function parseRrule(rrule: string): CustomRepeatValue {
  const parts = Object.fromEntries(
    rrule.split(";").map((p) => p.split("=")),
  ) as Record<string, string>;

  const freqMap: Record<string, CustomRepeatValue["frequency"]> = {
    DAILY: "day",
    WEEKLY: "week",
    MONTHLY: "month",
  };

  const dayMap: Record<string, string> = {
    MO: "mon",
    TU: "tue",
    WE: "wed",
    TH: "thu",
    FR: "fri",
    SA: "sat",
    SU: "sun",
  };

  const frequency = freqMap[parts.FREQ] ?? "week";
  const interval = parts.INTERVAL ?? "1";
  const days = parts.BYDAY
    ? parts.BYDAY.split(",").map((d) => dayMap[d] ?? d)
    : [];

  let endType: CustomRepeatValue["endType"] = "never";
  let endDate: Date | undefined;
  let occurrences: string | undefined;

  if (parts.UNTIL) {
    endType = "on";
    const s = parts.UNTIL.replace("Z", "");
    endDate = new Date(
      `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T00:00:00`,
    );
  } else if (parts.COUNT) {
    endType = "after";
    occurrences = parts.COUNT;
  }

  return { frequency, interval, days, endType, endDate, occurrences };
}

function initRepeat(rrule: string | undefined): string {
  if (!rrule) return "none";
  if (rrule === "FREQ=DAILY") return "daily";
  if (rrule === "FREQ=WEEKLY") return "weekly";
  return "rule";
}

export default function RecurrenceRuleField({
  onChange,
  defaultRRule,
}: RecurrenceRuleFieldProps) {
  const [repeat, setRepeat] = useState<string>(() => initRepeat(defaultRRule));
  const [customRule, setCustomRule] = useState<string>(defaultRRule ?? "");
  const [showModal, setShowModal] = useState<boolean>(false);

  function handleValueChange(value: string) {
    setRepeat(value);
    if (value === "none") onChange("");
    else if (value === "daily") onChange("FREQ=DAILY");
    else if (value === "weekly") onChange("FREQ=WEEKLY");
    else if (value === "custom") setShowModal(true);
  }

  function handleSetCustomRule(rrule: string) {
    setCustomRule(rrule);
    onChange(rrule);
    console.log("Custom RRULE set:", rrule);
    if (rrule == "") setRepeat("none");
    else if (rrule == "FREQ=DAILY") {
      setRepeat("daily");
    } else if (rrule == "FREQ=WEEKLY") {
      setRepeat("weekly");
    } else {
      setRepeat("rule");
      // setShowRule(true);
    }
    setShowModal(false);
  }

  const showCustomRule =
    customRule !== "" &&
    customRule !== "FREQ=DAILY" &&
    customRule !== "FREQ=WEEKLY";

  return (
    <div className="md:w-1/2">
      <Label>Repeat</Label>
      <Select value={repeat} onValueChange={handleValueChange}>
        <SelectTrigger className="flex rounded-md border border-b-4 border-gray-200 border-b-gray-300 bg-background px-3 py-2 text-sm">
          <SelectValue placeholder="Does not repeat" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Does not repeat</SelectItem>
          <SelectItem value="daily">Daily</SelectItem>
          <SelectItem value="weekly">Weekly</SelectItem>
          <SelectItem
            value="rule"
            disabled={!showCustomRule}
            className={`${showCustomRule ? "" : "hidden"} `}
          >
            {showCustomRule ? rrulestr(customRule).toText() : ""}
          </SelectItem>
          <SelectItem value="custom" onSelect={() => setShowModal(true)}>
            Custom...
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Always mounted so internal modal state (frequency, days, end type, etc.)
          persists between open/close cycles. Visibility is controlled via `open`. */}
      <CustomRepeatModal
        open={showModal}
        defaultValue={customRule ? parseRrule(customRule) : undefined}
        onClose={() => {
          setShowModal(false);
          // If the user never committed a rule, revert the select to "none"
          if (!customRule) {
            setRepeat("none");
            onChange("");
          } else {
            handleSetCustomRule(customRule);
          }
        }}
        onDone={(value: CustomRepeatValue) => {
          console.log("Custom repeat value from modal:", value);
          const rrule = buildRrule(value);
          handleSetCustomRule(rrule);
        }}
      />
    </div>
  );
}
