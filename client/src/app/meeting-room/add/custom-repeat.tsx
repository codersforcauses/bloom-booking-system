"use client";

import { useState } from "react";

import { CheckboxGroup, CheckboxItem } from "@/components/checkbox-group";
import InputField from "@/components/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  const [interval, setInterval] = useState("1");
  const [frequency, setFrequency] = useState("week");
  const [days, setDays] = useState<string[]>(["tue"]);
  const [endType, setEndType] = useState<"on" | "after" | "never">("on");
  const [endDate, setEndDate] = useState<Date | undefined>(
    new Date(2022, 4, 30),
  );
  const [occurrences, setOccurrences] = useState("1");
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(2021, 11, 3),
  );

  if (!open) return null;

  const handleDone = () => {
    onDone({
      interval,
      frequency,
      days,
      endType,
      endDate,
      occurrences,
      startDate,
    });
  };

  const dayOptions = [
    { value: "mon", label: "Monday" },
    { value: "tue", label: "Tuesday" },
    { value: "wed", label: "Wednesday" },
    { value: "thu", label: "Thursday" },
    { value: "fri", label: "Friday" },
    { value: "sat", label: "Saturday" },
    { value: "sun", label: "Sunday" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="max-h-[90vh] w-full max-w-[380px] overflow-y-auto rounded-xl bg-white p-5 shadow-lg">
        {/* Repeat every section */}
        <div className="mb-4">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <span className="body-sm-bold block">Repeat every</span>
            <div className="flex w-full gap-2 sm:w-auto">
              <div className="w-20">
                <InputField
                  kind="number"
                  name="interval"
                  label=""
                  value={interval}
                  onChange={setInterval}
                  min={1}
                  className="mb-0"
                />
              </div>
              <div className="flex-1 sm:w-32 sm:flex-none">
                <InputField
                  kind="select"
                  name="frequency"
                  label=""
                  value={frequency}
                  options={[
                    { label: "Day", value: "day" },
                    { label: "Week", value: "week" },
                    { label: "Month", value: "month" },
                    { label: "Year", value: "year" },
                  ]}
                  onChange={setFrequency}
                  className="mb-0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Repeat on section - only show for weekly */}
        {frequency === "week" && (
          <div className="mb-4">
            <div className="body-sm-bold mb-2 block">Repeat on</div>
            <CheckboxGroup
              value={days}
              onValueChange={setDays}
              className="grid-cols-2 gap-2"
            >
              {dayOptions.map((day) => (
                <label
                  key={day.value}
                  htmlFor={day.value}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <CheckboxItem value={day.value} />
                  <span className="body text-black">{day.label}</span>
                </label>
              ))}
            </CheckboxGroup>
          </div>
        )}

        {/* Starts section */}
        <div className="mb-4">
          <InputField
            kind="date"
            name="startDate"
            label="Starts"
            value={startDate}
            onChange={setStartDate}
            placeholder="Fri 03/12/2021"
          />
        </div>

        {/* Ends section */}
        <div className="mb-4">
          <div className="body-sm-bold mb-2 block">Ends</div>

          <RadioGroup
            value={endType}
            onValueChange={(value) =>
              setEndType(value as "on" | "after" | "never")
            }
          >
            <div className="space-y-2">
              {/* On option */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="on"
                    id="end-on"
                    className="flex h-4 w-4 flex-shrink-0 items-center justify-center"
                  />
                  <Label
                    htmlFor="end-on"
                    className="body w-12 cursor-pointer leading-none text-black"
                  >
                    On
                  </Label>
                </div>

                <div className="flex-1 sm:flex-auto">
                  <InputField
                    kind="date"
                    name="endDate"
                    label=""
                    value={endDate}
                    onChange={setEndDate}
                    placeholder="Fri 30/05/2022"
                    className="mb-0"
                  />
                </div>
              </div>

              {/* After option */}
              <div className="flex flex-col justify-center gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="after"
                    id="end-after"
                    className="flex h-4 w-4 flex-shrink-0 items-center justify-center"
                  />
                  <Label
                    htmlFor="end-after"
                    className="body w-12 cursor-pointer leading-none text-black"
                  >
                    After
                  </Label>
                </div>

                <div className="flex flex-1 items-center gap-2 sm:flex-auto">
                  <div className="w-20">
                    <InputField
                      kind="number"
                      name="occurrences"
                      label=""
                      value={occurrences}
                      onChange={setOccurrences}
                      min={1}
                      className="mb-0"
                    />
                  </div>
                  <span className="body text-black">Occurrences</span>
                </div>
              </div>

              {/* Never option */}
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value="never"
                  id="end-never"
                  className="flex h-4 w-4 flex-shrink-0 items-center justify-center"
                />
                <Label
                  htmlFor="end-never"
                  className="body cursor-pointer leading-none text-black"
                >
                  Never
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col justify-end gap-2 pt-2 sm:flex-row">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-bloom-blue bg-white text-bloom-blue sm:w-auto"
          >
            Cancel
          </Button>
          <Button onClick={handleDone} className="w-full text-white sm:w-auto">
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
}
