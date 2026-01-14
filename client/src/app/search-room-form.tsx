"use client";
import React from "react";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

import InputField from "@/components/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// TODO: should be from API
const LOCATIONS = [
  { label: "Pune", value: "pune" },
  { label: "Mumbai", value: "mumbai" },
  { label: "Delhi", value: "delhi" },
];

// labels for Amenities
const AMENITIES = [
  "Audio",
  "Video",
  "White Board",
  "HDMI",
  "Projector",
  "Speaker Phone",
];

// seats examples
const SEAT_OPTIONS = [
  { label: "1-5 seats", value: "1-5" },
  { label: "6-10 seats", value: "6-10" },
  { label: "11-20 seats", value: "11-20" },
  { label: "20+ seats", value: "20+" },
];

// optional or required
const RoomSearchSchemaBase = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  fromDate: z.date(),
  fromTime: z.string().min(1, "From time is required"),
  toDate: z.date(),
  toTime: z.string().min(1, "To time is required"),
  amenities: z.array(z.string()).optional(),
  seats: z.string().optional(),
});

// check if toDate later than fromDate
const RoomSearchSchema = RoomSearchSchemaBase.refine(
  (data) => {
    if (data.fromDate && data.toDate) {
      return data.toDate > data.fromDate;
    }
    return true;
  },
  {
    message: "Booking requires at least one night",
    path: ["toDate"],
  },
);

type RoomSearchSchemaValue = z.infer<typeof RoomSearchSchema>;

interface SearchRoomFormProps {
  form: UseFormReturn<RoomSearchSchemaValue>;
  onSubmit: (data: RoomSearchSchemaValue) => void;
  onReset: () => void;
}

export default function SearchRoomForm({
  form,
  onSubmit,
  onReset,
}: SearchRoomFormProps) {
  return (
    <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
      <FormField
        name="name"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <InputField
                kind="text"
                label="Name"
                name="name"
                value={field.value || ""}
                onChange={field.onChange}
                placeholder="Enter name"
                required={true}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        name="location"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <InputField
                kind="select"
                label="Location"
                name="location"
                options={LOCATIONS} // location from api
                value={field.value || ""}
                onChange={field.onChange}
                placeholder="Select location"
                required={true}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField
          name="fromDate"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputField
                  kind="date" // Calendar
                  label="From Date"
                  name="fromDate"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select date"
                  required={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="fromTime"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputField
                  kind="time-select"
                  label="Time"
                  name="fromTime"
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="HH:MM"
                  required={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          name="toDate"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputField
                  kind="date"
                  label="To Date"
                  name="toDate"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select date"
                  required={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="toTime"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputField
                  kind="time-select"
                  label="Time"
                  name="toTime"
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="HH:MM"
                  required={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        name="amenities"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <InputField
                kind="badge"
                label="Amenities"
                name="amenities"
                options={AMENITIES}
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Select amenities"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        name="seats"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <InputField
                kind="select"
                label="Select Seats"
                name="seats"
                options={SEAT_OPTIONS}
                value={field.value || ""}
                onChange={field.onChange}
                placeholder="Select seats"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onReset}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="confirm"
          disabled={!form.formState.isValid}
        >
          + Search
        </Button>
      </div>
    </Form>
  );
}

export { RoomSearchSchema };
export type { RoomSearchSchemaValue };
