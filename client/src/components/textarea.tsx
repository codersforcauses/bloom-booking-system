// Usage:
// <Textarea  id="componentIdentifier" // optional (defaults to name if not provided)
//            name="fieldName"
//            label="fieldLabel" // optional (defaults to name with first letter capitalized if not provided)
//            placeholder="placeholderText" // optional (defaults to name with first letter capitalized if not provided)
//            rows={4} // optional (defaults to 4 if not provided)
//            value={fieldValue} // useState variable
//            onChange={fieldSetterFunction} // useState setter function
//            required={true} // optional (if required, shows asterisk)
//            className="customTextareaClass" // optional, additional classNames for textarea
// />

// Style (apart from border color: --border, other styles match InputField):
// label: body-sm-bold, default text color
// textarea: border color: --border, background color: --background, shadow: 0 4px 0 #D1D5DB
// placeholder: text color: --bloom-gray

"use client";
import React from "react";

import { cn } from "@/lib/utils";

interface TextareaProps {
  id?: string;
  name: string;
  label?: string;
  placeholder?: string;
  rows?: number;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

// Use to capitalize the first letter of name as label placeholder if not passed
const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const Textarea: React.FC<TextareaProps> = ({
  id,
  name,
  label,
  placeholder,
  rows,
  value,
  onChange,
  required,
  className,
}) => {
  return (
    <>
      <label htmlFor={name} className={"body-sm-bold mb-1 block"}>
        {label ? label : capitalizeFirstLetter(name)}
        {required && <span className={"text-[var(--bloom-red)]"}> *</span>}
      </label>
      <textarea
        id={id ? id : name}
        name={name}
        placeholder={placeholder ? placeholder : capitalizeFirstLetter(name)}
        rows={rows ? rows : 4}
        className={cn(
          "w-full rounded-md border border-border bg-background shadow-bloom-input outline-none",
          "body px-3 py-2 placeholder:text-bloom-gray",
          className,
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </>
  );
};

export default Textarea;
