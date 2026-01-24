/**
 * Usage:
 *
 * A group of checkbox: use `[value, setValue] = useState<string[]>(initialValue)` to get the selected value
 * ```tsx
 * <CheckboxGroup value={value} onValueChange={setValue}>
 *   <CheckboxItem value={value1}>{children}</CheckboxItem>
 *   <CheckboxItem value={value2}>{children}</CheckboxItem>
 * </CheckboxGroup>
 * ```
 */

"use client";
import type { CheckedState } from "@radix-ui/react-checkbox";
import React, { useCallback, useContext } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type CheckboxGroupContextValue = {
  value: string[];
  onChange: (itemValue: string, checked: boolean) => void;
};

const CheckboxGroupContext =
  React.createContext<CheckboxGroupContextValue | null>(null);

/**
 * CheckboxGroup component for wrapping multiple CheckboxItem components and rendering a checkbox group.
 */
interface CheckboxGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string[];
  onValueChange: (value: string[]) => void;
}

const CheckboxGroup = React.forwardRef<HTMLDivElement, CheckboxGroupProps>(
  ({ className, value, onValueChange, children, ...props }, ref) => {
    const onItemValueChange = useCallback(
      (itemValue: string, checked: boolean) => {
        if (checked) {
          onValueChange([...value, itemValue]);
        } else {
          onValueChange(value.filter((v) => v !== itemValue));
        }
      },
      [value, onValueChange],
    );

    return (
      <CheckboxGroupContext.Provider
        value={{ value, onChange: onItemValueChange }}
      >
        <div ref={ref} className={cn("grid gap-2", className)} {...props}>
          {children}
        </div>
      </CheckboxGroupContext.Provider>
    );
  },
);

CheckboxGroup.displayName = "CheckboxGroup";

/**
 * CheckboxItem component for rendering a single checkbox. Must used within CheckboxGroup.
 */
interface CheckboxItemProps extends React.ComponentPropsWithoutRef<
  typeof Checkbox
> {
  value: string;
}

const CheckboxItem = React.forwardRef<
  React.ElementRef<typeof Checkbox>,
  CheckboxItemProps
>(
  (
    { className, id: propsId, value, checked, onCheckedChange, ...props },
    ref,
  ) => {
    const context = useContext(CheckboxGroupContext);
    const id = propsId || value;

    if (!context) {
      throw new Error("CheckboxItem must be used within a CheckboxGroup.");
    }

    const isChecked = context.value.includes(value);
    const handleCheckedChange = (checked: CheckedState) =>
      context.onChange(value, checked === true);

    return (
      <Checkbox
        ref={ref}
        id={id}
        value={value}
        className={className}
        checked={isChecked}
        onCheckedChange={handleCheckedChange}
        {...props}
      />
    );
  },
);

CheckboxItem.displayName = "CheckboxItem";

export { CheckboxGroup, CheckboxItem };
