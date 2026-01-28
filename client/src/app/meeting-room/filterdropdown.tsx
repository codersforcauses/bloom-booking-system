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
import api from "@/lib/api";
import { Room } from "@/types/card";

import RoomContext from "./roomContext";

export default function RoomFilterAccordion() {
  const { setRooms, locations, amenities } = React.useContext(RoomContext);
  const form = useForm<Room>({
    defaultValues: {
      location: "",
      capacity: 0,
      amenities: [],
      is_active: false,
    },
    mode: "onSubmit",
  });

  async function onSubmit(values: Room) {
    const apiUrl: string[] = [];

    if (values.location) apiUrl.push(`location=${values.location}`);
    if (values.capacity) apiUrl.push(`min_capacity=${values.capacity}`);
    if (values.amenities.length) {
      apiUrl.push(`amenities=${values.amenities.join(",")}`);
    }

    try {
      const res = await api.get(`/rooms/?${apiUrl.join("&")}`);
      setRooms(res.data.results);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="flex items-center justify-center">
      <div className="w-[360px] rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-base font-semibold">Filter</h2>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Accordion
              type="multiple"
              defaultValue={["location", "capacity"]}
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
                            options={locations.map((l) => ({
                              label: l.name,
                              value: String(l.name),
                            }))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Capacity */}
              <AccordionItem value="capacity">
                <AccordionTrigger className="justify-between py-3 text-sm font-medium">
                  Capacity
                </AccordionTrigger>
                <AccordionContent>
                  <FormField
                    name="capacity"
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
                            name="capacity"
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
              </AccordionItem>

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
                      amenities.map((a) => {
                        const selected = (
                          form.watch("amenities") ?? []
                        ).includes(a.name);

                        return (
                          <label key={a.id} className="flex items-center gap-2">
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
                                      (id: string) => id !== a.name,
                                    ),
                                  );
                                } else {
                                  // Add if not selected
                                  form.setValue("amenities", [
                                    ...current,
                                    a.name,
                                  ]);
                                }
                              }}
                            />
                            <span>{a.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Active */}
              <AccordionItem value="active">
                <AccordionTrigger className="justify-between py-3 text-sm font-medium">
                  Active
                </AccordionTrigger>
                <AccordionContent>
                  <FormField
                    name="is_active"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <InputField
                            kind="select"
                            label=""
                            name="is_active"
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
              </AccordionItem>
            </Accordion>

            <div className="mt-4 flex justify-end gap-3 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                className="px-6"
                onClick={() => form.reset()}
              >
                Cancel
              </Button>
              <Button type="submit" className="px-6">
                Apply
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
