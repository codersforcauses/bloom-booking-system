// Usage:
// <Textarea  id="componentIdentifier" // optional (defaults to name if not provided)
//            name="fieldName"
//            label="fieldLabel" // optional (defaults to name with first letter capitalized if not provided)
//            placeholder="placeholderText" // optional (defaults to name with first letter capitalized if not provided)
//            rows={4} // optional (defaults to 4 if not provided)
//            value={fieldValue} // useState variable
//            setValue={fieldSetterFunction} // useState setter function
// />

// Style (apart from border color: --border, other styles match InputField):
// label: body-sm-bold, default text color
// textarea: border color: --border, background color: --background, shadow: 0 4px 0 #D1D5DB
// placeholder: text color: --bloom-gray

"use client";
import React, { useState } from "react";

interface TextareaProps {
  id?: string;
  name: string;
  label?: string;
  placeholder?: string;
  rows?: number;
  value: string;
  setValue: (value: string) => void;
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
  setValue,
}) => {
  return (
    <>
      <label htmlFor={name} className="body-sm-bold mb-1 block">
        {label ? label : capitalizeFirstLetter(name)}
      </label>
      <div className="w-full rounded-md border border-[hsl(var(--border))] bg-background shadow-[0_4px_0_0_#D1D5DB]">
        <textarea
          id={id ? id : name}
          name={name}
          placeholder={placeholder ? placeholder : capitalizeFirstLetter(name)}
          rows={rows ? rows : 4}
          className="body w-full bg-transparent px-3 py-2 outline-none placeholder:text-[var(--bloom-gray)]"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
    </>
  );
};

export default Textarea;
