import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import FilterDropDown from "./filter-dropdown";

export default function FilterPopOver() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Filter</Button>
      </PopoverTrigger>

      <PopoverContent align="center" sideOffset={8}>
        <FilterDropDown />
      </PopoverContent>
    </Popover>
  );
}
