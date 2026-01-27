"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { endOfMonth,endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Matcher } from "react-day-picker";
import { useForm } from "react-hook-form";
import * as z from "zod";

import AlertDialog from "@/components/alert-dialog";
import InputField from "@/components/input";
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
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { Room } from "@/types/card";

interface RoomAvailability {
  recurrence_rule: string;
  start_datetime: Date;
  end_datetime: Date;
}

interface DateTimeSlots {
  date: string;
  slots: {
    start: Date;
    end: Date;
  }[];
}

// Converts google calendar day strings to 3 lettter day strings
const GoogleCalendarDayConversion = new Map();
GoogleCalendarDayConversion.set("MO", "Mon");
GoogleCalendarDayConversion.set("TU", "Tue");
GoogleCalendarDayConversion.set("WE", "Wed");
GoogleCalendarDayConversion.set("TH", "Thu");
GoogleCalendarDayConversion.set("FR", "Fri");
GoogleCalendarDayConversion.set("SA", "Sat");
GoogleCalendarDayConversion.set("SU", "Sun");

// Convert between 3 letter day strings and their respective number
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

function BookRoomForm() {
  const params = useParams();
  const room_id = Number(params.room_id);

  // Used to strict date and time selection options
  const default_room_availability: RoomAvailability = {
    recurrence_rule: "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
    start_datetime: new Date(new Date(0).setHours(8)),
    end_datetime: new Date(new Date(0).setHours(17)),
  };
  const [roomAvailability, setRoomAvailability] = useState(
    default_room_availability,
  );
  const default_available_timeslots: DateTimeSlots[] = [];
  const [availableTimeSlots, setAvailableTimeSlots] = useState(
    default_available_timeslots,
  );
  const default_disabled_dates: Matcher[] = [];
  const [disabledDates, setDisabledDates] = useState(default_disabled_dates);

  const [allDay, setAllDay] = useState(false);
  const [verified, setVerified] = useState(false);
  const [alertDialogProps, setAlertDialogProps] = useState({
    title: "",
    successText: "",
    showIcon: false,
    isPending: false,
  });

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
  });

  /**
   * Uses data from the from to send an POST request to /api/bookings/ endpoint
   * and sets alertDialogProps and isPending according to server response.
   * @param data The data from the form.
   */
  function onSubmit(data: z.infer<typeof formSchema>) {
    setAlertDialogProps({
      title: "Submitting booking...",
      successText: "",
      showIcon: false,
      isPending: true,
    });
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
      successText: "",
      showIcon: false,
      isPending: false,
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
        const success_text = cn(
          `Your ${res.room.name} Booking for`,
          `${date.getDate()} ${MonthString[date.getMonth()]} ${date.getFullYear()}`,
          `from ${start_time} to ${end_time}`,
          `has been submitted.\n`,
          `You will receive an email confirmation shortly.`,
        );
        alert_dialog_props.title = "Awesome!";
        alert_dialog_props.successText = success_text;
        alert_dialog_props.showIcon = true;
      })
      .catch((error) => {
        alert_dialog_props.title = "Sorry!";
        alert_dialog_props.showIcon = false;
        const res = error.response.data;
        if (res.start_datetime !== undefined) {
          alert_dialog_props.successText = cn(res.start_datetime);
        } else if (res.end_datetime !== undefined) {
          alert_dialog_props.successText = cn(res.end_datetime);
        } else if (res.non_field_errors !== undefined) {
          alert_dialog_props.successText = cn(res.non_field_errors);
        } else if (res.detail !== undefined) {
          alert_dialog_props.successText = cn(res.detail);
        } else {
          alert_dialog_props.successText = "Unknown error.";
          console.error(error);
        }
      })
      .finally(() => {
        setAlertDialogProps(alert_dialog_props);
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
        // TODO : Handle error case
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
    const start_date = startOfWeek(start_datetime)
      .toISOString()
      .substring(0, 10);
    const end_date = endOfWeek(end_datetime).toISOString().substring(0, 10);
    const apiUrl = `rooms/${room_id}/availability/?start_date=${start_date}&end_date=${end_date}`;
    let available_timeslots: DateTimeSlots[] = [];
    await api({ url: apiUrl, method: "get" })
      .then((response) => {
        available_timeslots = response.data.availability.map(
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
        setAvailableTimeSlots(available_timeslots);
      })
      .catch((error) => {
        // TODO: handle error case
        console.error(error);
      });
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
                    // TODO: Restrict time selection
                  }}
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
                  kind="time-select"
                  required={true}
                  name="start_time"
                  label="Start time"
                  value={field.value}
                  onChange={field.onChange}
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
                  kind="time-select"
                  required={true}
                  name="end_time"
                  label="End time"
                  value={field.value}
                  onChange={field.onChange}
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
        onCheckedChange={(checked) => setAllDay(checked === true)}
        disabled={true}
      >
        All Day (Currently not implemented)
      </Checkbox>
      <ReCAPTCHAV2 setVerified={setVerified} />
      <AlertDialog {...alertDialogProps}>
        <Button
          type="submit"
          className="w-1/6 min-w-[8rem] font-bold"
          disabled={!verified}
        >
          Submit
        </Button>
      </AlertDialog>
    </Form>
  );
}

export default function BookRoomPage() {
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
        // TODO: handle error (properly)
        console.error("Error fetching room:", error);
        setError(error.message);

        const err_room: Room = {
          id: -1,
          title: "Error... unable to load room",
          image: defaultImage,
          location: "",
          available: false,
          availablility: "",
          seats: 0,
          amenities: [],
          removed: false,
        };
        setRoom(err_room);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  useEffect(() => {
    fetchRoom(room_id);
  }, []);

  return (
    <div className="h-fit min-h-screen w-screen bg-gray-100">
      <div className="flex w-full items-center px-[3rem] py-[2rem]">
        <h1 className="text-xl font-semibold">Book room</h1>
      </div>
      <div className="flex h-full w-full items-start justify-center gap-[3rem] p-[1rem]">
        <div className="w-fit max-w-[24rem]">
          <RoomCard room={room} />
        </div>
        <BookRoomForm />
      </div>
    </div>
  );
}
