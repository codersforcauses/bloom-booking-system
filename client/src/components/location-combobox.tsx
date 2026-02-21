"use client";

import * as React from "react";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { useSearchRoomLocations } from "@/hooks/room";
import { LocationResponse } from "@/lib/api-types";

import { ScrollArea } from "./ui/scroll-area";

type LocationComboboxProps = {
  value: LocationResponse[];
  onChange: (locations: LocationResponse[]) => void;
};

export function LocationCombobox({ value, onChange }: LocationComboboxProps) {
  const anchor = useComboboxAnchor();
  const [search, setSearch] = React.useState("");

  const { data: locations = [], isLoading } = useSearchRoomLocations(search);

  const items = React.useMemo(() => {
    const map = new Map<string, LocationResponse>();
    value.forEach((v) => map.set(String(v.id), v));
    locations.forEach((r: LocationResponse) => map.set(String(r.id), r));
    return Array.from(map.values());
  }, [locations, value]);

  return (
    <Combobox
      multiple
      items={items}
      value={value}
      onValueChange={onChange}
      itemToStringValue={(location) => location.name}
      autoHighlight
    >
      <ComboboxChips ref={anchor} className="w-full">
        <ComboboxValue>
          {(values) => (
            <>
              {values.map((location: LocationResponse) => (
                <ComboboxChip key={location.id}>{location.name}</ComboboxChip>
              ))}
              <ComboboxChipsInput
                placeholder="Search locations..."
                onChange={(e) => setSearch(e.target.value)}
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>

      <ComboboxContent anchor={anchor}>
        {(isLoading || items.length === 0) && (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            {isLoading ? "Searching…" : "No Data Found"}
          </div>
        )}
        <ScrollArea className="flex max-h-60 flex-col">
          <ComboboxList>
            {items.map((location: LocationResponse) => (
              <ComboboxItem key={location.id} value={location}>
                {location.name}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ScrollArea>
      </ComboboxContent>
    </Combobox>
  );
}
