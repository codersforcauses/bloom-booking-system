"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import Combobox from "../../../components/combobox";
import RoomContext from "./room-context";

const RoomFilterSchema = z.object({
  locations: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  minSeats: z
    .number()
    .int()
    .min(1, { message: "Must be a positive number" })
    .optional(),
  maxSeats: z
    .number()
    .int()
    .min(1, { message: "Must be a positive number" })
    .optional(),
  isActive: z.boolean().optional(),
});

export type RoomFilterSchemaValue = z.infer<typeof RoomFilterSchema>;

export default function FilterDropdown() {
  const ctx = React.useContext(RoomContext);
  if (!ctx) throw new Error("RoomContext not found");

  const { locations, amenities, onFilterChange, filterValues } = ctx;

  const form = useForm<RoomFilterSchemaValue>({
    resolver: zodResolver(RoomFilterSchema),
    defaultValues: {
      locations: [],
      minSeats: undefined,
      maxSeats: undefined,
      amenities: [],
      isActive: undefined,
    },
    mode: "onChange",
  });

  // Keep form values in sync with filterValues from context
  React.useEffect(() => {
    form.reset({
      locations: filterValues?.locations ?? [],
      minSeats: filterValues?.minSeats ?? undefined,
      maxSeats: filterValues?.maxSeats ?? undefined,
      amenities: filterValues?.amenities ?? [],
      isActive: filterValues?.isActive ?? undefined,
    });
  }, [filterValues]);

  function onSubmit(values: RoomFilterSchemaValue) {
    // Pass filter values up to the page
    if (onFilterChange) {
      onFilterChange({
        locations: values.locations,
        minSeats: values.minSeats,
        maxSeats: values.maxSeats,
        amenities: values.amenities,
        isActive: values.isActive,
      });
    }
  }

  return (
    <div className="max-h-[60vh] w-64 overflow-y-auto p-4 md:max-h-[75vh]">
      <h2 className="mb-2 text-base font-semibold">Filter</h2>
      <Form
        form={form}
        onSubmit={form.handleSubmit(onSubmit)}
        className="border-none p-0"
      >
        <Accordion
          type="multiple"
          defaultValue={["location"]}
          className="w-full divide-y border-b border-border"
        >
          {/* Location */}
          <AccordionItem value="location" className="border-none">
            <AccordionTrigger className="justify-between py-3 text-sm font-medium">
              Location
            </AccordionTrigger>
            <AccordionContent>
              <FormField
                name="locations"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Combobox
                        name="locations"
                        items={locations}
                        values={field.value || []}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Amenities */}
          <AccordionItem value="amenities">
            <AccordionTrigger className="justify-between py-3 text-sm font-medium">
              Amenities
            </AccordionTrigger>
            <AccordionContent>
              <FormField
                name="amenities"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Combobox
                        name="amenities"
                        items={amenities}
                        values={field.value || []}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Min Seats */}
          <AccordionItem value="minSeats">
            <AccordionTrigger className="justify-between py-3 text-sm font-medium">
              Minimum Seats
            </AccordionTrigger>
            <AccordionContent>
              <FormField
                name="minSeats"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value) || undefined)
                        }
                        placeholder="Minimum Seats"
                        type="number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Max Seats */}
          <AccordionItem value="maxSeats">
            <AccordionTrigger className="justify-between py-3 text-sm font-medium">
              Maximum Seats
            </AccordionTrigger>
            <AccordionContent>
              <FormField
                name="maxSeats"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value) || undefined)
                        }
                        placeholder="Maximum Seats"
                        type="number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Is Active */}
          <AccordionItem value="isActive">
            <AccordionTrigger className="justify-between py-3 text-sm font-medium">
              Is Active
            </AccordionTrigger>
            <AccordionContent>
              <FormField
                name="isActive"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        value={
                          field.value === undefined
                            ? "both"
                            : field.value
                              ? "active"
                              : "inactive"
                        }
                        onValueChange={(value) => {
                          if (value === "both") field.onChange(undefined);
                          else if (value === "active") field.onChange(true);
                          else if (value === "inactive") field.onChange(false);
                        }}
                        className="grid grid-cols-1 gap-1 md:grid-cols-2"
                      >
                        <Label className="flex cursor-pointer items-center gap-2 p-1">
                          <RadioGroupItem value="active" id="active" /> Active
                        </Label>
                        <Label className="flex cursor-pointer items-center gap-2 p-1">
                          <RadioGroupItem value="inactive" id="inactive" />{" "}
                          Inactive
                        </Label>
                        <Label className="flex cursor-pointer items-center gap-2 pl-1 pt-1">
                          <RadioGroupItem value="both" id="both" /> Both
                        </Label>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex justify-end gap-3 pt-3">
          <Button
            type="button"
            variant="outline"
            className="px-6"
            onClick={() => {
              onFilterChange({});
              form.reset();
            }}
          >
            Clear
          </Button>
          <Button
            type="submit"
            className="px-6"
            disabled={!form.formState.isDirty || form.formState.isSubmitting}
          >
            Apply
          </Button>
        </div>
      </Form>
    </div>
  );
}
