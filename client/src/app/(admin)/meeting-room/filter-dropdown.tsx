"use client";
import * as React from "react";
import { FormProvider, useForm } from "react-hook-form";

import InputField from "@/components/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  AmenityResponse,
  LocationResponse,
  RoomResponse,
} from "@/lib/api-types";
import { Room } from "@/types/card";

import RoomContext from "./room-context";

export default function FilterDropdown() {
  const ctx = React.useContext(RoomContext);
  if (!ctx) throw new Error("RoomContext not found");

  const { locations, amenities, onFilterChange, filterValues } = ctx;
  const form = useForm<Room>({
    defaultValues: {
      location: filterValues?.location ?? "",
      seats: filterValues?.seats ?? 0,
      amenities: filterValues?.amenities ?? [],
      available: filterValues?.available ?? false,
    },
    mode: "onSubmit",
  });

  // Keep form values in sync with filterValues from context
  React.useEffect(() => {
    form.reset({
      location: filterValues?.location ?? "",
      seats: filterValues?.seats ?? 0,
      amenities: filterValues?.amenities ?? [],
      available: filterValues?.available ?? false,
    });
  }, [filterValues]);

  function onSubmit(values: Room) {
    // Pass filter values up to the page
    if (onFilterChange) {
      onFilterChange({
        location: values.location,
        // seats: values.seats,
        amenities: values.amenities,
        // available: values.available,
      });
    }
  }

  return (
    <div className="w-64 p-4">
      <h2 className="mb-2 text-base font-semibold">Filter</h2>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Accordion
            type="multiple"
            defaultValue={["location", "seats"]}
            className="w-full divide-y"
          >
            {/* Location */}
            <AccordionItem value="location" className="border-none">
              <AccordionTrigger className="justify-between py-3 text-sm font-medium">
                Location
              </AccordionTrigger>
              <AccordionContent>
                <FormField
                  name="location"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <InputField
                          kind="select"
                          label=""
                          name="location"
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder={
                            locations.length === 0
                              ? "Loading..."
                              : "Select location"
                          }
                          options={locations.map((res: LocationResponse) => ({
                            label: res.name,
                            value: String(res.name),
                          }))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Capacity
              <AccordionItem value="seats">
                <AccordionTrigger className="justify-between py-3 text-sm font-medium">
                  Capacity
                </AccordionTrigger>
                <AccordionContent>
                  <FormField
                    name="seats"
                    control={form.control}
                    rules={{
                      validate: (v) => {
                        if (v === "") return true;
                        if (!/^\d+$/.test(v))
                          return "Capacity must be a whole number";
                        const n = Number(v);
                        if (n < 0 || n > 999)
                          return "Capacity must be between 0 and 999";
                        return true;
                      },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <InputField
                            kind="number"
                            label=""
                            name="seats"
                            value={field.value ?? 0}
                            onChange={field.onChange}
                            placeholder="0–999"
                            min={0}
                            max={999}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem> */}

            {/* Amenities */}
            <AccordionItem value="amenities">
              <AccordionTrigger className="justify-between py-3 text-sm font-medium">
                Amenities
              </AccordionTrigger>
              <AccordionContent>
                <div className="mt-1 space-y-2 pl-1 text-sm">
                  {amenities.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Loading...
                    </div>
                  ) : (
                    amenities.map((res: AmenityResponse) => {
                      const selected = (form.watch("amenities") ?? []).includes(
                        res.name,
                      );

                      return (
                        <label key={res.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={selected}
                            onChange={() => {
                              const current = form.watch("amenities") ?? [];
                              if (selected) {
                                // Remove if already selected
                                form.setValue(
                                  "amenities",
                                  current.filter(
                                    (id: string) => id !== res.name,
                                  ),
                                  { shouldDirty: true },
                                );
                              } else {
                                // Add if not selected
                                form.setValue(
                                  "amenities",
                                  [...current, res.name],
                                  { shouldDirty: true },
                                );
                              }
                            }}
                          />
                          <span>{res.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Active */}
            {/* <AccordionItem value="active">
              <AccordionTrigger className="justify-between py-3 text-sm font-medium">
                Active
              </AccordionTrigger>
              <AccordionContent>
                <FormField
                  name="available"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <InputField
                          kind="select"
                          label=""
                          name="available"
                          value={String(field.value) || ""}
                          onChange={(val: string) => field.onChange(val)}
                          placeholder="Active"
                          options={[
                            { label: "Active", value: "true" },
                            { label: "Inactive", value: "false" },
                          ]}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem> */}
          </Accordion>

          <div className="mt-4 flex justify-end gap-3 border-t pt-4">
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
              disabled={!form.formState.isDirty && !form.formState.isSubmitting}
            >
              Apply
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
