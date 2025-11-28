// Text fields, Dropdown Menus, Date Fields, Time Fields, Badge Fields, are all variations of the Input field.
// Currently only the Text and Badge field has been implemented.
// If you are working on another variant, create a new .tsx file for it and import it here.

import React from "react";

import Badge from "@/components/ui/badge";

type FieldKind = "text" | "number" | "select" | "badge" | "date" | "time";

type BaseFieldProps = {
  name: string;
  label: string;
  required?: boolean;
  className?: string;
  fieldClassName?: string;
  error?: string;
};

// TEXT (This is the default one)
type TextFieldProps = BaseFieldProps & {
  kind?: "text";
  value: string;
  onChange: (value: string) => void;
};

// NUMBER
type NumberFieldProps = BaseFieldProps & {
  kind: "number";
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
};

// SELECT (AKA DROPDOWN)
type SelectFieldProps = BaseFieldProps & {
  kind: "select";
  // TODO
};

// BADGE
type BadgeFieldProps = BaseFieldProps & {
  kind: "badge";
  options: string[]; // define the values in page.tsx
  value: string[]; // selected values
  onChange: (value: string[]) => void;
};

// DATE
type DateFieldProps = BaseFieldProps & {
  kind: "date";
  // TODO
};

// TIME
type TimeFieldProps = BaseFieldProps & {
  kind: "time";
  // TODO
};

export type InputFieldProps =
  | TextFieldProps
  | NumberFieldProps
  | SelectFieldProps
  | BadgeFieldProps
  | DateFieldProps
  | TimeFieldProps;

const InputField: React.FC<InputFieldProps> = (props) => {
  const { label, required, className, fieldClassName, error, name } = props;

  const kind: FieldKind = props.kind ?? "text";
  const isBadge = kind === "badge";
  const badgeProps = isBadge ? (props as BadgeFieldProps) : null;

  const wrapperClasses = "space-y-1 " + (className ?? "");
  const fieldClasses =
    "rounded-md border px-3 py-2 bg-background shadow-[0_4px_0_0_#D1D5DB] " +
    (fieldClassName ?? "");

  let control: React.ReactNode = null;

  if (kind === "text") {
    // For Text
    const textProps = props as TextFieldProps;

    control = (
      <input
        id={name}
        name={name}
        className="body w-full bg-transparent outline-none placeholder:text-[var(--bloom-gray)]"
        value={textProps.value}
        onChange={(e) => textProps.onChange(e.target.value)}
        placeholder="Text"
      />
    );
  } else if (kind === "number") {
    const numberProps = props as NumberFieldProps;

    control = (
      <input
        id={name}
        name={name}
        className="body w-full bg-transparent outline-none placeholder:text-[var(--bloom-gray)]"
        value={numberProps.value}
        onChange={(e) => numberProps.onChange(e.target.value)}
        placeholder="0"
        type="number"
        inputMode="numeric"
      />
    );
  } else if (kind === "badge" && badgeProps) {
    // For Badge
    control = (
      <div className="flex min-h-[1.5rem] flex-wrap items-center gap-2">
        {badgeProps.value.length === 0 ? (
          <span className="body text-[var(--bloom-gray)] opacity-100">
            Select Amenities
          </span>
        ) : (
          badgeProps.value.map((item) => (
            <Badge key={item} className="inline-flex items-center gap-1">
              <span>{item}</span>
              <button
                type="button"
                onClick={() =>
                  badgeProps.onChange(
                    badgeProps.value.filter((v) => v !== item),
                  )
                }
                className="ml-1 text-[var(--bloom-red)] hover:opacity-80"
              >
                ×
              </button>
            </Badge>
          ))
        )}
      </div>
    );
  } else {
    // Just in case
    control = (
      <div className="body-sm text-[var(--bloom-red)]">
        Not implemented yet: <span className="font-mono">{kind}</span>
      </div>
    );
  }

  return (
    <div className={wrapperClasses}>
      <label htmlFor={name} className="body-sm-bold block">
        {label}
        {required && <span className="text-[var(--bloom-red)]"> *</span>}
      </label>

      {/* Text Field Container */}
      <div className={fieldClasses}>{control}</div>

      {/* Badge Field Container*/}
      {isBadge && badgeProps && (
        <div className="mt-2 flex flex-wrap gap-2">
          {badgeProps.options.map((option) => {
            const selected = badgeProps.value.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  if (selected) return; // only add via the list and removal via "×"
                  badgeProps.onChange([...badgeProps.value, option]);
                }}
                className="focus:outline-none"
              >
                <Badge
                  className={
                    selected
                      ? "cursor-default opacity-50"
                      : "cursor-pointer hover:opacity-100"
                  }
                >
                  {option}
                </Badge>
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="caption text-[var(--bloom-red)]">{error}</p>}
    </div>
  );
};

export default InputField;
