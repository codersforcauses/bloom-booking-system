"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect,useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCancelBooking } from "@/hooks/booking";

const CANCEL_REASONS = [
  "Change of plans",
  "Booked by mistake",
  "Time conflict",
  "No longer needed",
  "Other",
] as const;

const BookingCancelSchema = z.object({
  reason: z.enum(CANCEL_REASONS, { message: "Select a valid reason" }),
  message: z
    .string()
    .max(2000, { message: "Maximum 2000 characters" })
    .optional(),
});

export type BookingCancelSchemaValue = z.infer<typeof BookingCancelSchema>;

interface CancelBookingDialogProps {
  bookingId: number;
  visitorEmail: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CancelBookingDialog({
  bookingId,
  visitorEmail,
  isOpen,
  onOpenChange,
}: CancelBookingDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<BookingCancelSchemaValue>({
    resolver: zodResolver(BookingCancelSchema),
    defaultValues: {
      reason: "Change of plans",
      message: "",
    },
    mode: "onChange",
  });

  const { mutate, isPending } = useCancelBooking(
    bookingId,
    setErrorMessage,
    () => {
      onOpenChange(false);
    },
  );

  const onSubmit = (data: BookingCancelSchemaValue) => {
    if (!bookingId || !data) return;
    setErrorMessage(null);
    let reasonText: string = data.reason.trim();
    if (data.message?.trim()) {
      reasonText = `${data.reason}. Detail: ${data.message.trim()}`;
    }
    // Backend cancellation is via PATCH /bookings/:id/ with visitor_email + cancel_reason.
    // Backend doesn't store cancel_message yet; we append it to cancel_reason for now.
    const payload = {
      visitor_email: visitorEmail,
      cancel_reason: reasonText,
    };
    mutate(payload);
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-md border border-border bg-white p-6 max-sm:w-[90%]">
        <DialogTitle className="text-center">
          Reason to cancel booking
        </DialogTitle>
        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className="border-none p-4"
        >
          <FormField
            name="reason"
            control={form.control}
            render={({ field }) => (
              <FormItem className="mb-2">
                <FormControl>
                  <Label>
                    Reason
                    <Select
                      value={field.value || "Change of plans"}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <SelectTrigger className="mt-2 rounded-md border border-b-4 border-gray-200 border-b-gray-300 bg-background px-3 py-2 text-base">
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {CANCEL_REASONS.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Label>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="message"
            control={form.control}
            render={({ field }) => (
              <FormItem className="mb-2">
                <FormControl>
                  <Label>
                    Message
                    <Textarea
                      placeholder="Message (optional)"
                      className="mt-2"
                      value={field.value || ""}
                      onChange={field.onChange}
                      disabled={isPending}
                    />
                  </Label>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {errorMessage && (
            <p className="mb-2 text-sm text-bloom-red">{errorMessage}</p>
          )}
          <div className="flex items-center justify-center gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="warning"
              type="submit"
              disabled={isPending || !form.formState.isValid}
            >
              {isPending ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
