"use client";
import { zodResolver } from "@hookform/resolvers/zod";
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
  // FormControl,
  // FormField,
  // FormItem,
  // FormMessage,
} from "@/components/ui/form";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";
// import { useCancelBooking } from "@/hooks/booking";

const BookingUpdateSchema = z.object({
  // to be added later
});

export type BookingUpdateSchemaValue = z.infer<typeof BookingUpdateSchema>;

interface UpdateBookingDialogProps {
  // to be added later
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UpdateBookingDialog({
  isOpen,
  onOpenChange,
}: UpdateBookingDialogProps) {
  const form = useForm<BookingUpdateSchemaValue>({
    resolver: zodResolver(BookingUpdateSchema),
    defaultValues: {
      // to be added later
    },
    mode: "onChange",
  });

  // const { mutate, isPending, isError, error } = useUpdateBooking(bookingId);

  const onSubmit = (data: BookingUpdateSchemaValue) => {
    const payload = {
      // to be added later
    };
    // mutate(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-md border border-border bg-white p-6 max-sm:w-[90%]">
        <DialogTitle className="text-center">Update Booking</DialogTitle>
        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className="border-none p-4"
        >
          {/* <FormField
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
          /> */}
          {/* {isError && (
            <p className="mb-2 text-sm text-bloom-red">
              {error instanceof Error
                ? error.message
                : "Update failed. Please try again."}
            </p>
          )} */}
          <div className="flex items-center justify-center gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="confirm"
              type="submit"
              // disabled={isPending || !form.formState.isValid}
            >
              {/* {isPending ? "Updating..." : "Update"} */} Submit
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
