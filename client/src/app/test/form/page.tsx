"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import InputField from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const FREQUENCIES = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const AMENITIES = [
  "Audio",
  "Video",
  "White Board",
  "HDMI",
  "Projector",
  "Speaker Phone",
];

const schema = z.object({
  firstname: z.string().min(1, "Firstname is required"),
  lastname: z.string().min(1, "Lastname is required"),
  middlename: z.string().optional(),
  age: z
    .string()
    .min(1, "Age is required")
    .regex(/^\d+$/, { message: "Age must be a non-negative integer" })
    .refine(
      (val) => {
        const num = Number(val);
        return num >= 1 && num <= 120;
      },
      {
        message: "Age must be between 1 and 120",
      },
    ),
  frequency: z.enum(["daily", "weekly", "monthly"], {
    error: () => ({ message: "Invalid frequency" }),
  }),
  amenities: z
    .array(
      z.enum(AMENITIES, { error: () => ({ message: "Invalid amenities" }) }),
    )
    .optional(),
  recurrenceDate: z.enum(["Monday", "Tuesday", "Wednesday"], {
    error: () => ({ message: "Invalid recurrence date" }),
  }),
});

export default function TestFormPage() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  return (
    <div className="mx-auto w-full max-w-xl px-10 py-10">
      <Form
        form={form}
        onSubmit={form.handleSubmit((data) => {
          alert("submitted data:\n" + JSON.stringify(data));
        })}
      >
        <div className="flex flex-row gap-3">
          <FormField
            name="firstname"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <InputField
                    kind="text"
                    label="First Name"
                    name="firstname"
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="First Name"
                    required={true}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="middlename"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <InputField
                    kind="text"
                    label="Middle Name"
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

          <FormField
            name="lastname"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <InputField
                    kind="text"
                    label="Last Name"
                    name="lastname"
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Last Name"
                    required={true}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          name="age"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputField
                  kind="number"
                  label="Age"
                  name="age"
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Age"
                  required={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Frequency */}
        <FormField
          name="frequency"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputField
                  kind="select"
                  label="Frequency"
                  name="frequency"
                  options={FREQUENCIES}
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Select frequency"
                  required={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amenities (badges / multiselect) */}
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
                  placeholder="Select Amenities"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Recurrence Date (Radio Group) */}
        <FormField
          name="recurrenceDate"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold">
                Recurrence Date <span className="text-red-600">*</span>
              </FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex space-x-4"
                >
                  <div className="space-x-2">
                    <RadioGroupItem value="Monday" id="Monday" />
                    <Label htmlFor="Monday">Monday</Label>
                  </div>

                  <div className="space-x-2">
                    <RadioGroupItem value="Tuesday" id="Tuesday" />
                    <Label htmlFor="Tuesday">Tuesday</Label>
                  </div>

                  <div className="space-x-2">
                    <RadioGroupItem value="Wednesday" id="Wednesday" />
                    <Label htmlFor="Wednesday">Wednesday</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Buttons */}
        <div className="ml-auto space-x-3 space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => alert(JSON.stringify("Cancel button triggered"))}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="confirm"
            disabled={!form.formState.isValid}
          >
            Okay
          </Button>
        </div>
      </Form>
    </div>
  );
}
