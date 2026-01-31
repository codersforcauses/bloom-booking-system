"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import InputField from "@/components/input";
import ReCAPTCHA_v2 from "@/components/recaptcha";
import { Button } from "@/components/ui/button";

const itemSchema = z.object({
  email: z.email("Invalid email."),
});

type ItemFormValues = z.infer<typeof itemSchema>;

export default function FindMyBookingPage() {
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      email: "",
    },
  });

  /**
   * Fetches booking information for the email specified in the form.
   * @param formData - content of the form inputs
   */
  const onSubmit = async (data: ItemFormValues) => {
    try {
      // Optional: call API here or just navigate
      router.push(`/booking?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      console.error("Error searching bookings:", error);
    }
  };

  return (
    <div className="min-h-layout-header mx-auto flex flex-col items-center justify-center space-y-6 bg-[hsl(var(--card))] p-6 text-[hsl(var(--card-foreground))]">
      <form
        className="flex flex-col items-center justify-center gap-8"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h2 className="title mb-2">Enter your email</h2>
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <InputField
              className="w-[90vw] md:w-[50vw]"
              kind="text"
              label=""
              name="email"
              placeholder="Enter your email"
              value={field.value}
              onChange={field.onChange}
              error={errors.email?.message}
            />
          )}
        />
        <ReCAPTCHA_v2 setVerified={setVerified}></ReCAPTCHA_v2>
        <Button disabled={!verified || !!errors.email || isSubmitting}>
          Search
        </Button>
      </form>
    </div>
  );
}
