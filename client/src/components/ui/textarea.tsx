// Usage:
// <Textarea  id="componentIdentifier" // optional (defaults to name if not provided)
//            name="fieldName"
//            label="fieldLabel" // optional (defaults to name with first letter capitalized if not provided)
//            placeholder="placeholderText" // optional (defaults to name with first letter capitalized if not provided)
//            rows={4} // optional (defaults to 4 if not provided)
//            value={fieldValue} // useState variable
//            onChange={fieldSetterFunction} // useState setter function
//            required={true} // optional (if required, shows requiredText)
//            requiredText="requiredText" // optional (default to asterisk)
//            labelClassName="customLabelClass" // optional, additional classNames for label
//            requiredTextClassName="customAsteriskClass" // optional, additional classNames for asterisk when required = true
//            divClassName="customDivClass" // optional, additional classNames for div wrapping textarea
//            textareaClassName="customTextareaClass" // optional, additional classNames for textarea
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
  requiredText?: string;
  labelClassName?: string;
  requiredTextClassName?: string;
  divClassName?: string;
  textareaClassName?: string;
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
  requiredText,
  labelClassName,
  requiredTextClassName,
  divClassName,
  textareaClassName,
}) => {
  return (
    <>
      <label
        htmlFor={name}
        className={cn("body-sm-bold mb-1 block", labelClassName)}
      >
        {label ? label : capitalizeFirstLetter(name)}
        {required && (
          <span
            className={cn("text-[var(--bloom-red)]", requiredTextClassName)}
          >
            {requiredText ? requiredText : "*"}
          </span>
        )}
      </label>
      <div
        className={cn(
          "w-full rounded-md border border-[hsl(var(--border))] bg-background shadow-[0_4px_0_0_#D1D5DB]",
          divClassName,
        )}
      >
        <textarea
          id={id ? id : name}
          name={name}
          placeholder={placeholder ? placeholder : capitalizeFirstLetter(name)}
          rows={rows ? rows : 4}
          className={cn(
            "body w-full bg-transparent px-3 py-2 outline-none placeholder:text-[var(--bloom-gray)]",
            textareaClassName,
          )}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </>
  );
};

export default Textarea;
