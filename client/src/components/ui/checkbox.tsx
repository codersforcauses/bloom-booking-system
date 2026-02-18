/**
 * Usage:
 *
 * A single checkbox: use `[checked, setChecked] = useState<boolean>(initialValue)` to get the checkbox status
 * ```tsx
 * <Checkbox
 *   checked={checked}
 *   onCheckedChange={(checked) => setChecked(checked === true)} // As Radix Output can be true | false | "indeterminate", simple pass setChecked will cause Typescript complaint
 *   // optional props can be passed as in standard html checkbox
 * >
 *   {children}   // add label here
 * </Checkbox>
 * ```
 *
 * A group of checkbox: use CheckboxGroup
 *
 */

"use client";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import React from "react";
import { FaCheck } from "react-icons/fa";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Checkbox component for rendering a single checkbox. Used standalone.
 */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, children, ...props }, ref) => {
  return (
    <Label className="flex cursor-pointer items-center gap-1">
      <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
          "h-6 w-6 rounded-sm",
          "border-2 border-gray-300",
          "data-[state=checked]:border-none data-[state=checked]:bg-bloom-blue data-[state=checked]:text-primary-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center">
          <FaCheck className="h-4 w-4 text-white" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {children}
    </Label>
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox };
