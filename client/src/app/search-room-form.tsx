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

const RoomSearchSchema = z.object({
  name: z.string().min(1, "Firstname is required"),
});

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
      {/* Buttons */}
      <div className="ml-auto space-x-3 space-y-2">
        <Button type="button" variant="outline" onClick={onReset}>
          Reset
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
  );
}

export { RoomSearchSchema };
export type { RoomSearchSchemaValue };
