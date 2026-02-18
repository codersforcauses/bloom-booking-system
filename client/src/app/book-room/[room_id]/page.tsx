"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useParams, useRouter } from "next/navigation";
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
import { PLACEHOLDER_IMAGE, RoomCard } from "@/components/room-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Room } from "@/types/card";

import {
  formatDateTime,
  getAMPMTimeString,
  getDateTimeSlots,
  getUnavailableDates,
  getUnavailableDaysOfWeek,
} from "./room-utils";

/**
 * Information about the Room's opening hours
 */
interface RoomAvailability {
  recurrence_rule: string;
  start_datetime: Date;
  end_datetime: Date;
}

/**
 * React hook form component using zod validation for booking a room.
 * Includes name, email, date, start time and end time fields, reCAPTCHA
 * verification, an all day checkbox, and an alert dialog on submission.
 *
 * Date picker disables unavailable dates based on room availability and
 * existing bookings.
 */
function BookRoomForm() {
  const router = useRouter();

  const params = useParams();
  const room_id = Number(params.room_id);

  if (room_id === undefined || isNaN(room_id)) {
    return <NotFound />;
  }

  /**
   * The opening hours of the room
   */
  const default_room_availability: RoomAvailability = {
    recurrence_rule: "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
    start_datetime: new Date(new Date(0).setHours(8)),
    end_datetime: new Date(new Date(0).setHours(17)),
  };
  const [roomAvailability, setRoomAvailability] = useState<RoomAvailability>(
    default_room_availability,
  );
  /**
   * The previous query parameters used to request available timeslots,
   * used to prevent duplicate requests and filling up availableTimeSlots with
   * duplicates
   */
  // Remove previousAvailabilityRequests and availableTimeSlots state
  /**
   * The dates to prevent users from selecting (e.g. past dates, closed days of
   * week,booked dates)
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
   * The state of the All Day button disabled property
   */
  const [allDayEnabled, setAllDayEnabled] = useState<boolean>(true);
  /**
   * The state of the All Day button
   */
  const [allDay, setAllDay] = useState<boolean>(false);
  /**
   * The state of the reCAPTCHA verification
   */
  const [verified, setVerified] = useState<boolean>(false);
  /**
   * Closes the alert dialog (used because props are controlled by state variable).
   */
  function close_dialog() {
    setAlertDialogProps({
      ...alertDialogProps,
      open: false,
    });
  }
  /**
   * The props to render within the alert dialog
   */
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
      // onSuccess callback
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
      // onError callback
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
      date: undefined,
      start_time: "",
      end_time: "",
    },
  });

  /**
   * Uses data from the form to create a booking via the useCreateBooking hook.
   * @param data The data from the form.
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

  /**
   * Set the disabledDates state variable with relevant information from calling
   * getUnavailableDaysOfWeek and getUnavailableDates functions
   */
  function disableUnavailableDates(
    available_timeslots: DateTimeSlots[] = availableTimeSlots ?? [],
    room_availability: RoomAvailability = roomAvailability,
    options: { start_date?: Date; end_date?: Date } = {},
  ) {
    const days_of_week = getUnavailableDaysOfWeek(
      room_availability.recurrence_rule,
    ).map((day) => (day + 1) % 7); // DayPicker uses Mon=1, convert to Sun=0
    const dates = getUnavailableDates(available_timeslots, {
      ignore_days_of_week: days_of_week,
      start_date: options.start_date,
      end_date: options.end_date,
    });
    setDisabledDates([
      { before: new Date() },
      { dayOfWeek: days_of_week },
      ...dates,
    ]);
  }

  const {
    data: room_availability,
    isLoading: isLoadingRoomAvailability,
    isError: isErrorRoomAvailability,
    error: roomAvailabilityError,
  } = RoomAPI.useFetchRoomAvailability(room_id);

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
    refetch: refetchTimeSlots,
  } = RoomAPI.useFetchRoomTimeSlots(
    room_id,
    timeslotRange.start,
    timeslotRange.end,
  );

  async function fetchAvailability() {
    // Refetch timeslots for the current range
    await refetchTimeSlots();
    disableUnavailableDates(availableTimeSlots, room_availability, {
      start_date: timeslotRange.start,
      end_date: timeslotRange.end,
    });
  }

  /**
   * Fetches and updates the availabile timeslots for the current month of the
   * date picker
   *
   * NOTE: Makes a new request every time the month is switched, would be more
   * efficient to change availableTimeSlots to something like a map with the
   * start date of each month as its keys and check for existing availability.
   *
   * @param month The datetime of the start of the month
   */

  async function handleMonthChange(month: Date) {
    const start_datetime = startOfWeek(startOfMonth(month));
    const end_datetime = endOfWeek(endOfMonth(month));
    setTimeslotRange({ start: start_datetime, end: end_datetime });
    // Refetch will be triggered by hook dependency change
    // Disabled dates will be updated by useEffect below
  }

  /**
   * Returns true if the time provided is within ont of the time slots provided
   * @param time An HH:MM string representing a valid time
   * @param slots An array of timeslots
   * @returns True if time param is contained within one of the timeslots
   */
  function timeInTimeSlots(time: string, slots: TimeSlot[]): boolean {
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const date = new Date(format(slot.start, "yyyy-MM-dd"));
      const datetime = new Date(formatDateTime(date, time));
      if (datetime >= slot.start && datetime <= slot.end) return true;
    }
    return false;
  }

  /**
   * Get the time options for a select field between the room's opening and
   * closing times within the available time slots provided
   * @param slots The available timeslots to get times between
   * @param filter_out_unavilable If true removes unavailable options from array
   * returned, otherwise sets disabled to true for these options
   * @param option_length The time between options e.g. 30 returns 08:00, 08:30
   * @returns An array of of select options of times in HH:MM format between the
   * room's opening and closing times, and within timeslots provided
   */
  function getTimeSelectOptionsInSlots(
    slots: TimeSlot[],
    filter_out_unavilable: boolean = true,
    option_length: number = 30,
  ): SelectOption[] {
    const time_options: SelectOption[] = [];
    const slot_length = new Date(
      new Date(0).setMinutes(option_length),
    ).getTime();

    const room_start = roomAvailability.start_datetime.getTime();
    const room_end = roomAvailability.end_datetime.getTime();
    const d = new Date(startOfDay(roomAvailability.start_datetime));
    while (d.getTime() <= room_end) {
      if (d.getTime() >= room_start) {
        const time = d.toTimeString().substring(0, 5);
        time_options.push({
          value: time,
          label: time,
          disabled: !timeInTimeSlots(time, slots),
        });
      }
      d.setTime(d.getTime() + slot_length);
    }

    if (filter_out_unavilable) return time_options.filter((o) => !o.disabled);
    return time_options;
  }

  /**
   * Get the available end_times given a start_time and available time slots,
   * restricts the end_times to be within the same time slot as the start time
   * and after the start time.
   * @param start_time The value of the start_time field
   * @param timeslots The timeslots of the current date
   * @returns An array of SelectOptions with the end time options
   */
  function getEndTimeOptions(
    start_time: string = form.getValues("start_time"),
    timeslots: TimeSlot[] = selectTimeSlots,
  ): SelectOption[] {
    let end_options: SelectOption[] = [];
    if (start_time === "") {
      end_options = getTimeSelectOptionsInSlots(timeslots);
    } else {
      for (let i = 0; i < timeslots.length; i++) {
        const slot = timeslots[i];
        if (timeInTimeSlots(start_time, [slot])) {
          end_options = getTimeSelectOptionsInSlots([slot]).filter(
            (opt: SelectOption) => {
              // Remove end times before start
              const start = new Date(formatDateTime(new Date(), start_time));
              const opt_time = new Date(formatDateTime(new Date(), opt.value));
              return start < opt_time;
            },
          );
          break;
        }
      }
    }
    return end_options;
  }

  /**
   * Enable/disable the all day checkbox depending on if room is available all
   * day.
   * @param timeslots The timeslots for the currently selected date
   */
  function enableAllDayIfApplicable(timeslots: TimeSlot[]) {
    if (timeslots.length === 1) {
      const room_start_time = roomAvailability.start_datetime
        .toTimeString()
        .substring(0, 5);
      const room_end_time = roomAvailability.end_datetime
        .toTimeString()
        .substring(0, 5);

      const slot = timeslots[0];
      const slot_start_time = slot.start.toTimeString().substring(0, 5);
      const slot_end_time = slot.end.toTimeString().substring(0, 5);

      if (
        slot_start_time === room_start_time &&
        slot_end_time === room_end_time
      ) {
        setAllDayEnabled(true);
        return;
      }
    }
    setAllDay(false);
    setAllDayEnabled(false);
  }

  /**
   * Update the selectTimeSlots state variable to the time slots available on
   * the new date, update the startTimeOptions state variable to the selectable
   * times within the new time slots, reset the start_time field if old value
   * is now invalid, call handleStartTimeChange() to update end_time field
   * options, enable/disabled the all day button depending on timeslots available.
   *
   * @param date The date the day picker was changed to.
   */
  function handleDateChange(date: Date | undefined) {
    const timeslots = getDateTimeSlots(date, availableTimeSlots ?? []);
    setSelectTimeSlots(timeslots);
    const start_options = getTimeSelectOptionsInSlots(timeslots);
    setStartTimeOptions(start_options);
    // Reset field if previous value is now invalid
    let start_time: string | undefined = form.getValues("start_time");
    if (!start_options.map((opt) => opt.value).includes(start_time)) {
      form.resetField("start_time"); // Not working as expected
      start_time = "";
    }
    enableAllDayIfApplicable(timeslots);
    // Time is different as it is now a different date so trigger change
    handleStartTimeChange(start_time, timeslots); // Updates end_time options
  }

  /**
   * Update the endTimeOptions state variable to the available end times,
   * reset the end_time field if the old value is now invalid, uncheck all day
   * if the start time was changed from the room opening time.
   * @param start_time The HH:MM string the start_time field was changed to
   * @param timeslots The available timeslots of the current date
   */
  function handleStartTimeChange(
    start_time: string,
    timeslots: TimeSlot[] = selectTimeSlots,
  ) {
    const end_options = getEndTimeOptions(start_time, timeslots);
    setEndTimeOptions(end_options);
    // Reset field if previous value is now invalid
    let end_time: string = form.getValues("end_time");
    if (!end_options.map((opt) => opt.value).includes(end_time)) {
      form.resetField("end_time"); // Not working as expected
    }
    // Uncheck all day if start time changed from room opening time
    if (
      allDay &&
      start_time !==
        roomAvailability.start_datetime.toTimeString().substring(0, 5)
    ) {
      setAllDay(false);
    }
  }

  /**
   * Uncheck all day if end time changed from room closing time.
   *
   * @param end_time
   */
  function handleEndTimeChange(end_time: string) {
    if (
      allDay &&
      end_time !== roomAvailability.end_datetime.toTimeString().substring(0, 5)
    ) {
      setAllDay(false);
    }
  }

  /**
   * Set the start_time and end_time fields to the room's opening and closing
   *
   * @param checked The state of the all day checkbox
   */
  function handleAllDayChanged(checked: boolean) {
    if (form.getValues("date") === undefined) {
      setAllDay(false);
      form.setError("date", { message: "Please select a date." });
      return;
    }
    if (checked) {
      const room_start_time = roomAvailability.start_datetime
        .toTimeString()
        .substring(0, 5);
      const room_end_time = roomAvailability.end_datetime
        .toTimeString()
        .substring(0, 5);
      form.setValue("start_time", room_start_time);
      form.setValue("end_time", room_end_time);
      handleStartTimeChange(room_start_time);
    }
  }

  /**
   * Fetch the room availability and available timeslots between the current
   * time and end of the current month on component mount.
   */
  useEffect(() => {
    if (!room_availability) {
      return;
    }

    fetchAvailability();
  }, [room_availability]);

  /**
   * Update disabledDates whenever availableTimeSlots or roomAvailability changes.
   */
  useEffect(() => {
    disableUnavailableDates(availableTimeSlots, roomAvailability, {
      start_date: timeslotRange.start,
      end_date: timeslotRange.end,
    });
  }, [
    availableTimeSlots,
    roomAvailability,
    timeslotRange.start,
    timeslotRange.end,
  ]);

  if (isErrorRoomAvailability || isErrorTimeSlots) {
    return (
      <div>
        <h2 className="text-2xl font-bold">Error</h2>
        <p>{resolveErrorMessage(roomAvailabilityError)}</p>
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
                    handleDateChange(e);
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
                    handleStartTimeChange(e);
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
                  onChange={(e) => {
                    field.onChange(e);
                    handleEndTimeChange(e);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {/* <Checkbox
        className="ml-6"
        checked={allDay}
        onCheckedChange={(checked) => {
          setAllDay(checked === true);
          handleAllDayChanged(checked === true);
        }}
        disabled={!allDayEnabled}
      >
        {allDayEnabled ? "All day" : "All day (Unavailable for selected date)"}
      </Checkbox> */}
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

  if (room_id === undefined || isNaN(room_id)) {
    return <NotFound />;
  }

  // Use the useFetchRoom hook to get room data
  const {
    data: roomData,
    isLoading,
    isError,
    error,
  } = RoomAPI.useFetchRoom(room_id);

  // Normalize the room data to the Room type expected by RoomCard
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
        <BookRoomForm />
      </div>
    </div>
  );
}
