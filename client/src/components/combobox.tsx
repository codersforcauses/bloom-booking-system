import * as React from "react";

import {
  Combobox as ComboboxRoot,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";

type Item = {
  id: string | number;
  name: string;
  [key: string]: any;
};

type ComboboxProps = {
  name: string;
  items: Item[];
  values: string[];
  onValueChange: (values: string[]) => void;
  isLoading?: boolean;
};

// Generic Combobox Component
export default function Combobox({
  name,
  items,
  values,
  onValueChange,
  isLoading = false,
}: ComboboxProps) {
  const anchor = useComboboxAnchor();

  return (
    <ComboboxRoot multiple value={values} onValueChange={onValueChange}>
      <ComboboxChips ref={anchor}>
        {values?.map((item) => (
          <ComboboxChip key={item}>{item}</ComboboxChip>
        ))}
        <ComboboxChipsInput
          className="placeholder:text-muted-foreground"
          placeholder={values.length === 0 ? `Select ${name}` : ""}
        />
      </ComboboxChips>

      <ComboboxContent anchor={anchor} className="w-[var(--anchor-width)]">
        {(isLoading || items.length === 0) && (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            {isLoading ? "Searching..." : "No Data Found"}
          </div>
        )}
        <ComboboxList>
          {items.map((item: Item) => (
            <ComboboxItem key={item.id} value={item.name}>
              {item.name}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </ComboboxRoot>
  );
}
