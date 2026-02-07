// This file contains the following input field types:
// - Text
// - Number
// - Select
// - Badge
// - Date
// - Time (HH:MM input)
// - Time-Select (08:00–17:00, 30-min intervals)
// - Search

import { isValid } from "date-fns";
import { Calendar as CalendarIcon, SearchIcon } from "lucide-react";
import React, { useState } from "react";
import { Matcher, MonthChangeEventHandler } from "react-day-picker";

import Badge from "@/components/badge";
import { Calendar } from "@/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDateFieldChange } from "@/hooks/date-field";
import { cn } from "@/lib/utils";

type FieldKind =
  | "text"
  | "number"
  | "select"
  | "badge"
  | "date"
  | "time"
  | "time-select"
  | "search";

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

export type SelectOption = { label: string; value: string; disabled?: boolean };
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
  actionElement?: React.ReactNode;
};

type DateFieldProps = BaseFieldProps & {
  kind: "date";
  value: Date | string | undefined;
  onChange: (value: Date | string | undefined) => void;
  defaultMonth?: Date;
  disabledDates?: Matcher | Matcher[];
  onMonthChange?: MonthChangeEventHandler;
};

type TimeFieldProps = BaseFieldProps & {
  kind: "time";
  value: string; // "HH:MM"
  onChange: (value: string) => void;
};

type TimeSelectFieldProps = BaseFieldProps & {
  kind: "time-select";
  value: string; // "HH:MM"
  onChange: (value: string) => void;
};

type SearchFieldProps = BaseFieldProps & {
  kind: "search";
  value: string;
  onSearch: (value: string) => void;
};

// THIS IS A PLACEHOLDER
// i will redo this once the booking model is merged into main.
// 08:00 → 17:00 in 30-minute steps
const TIME_OPTIONS_30_MIN: string[] = (() => {
  const times: string[] = [];
  for (let hour = 8; hour <= 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 17 && minute > 0) break; // stop at 17:00
      const hh = hour.toString().padStart(2, "0");
      const mm = minute.toString().padStart(2, "0");
      times.push(`${hh}:${mm}`);
    }
  }
  return times;
})();

export type InputFieldProps =
  | TextFieldProps
  | NumberFieldProps
  | SelectFieldProps
  | BadgeFieldProps
  | DateFieldProps
  | TimeFieldProps
  | TimeSelectFieldProps
  | SearchFieldProps;

const InputField: React.FC<InputFieldProps> = (props) => {
  const { label, required, className, fieldClassName, error, name } = props;

  const kind: FieldKind = props.kind ?? "text";

  const isBadge = kind === "badge";
  const badgeProps = isBadge ? (props as BadgeFieldProps) : null;

  const isSelect = kind === "select";
  const selectProps = isSelect ? (props as SelectFieldProps) : null;

  const isDate = kind === "date";
  const dateProps = isDate ? (props as DateFieldProps) : null;

  const isTimeSelect = kind === "time-select";
  const timeSelectProps = isTimeSelect ? (props as TimeSelectFieldProps) : null;

  const wrapperClasses = ["space-y-2", className].filter(Boolean).join(" ");
  const fieldClasses = [
    "rounded-md border bg-background",
    "shadow-bloom-input",
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
  } else if (kind === "date" && dateProps) {
    control = renderDateFieldControl(dateProps);
  } else if (kind === "time") {
    control = renderTimeFieldControl(props as TimeFieldProps, name);
  } else if (kind === "time-select" && timeSelectProps) {
    control = renderTimeSelectFieldControl(timeSelectProps);
  } else if (kind === "badge" && badgeProps) {
    control = renderBadgeFieldControl(badgeProps);
  } else if (kind === "search") {
    control = renderSearchFieldControl(props as SearchFieldProps, name);
  } else {
    control = renderNotImplementedControl(kind);
  }

  return (
    <div className={cn(wrapperClasses)}>
      <label htmlFor={name} className="body-sm-bold block">
        {label}
        {required && <span className="text-bloom-red"> *</span>}
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
          {badgeProps.actionElement}
        </div>
      )}

      {error && <p className="caption text-bloom-red">{error}</p>}
    </div>
  );
};

export default InputField;

