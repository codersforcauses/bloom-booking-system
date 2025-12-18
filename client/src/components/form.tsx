/**
 * Usage of Form:
 * ```tsx
 * <Form
 *   schema={schema}
 *   // Zod schema defining the form data. Note: numbers are treated as strings.
 *
 *   onSubmit={submitHandler}
 *   // Callback: (data, methods?) => void
 *   // `methods` is optional; use it for programmatic actions like setError, setValue, etc.
 *
 *   onError={errorHandler}
 *   // Optional callback to handle form errors manually
 *   // Example structure:
 *   // {
 *   //   name: { message: "name is required" },
 *   //   age: { message: "age is required" }
 *   // }
 *
 *   className="customFormClassName" // optional
 * >
 *   {(methods) => (          // `methods` is optional; you can also pass only children
 *     <>
 *       {children}
 *     </>
 *   )}
 * </Form>
 * ```
 *
 * Usage of ControlledField (wrap the input components for validation):
 * ```tsx
 * <ControlledField<Type>      // specify type for type-checking
 *   name="fieldName"          // must match the Zod schema field
 * >
 *   {({ value, onChange, error }) => (     // `error` is optional
 *     <>
 *       <InputField
 *         value={value}         // controlled value
 *         onChange={onChange}   // controlled change
 *         // other props of InputField
 *       />
 *       {error ? <p className="text-red-500">{error}</p> : null}   // optional inline error
 *     </>
 *   )}
 * </ControlledField>
 * ```
 *
 * Error Handling:
 * - Default: if no `onError` is provided, an alert shows all field errors.
 * - `onError`: optional callback to handle errors manually.
 * - Access errors via `methods.formState.errors` or check validity via `methods.formState.isValid` (only if methods is provided)
 * - ControlledField can display inline errors via the `error` prop
 *
 * Handling API errors:
 * - Define handleSubmit as:
 * ```tsx
 * const handleSubmit = async (
 *   data: z.infer<typeof schema>,
 *   methods?: FormMethodsType<typeof data>
 * ) => {
 *   try {
 *     // call API
 *   } catch (error) {
 *     methods?.setError("root", { message: "Custom API error message" });
 *   }
 * };
 * ```
 * - `methods?.setError` allows programmatic setting of form-level or field-level errors.
 * - To retrive the error message, use `methods.formState.errors.root.message`.
 */

"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { ReactElement, ReactNode } from "react";
import {
  Controller,
  FieldErrors,
  FieldValues,
  FormProvider,
  useForm,
  useFormContext,
  UseFormReturn,
} from "react-hook-form";
import * as z from "zod";

import { cn } from "@/lib/utils";

type AnyZodObject = z.ZodObject<any>;

type FormData<TSchema extends AnyZodObject> = z.infer<TSchema>;

type FormMethodsType<TData extends FieldValues> = UseFormReturn<
  TData,
  any,
  TData
>;

// Ensure that form data and the zod schema is of the same type
type FormProps<TSchema extends AnyZodObject> = {
  schema: TSchema;
  children:
    | ReactNode
    | ((
        methods: UseFormReturn<z.input<TSchema>, any, z.output<TSchema>>,
      ) => ReactNode);
  onSubmit: (
    data: FormData<TSchema>,
    methods?: UseFormReturn<z.input<TSchema>, any, z.output<TSchema>>,
  ) => void;
  onError?: (errors: FieldErrors<z.input<TSchema>>) => void;
  className?: string;
};

// Helper function to make zod invalidation errors to a message paragraph
function getErrorMessage<TSchema extends AnyZodObject>(
  errors: FieldErrors<z.input<TSchema>>,
) {
  return Object.entries(errors)
    .map(([field, error]) => `• ${field}: ${error?.message ?? "Invalid value"}`)
    .join("\n");
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
    mode: "onChange",
  });

  const handleSubmit = methods.handleSubmit(
    (data: z.infer<TSchema>) => onSubmit(data, methods),
    (errors: FieldErrors<z.input<TSchema>>) => {
      if (onError) onError(errors);
      else
        alert("Please fix the following errors:\n" + getErrorMessage(errors));
    },
  );

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex w-full flex-col space-y-3 rounded-md border border-[hsl(var(--border))] bg-background px-8 py-8",
          className,
        )}
      >
        {typeof children === "function" ? children(methods) : children}
      </form>
    </FormProvider>
  );
};

// To make input validation effective, an extra wrapper is needed for the input field
type ControlledFieldProps<TSchema> = {
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
    error?: string;
  }) => ReactElement;
};

const ControlledField = <TSchema,>({
  name,
  children,
}: ControlledFieldProps<TSchema>) => {
  const { control, formState } = useFormContext();
  const error = formState.errors[name]?.message as string | undefined;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) =>
        children({
          value: field.value ?? "",
          onChange: field.onChange,
          error,
        })
      }
    />
  );
};

export { ControlledField, Form };
export type { FormMethodsType };
