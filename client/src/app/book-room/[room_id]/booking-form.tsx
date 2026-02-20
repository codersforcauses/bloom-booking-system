"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import NotFound from "@/app/not-found";
import {
  AlertDialog,
  AlertDialogProps,
  AlertDialogVariant,
} from "@/components/alert-dialog";
import ReCAPTCHAV2 from "@/components/recaptcha";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useCreateBooking } from "@/hooks/booking";
import { cn } from "@/lib/utils";

import RecurrenceRuleField from "./recurrence-rule-field";
import { formatDateTime } from "./room-utils";

// 00:00 → 23:30 in 30-minute steps
const TIME_OPTIONS: string[] = (() => {
  const times: string[] = [];
  for (let hour = 0; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const hh = hour.toString().padStart(2, "0");
      const mm = minute.toString().padStart(2, "0");
      times.push(`${hh}:${mm}`);
    }
  }
  return times;
})();

type BookRoomFormProps = {
  room_id: number;
  date?: string;
  start_time?: string;
  end_time?: string;
  name?: string;
  email?: string;
  isCalendar?: boolean;
};

/**
 * React hook form component using zod validation for booking a room.
 * Includes name, email, date, start time and end time fields, reCAPTCHA
 * verification, and an alert dialog on submission.
 */
export default function BookRoomForm({
  room_id,
  date,
  start_time,
  end_time,
  name,
  email,
  isCalendar = true,
}: BookRoomFormProps) {
  const router = useRouter();

  if (room_id === undefined || isNaN(room_id)) {
    return <NotFound />;
  }

  const [verified, setVerified] = useState<boolean>(false);
  const [recurrenceRule, setRecurrenceRule] = useState<string>("");

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
        onConfirm: () => router.push("/calendar/" + room_id),
        onClose: () => router.push("/calendar/" + room_id),
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
      name: name ?? "",
      email: email ?? "",
      date: date ? new Date(date) : undefined,
      start_time: start_time ?? "",
      end_time: end_time ?? "",
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
      recurrence_rule: recurrenceRule,
    };

    createBooking.mutate(payload);
  }

  return (
    <Form
      form={form}
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn(
        "h-fit w-full min-w-80 rounded-md md:max-w-4xl",
        "flex flex-col bg-white px-8 py-8 md:gap-6 md:px-16 md:py-12",
      )}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-3">
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel required>
                Name <span className="text-bloom-red">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="Name" />
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
              <FormLabel required>
                Email <span className="text-bloom-red">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="Email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-3">
        <FormField
          name="date"
          control={form.control}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel required>
                Date <span className="text-bloom-red">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(
                      val ? new Date(val + "T00:00:00") : undefined,
                    );
                  }}
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
              <FormLabel required>
                Start time <span className="text-bloom-red">*</span>
              </FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="flex w-full rounded-md border border-b-4 border-gray-200 border-b-gray-300 bg-background px-3 py-2 text-sm">
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="end_time"
          control={form.control}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel required>
                End time <span className="text-bloom-red">*</span>
              </FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="flex w-full rounded-md border border-b-4 border-gray-200 border-b-gray-300 bg-background px-3 py-2 text-sm">
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {!isCalendar && <RecurrenceRuleField onChange={setRecurrenceRule} />}

      {/* <ReCAPTCHAV2 setVerified={setVerified} /> */}
      <div className="flex gap-4">
        <Button type="submit" disabled={createBooking.isPending}>
          {!createBooking.isPending ? "Submit" : <Spinner className="w-6" />}
        </Button>
        {isCalendar && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const values = form.getValues();
              const formDate = values.date
                ? format(values.date, "yyyy-MM-dd")
                : "";
              router.push(
                `/book-room/${room_id}?date=${formDate}&start_time=${values.start_time ?? ""}&end_time=${values.end_time ?? ""}&name=${values.name ?? ""}&email=${values.email ?? ""}`,
              );
            }}
          >
            Book a recurring slot
          </Button>
        )}
      </div>
      <AlertDialog {...alertDialogProps} />
    </Form>
  );
}
