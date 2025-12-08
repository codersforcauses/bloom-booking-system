"use client";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CheckboxGroup, CheckboxItem } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
      `Submitted data:\nacceptCondition: ${acceptTerms.toString()}\ndates: ${JSON.stringify(dates)}`,
    );
  };

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto my-5 flex w-full max-w-lg flex-col items-center justify-center">
        <form onSubmit={handleSubmit} className="w-full rounded-md border p-4">
          {/* a single checkbox */}
          <p className="title mb-3">A single checkbox</p>
          <CheckboxItem
            id="acceptTerms"
            name="acceptTerms"
            checked={acceptTerms}
            onCheckedChange={(checked) => setAcceptTerms(checked === true)} // Radix Output can be true | false | "indeterminate"
          >
            <Label htmlFor="acceptTerms"> Accept terms and conditions. </Label>
          </CheckboxItem>
          {/* a checkbox group */}
          <p className="title mb-3 mt-5">A checkbox group</p>
          <CheckboxGroup value={dates} onValueChange={setDates}>
            {DATES.map((date) => (
              <CheckboxItem key={date} value={date} id={date}>
                <Label htmlFor={date}> {date} </Label>
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
