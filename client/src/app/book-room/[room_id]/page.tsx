"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { useParams, useRouter , useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Matcher } from "react-day-picker";
import { useForm } from "react-hook-form";
import * as z from "zod";

import NotFound from "@/app/not-found";
import {
  AlertDialog,
  AlertDialogProps,
  AlertDialogVariant,
} from "@/components/alert-dialog";
import InputField, { SelectOption } from "@/components/input";
import ReCAPTCHAV2 from "@/components/recaptcha";
import { RoomCard } from "@/components/room-card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { useCreateBooking } from "@/hooks/booking";
import RoomAPI, { DateTimeSlots, TimeSlot } from "@/hooks/room";
import { normaliseRoom } from "@/lib/normalise-room";
import { cn, resolveErrorMessage } from "@/lib/utils";

import {
  formatDateTime,
  getDateTimeSlots,
  getUnavailableDates,
} from "./room-utils";

type BookRoomFormProps = {
  room_id: number;
  date?: string;
  start_time?: string;
  end_time?: string;
};

/**
 * React hook form component using zod validation for booking a room.
 * Includes name, email, date, start time and end time fields, reCAPTCHA
 * verification, and an alert dialog on submission.
 *
 * Date picker disables past dates and fully-booked dates based on the
 * available timeslots returned by the API.
 */
function BookRoomForm({
  room_id,
  date,
  start_time,
  end_time,
}: BookRoomFormProps) {
  const router = useRouter();

  if (room_id === undefined || isNaN(room_id)) {
    return <NotFound />;
  }

  /**
   * The dates to prevent users from selecting (e.g. past dates, fully-booked dates)
   */
  const [disabledDates, setDisabledDates] = useState<Matcher[]>([]);
  /**
   * The time slots of the current date chosen by the date field used to
   * restrict the time selection fields
   */
  const [selectTimeSlots, setSelectTimeSlots] = useState<TimeSlot[]>([]);
  /**
   * The options to render within the time selection fields
   */
  const [startTimeOptions, setStartTimeOptions] = useState<SelectOption[]>([]);
  const [endTimeOptions, setEndTimeOptions] = useState<SelectOption[]>([]);
  /**
   * The state of the reCAPTCHA verification
   */
  const [verified, setVerified] = useState<boolean>(false);

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
        onConfirm: () => router.push("/"),
        onClose: () => router.push("/"),
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
      recurrence_rule: "",
    };

    createBooking.mutate(payload);
  }

  // Default to current month for timeslot fetching
  const [timeslotRange, setTimeslotRange] = useState(() => {
    const start = new Date();
    const end = endOfWeek(endOfMonth(start));
    return { start, end };
  });

  const {
    data: availableTimeSlots,
    isLoading: isLoadingTimeSlots,
    isError: isErrorTimeSlots,
    error: timeSlotsError,
  } = RoomAPI.useFetchRoomTimeSlots(
    room_id,
    timeslotRange.start,
    timeslotRange.end,
  );

  /**
   * Fetches available timeslots for the month navigated to in the date picker.
   */
  async function handleMonthChange(month: Date) {
    const start_datetime = startOfWeek(startOfMonth(month));
    const end_datetime = endOfWeek(endOfMonth(month));
    setTimeslotRange({ start: start_datetime, end: end_datetime });
  }

  /**
   * Returns true if the time provided is within one of the time slots provided.
   */
  function timeInTimeSlots(time: string, slots: TimeSlot[]): boolean {
    for (const slot of slots) {
      const datetime = new Date(formatDateTime(new Date(slot.start), time));
      if (datetime >= slot.start && datetime <= slot.end) return true;
    }
    return false;
  }

  /**
   * Get 30-minute time options directly from the available slot boundaries.
   * Since rooms are 24/7, there are no fixed opening/closing hours to bound by.
   */
  function getTimeSelectOptionsInSlots(
    slots: TimeSlot[],
    option_length: number = 30,
  ): SelectOption[] {
    const time_options: SelectOption[] = [];
    const slot_length = new Date(
      new Date(0).setMinutes(option_length),
    ).getTime();

    for (const slot of slots) {
      const d = new Date(slot.start);
      while (d.getTime() < slot.end.getTime()) {
        const time = d.toTimeString().substring(0, 5);
        if (!time_options.some((o) => o.value === time)) {
          time_options.push({ value: time, label: time, disabled: false });
        }
        d.setTime(d.getTime() + slot_length);
      }
    }

    return time_options;
  }

  /**
   * Get available end times after a given start_time, restricted to the same
   * slot as the start time.
   */
  function getEndTimeOptions(
    start_time: string = form.getValues("start_time"),
    timeslots: TimeSlot[] = selectTimeSlots,
  ): SelectOption[] {
    if (start_time === "") {
      return getTimeSelectOptionsInSlots(timeslots);
    }
    for (const slot of timeslots) {
      if (timeInTimeSlots(start_time, [slot])) {
        return getTimeSelectOptionsInSlots([slot]).filter((opt) => {
          const start = new Date(formatDateTime(new Date(), start_time));
          const opt_time = new Date(formatDateTime(new Date(), opt.value));
          return start < opt_time;
        });
      }
    }
    return [];
  }

  /**
   * Update disabled dates from the available timeslots.
   * Disables past dates and dates with no available slots (fully booked).
   */
  function disableUnavailableDates(
    available_timeslots: DateTimeSlots[] = availableTimeSlots ?? [],
    options: { start_date?: Date; end_date?: Date } = {},
  ) {
    const dates = getUnavailableDates(available_timeslots, {
      start_date: options.start_date,
      end_date: options.end_date,
    });
    setDisabledDates([{ before: new Date() }, ...dates]);
  }

  /**
   * Update time slot options when the selected date changes.
   */
  function handleDateChange(date: Date | undefined) {
    const timeslots = getDateTimeSlots(date, availableTimeSlots ?? []);
    setSelectTimeSlots(timeslots);
    const start_options = getTimeSelectOptionsInSlots(timeslots);
    setStartTimeOptions(start_options);
    let start_time: string | undefined = form.getValues("start_time");
    if (!start_options.map((opt) => opt.value).includes(start_time)) {
      form.resetField("start_time");
      start_time = "";
    }
    handleStartTimeChange(start_time, timeslots);
  }

  /**
   * Update end time options when the start time changes, and reset end time
   * if the previous value is now invalid.
   */
  function handleStartTimeChange(
    start_time: string,
    timeslots: TimeSlot[] = selectTimeSlots,
  ) {
    const end_options = getEndTimeOptions(start_time, timeslots);
    setEndTimeOptions(end_options);
    const end_time: string = form.getValues("end_time");
    if (!end_options.map((opt) => opt.value).includes(end_time)) {
      form.resetField("end_time");
    }
  }

  /**
   * Re-compute disabled dates whenever available timeslots or the visible
   * month range changes.
   */
  useEffect(() => {
    disableUnavailableDates(availableTimeSlots, {
      start_date: timeslotRange.start,
      end_date: timeslotRange.end,
    });
  }, [availableTimeSlots, timeslotRange.start, timeslotRange.end]);

  if (isErrorTimeSlots) {
    return (
      <div>
        <h2 className="text-2xl font-bold">Error</h2>
        <p>{resolveErrorMessage(timeSlotsError)}</p>
      </div>
    );
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
              <FormControl>
                <InputField
                  kind="text"
                  required={true}
                  name="name"
                  label="Name"
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
              <FormControl>
                <InputField
                  kind="text"
                  required={true}
                  name="email"
                  label="Email"
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
              <FormControl>
                <InputField
                  kind="date"
                  required={true}
                  name="date"
                  label="Date"
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e);
                    // handleDateChange(e);
                  }}
                  defaultMonth={
                    field.value === undefined ? new Date() : field.value
                  }
                  disabledDates={disabledDates}
                  onMonthChange={handleMonthChange}
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
              <FormControl>
                <InputField
                  kind="select"
                  required={true}
                  name="start_time"
                  label="Start time"
                  options={startTimeOptions}
                  value={field.value || ""}
                  placeholder="Select a time"
                  onChange={(e) => {
                    field.onChange(e);
                    // handleStartTimeChange(e);
                  }}
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
              <FormControl>
                <InputField
                  kind="select"
                  required={true}
                  name="end_time"
                  label="End time"
                  options={endTimeOptions}
                  value={field.value || ""}
                  placeholder="Select a time"
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <ReCAPTCHAV2 setVerified={setVerified} />
      <Button
        type="submit"
        className="w-1/6 min-w-[8rem] font-bold"
        disabled={!verified || createBooking.isPending}
      >
        {!createBooking.isPending ? "Submit" : <Spinner className="w-6" />}
      </Button>
      <AlertDialog {...alertDialogProps} />
    </Form>
  );
}

