"use client";
import React, { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

import InputField from "@/components/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import api from "@/lib/api";

// badge options string[] (name)

const RoomSearchSchemaBase = z.object({
  name: z.string().optional(),
  location: z.string().optional(),
  fromDate: z.date().optional(),
  fromTime: z.string().optional(),
  toDate: z.date().optional(),
  toTime: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  minSeats: z.number().int().min(1).optional(),
  maxSeats: z.number().int().min(1).optional(),
});

const RoomSearchSchema = RoomSearchSchemaBase.refine(
  (data) => {
    if (data.fromDate && data.toDate) {
      const fromDate = new Date(data.fromDate);
      const toDate = new Date(data.toDate);
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(0, 0, 0, 0);
      return toDate >= fromDate;
    }
    return true;
  },
  { message: "To Date must be on/after From Date", path: ["toDate"] },
)
  .refine(
    (data) => {
      if (data.minSeats != null && data.maxSeats != null) {
        return data.minSeats <= data.maxSeats;
      }
      return true;
    },
    {
      message: "Minimum seats cannot exceed maximum seats",
      path: ["maxSeats"],
    },
  )
  .superRefine((data, ctx) => {
    if (data.fromDate && data.toDate && data.fromTime && data.toTime) {
      const isSameDay =
        data.fromDate.getFullYear() === data.toDate.getFullYear() &&
        data.fromDate.getMonth() === data.toDate.getMonth() &&
        data.fromDate.getDate() === data.toDate.getDate();

      if (isSameDay && data.toTime <= data.fromTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End time must be after start time on the same day",
          path: ["toTime"],
        });
      }
    }
  });

export type RoomSearchSchemaValue = z.infer<typeof RoomSearchSchema>;

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
  const [locations, setLocations] = useState<
    { label: string; value: string }[]
  >([]);
  const [amenityNames, setAmenityNames] = useState<string[]>([]);

  useEffect(() => {
    const fetchLocations = async () => {
      const res = await api.get("/locations/");
      const raw = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
      setLocations(
        raw.map((loc: Record<string, unknown>) => ({
          label: loc.name,
          value: loc.name,
        })),
      );
    };

    const fetchAmenities = async () => {
      const res = await api.get("/amenities/");
      const raw = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
      setAmenityNames(raw.map((a: Record<string, unknown>) => a.name));
    };

    Promise.all([fetchLocations(), fetchAmenities()]).catch((e) => {
      console.error("Failed to fetch form options", e);
    });
  }, []);

  return (
    <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
      {/* name */}
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
                required={false}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* location */}
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
                options={locations}
                value={field.value || ""}
                onChange={field.onChange}
                placeholder="Select location"
                required={false}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* from/to date+time */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FormField
          name="fromDate"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputField
                  kind="date"
                  label="From Date"
                  name="fromDate"
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    form.trigger(["toTime", "toDate"]);
                  }}
                  placeholder="Select date"
                  required={false}
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
                  onChange={(v) => {
                    field.onChange(v);
                    form.trigger(["toTime", "toDate"]);
                  }}
                  placeholder="HH:MM"
                  required={false}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                  onChange={(v) => {
                    field.onChange(v);
                    form.trigger(["toTime", "toDate"]);
                  }}
                  placeholder="Select date"
                  required={false}
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
                  onChange={(v) => {
                    field.onChange(v);
                    form.trigger(["toTime", "toDate"]);
                  }}
                  placeholder="HH:MM"
                  required={false}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* amenities */}
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
                options={amenityNames}
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Select amenities"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* seats range */}
      <div className="grid grid-cols-2 gap-3">
        <FormField
          name="minSeats"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputField
                  kind="number"
                  label="Minimum Seats"
                  name="minSeats"
                  value={field.value == null ? "" : String(field.value)}
                  onChange={(v) => {
                    const num = v === "" ? undefined : Number(v);
                    field.onChange(num);
                  }}
                  placeholder="e.g. 4"
                  min={1}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="maxSeats"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputField
                  kind="number"
                  label="Maximum Seats"
                  name="maxSeats"
                  value={field.value == null ? "" : String(field.value)}
                  onChange={(v) => {
                    const num = v === "" ? undefined : Number(v);
                    field.onChange(num);
                  }}
                  placeholder="e.g. 12"
                  min={1}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onReset}>
          Clear
        </Button>
        <Button
          type="submit"
          variant="confirm"
          disabled={!form.formState.isValid}
        >
          Search
        </Button>
      </div>
    </Form>
  );
}

export { RoomSearchSchema };
