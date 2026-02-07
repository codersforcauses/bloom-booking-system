import { format, isValid, parse } from "date-fns";
import React, { useEffect, useState } from "react";
import { Matcher, MonthChangeEventHandler } from "react-day-picker";

type BaseFieldProps = {
  name: string;
  label: string;
  required?: boolean;
  className?: string;
  fieldClassName?: string;
  error?: string;
  placeholder?: string;
};

type DateFieldProps = BaseFieldProps & {
  kind: "date";
  value: Date | string | undefined;
  onChange: (value: Date | string | undefined) => void;
  defaultMonth?: Date;
  disabledDates?: Matcher | Matcher[];
  onMonthChange?: MonthChangeEventHandler;
};

export const useDateFieldChange = (props: DateFieldProps) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [viewMonth, setViewMonth] = useState<Date>(
    props.defaultMonth || new Date(),
  );

  // helper function to tell if a date is disabled (in case user input )
  const isDateDisabled = (date: Date) => {
    if (!props.disabledDates || !Array.isArray(props.disabledDates))
      return false;

    return props.disabledDates.some((matcher: Matcher) => {
      // Check "before" matcher (e.g., { before: new Date() })
      if (
        typeof matcher === "object" &&
        "before" in matcher &&
        matcher.before instanceof Date
      ) {
        return date < matcher.before;
      }

      // Check "dayOfWeek" matcher (e.g., { dayOfWeek: [0, 6] })
      if (
        typeof matcher === "object" &&
        "dayOfWeek" in matcher &&
        Array.isArray(matcher.dayOfWeek)
      ) {
        return matcher.dayOfWeek.includes(date.getDay());
      }

      // Check specific individual Dates
      if (matcher instanceof Date) {
        return matcher.toDateString() === date.toDateString();
      }

      return false;
    });
  };

  // Sync input text when the parent value changes e.g., from Calendar
  useEffect(() => {
    if (
      typeof props.value !== "string" &&
      props.value &&
      isValid(props.value)
    ) {
      setInputValue(format(props.value, "dd/MM/yyyy"));
      setViewMonth(props.value);
    } else {
      if (!props.value) setInputValue("");
      setViewMonth(props.defaultMonth || new Date()); // if value is empty or invalid, set month view to default
    }
  }, [props.value]);

  // Check if it's a valid date and has a reasonable year and then update props.value
  const validateAndUpdate = (text: string) => {
    if (!text) {
      props.onChange(undefined);
      return;
    }

    const parsedDate = parse(text, "dd/MM/yyyy", new Date());
    const isMeaningfulDate =
      isValid(parsedDate) &&
      parsedDate.getFullYear() > 1970 &&
      parsedDate.getFullYear() < 2050;
    const isUnavailable = isMeaningfulDate && isDateDisabled(parsedDate);

    if (isMeaningfulDate && !isUnavailable) {
      props.onChange(parsedDate);
    } else {
      props.onChange(text); // Trigger Zod error string
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);

    const parsedDate = parse(text, "dd/MM/yyyy", new Date());
    const isMeaningfulDate =
      isValid(parsedDate) &&
      parsedDate.getFullYear() > 1970 &&
      parsedDate.getFullYear() < 2050;

    // if it is meaningful date but text length is smaller than 10, the user may be in the process of entering, skip validating
    if (!isMeaningfulDate || text.length === 10) {
      validateAndUpdate(text);
    }
  };

  // Final validation when input is not on focus
  const handleBlur = () => validateAndUpdate(inputValue);

  return { inputValue, viewMonth, setViewMonth, handleInputChange, handleBlur };
};