function renderTextFieldControl(props: TextFieldProps, name: string) {
  return (
    <input
      id={name}
      name={name}
      className="body w-full bg-transparent px-3 py-2 outline-none placeholder:text-bloom-gray"
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
      className="body w-full bg-transparent px-3 py-2 outline-none placeholder:text-bloom-gray"
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
          <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function renderDateFieldControl(props: DateFieldProps) {
  const { inputValue, viewMonth, setViewMonth, handleInputChange, handleBlur } =
    useDateFieldChange(props);

  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder={props.placeholder ?? "dd/MM/yyyy"}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className="body w-full border-none bg-transparent px-3 py-2 pr-10 outline-none placeholder:text-bloom-gray focus:ring-0 focus:ring-offset-0"
      />

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
            tabIndex={-1}
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
        </PopoverTrigger>

        <PopoverContent align="end" className="p-1">
          <Calendar
            mode="single"
            selected={
              props.value instanceof Date && isValid(props.value)
                ? props.value
                : undefined
            }
            onSelect={props.onChange}
            month={
              viewMonth instanceof Date && isValid(viewMonth)
                ? viewMonth
                : new Date()
            }
            onMonthChange={(month) => {
              // first day of the month
              setViewMonth(month);
              props.onMonthChange?.(month);
            }}
            disabled={props.disabledDates}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function renderTimeFieldControl(props: TimeFieldProps, name: string) {
  const handleChange = (raw: string) => {
    // strip non-digits, cap at 4 digits
    const digits = raw.replace(/\D/g, "").slice(0, 4);

    if (digits.length === 0) {
      props.onChange("");
      return;
    }

    // hour n minute validation
    if (digits.length <= 2) {
      const hh = Number(digits);
      if (hh > 23) return;
      props.onChange(digits);
      return;
    }

    const hh = Number(digits.slice(0, 2));
    const mm = Number(digits.slice(2));

    if (hh > 23 || mm > 59) return;

    const formatted = `${digits.slice(0, 2)}:${digits.slice(2)}`;
    props.onChange(formatted);
  };

  return (
    <input
      id={name}
      name={name}
      className="body w-full bg-transparent px-3 py-2 outline-none placeholder:text-bloom-gray"
      value={props.value}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={props.placeholder ?? "HH:MM"}
      inputMode="numeric"
      maxLength={5}
    />
  );
}

function renderTimeSelectFieldControl(props: TimeSelectFieldProps) {
  return (
    <Select value={props.value} onValueChange={props.onChange}>
      <SelectTrigger className="body flex w-full items-center justify-between border-none bg-transparent px-3 py-2 shadow-none focus:ring-0 focus:ring-offset-0">
        <SelectValue placeholder={props.placeholder ?? "Select a time"} />
      </SelectTrigger>
      <SelectContent>
        {TIME_OPTIONS_30_MIN.map((time) => (
          <SelectItem key={time} value={time}>
            {time}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function renderBadgeFieldControl(props: BadgeFieldProps) {
  return (
    <div className="flex min-h-[38px] flex-wrap items-center gap-2 px-1.5 py-1.5">
      {props.value.length === 0 ? (
        <span className="body mx-1.5 text-bloom-gray opacity-100">
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
              className="ml-1 text-bloom-red hover:opacity-80"
            >
              ×
            </button>
          </Badge>
        ))
      )}
    </div>
  );
}

function renderSearchFieldControl(props: SearchFieldProps, name: string) {
  const [tempValue, setTempValue] = useState(props.value);

  React.useEffect(() => {
    setTempValue(props.value);
  }, [props.value]);
  const handleOnBlur = () => props.onSearch(tempValue);

  const handleOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") props.onSearch(tempValue);
  };

  return (
    <div
      className={["flex flex-col", props.className].filter(Boolean).join(" ")}
    >
      <div
        className={["relative", props.fieldClassName].filter(Boolean).join(" ")}
      >
        <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

        <input
          id={name}
          name={name}
          type="text"
          className="body w-full rounded-md border bg-white px-3 py-1 pl-8 outline-none placeholder:text-[var(--bloom-gray)]"
          placeholder={props.placeholder ?? "Search..."}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleOnBlur}
          onKeyDown={handleOnKeyDown}
        />
      </div>
    </div>
  );
}

function renderNotImplementedControl(kind: FieldKind) {
  return (
    <div className="body-sm text-bloom-red">
      Not implemented yet: <span className="font-mono">{kind}</span>
    </div>
  );
}
