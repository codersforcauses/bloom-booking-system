"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { endOfMonth, endOfWeek, startOfWeek } from "date-fns";
import { useParams,useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Matcher } from "react-day-picker";
import { useForm } from "react-hook-form";
import * as z from "zod";

import {
  AlertDialog,
  AlertDialogProps,
  AlertDialogVariant,
} from "@/components/alert-dialog";
import InputField, { SelectOption } from "@/components/input";
import ReCAPTCHAV2 from "@/components/recaptcha";
import { RoomCard } from "@/components/room-card";
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
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { Room } from "@/types/card";

/**
 * Information about the Room's opening hours
 */
interface RoomAvailability {
  recurrence_rule: string;
  start_datetime: Date;
  end_datetime: Date;
}

/**
 * A slot of time from a start time to an end time
 */
interface TimeSlot {
  start: Date;
  end: Date;
}

/**
 * Information about a date and its available time slots
 */
interface DateTimeSlots {
  date: string;
  slots: TimeSlot[];
}

/**
 * Converts google calendar day strings to 3 lettter day strings
 */
const GoogleCalendarDayConversion = new Map();
GoogleCalendarDayConversion.set("MO", "Mon");
GoogleCalendarDayConversion.set("TU", "Tue");
GoogleCalendarDayConversion.set("WE", "Wed");
GoogleCalendarDayConversion.set("TH", "Thu");
GoogleCalendarDayConversion.set("FR", "Fri");
GoogleCalendarDayConversion.set("SA", "Sat");
GoogleCalendarDayConversion.set("SU", "Sun");

/**
 * Convert between 3 letter day strings and their respective number
 */
const DayNumber = new Map();
DayNumber.set("Mon", 0);
DayNumber.set("Tue", 1);
DayNumber.set("Wed", 2);
DayNumber.set("Thu", 3);
DayNumber.set("Fri", 4);
DayNumber.set("Sat", 5);
DayNumber.set("Sun", 6);
DayNumber.set(0, "Mon");
DayNumber.set(1, "Tue");
DayNumber.set(2, "Wed");
DayNumber.set(3, "Thu");
DayNumber.set(4, "Fri");
DayNumber.set(5, "Sat");
DayNumber.set(6, "Sun");

/**
 * Combine a date object and a HH:MM time string to a ISO string
 * @param date a Date object
 * @param time a valid time in format HH:MM
 * @returns a Date object with the same date as date param and time contained in time string
 */
function formatDateTime(date: Date, time: string) {
  const full_date = new Date(date);
  const time_split = time.split(":");
  const hours = Number(time_split[0]);
  const mins = Number(time_split[1]);
  full_date.setHours(hours);
  full_date.setMinutes(mins);
  const iso_string = full_date.toISOString();
  return iso_string;
}

/**
 * Extracts the days from the BYDAY argument of a google calendar
 * reccurence rule into an array.
 * @param rrule A valid google calendar recurrence rule
 * @returns An array of google calendar days e.g. ["MO","TU"]
 */
function getDaysFromRRule(rrule: string) {
  if (rrule === undefined) return [];
  const rule = rrule.startsWith("RRULE:") ? rrule.substring(7) : rrule;
  const rule_info = rule.split(";");
  for (let i = 0; i < rule_info.length; i++) {
    if (rule_info[i].startsWith("BYDAY")) {
      const days_str = rule_info[i].split("=")[1];
      const days = days_str.split(",");
      return days;
    }
  }
  return [];
}

/**
 * Return the time in 12 hour hour:minutes am/pm format
 * @param datetime A valid Date object
 * @returns a string in AM/PM time e.g. 9:00am, 10:00pm
 */
