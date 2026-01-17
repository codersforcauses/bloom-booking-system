"use client";
import { FormProvider, useForm } from "react-hook-form";

import { Calendar } from "@/components/calendar";
import InputField from "@/components/input";
import Textarea from "@/components/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import TimePicker from "@/components/ui/timeselect";

const ROOM_NAMES = [
  "Conference Room A",
  "Meeting Room B",
  "Huddle Space C",
  "Boardroom D",
];
const FREQUENCIES = [
  { label: "Unavailable", value: "daily" },
  { label: "Available", value: "weekly" },
];

export default function FilterDropDown(roomNames: any) {
  const form = useForm<{ frequency: string }>({
    defaultValues: { frequency: "" },
  });
  return (
    <div className="flex items-center justify-center">
      <div className="w-[360px] rounded-xl border bg-white p-4 shadow-sm">
        {/* Card title */}
        <h2 className="mb-2 text-base font-semibold">Filter</h2>

        {/* Inner accordion with multiple sections */}
        <Accordion
          type="multiple"
          defaultValue={["room-name"]}
          className="w-full divide-y"
        >
          {/* Room Name section (open by default) */}
          <AccordionItem value="room-name" className="border-none">
            <AccordionTrigger className="justify-between py-3 text-sm font-medium">
              Room Name
            </AccordionTrigger>
            <AccordionContent>
              <div className="mt-1 space-y-2 pl-1 text-sm">
                {roomNames.map((name) => (
                  <label key={name} className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4" />
                    <span>{name}</span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Date section */}
          <AccordionItem value="date">
            <AccordionTrigger className="justify-between py-3 text-sm font-medium">
              Date
            </AccordionTrigger>
            <AccordionContent>
              <Calendar />
            </AccordionContent>
          </AccordionItem>

          {/* Time section */}
          <AccordionItem value="time">
            <AccordionTrigger className="justify-between py-3 text-sm font-medium">
              Time
            </AccordionTrigger>
            <AccordionContent>
              <TimePicker />
            </AccordionContent>
          </AccordionItem>

          {/* Location section */}
          <AccordionItem value="location">
            <AccordionTrigger className="justify-between py-3 text-sm font-medium">
              Location
            </AccordionTrigger>
            <AccordionContent>
              <FormProvider {...form}>
                <FormField
                  name="middlename"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <InputField
                          kind="text"
                          label=""
                          name="middlename"
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Middle Name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormProvider>
            </AccordionContent>
          </AccordionItem>

          {/* Status section */}
          <AccordionItem value="status">
            <AccordionTrigger className="justify-between py-3 text-sm font-medium">
              Status
            </AccordionTrigger>
            <AccordionContent>
              <FormProvider {...form}>
                <FormField
                  name="frequency"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <InputField
                          kind="select"
                          label=""
                          name="frequency"
                          options={FREQUENCIES}
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Select status"
                          required={true}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormProvider>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Footer buttons */}
        <div className="mt-4 flex justify-end gap-3 border-t pt-4">
          <Button variant="outline" className="px-6">
            Cancel
          </Button>
          <Button className="px-6">Apply</Button>
        </div>
      </div>
    </div>
  );
}
