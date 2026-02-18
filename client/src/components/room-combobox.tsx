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
import { useSearchRooms } from "@/hooks/room";
import { RoomShortResponse } from "@/lib/api-types";

type RoomComboboxProps = {
  value: RoomShortResponse[];
  onChange: (rooms: RoomShortResponse[]) => void;
};

export function RoomCombobox({ value, onChange }: RoomComboboxProps) {
  const anchor = useComboboxAnchor();
  const [search, setSearch] = React.useState("");

  const { data: rooms = [], isLoading } = useSearchRooms(search);

  const items = React.useMemo(() => {
    const map = new Map<string, RoomShortResponse>();
    value.forEach((v) => map.set(String(v.id), v));
    rooms.forEach((r: RoomShortResponse) => map.set(String(r.id), r));
    return Array.from(map.values());
  }, [rooms, value]);

  return (
    <Combobox
      multiple
      items={items}
      value={value}
      onValueChange={onChange}
      itemToStringValue={(room) => room.name}
      autoHighlight
    >
      <ComboboxChips ref={anchor} className="w-full">
        <ComboboxValue>
          {(values) => (
            <>
              {values.map((room: RoomShortResponse) => (
                <ComboboxChip key={room.id}>{room.name}</ComboboxChip>
              ))}
              <ComboboxChipsInput
                placeholder="Search rooms..."
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
        <ComboboxList>
          {items.map((room: RoomShortResponse) => (
            <ComboboxItem key={room.id} value={room}>
              {room.name}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
