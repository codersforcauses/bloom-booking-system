"use client";
import { set } from "date-fns";
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

import RoomContext from "./roomContext";

type ApiListResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type NamedEntity = {
  id: number;
  name: string;
};

type FilterValues = {
  location_id: string;
  capacity: string;
  amenity_ids: number[];
  is_active: "" | "true" | "false";
};

type Props = {
  onApply?: (filters: {
    location_id?: number;
    capacity?: number;
    amenity_ids?: number[];
    is_active?: boolean;
  }) => void;
  onCancel?: () => void;
};

export default function RoomFilterAccordion({ onApply, onCancel }: Props) {
  const { setRooms } = React.useContext(RoomContext);
  const form = useForm<FilterValues>({
    defaultValues: {
      location_id: "",
      capacity: "",
      amenity_ids: [],
      is_active: "",
    },
    mode: "onSubmit",
  });

  const [locations, setLocations] = React.useState<NamedEntity[]>([]);
  const [amenities, setAmenities] = React.useState<NamedEntity[]>([]);
  const [loadingLocations, setLoadingLocations] = React.useState(false);
  const [loadingAmenities, setLoadingAmenities] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadError(null);

      try {
        setLoadingLocations(true);
        const locRes = await api.get("/locations/");
        const locJson = locRes.data as ApiListResponse<NamedEntity>;
        if (!cancelled) setLocations(locJson.results ?? []);
      } catch (e: any) {
        if (!cancelled) {
          const msg =
            e?.response?.data?.detail ||
            e?.response?.data?.message ||
            e?.message ||
            "Failed to load locations";
          setLoadError(msg);
        }
      } finally {
        if (!cancelled) setLoadingLocations(false);
      }

      try {
        setLoadingAmenities(true);
        const amRes = await api.get("/amenities/");
        const amJson = amRes.data as ApiListResponse<NamedEntity>;
        if (!cancelled) setAmenities(amJson.results ?? []);
      } catch (e: any) {
        if (!cancelled) {
          const msg =
            e?.response?.data?.detail ||
            e?.response?.data?.message ||
            e?.message ||
            "Failed to load amenities";
          setLoadError((prev) => prev ?? msg);
        }
      } finally {
        if (!cancelled) setLoadingAmenities(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleAmenity = (id: number) => {
    const cur = form.getValues("amenity_ids") ?? [];
    form.setValue(
      "amenity_ids",
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
      { shouldDirty: true },
    );
  };

  const handleApply = form.handleSubmit((values) => {
    const out: {
      location_id?: number;
      capacity?: number;
      amenity_ids?: number[];
      is_active?: boolean;
    } = {};

    if (values.location_id) out.location_id = Number(values.location_id);

    if (values.capacity !== "") {
      const n = Number(values.capacity);
      if (!Number.isNaN(n)) out.capacity = n;
    }

    if (values.amenity_ids?.length) out.amenity_ids = values.amenity_ids;

    if (values.is_active === "true") out.is_active = true;
    if (values.is_active === "false") out.is_active = false;

    onApply?.(out);
  });

  const handleCancel = () => {
    form.reset();
    onCancel?.();
  };

  const FALLBACK_IMG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
      <rect width="100%" height="100%" fill="#f2f2f2"/>
      <rect x="60" y="70" width="680" height="360" rx="18" fill="#e6e6e6"/>
      <text x="50%" y="52%" text-anchor="middle" font-family="Arial" font-size="36" fill="#9a9a9a">
        Room
      </text>
    </svg>
  `);

  function mapRoomNames(data: any[]): string[] {
    return (data ?? []).map((r: any) => r?.name || "Untitled Room");
  }

  function mapRooms(data: ApiRoom[]): Room[] {
    return (data ?? []).map((r) => {
      const isActive = r?.is_active ?? false;

      // bandaid string until backend provides real "open hours" etc.
      const availabilityStr = isActive ? "Active" : "Inactive";

      return {
        id: r.id,
        title: r.name || "Untitled Room",
        image: r.img || FALLBACK_IMG,
        location: r.location?.name || "Unknown",
        seats: r.capacity ?? 0,
        amenities: mapRoomNames(r.amenities ?? []),
        bookings: 0,
        removed: false,

        available: isActive,
        availablility: availabilityStr,
      };
    });
  }

  async function filterapply(values: FilterValues) {
    const apiUrl: string[] = [];

    if (values.location_id) apiUrl.push(`location=${values.location_id}`);
    if (values.capacity) apiUrl.push(`min_capacity=${values.capacity}`);

    console.log("API URL:", apiUrl.join("&"));
    try {
      const res = await api.get(`/rooms/?${apiUrl.join("&")}`);
      console.log(res.data.results);
      setRooms(mapRooms(res.data.results));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="flex items-center justify-center">
      <div className="w-[360px] rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-base font-semibold">Filter</h2>

        {loadError ? (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {loadError}
          </div>
        ) : null}

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(filterapply)}>
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
                    name="location_id"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <InputField
                            kind="select"
                            label=""
                            name="location_id"
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder={
                              loadingLocations
                                ? "Loading..."
                                : "Select location"
                            }
                            options={locations.map((l) => ({
                              label: l.name,
                              value: String(l.id),
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
                            value={field.value ?? ""}
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
                    {loadingAmenities ? (
                      <div className="text-sm text-muted-foreground">
                        Loading...
                      </div>
                    ) : amenities.length ? (
                      amenities.map((a) => {
                        const selected = (
                          form.watch("amenity_ids") ?? []
                        ).includes(a.id);
                        return (
                          <label key={a.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={selected}
                              onChange={() => toggleAmenity(a.id)}
                            />
                            <span>{a.name}</span>
                          </label>
                        );
                      })
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No amenities found.
                      </div>
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
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Any"
                            options={[
                              { label: "Any", value: "test" },
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
                onClick={handleCancel}
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
