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

export default function RecurrenceRuleField({
  onChange,
}: RecurrenceRuleFieldProps) {
  const [repeat, setRepeat] = useState<string>("none");
  const [customRule, setCustomRule] = useState<string>("");
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
