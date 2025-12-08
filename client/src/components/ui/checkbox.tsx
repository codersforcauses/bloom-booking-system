// Usage:
// A single checkbox: use [checked, setChecked] = useState<boolean>(initialValue) to get the checkbox status
// <CheckboxItem
//   checked={checked}
//   onCheckedChange={(checked) => setChecked(checked === true)} // As Radix Output can be true | false | "indeterminate", simple pass setChecked will cause Typescript complaint
//   // optional props can be passed as in standard html checkbox
// >
// {children}   // add label here
//</CheckboxItem>

// A group of checkbox: use [value, setValue] = useState<string[]>(initialValue) to get the selected value
// <CheckboxGroup value={value} onValueChange={setValue}>
//   <CheckboxItem value={value1}>{children}</CheckboxItem>  // value is a necessary field in this case
//   <CheckboxItem value={value2}>{children}</CheckboxItem>
// </CheckboxGroup>

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import React, { useCallback, useContext } from "react";
import { FaCheck } from "react-icons/fa";

import { cn } from "@/lib/utils";

type CheckboxGroupContextValue = {
  value: string[];
  onChange: (itemValue: string, checked: boolean) => void;
};
const CheckboxGroupContext =
  React.createContext<CheckboxGroupContextValue | null>(null);

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

interface CheckboxItemProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  value?: string;
}

// checkbox item
const CheckboxItem = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxItemProps
>(
  (
    {
      className,
      id: propsId,
      value,
      checked,
      onCheckedChange,
      children,
      ...props
    },
    ref,
  ) => {
    const context = useContext(CheckboxGroupContext);
    const id = propsId || value;

    // if checkbox is used in a group, value must be provided
    if (context && !value) {
      throw new Error("Value is required when checkbox is put in a group");
    }

    // if checkbox is not used in a group, use the default checked and onCheckedChange
    const isGrouped = !!value && !!context;
    const isChecked = isGrouped ? context.value.includes(value) : checked;
    const handleCheckedChange = isGrouped
      ? (checked: boolean) => context.onChange(value, checked)
      : onCheckedChange;

    return (
      <div className="flex items-center gap-1">
        <CheckboxPrimitive.Root
          ref={ref}
          id={id}
          className={cn(
            "h-6 w-6 rounded-sm",
            "border-2 border-gray-300",
            "data-[state=checked]:border-none data-[state=checked]:bg-bloom-orbit data-[state=checked]:text-primary-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          checked={isChecked}
          onCheckedChange={handleCheckedChange}
          {...props}
        >
          <CheckboxPrimitive.Indicator className="flex items-center justify-center">
            <FaCheck className="h-4 w-4 text-white" />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        {children}
      </div>
    );
  },
);

CheckboxItem.displayName = "CheckboxItem";

export { CheckboxGroup, CheckboxItem };
