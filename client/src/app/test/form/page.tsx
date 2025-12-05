"use client";
import React from "react";
import * as yup from "yup";

import { ControlledField, Form } from "@/components/ui/form";
import InputField from "@/components/ui/input";

const schema = yup.object({
  name: yup.string(), // optional field
  age: yup
    .string()
    .required()
    .matches(/^\d+$/, "Age must be an non-negative integer")
    .test("positive", "Age must be between 1 and 12", (value) => {
      if (!value) return false;
      return Number(value) >= 1 && Number(value) <= 12;
    }),
});

export default function TestFormPage() {
  return (
    <Form
      schema={schema}
      onSubmit={(data) => {
        console.log("submitted", data);
      }}
      // onError={(errors) => console.log(Object.entries(errors))}
    >
      <ControlledField<string> name="name">
        {({ value, onChange }) => (
          <>
            <InputField
              kind="text"
              label="Name"
              name="name"
              value={value}
              onChange={onChange}
              placeholder="Enter your name here..."
            />
            <p>This is an input</p>
          </>
        )}
      </ControlledField>

      <ControlledField<string> name="age">
        {({ value, onChange }) => (
          <InputField
            kind="number"
            label="Age"
            name="age"
            value={value}
            onChange={onChange}
            placeholder="Enter your age here..."
          />
        )}
      </ControlledField>
      <input type="submit"></input>
    </Form>
  );
}
