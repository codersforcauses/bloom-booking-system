"use client";
import { useState } from "react";

import { CheckboxGroup, CheckboxItem } from "@/components/checkbox-group";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const DATES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function CheckboxTestPage() {
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
  const [dates, setDates] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      `Submitted data:\nacceptTerms: ${acceptTerms.toString()}\ndates: ${JSON.stringify(dates)}`,
    );
  };

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto my-5 flex w-full max-w-lg flex-col items-center justify-center">
        <form onSubmit={handleSubmit} className="w-full rounded-md border p-4">
          {/* a single checkbox */}
          <p className="title mb-3">A single checkbox</p>
          <Checkbox
            checked={acceptTerms}
            onCheckedChange={(checked) => setAcceptTerms(checked === true)} // Radix Output can be true | false | "indeterminate"
          >
            <p> Accept terms and conditions. </p>
          </Checkbox>
          {/* a checkbox group */}
          <p className="title mb-3 mt-5">A checkbox group</p>
          <CheckboxGroup
            value={dates}
            onValueChange={setDates}
            className="grid-cols-2"
          >
            {DATES.map((date) => (
              <CheckboxItem key={date} value={date} id={date}>
                <p> {date} </p>
              </CheckboxItem>
            ))}
          </CheckboxGroup>
          <Button type="submit" className="mx-auto mt-4">
            Submit
          </Button>
        </form>
        <p className="mt-4 text-center">
          Current acceptTerms value: {acceptTerms.toString()}
        </p>
        <p className="mt-4 text-center">
          Current dates message: {JSON.stringify(dates, null, 1)}
        </p>
      </div>
    </div>
  );
}
