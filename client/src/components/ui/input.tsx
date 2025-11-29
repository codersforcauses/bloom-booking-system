// This file contains the following input field types:
// - Text
// - Number
// - Select
// - Badge
// - Date (not implemented)
// - Time (not implemented)

import React from "react";

import Badge from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FieldKind = "text" | "number" | "select" | "badge" | "date" | "time";

type BaseFieldProps = {
  name: string;
  label: string;
  required?: boolean;
  className?: string;
  fieldClassName?: string;
  error?: string;
  placeholder?: string;
};

type TextFieldProps = BaseFieldProps & {
  kind?: "text";
  value: string;
  onChange: (value: string) => void;
};

type NumberFieldProps = BaseFieldProps & {
  kind: "number";
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
};

type SelectOption = { label: string; value: string };
type SelectFieldProps = BaseFieldProps & {
  kind: "select";
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
};

type BadgeFieldProps = BaseFieldProps & {
  kind: "badge";
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
};

type DateFieldProps = BaseFieldProps & {
  kind: "date";
};

type TimeFieldProps = BaseFieldProps & {
  kind: "time";
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

  const isSelect = kind === "select";
  const selectProps = isSelect ? (props as SelectFieldProps) : null;

  const wrapperClasses = ["space-y-1", className].filter(Boolean).join(" ");
  const fieldClasses = [
    "rounded-md border bg-background",
    "shadow-[0_4px_0_0_#D1D5DB]",
    fieldClassName,
  ]
    .filter(Boolean)
    .join(" ");

  let control: React.ReactNode = null;

  if (kind === "text") {
    control = renderTextFieldControl(props as TextFieldProps, name);
  } else if (kind === "number") {
    control = renderNumberFieldControl(props as NumberFieldProps, name);
  } else if (kind === "select" && selectProps) {
    control = renderSelectFieldControl(selectProps);
  } else if (kind === "badge" && badgeProps) {
    control = renderBadgeFieldControl(badgeProps);
  } else {
    control = renderNotImplementedControl(kind);
  }

  return (
    <div className={wrapperClasses}>
      <label htmlFor={name} className="body-sm-bold block">
        {label}
        {required && <span className="text-[var(--bloom-red)]"> *</span>}
      </label>

      <div className={fieldClasses}>{control}</div>

      {isBadge && badgeProps && (
        <div className="mt-2 flex flex-wrap gap-2">
          {badgeProps.options.map((option) => {
            const selected = badgeProps.value.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  if (selected) return;
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

function renderTextFieldControl(props: TextFieldProps, name: string) {
  return (
    <input
      id={name}
      name={name}
      className="body w-full bg-transparent px-3 py-2 outline-none placeholder:text-[var(--bloom-gray)]"
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder ?? "Text"}
    />
  );
}

function renderNumberFieldControl(props: NumberFieldProps, name: string) {
  return (
    <input
      id={name}
      name={name}
      className="body w-full bg-transparent px-3 py-2 outline-none placeholder:text-[var(--bloom-gray)]"
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder ?? "Number"}
      type="number"
      inputMode="numeric"
      min={props.min}
      max={props.max}
      step={props.step}
    />
  );
}

function renderSelectFieldControl(props: SelectFieldProps) {
  return (
    <Select value={props.value} onValueChange={props.onChange}>
      <SelectTrigger className="body flex w-full items-center justify-between border-none bg-transparent px-3 py-2 shadow-none focus:ring-0 focus:ring-offset-0">
        <SelectValue placeholder={props.placeholder ?? "Select an option"} />
      </SelectTrigger>
      <SelectContent>
        {props.options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function renderBadgeFieldControl(props: BadgeFieldProps) {
  return (
    <div className="flex min-h-[1.5rem] flex-wrap items-center gap-2">
      {props.value.length === 0 ? (
        <span className="body px-3 py-2 text-[var(--bloom-gray)] opacity-100">
          {props.placeholder ?? "Select amenities"}
        </span>
      ) : (
        props.value.map((item) => (
          <Badge key={item} className="inline-flex items-center gap-1">
            <span>{item}</span>
            <button
              type="button"
              onClick={() =>
                props.onChange(props.value.filter((v) => v !== item))
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
}

function renderNotImplementedControl(kind: FieldKind) {
  return (
    <div className="body-sm text-[var(--bloom-red)]">
      Not implemented yet: <span className="font-mono">{kind}</span>
    </div>
  );
}
