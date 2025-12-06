"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Root RadioGroup component – used as a container for multiple radio items.
 * This is the generic building block you can reuse anywhere in the app.
 */
const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn("grid gap-2", className)}
    {...props}
  />
));

RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

/**
 * Single radio item – represents one selectable option.
 * Use together with a Label component for accessible text.
 */
const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      // base size/shape
      "aspect-square h-4 w-4 rounded-full border border-slate-300",
      // theme + interaction states
      "text-indigo-600 shadow-sm",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "data-[state=checked]:border-indigo-600 data-[state=checked]:bg-indigo-50",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator
      className={cn(
        "flex items-center justify-center",
        "after:block after:h-2.5 after:w-2.5 after:rounded-full after:bg-indigo-600",
      )}
    />
  </RadioGroupPrimitive.Item>
));

RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
