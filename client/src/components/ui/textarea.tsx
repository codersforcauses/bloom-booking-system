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
      <label htmlFor={name} className="body mb-1 block">
        {label ? label : capitalizeFirstLetter(name)}
      </label>
      <div className="w-full rounded-md border border-[hsl(var(--border))] bg-background shadow-[0_4px_0_0_#D1D5DB]">
        <textarea
          id={id ? id : name}
          name={name}
          placeholder={placeholder ? placeholder : capitalizeFirstLetter(name)}
          rows={rows ? rows : 4}
          className="body w-full bg-transparent px-3 py-2 outline-none placeholder:text-[hsl(var(--input))]"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
    </>
  );
};

export default Textarea;
