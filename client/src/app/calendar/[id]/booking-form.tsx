import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { formatDateTime } from "@/app/book-room/[room_id]/room-utils";
import NotFound from "@/app/not-found";
import {
  AlertDialog,
  AlertDialogProps,
  AlertDialogVariant,
} from "@/components/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useCreateBooking } from "@/hooks/booking";
import { cn } from "@/lib/utils";

type BookRoomFormProps = {
  room_id: number;
  date: string;
  start_time: string;
  end_time: string;
};

export default function BookRoomForm({
  room_id,
  date,
  start_time,
  end_time,
}: BookRoomFormProps) {
  const router = useRouter();

  if (room_id === undefined || isNaN(room_id)) {
    return <NotFound />;
  }

  function close_dialog() {
    setAlertDialogProps({
      ...alertDialogProps,
      open: false,
    });
  }

  const default_alert_dialog_props: AlertDialogProps = {
    title: "",
    description: "",
    variant: "info" as AlertDialogVariant,
    open: false,
    onConfirm: close_dialog,
    onClose: close_dialog,
  };
  const [alertDialogProps, setAlertDialogProps] = useState<AlertDialogProps>(
    default_alert_dialog_props,
  );

  // Create booking mutation with success/error handlers
  const createBooking = useCreateBooking(
    () => {
      setAlertDialogProps({
        title: "Awesome!",
        description:
          "Your booking has been submitted successfully.\nYou will receive an email confirmation shortly.",
        variant: "success",
        open: true,
        onConfirm: () => router.push(`/calendar/${room_id}`),
        onClose: () => router.push(`/calendar/${room_id}`),
      });
    },
    (error) => {
      let errorMessage = "Unknown error.";

      if (axios.isAxiosError(error) && error.response?.data) {
        const res = error.response.data as {
          start_datetime?: string[];
          end_datetime?: string[];
          non_field_errors?: string[];
          detail?: string;
        };

        if (res.start_datetime) {
          errorMessage = cn(res.start_datetime);
        } else if (res.end_datetime) {
          errorMessage = cn(res.end_datetime);
        } else if (res.non_field_errors) {
          errorMessage = cn(res.non_field_errors);
        } else if (res.detail) {
          errorMessage = cn(res.detail);
        }
      }

      setAlertDialogProps({
        title: "Sorry!",
        description: errorMessage,
        variant: "error",
        open: true,
        onConfirm: close_dialog,
        onClose: close_dialog,
      });
    },
  );

  const yesterday_date = new Date(new Date().setDate(new Date().getDate() - 1));
  const formSchema = z
    .object({
      name: z.string().min(1, "This is a required field."),
      email: z.email("Must be a valid email address."),
      date: z.date().min(yesterday_date, "Cannot be a date in the past."),
      start_time: z.iso.time("Must be a valid time."),
      end_time: z.iso.time("Must be a valid time."),
    })
    .refine(
      (data) => {
        const now = new Date();
        const start_datetime = new Date(
          Date.parse(formatDateTime(data.date, data.start_time)),
        );
        return now < start_datetime;
      },
      {
        message: "Start time must be in the future.",
        path: ["start_time"],
      },
    )
    .refine(
      (data) => {
        const start_datetime = new Date(
          Date.parse(formatDateTime(data.date, data.start_time)),
        );
        const end_datetime = new Date(
          Date.parse(formatDateTime(data.date, data.end_time)),
        );
        return start_datetime < end_datetime;
      },
      {
        message: "End time must be after start time.",
        path: ["end_time"],
      },
    );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      date: new Date(date),
      start_time: start_time,
      end_time: end_time,
    },
  });

  /**
   * Uses data from the form to create a booking via the useCreateBooking hook.
   */
  function onSubmit(data: z.infer<typeof formSchema>) {
    const payload = {
      room_id: room_id,
      visitor_name: data.name,
      visitor_email: data.email,
      start_datetime: formatDateTime(data.date, data.start_time),
      end_datetime: formatDateTime(data.date, data.end_time),
    };

    createBooking.mutate(payload);
  }

  return (
    <Form
      form={form}
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn(
        "h-fit w-full rounded-md md:min-w-[32rem] md:max-w-[56rem]",
        "flex flex-col gap-6 bg-white px-8 py-8 md:px-16 md:py-12",
      )}
    >
      <div className="flex flex-col gap-6 md:flex-row md:gap-3">
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  required={true}
                  name="name"
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  required={true}
                  name="email"
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="flex flex-col gap-6 md:flex-row md:gap-3">
        <FormField
          name="date"
          control={form.control}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  name="date"
                  value={
                    field.value
                      ? field.value.toISOString().substring(0, 10)
                      : ""
                  }
                  disabled
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="start_time"
          control={form.control}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Start time</FormLabel>
              <FormControl>
                <Input
                  type="string"
                  name="start_time"
                  value={field.value || ""}
                  placeholder="Select a time"
                  disabled
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="end_time"
          control={form.control}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>End time</FormLabel>
              <FormControl>
                <Input
                  type="string"
                  name="end_time"
                  value={field.value || ""}
                  placeholder="Select a time"
                  disabled
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Button
        type="submit"
        disabled={createBooking.isPending}
        className="w-fit"
      >
        {!createBooking.isPending ? "Submit" : <Spinner className="w-6" />}
      </Button>
      <AlertDialog {...alertDialogProps} />
    </Form>
  );
}
