"use client";

import { Slot } from "@radix-ui/react-slot";
import React from "react";
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
  type UseFormReturn,
  useFormState,
} from "react-hook-form";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

/**
 * Helper: create context to share name within each field
 */
const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

type FormItemContextValue = {
  id: string;
};

/**
 * Helper: create context to share id within each field
 */
const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

type FormProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
} & React.ComponentProps<"form">;

/**
 * Write `<Form></Form>` to use the form component to group a form
 * Use the form props to pass zod schema, set default values, etc.
 * ```
 * const form = useForm<z.infer<typeof schema>>({
 *  resolver: zodResolver(schema),  // pass zod schema
 *  mode: "onChange",               // validate the form each time values change
 * });
 * ```
 */
const FormComponent = React.forwardRef<HTMLFormElement, FormProps<FieldValues>>(
  ({ form, className, children, ...props }, ref) => {
    return (
      <FormProvider {...form}>
        <form
          ref={ref}
          className={cn(
            "flex w-full flex-col space-y-4 rounded-md border border-[hsl(var(--border))] bg-background px-8 py-8",
            className,
          )}
          {...props}
        >
          {children}
        </form>
      </FormProvider>
    );
  },
);
FormComponent.displayName = "Form";

/**
 * Wrapper to wrap each form field. Example:
 * ```
 *    <FormField
 *      name="firstname"  // field name
 *      control={form.control}  // to let react hook form manage the state
 *      render={({ field }) => (
 *        <FormItem>
 *          <FormControl>
 *            <InputField
 *              // other fields
 *              value={field.value}  // pass field.value for react hook form management
 *              onChange={field.onChange}   // pass field.onChange for react hook form management
 *            />
 *           </FormControl>
 *           <FormMessage />
 *        </FormItem>
 *      )}
 * ```
 */
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

/**
 * Custom hook to get states and other infos within a FormField
 */
const useFormCustom = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

/**
 * Wrapper to wrap each field's rendering components
 */
const FormItem = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    const id = React.useId();

    return (
      <FormItemContext.Provider value={{ id }}>
        <div
          ref={ref}
          data-slot="form-item"
          className={cn("grid gap-2", className)}
          {...props}
        />
      </FormItemContext.Provider>
    );
  },
);
FormItem.displayName = "FormItem";

/**
 * Optional if label is not included in input field
 * If FormLabel is use, FormControl must be used to wrap the children to let label control the children
 */
const FormLabel = React.forwardRef<
  HTMLLabelElement,
  React.ComponentProps<typeof Label> & { required?: boolean }
>(({ required = false, className, ...props }, ref) => {
  const { error, formItemId } = useFormCustom();
  return (
    <Label
      ref={ref}
      data-slot="form-label"
      data-error={!!error}
      htmlFor={formItemId}
      className={cn("", className)}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

/**
 * Wrapper to used with FormLabel and provide accessibility info
 */
const FormControl = React.forwardRef<
  HTMLElement,
  React.ComponentProps<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormCustom();

  return (
    <Slot
      ref={ref}
      className="peer"
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId
      }
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

/**
 * Optional if you want to render messages (e.g., error message)
 */
const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentProps<"p">
>(({ className, ...props }, ref) => {
  const { error, formMessageId } = useFormCustom();
  const body = error ? String(error?.message ?? "") : props.children;

  if (!body) return null;

  return (
    <p
      ref={ref}
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-sm text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

// to avoid type issues
export const Form = FormComponent as <T extends FieldValues>(
  props: FormProps<T> & { ref?: React.Ref<HTMLFormElement> },
) => React.ReactElement;

export {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormCustom,
};
