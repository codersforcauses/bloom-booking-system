/**
 * Usage of Form:
 *
 * ```tsx
 * import { Form, ControlledField } from "@/components/ui/form";
 *
 * <Form
 *   schema={schema} // Note: according to the current implementation, numbers are also string.
 *                   // For an example please refer to /app/test/form/page.tsx
 *   onSubmit={submitHandler} // callback function in the form of (data) => handleSubmit(data)
 *   onError={errorHandler}   // optional, allows flexibility of error message display,
 *                            // callback function in the form of (errors) => handleError(errors)
 *                            // example structure of errors:
 *                            // {
 *                            //   name: { message: "name is a required field" },
 *                            //   age: { message: "age is a required field" }
 *                            // }
 *   className="customFormClassName" // optional
 * >
 *   {children} // free to add any contents here, but using ControlledField for input is a must
 * </Form>
 * ```
 *
 * Usage of ControlledField (wrapper necessary for input validation):
 *
 * ```tsx
 * <ControlledField<type>      // type must be specified for type checking
 *   name="fieldName"          // fieldName must be aligned with the definition in zod
 * >
 *   {({ value, onChange }) => (
 *     <InputField             // can be other input-related components
 *       kind="text"
 *       label="Name"
 *       name="name"
 *       value={value}         // pass value
 *       onChange={onChange}   // pass onChange (onValueChange in some components)
 *       placeholder="Enter your name here..."
 *     />
 *   )}
 * </ControlledField>
 * ```
 *
 * Error Handling:
 * - Default behaviour: when no extra error handling logic is added,
 *   an alert will come up to show error messages of all fields to users
 * - `onError` function as error handler
 * - Wraps the children: `{(methods) => (<>{children}</>)}`
 *   then get errors by `methods.formState.errors` or check validity of form data by `methods.formState.isValid`
 *
 * To see an example, check /app/test/form/page.tsx.
 */

"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { ReactElement, ReactNode } from "react";
import {
  Controller,
  FieldErrors,
  FormProvider,
  useForm,
  useFormContext,
  UseFormReturn,
} from "react-hook-form";
import * as z from "zod";

import { cn } from "@/lib/utils";

type AnyZodObject = z.ZodObject<any>;

type FormData<TSchema extends AnyZodObject> = z.infer<TSchema>;

// Ensure that form data and the zod schema is of the same type
type FormProps<TSchema extends AnyZodObject> = {
  schema: TSchema;
  children: ReactNode | ((methods: UseFormReturn<any>) => ReactNode);
  onSubmit: (data: FormData<TSchema>) => void;
  onError?: (errors: FieldErrors<z.input<TSchema>>) => void;
  className?: string;
};

// Helper function to make zod invalidation errors to a message paragraph
function getErrorMessage<TSchema extends AnyZodObject>(
  errors: FieldErrors<z.input<TSchema>>,
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

const Form = <TSchema extends AnyZodObject>({
  schema,
  children,
  onSubmit,
  onError,
  className,
}: FormProps<TSchema>) => {
  const methods = useForm<z.input<TSchema>, any, z.output<TSchema>>({
    resolver: zodResolver(schema),
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
  name: string; // match the field defined in zod
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
