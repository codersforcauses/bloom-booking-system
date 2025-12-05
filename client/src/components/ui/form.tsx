// Usage of Form:
// import { Form, ControlledField } from "@/components/ui/form"; // Note: both are necessary and not default export!
// <Form schema={yupSchema} // Note: according to the current implimentation, numbers are also string. For an example please refer to /app/test/form/page.tsx
//       onSubmit={submitHandler} // callback function in the form of (data) => handleSumit(data)
//       orError={errorHandler} // optional, allows flexibility of error message display,
//                                  callback function in the form of (errors) => handleError(errors)
//                                  example structure of errors:
//                                  {
//                                    name: { message: "name is a required field" },
//                                    age: { message: "age is a required field" }
//                                  }
//        className="customFormClassName" // optional
// >
// {children} // free to add any contents here, but using ControlledField for input is a must
// </Form>

// Usage of ControlledField (wrapper necessary for input validation):
// <ControlledField<type>      // type must be specified for type checking
//   name="fieldName"          // fieldName must be aligned with the definition in yup
// >
//   {({ value, onChange }) => (
// <InputField           // can be other input-related components
//   kind="text"
//   label="Name"
//   name="name"
//   value={value}       // pass value
//   onChange={onChange}   // pass onChange
//   placeholder="Enter your name here..."
// />
//   )}
// </ControlledField>

// Error Handling:
// Since input validation is not inbuilt in InputField and Textarea,
// the component offers three ways of error handling
// 1. Default behaviour: when no extra error handling logic is added,
//    an alert will come up to show error messages of all fields to users
// 2. onError function as error handler
// 3. (not recommended unless necessary)
//    wraps the children to   {(methods) => (<>{children}</>)}
//    then get errors by methods.formState.errors
// To get example, check /app/test/form/page.tsx

"use client";
import { yupResolver } from "@hookform/resolvers/yup";
import React, { ReactElement, ReactNode } from "react";
import {
  Controller,
  FieldErrors,
  FormProvider,
  useForm,
  useFormContext,
  UseFormReturn,
} from "react-hook-form";
import * as yup from "yup";

import { cn } from "@/lib/utils";

type FormData<TSchema extends yup.AnyObjectSchema> = yup.InferType<TSchema>;

// Ensure that form data and the yup schema is of the same type
type FormProps<TSchema extends yup.AnyObjectSchema> = {
  schema: TSchema;
  children: ReactNode | ((methods: UseFormReturn<any>) => ReactNode);
  onSubmit: (data: FormData<TSchema>) => void;
  onError?: (errors: FieldErrors<FormData<TSchema>>) => void;
  className?: string;
};

// Helper function to make yup invalidation errors to a message paragraph
function getErrorMessage<TSchema extends yup.AnyObjectSchema>(
  errors: FieldErrors<FormData<TSchema>>,
) {
  let returnMessage = "Please fix the errors before submission:\n\n";
  returnMessage += Object.entries(errors)
    .map(([field, error]) => {
      const message = error?.message || "Invalid value";
      return `• ${field}: ${message}`;
    })
    .join("\n");
  return returnMessage;
}

const Form = <TSchema extends yup.AnyObjectSchema>({
  schema,
  children,
  onSubmit,
  onError,
  className,
}: FormProps<TSchema>) => {
  const methods = useForm<yup.InferType<TSchema>>({
    resolver: yupResolver(schema),
  });

  return (
    <>
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit, (errors) => {
            if (onError) onError(errors);
            else alert(getErrorMessage(errors));
          })}
          className={cn(
            "flex w-full flex-col space-y-3 rounded-md border border-[hsl(var(--border))] bg-background px-8 py-8",
            className,
          )}
        >
          {typeof children === "function" ? children(methods) : children}
        </form>
      </FormProvider>
    </>
  );
};

// To make input validation effective, an extra wrapper is needed for the input field
type controlledFieldProps<TSchema> = {
  name: string; // match the field defined in yup
  children: (props: {
    value: TSchema;
    onChange: (
      value:
        | TSchema
        | React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
          >,
    ) => void;
  }) => ReactElement;
};

const ControlledField = <TSchema,>({
  name,
  children,
}: controlledFieldProps<TSchema>) => {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) =>
        children({
          value: field.value ?? "",
          onChange: field.onChange,
        })
      }
    />
  );
};

export { ControlledField, Form };