export default function BookRoomPage() {
  const router = useRouter();

  const params = useParams();
  const room_id = Number(params.room_id);
  const searchParams = useSearchParams();
  const date = searchParams.get("date");
  const start_time = searchParams.get("start_time");
  const end_time = searchParams.get("end_time");

  if (room_id === undefined || isNaN(room_id)) {
    return <NotFound />;
  }

  const {
    data: roomData,
    isLoading,
    isError,
    error,
  } = RoomAPI.useFetchRoom(room_id);

  const room = normaliseRoom(roomData);

  if (isError) {
    return (
      <AlertDialog
        title="An error has occurred"
        description={
          resolveErrorMessage(error) ||
          "Unable to load room information. Please try again later."
        }
        variant="error"
        open={true}
        onConfirm={() => {
          router.push("/");
        }}
        onClose={() => {
          router.push("/");
        }}
      />
    );
  }

  return (
    <div className="h-fit w-full">
      <div className="flex w-full items-center p-4">
        <h1 className="text-xl font-semibold">Book room</h1>
      </div>
      <div
        className={cn(
          "flex h-full w-full flex-col lg:flex-row",
          "items-center justify-center gap-4 p-4 md:px-12 lg:items-start xl:gap-12",
        )}
      >
        <div className="w-96">
          <RoomCard room={room} />
        </div>
        <BookRoomForm
          room_id={room_id}
          date={date ?? undefined}
          start_time={start_time ?? undefined}
          end_time={end_time ?? undefined}
        />
      </div>
    </div>
  );
}
