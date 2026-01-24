import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import FilterDropDown from "./filterdropdown";

export default function FilterPopOver() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="bg-white">
          Filter
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-auto p-0">
        <FilterDropDown />
      </PopoverContent>
    </Popover>
  );
}