function getAMPMTimeString(datetime: Date) {
  const hours = datetime.getHours();
  const hours_str = hours > 12 ? `${hours - 12}` : `${hours}`;
  const mins_str = datetime.getMinutes().toString().padStart(2, "0");
  const suffix = hours > 12 ? "pm" : "am";
  return `${hours_str}:${mins_str}${suffix}`;
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
  const params = useParams();
  const room_id = Number(params.room_id);
  /**
   * The opening hours of the room
   */
  const default_room_availability: RoomAvailability = {
    recurrence_rule: "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
    start_datetime: new Date(new Date(0).setHours(8)),
    end_datetime: new Date(new Date(0).setHours(17)),
  };
  const [roomAvailability, setRoomAvailability] = useState(
    default_room_availability,
  );
  /**
   * The previous query parameters used to request available timeslots,
   * used to prevent duplicate requests and filling up availableTimeSlots with
   * duplicates
   */
  const empty_previous_requests: string[] = [];
  const [previousAvailabilityRequests, setPreviousAvailabilityRequests] =
    useState(empty_previous_requests);
  /**
   * The time availability of a room over a range of dates
   */
  const default_available_timeslots: DateTimeSlots[] = [];
  const [availableTimeSlots, setAvailableTimeSlots] = useState(
    default_available_timeslots,
  );
  /**
   * The dates to prevent users from selecting (e.g. past dates, closed days of
   * week,booked dates)
   */
  const default_disabled_dates: Matcher[] = [];
  const [disabledDates, setDisabledDates] = useState(default_disabled_dates);
  /**
   * The time slots of the current date chosen by the date field used to
   * restrict the time selection fields
   */
  const empty_slots: TimeSlot[] = [];
  const [selectTimeSlots, setSelectTimeSlots] = useState(empty_slots);
  /**
   * The options to render within the time selection fields
   */
  const empty_time_options: SelectOption[] = [];
  const [startTimeOptions, setStartTimeOptions] = useState(empty_time_options);
  const [endTimeOptions, setEndTimeOptions] = useState(empty_time_options);
  /**
   * The state of the All Day button disabled property
   */
  const [allDayEnabled, setAllDayEnabled] = useState(true);
  /**
   * The state of the All Day button
   */
  const [allDay, setAllDay] = useState(false);
  /**
   * The state of the reCAPTCHA verification
   */
  const [verified, setVerified] = useState(false);
  /**
   * The state of the form submission
   */
  const [submitPending, setSubmitPending] = useState(false);
  /**
   * Closes the alert dialog (used becuause props are controlled by state variable).
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
  const [alertDialogProps, setAlertDialogProps] = useState(
    default_alert_dialog_props,
  );

  const formSchema = z
    .object({
      name: z.string().min(1, "This is a required field."),
      email: z.email("Must be a valid email address."),
      date: z.date("Must be a valid date.").min(
        new Date().setDate(new Date().getDate() - 1), // Yesterday's date
        "Cannot be a date in the past.",
      ),
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
      name: undefined,
      email: undefined,
      date: undefined,
      start_time: undefined,
      end_time: undefined,
    },
  });

  /**
   * Uses data from the from to send an POST request to /api/bookings/ endpoint
   * and sets alertDialogProps according to server response.
   * @param data The data from the form.
   */
  function onSubmit(data: z.infer<typeof formSchema>) {
    setSubmitPending(true);
    const payload = {
      room_id: room_id,
      visitor_name: data.name,
      visitor_email: data.email,
      start_datetime: formatDateTime(data.date, data.start_time),
      end_datetime: formatDateTime(data.date, data.end_time),
      recurrence_rule: "",
    };
    const alert_dialog_props = {
      title: "",
      description: "",
      variant: "info" as AlertDialogVariant,
      open: true,
    };
    api({ url: "bookings/", method: "post", data: payload })
      .then((response) => {
        const res = response.data;
        const date = new Date(Date.parse(res.start_datetime));
        // Substring (0,5) gives just the HH:MM part of the string
        const start_time = new Date(Date.parse(res.start_datetime))
          .toTimeString()
          .substring(0, 5);
        const end_time = new Date(Date.parse(res.end_datetime))
          .toTimeString()
          .substring(0, 5);
        enum MonthString {
          Jan,
          Feb,
          Mar,
          Apr,
          May,
          Jun,
          Jul,
          Aug,
          Sep,
          Oct,
          Nov,
          Dec,
        }
        const description = cn(
          `Your ${res.room.name} Booking for`,
          `${date.getDate()} ${MonthString[date.getMonth()]} ${date.getFullYear()}`,
          `from ${start_time} to ${end_time}`,
          `has been submitted.\n`,
          `You will receive an email confirmation shortly.`,
        );
        alert_dialog_props.title = "Awesome!";
        alert_dialog_props.description = description;
        alert_dialog_props.variant = "success" as AlertDialogVariant;
      })
      .catch((error) => {
        alert_dialog_props.title = "Sorry!";
        alert_dialog_props.variant = "error" as AlertDialogVariant;
        const res = error.response.data;
        if (res.start_datetime !== undefined) {
          alert_dialog_props.description = cn(res.start_datetime);
        } else if (res.end_datetime !== undefined) {
          alert_dialog_props.description = cn(res.end_datetime);
        } else if (res.non_field_errors !== undefined) {
          alert_dialog_props.description = cn(res.non_field_errors);
        } else if (res.detail !== undefined) {
          alert_dialog_props.description = cn(res.detail);
        } else {
          alert_dialog_props.description = "Unknown error.";
          console.error(error);
        }
      })
      .finally(() => {
        setAlertDialogProps({
          ...alertDialogProps,
          ...alert_dialog_props,
        });
        setSubmitPending(false);
      });
  }

  /**
   * Returns an array of numbers reprenseting days of the week (Sunday = )
   * not included * in the BYDAY argument of a Google Calendar recurrence_rule
   * @param rrule A valid Google Calendar recurrence rule
   */
  function getUnavailableDaysOfWeek(rrule: string): number[] {
    // Assumes availability pattern is weekly
    const available_days_of_week = getDaysFromRRule(rrule).map((day) =>
      DayNumber.get(GoogleCalendarDayConversion.get(day)),
    );
    const unavailable_days_of_week = [0, 1, 2, 3, 4, 5, 6].filter(
      (day) => !available_days_of_week.includes(day),
    );
    return unavailable_days_of_week;
  }

  /**
   * Get the dates that are not included in availability api response.
   *
   * @param available_timeslots An array of DateTimeSlots representing the
   * available timeslots of a room (from `api/rooms/{id}/availablity` response)
   * @param ignore_days_of_week An array of numbers representing days (Sun=0) to
   * ignore when looking for unavailable days
   * @returns An array of Dates between now and the last date of
   * available_timeslots that are not included in available_timeslots and are
   * on days not included in ignore_days_of_week
   */
  function getUnavailableDates(
    available_timeslots: DateTimeSlots[],
    ignore_days_of_week: number[] = [],
  ): Date[] {
    let unavailable_dates: Date[] = [];
    const available_dates = available_timeslots.map(
      (o: DateTimeSlots) => o.date,
    ); // Array.includes does not work on Date objects thus use ISO strings
    if (available_dates.length === 0) return unavailable_dates;
    const last_date = new Date(available_dates[available_dates.length - 1]);
    const d = new Date(new Date().toISOString().substring(0, 10));
    while (d <= last_date) {
      unavailable_dates.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    unavailable_dates = unavailable_dates
      .filter((date) => !ignore_days_of_week.includes(date.getDay()))
      // Array.includes does not work on Date objects thus use ISO strings
      .filter(
        (date) =>
          !available_dates.includes(date.toISOString().substring(0, 10)),
      );
    return unavailable_dates;
  }

  /**
   * Set the disabledDates state variable with relevant information from calling
   * getUnavailableDaysOfWeek and getUnavailableDates fucntions
   */
  function disableUnavailableDates(
    available_timeslots: DateTimeSlots[] = availableTimeSlots,
    room_availability: RoomAvailability = roomAvailability,
  ) {
    const days_of_week = getUnavailableDaysOfWeek(
      room_availability.recurrence_rule,
    ).map((day) => (day + 1) % 7); // DayPicker uses Sun=0
    const dates = getUnavailableDates(available_timeslots, days_of_week);
    setDisabledDates([
      { before: new Date() },
      { dayOfWeek: days_of_week },
      ...dates,
    ]);
  }

  // Probably best to replace this with a prop to the function/component to avoid calling the api twice
  /**
   * Calls the `api/room/{room_id}` api endpoint to get the room availablity
   * information (start time, end time, recurrence_rule).
   * @returns The room's availability rules (NOT its available timeslots).
   */
  async function fetchRoomAvailability() {
    const apiUrl = `rooms/${room_id}/`;
    let room_availability: RoomAvailability = {
      recurrence_rule: "",
      start_datetime: new Date(0),
      end_datetime: new Date(0),
    };
    await api({ url: apiUrl, method: "get" })
      .then((response) => {
        const data = response.data;
        room_availability = {
          recurrence_rule: data.recurrence_rule,
          start_datetime: new Date(data.start_datetime),
          end_datetime: new Date(data.end_datetime),
        };
        setRoomAvailability(room_availability);
      })
      .catch((error) => {
        // TODO : Handle error
        console.error(error);
      });
    return room_availability;
  }

  /**
   * Fetches the available timeslots of the room in range
   * {start_datetime, end_datetime} from the api.
   * @param date_range An object {start_date, end_date} specifying the start and
   * end dates to request the available time slots of, by default start_datetime
   * is set to the current time and end_datetime is set to the first of the
   * next month.
   * @returns
   */
  async function fetchAvailableTimeSlots({
    start_datetime = new Date(),
    end_datetime = endOfMonth(start_datetime),
  }: {
    start_datetime?: Date;
    end_datetime?: Date;
  } = {}) {
    /* 
    .toISOString() may cause an issue here as it formats datetimes to GMT time
    which means start_date will be the date before the start date as
    startOfWeek returns start of week 00:00 +8:00.
    */
    const start_date = startOfWeek(start_datetime)
      .toISOString()
      .substring(0, 10);
    const end_date = endOfWeek(end_datetime).toISOString().substring(0, 10);
    const query_params = `start_date=${start_date}&end_date=${end_date}`;
    const apiUrl = `rooms/${room_id}/availability/?${query_params}`;
    let available_timeslots: DateTimeSlots[] = [...availableTimeSlots];

    if (!previousAvailabilityRequests.includes(query_params)) {
      await api({ url: apiUrl, method: "get" })
        .then((response) => {
          const new_available_timeslots = response.data.availability.map(
            (o: { date: string; slots: { start: string; end: string }[] }) => {
              return {
                date: o.date,
                slots: o.slots.map((slot: { start: string; end: string }) => {
                  return {
                    start: new Date(Date.parse(slot.start)),
                    end: new Date(Date.parse(slot.end)),
                  };
                }),
              };
            },
          );
          available_timeslots = [
            ...available_timeslots,
            ...new_available_timeslots,
          ];
          setAvailableTimeSlots(available_timeslots);
          setPreviousAvailabilityRequests([
            ...previousAvailabilityRequests,
            query_params,
          ]);
        })
        .catch((error) => {
          /*
          If error occurs, available_timeslots is equal to the current
          availableTimeslots state variable so nothing needs to be handled
          */
          console.error(error);
        });
    }
    // Return available_timeslots for use before state variable updates
    return available_timeslots;
  }

  /**
   * Fetches the room's availablity rules and available timeslots and sets the
   * disabledDates state variable accoringly.
   */
  async function fetchAvailability() {
    const room_availability = fetchRoomAvailability();
    const available_timeslots = fetchAvailableTimeSlots();
    disableUnavailableDates(await available_timeslots, await room_availability);
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
    const available_timeslots = fetchAvailableTimeSlots({
      start_datetime: month,
    });
    disableUnavailableDates(await available_timeslots);
  }

  /**
   * Get the time slots available on the date provided from availableTimeSlots
   * state variable
   * @param date The date to get the time slots for
   * @returns An array of the available timeslots for the provided date
   */
  function getDateTimeSlots(date: Date | undefined): TimeSlot[] {
    if (date === undefined) return [];
    // Prevents timezone offset messing with date string using .toISOString()
    const date_string =
      `${date.getFullYear()}-` +
      `${(date.getMonth() + 1).toString().padStart(2, "0")}-` +
      `${date.getDate().toString().padStart(2, "0")}`;
    const date_availability = availableTimeSlots.find(
      (o: DateTimeSlots) => o.date === date_string,
    );
    if (date_availability === undefined) return [];
    return date_availability.slots;
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
      const date = new Date(slot.start.toISOString().substring(0, 10));
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

    const d = new Date(room_start);
    while (d.getTime() <= room_end) {
      const time = d.toTimeString().substring(0, 5);
      time_options.push({
        value: time,
        label: time,
        disabled: !timeInTimeSlots(d.toTimeString().substring(0, 5), slots),
      });
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
    start_time: string | undefined = form.getValues("start_time"),
    timeslots: TimeSlot[] = selectTimeSlots,
  ): SelectOption[] {
    let end_options: SelectOption[] = [];
    if (start_time === undefined || start_time === "") {
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
    const timeslots = getDateTimeSlots(date);
    setSelectTimeSlots(timeslots);
    const start_options = getTimeSelectOptionsInSlots(timeslots);
    setStartTimeOptions(start_options);
    // Reset field if previous value is now invalid
    let start_time: string | undefined = form.getValues("start_time");
    if (!start_options.map((opt) => opt.value).includes(start_time)) {
      form.resetField("start_time"); // Not working as expected
      start_time = undefined;
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
    start_time: string | undefined,
    timeslots: TimeSlot[] = selectTimeSlots,
  ) {
    const end_options = getEndTimeOptions(start_time, timeslots);
    setEndTimeOptions(end_options);
    // Reset field if previous value is now invalid
    let end_time: string | undefined = form.getValues("end_time");
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
  function handleEndTimeChange(end_time: string | undefined) {
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
    fetchAvailability();
  }, []);

  return (
    <Form
      form={form}
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn(
        "h-fit w-full min-w-[32rem] max-w-[56rem] rounded-md",
        "flex flex-col gap-6 bg-white px-16 py-12",
      )}
    >
      <div className="flex flex-row gap-3">
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
                  value={field.value}
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
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="flex flex-row gap-3">
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
                  value={field.value}
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
                  value={field.value}
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
      <Checkbox
        className="ml-6"
        checked={allDay}
        onCheckedChange={(checked) => {
          setAllDay(checked === true);
          handleAllDayChanged(checked === true);
        }}
        disabled={!allDayEnabled}
      >
        {allDayEnabled ? "All day" : "All day (Unavailable for selected date)"}
      </Checkbox>
      <ReCAPTCHAV2 setVerified={setVerified} />
      <Button
        type="submit"
        className="w-1/6 min-w-[8rem] font-bold"
        disabled={!verified || submitPending}
      >
        Submit
      </Button>
      <AlertDialog {...alertDialogProps} />
    </Form>
  );
}

/**
 * TODO : Write docs
 * @returns
 */
export default function BookRoomPage() {
  const router = useRouter();

  const params = useParams();
  const room_id = Number(params.room_id);

  // Temporary fix to ensure room is always a room type
  const loading_room: Room = {
    id: -1,
    title: "Loading...",
    image:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HwAFgwJ/lYpukQAAAABJRU5ErkJggg==",
    location: "",
    available: false,
    availablility: "",
    seats: 0,
    amenities: [],
    removed: false,
  };

  const [room, setRoom] = useState(loading_room);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetches the room information for the room with the specified id.
   * @param {Number} room_id Id of the room to fetch infomation about.
   */
  async function fetchRoom(room_id: number) {
    /**
     *
     * @param start_iso_datetime
     * @param end_iso_datetime
     * @param recurrence_rule
     * @returns
     */
    function formAvailabilityString(
      start_iso_datetime: string,
      end_iso_datetime: string,
      recurrence_rule: string,
    ) {
      /**
       * Forms ranges of consecutive days from a list of days
       * @param available_days an array of 3 strings representing days (e.g. "Mon")
       * @returns An array of [start_day, end_day] pairs representing the groups
       * of consecutive days e.g. ([["Mon","Wed"],["Fri","Fri"]) for input
       * ["Mon","Tue","Wed","Fri"]
       */
      function groupConsecutiveDays(available_days: string[]) {
        const day_numbers = available_days.map((day: string) =>
          DayNumber.get(day),
        );
        const day_groups = [];
        let temp_stack: number[] = [];
        for (let i = 0; i < day_numbers.length; i++) {
          const current = day_numbers[i];
          const last = temp_stack.pop();
          // Start of new streak
          if (last === undefined) {
            temp_stack = [current, current]; // Start and end of range
            continue;
          }
          // Continue streak
          if (current === last + 1) {
            temp_stack.push(current);
          }
          // End streak
          else {
            temp_stack.push(last);
            day_groups.push([...temp_stack]);
            temp_stack = [current, current];
          }
        }
        // Clean up remaining streak
        if (temp_stack.length > 0) {
          day_groups.push([...temp_stack]);
        }
        // Convert back to days
        for (let i = 0; i < day_groups.length; i++) {
          day_groups[i] = day_groups[i].map((day_number: number) =>
            DayNumber.get(day_number),
          );
        }
        return day_groups;
      }

      /**
       * Creates a string representing the days that a room is available from
       * a recurrence rule (e.g. "Mon-Wed, Fri")
       * @param rrule A valid goolge calendar recurrence rule
       * @returns A string representing the days a room is available
       */
      function getDaysAvailableString(rrule: string) {
        const rrule_days = getDaysFromRRule(rrule);
        const available_days = rrule_days.map((day: string) =>
          GoogleCalendarDayConversion.get(day),
        );
        const day_groups = groupConsecutiveDays(available_days);
        const string_parts: string[] = [];
        for (let i = 0; i < day_groups.length; i++) {
          const start_day = day_groups[i][0];
          const end_day = day_groups[i][1];
          if (start_day !== end_day) {
            string_parts.push(`${start_day}-${end_day}`);
          } else {
            string_parts.push(`${start_day}`);
          }
        }
        let return_string = string_parts[0];
        for (let i = 1; i < string_parts.length; i++) {
          return_string += ", " + string_parts[i];
        }
        return return_string;
      }
      const start_time = getAMPMTimeString(
        new Date(Date.parse(start_iso_datetime)),
      );
      const end_time = getAMPMTimeString(
        new Date(Date.parse(end_iso_datetime)),
      );
      const days_available = getDaysAvailableString(recurrence_rule);
      const availability_string = `${start_time} - ${end_time}, ${days_available}`;
      return availability_string;
    }

    const defaultImage =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HwAFgwJ/lYpukQAAAABJRU5ErkJggg==";
    const apiUrl = `rooms/${room_id}/`;
    await api({ url: apiUrl, method: "get" })
      .then((response) => {
        const data = response.data;
        const room: Room = {
          id: data.id,
          title: data.name,
          image: data.img !== null ? data.img : defaultImage,
          seats: data.capacity,
          location: data.location.name,
          available: data.is_active,
          availablility: formAvailabilityString(
            data.start_datetime,
            data.end_datetime,
            data.recurrence_rule,
          ),
          amenities: data.amenities.map(
            (amenity: { id: number; name: string }) => amenity.name,
          ),
        };
        setRoom(room);
      })
      .catch((error) => {
        console.error("Error fetching room:", error);
        setError(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  /**
   * Fetch the room information on component mount.
   */
  useEffect(() => {
    fetchRoom(room_id);
  }, []);

  return (
    <div className="h-fit min-h-screen w-screen bg-gray-100">
      <div className="flex w-full items-center px-[3rem] py-[2rem]">
        <h1 className="text-xl font-semibold">Book room</h1>
      </div>
      <div className="flex h-full w-full items-start justify-center gap-[3rem] p-[1rem]">
        {isLoading && <Spinner className="w-6" />}
        {!isLoading && error && (
          <AlertDialog
            title="An error has occurred"
            description="Unable to load room information. Please try again later."
            variant="error"
            open={true}
            onConfirm={() => {
              router.push("/");
            }}
            onClose={() => {
              router.push("/");
            }}
          />
        )}
        {!isLoading && !error && (
          <>
            <div className="w-fit max-w-[24rem]">
              <RoomCard room={room} />
            </div>
            <BookRoomForm />
          </>
        )}
      </div>
    </div>
  );
}
