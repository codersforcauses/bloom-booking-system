"use client";
import React from "react";
import * as yup from "yup";

import { Button } from "@/components/ui/button";
import { ControlledField, Form } from "@/components/ui/form";
import InputField from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const schema = yup.object({
  firstname: yup.string().required(),
  lastname: yup.string().required(),
  middlename: yup.string(),
  age: yup
    .string()
    .required()
    .matches(/^\d+$/, "Age must be an non-negative integer")
    .test("positive", "Age must be between 1 and 12", (value) => {
      if (!value) return false;
      return Number(value) >= 1 && Number(value) <= 12;
    }),
});

const extendedSchema = yup.object({
  firstname: yup.string().required(),
  lastname: yup.string().required(),
  middlename: yup.string(),
  age: yup
    .string()
    .required()
    .matches(/^\d+$/, "Age must be an non-negative integer")
    .test("positive", "Age must be between 1 and 120", (value) => {
      if (!value) return false;
      return Number(value) >= 1 && Number(value) <= 120;
    }),
  frequency: yup
    .string()
    .required()
    .oneOf(["daily", "weekly", "monthly"], "Invalid frequency"),
  amenities: yup
    .array()
    .of(
      yup
        .string()
        .oneOf(
          [
            "Audio",
            "Video",
            "White Board",
            "HDMI",
            "Projector",
            "Speaker Phone",
          ],
          "Invalid amenities",
        ),
    )
    .required(),
  recurrenceDate: yup
    .string()
    .oneOf(["Monday", "Tuesday", "Wednesday"], "Invalid date")
    .required(),
});

const FREQUENCIES = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  {
    label: "Monthly",
    value: "monthly",
  },
];

const AMENITIES = [
  "Audio",
  "Video",
  "White Board",
  "HDMI",
  "Projector",
  "Speaker Phone",
];

