"use client";
import React from "react";
import * as yup from "yup";

import { Button } from "@/components/ui/button";
import { ControlledField, Form } from "@/components/ui/form";
import InputField from "@/components/ui/input";

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

export default function TestFormPage() {
  return (
    <>
      {/* Default error handling */}
      <div className="mx-auto w-full max-w-xl px-10 py-10">
        <p className="title text-center">Form 1 (default error handling)</p>
        <Form
          schema={schema}
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
                  disabled={Object.keys(methods.formState.errors).length > 0}
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