export default function TestFormPage() {
  return (
    <>
      {/* Default error handling */}
      <div className="mx-auto w-full max-w-xl px-10 py-10">
        <p className="title text-center">Form 1 (default error handling)</p>
        <Form
          schema={extendedSchema}
          onSubmit={(data) => {
            alert("submitted data:\n" + JSON.stringify(data));
          }}
          // onError={(errors) => alert("errors:\n"+JSON.stringify(errors))}
        >
          <div className="flex flex-row gap-3">
            <ControlledField<string> name="firstname">
              {({ value, onChange }) => (
                <InputField
                  kind="text"
                  label="First Name"
                  name="firstname"
                  value={value}
                  onChange={onChange}
                  placeholder="First Name"
                  required={true}
                />
              )}
            </ControlledField>

            <ControlledField<string> name="middlename">
              {({ value, onChange }) => (
                <InputField
                  kind="text"
                  label="Middle Name"
                  name="middlename"
                  value={value}
                  onChange={onChange}
                  placeholder="Middle Name"
                />
              )}
            </ControlledField>

            <ControlledField<string> name="lastname">
              {({ value, onChange }) => (
                <InputField
                  kind="text"
                  label="Last Name"
                  name="lastname"
                  value={value}
                  onChange={onChange}
                  placeholder="Last Name"
                  required={true}
                />
              )}
            </ControlledField>
          </div>

          <ControlledField<string> name="age">
            {({ value, onChange }) => (
              <InputField
                kind="number"
                label="Age"
                name="age"
                value={value}
                onChange={onChange}
                placeholder="Age"
                required={true}
              />
            )}
          </ControlledField>

          <ControlledField<string> name="frequency">
            {({ value, onChange }) => (
              <InputField
                kind="select"
                label="Frequency"
                name="frequency"
                options={FREQUENCIES}
                value={value}
                onChange={onChange}
                placeholder="Select frequency"
              />
            )}
          </ControlledField>

          <ControlledField<string[]> name="amenities">
            {({ value, onChange }) => (
              <InputField
                kind="badge"
                label="Amenities"
                name="amenities"
                options={AMENITIES}
                value={value}
                onChange={onChange}
                placeholder="Select Amenities"
              />
            )}
          </ControlledField>

          <ControlledField<string> name="recurrenceDate">
            {({ value, onChange }) => (
              <>
                <p className="body-sm-bold">Recurrence Date</p>
                <RadioGroup
                  value={value}
                  onValueChange={onChange}
                  className="flex space-x-4"
                >
                  <div className="space-x-2">
                    <RadioGroupItem value="Monday" id="Monday" />
                    <Label htmlFor="Monday">Monday</Label>
                  </div>

                  <div className="space-x-2">
                    <RadioGroupItem value="Tuesday" id="Tuesday" />
                    <Label htmlFor="Tuesday">Tuesday</Label>
                  </div>

                  <div className="space-x-2">
                    <RadioGroupItem value="Wednesday" id="Wednesday" />
                    <Label htmlFor="Wednesday">Wednesday</Label>
                  </div>
                </RadioGroup>
              </>
            )}
          </ControlledField>

          {/* Button */}
          <div className="ml-auto space-x-3 space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => alert(JSON.stringify("Cancel button triggered"))}
            >
              Cancel
            </Button>
            <Button type="submit" variant="confirm">
              Okay
            </Button>
          </div>
        </Form>
      </div>

      {/* onError function */}
      <div className="mx-auto w-full max-w-xl px-10 py-10">
        <p className="title text-center">
          Form 2 (customized onError function)
        </p>
        <Form
          schema={schema}
          onSubmit={(data) => {
            alert("submitted data:\n" + JSON.stringify(data));
          }}
          onError={(errors) => alert("errors:\n" + JSON.stringify(errors))}
          className="bg-background"
        >
          <div className="flex flex-row gap-3">
            <ControlledField<string> name="firstname">
              {({ value, onChange }) => (
                <InputField
                  kind="text"
                  label="First Name"
                  name="firstname"
                  value={value}
                  onChange={onChange}
                  placeholder="First Name"
                  required={true}
                />
              )}
            </ControlledField>

            <ControlledField<string> name="middlename">
              {({ value, onChange }) => (
                <InputField
                  kind="text"
                  label="Middle Name"
                  name="middlename"
                  value={value}
                  onChange={onChange}
                  placeholder="Middle Name"
                />
              )}
            </ControlledField>

            <ControlledField<string> name="lastname">
              {({ value, onChange }) => (
                <InputField
                  kind="text"
                  label="Last Name"
                  name="lastname"
                  value={value}
                  onChange={onChange}
                  placeholder="Last Name"
                  required={true}
                />
              )}
            </ControlledField>
          </div>

          <ControlledField<string> name="age">
            {({ value, onChange }) => (
              <InputField
                kind="number"
                label="Age"
                name="age"
                value={value}
                onChange={onChange}
                placeholder="Age"
                required={true}
              />
            )}
          </ControlledField>

          {/* Button */}
          <div className="ml-auto space-x-3 space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => alert(JSON.stringify("Cancel button triggered"))}
            >
              Cancel
            </Button>
            <Button type="submit" variant="confirm">
              Okay
            </Button>
          </div>
        </Form>
      </div>

      {/* get errors from FormProvider */}
      <div className="mx-auto w-full max-w-xl px-10 py-10">
        <p className="title text-center">
          Form 3 (get errors from FormProvider)
        </p>
        <Form
          schema={schema}
          onSubmit={(data) => {
            alert("submitted data:\n" + JSON.stringify(data));
          }}
          onError={(errors) => alert("errors:\n" + JSON.stringify(errors))}
          className="bg-background"
        >
          {(methods) => (
            <>
              <div className="flex flex-row gap-3">
                <ControlledField<string> name="firstname">
                  {({ value, onChange }) => (
                    <InputField
                      kind="text"
                      label="First Name"
                      name="firstname"
                      value={value}
                      onChange={onChange}
                      placeholder="First Name"
                      required={true}
                    />
                  )}
                </ControlledField>

                <ControlledField<string> name="middlename">
                  {({ value, onChange }) => (
                    <InputField
                      kind="text"
                      label="Middle Name"
                      name="middlename"
                      value={value}
                      onChange={onChange}
                      placeholder="Middle Name"
                    />
                  )}
                </ControlledField>

                <ControlledField<string> name="lastname">
                  {({ value, onChange }) => (
                    <InputField
                      kind="text"
                      label="Last Name"
                      name="lastname"
                      value={value}
                      onChange={onChange}
                      placeholder="Last Name"
                      required={true}
                    />
                  )}
                </ControlledField>
              </div>

              <ControlledField<string> name="age">
                {({ value, onChange }) => (
                  <InputField
                    kind="number"
                    label="Age"
                    name="age"
                    value={value}
                    onChange={onChange}
                    placeholder="Age"
                    required={true}
                  />
                )}
              </ControlledField>

              {/* Button */}
              <div className="ml-auto space-x-3 space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    alert(JSON.stringify("Cancel button triggered"))
                  }
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="confirm"
                  disabled={!methods.formState.isValid} // better than methods.formState.errors as errors will be empty at the beginning
                >
                  Okay
                </Button>
              </div>
            </>
          )}
        </Form>
      </div>
    </>
  );
}
