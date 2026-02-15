// Utility functions for room booking (date formatting, recurrence, etc.)
import { format, startOfDay } from "date-fns";
import { rrulestr } from "rrule";

/**
 * Combine a date object and a HH:MM time string to a ISO string, if time string
 * is empty will return the same time as date param
 * @param date a Date object
 * @param time a valid time in format HH:MM
 * @returns a Date object with the same date as date param and time contained in time string
 */
function formatDateTime(date: Date, time: string) {
  const full_date = new Date(date);
  if (time !== "") {
    const time_split = time.split(":");
    const hours = Number(time_split[0]);
    const mins = Number(time_split[1]);
    full_date.setHours(hours);
    full_date.setMinutes(mins);
  }
  const iso_string = full_date.toISOString();
  return iso_string;
}

/**
 * Return the time in 12 hour hour:minutes am/pm format
 * @param datetime A valid Date object
 * @returns a string in AM/PM time e.g. 9:00am, 10:00pm
 */
function getAMPMTimeString(datetime: Date) {
  const hours = datetime.getHours();
  const display_hours = hours % 12 || 12;
  const display_mins = datetime.getMinutes().toString().padStart(2, "0");
  const suffix = hours >= 12 ? "pm" : "am";
  return `${display_hours}:${display_mins}${suffix}`;
}

/**
 * Returns an array of numbers representing days of the week (Monday = 0, Sunday = 6)
 * not included in the BYDAY argument of a recurrence rule
 * @param rrule_string RRule string (e.g., "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR")
 * @returns Array of unavailable weekday numbers (0=Mon, 6=Sun)
 */
function getUnavailableDaysOfWeek(rrule_string: string): number[] {
  if (!rrule_string) return [];

  try {
    // Parse the RRule
    const rule = rrulestr(
      rrule_string.startsWith("RRULE:")
        ? rrule_string
        : `RRULE:${rrule_string}`,
    );
    const options = rule.origOptions;

    // Get weekdays from the rule (RRule uses 0=Monday, 6=Sunday)
    let weekdays = options.byweekday;
    if (!weekdays) {
      // If no specific days, assume all days are available
      return [];
    }

    // Normalize to array
    if (!Array.isArray(weekdays)) {
      weekdays = [weekdays];
    }

    // Convert Weekday objects/numbers to day numbers (0-6)
    const available_days = weekdays.map((wd) => {
      if (typeof wd === "number") return wd;
      if (typeof wd === "object" && "weekday" in wd) return wd.weekday;
      // Handle string case if needed
      if (typeof wd === "string") {
        const dayMap: Record<string, number> = {
          MO: 0,
          TU: 1,
          WE: 2,
          TH: 3,
          FR: 4,
          SA: 5,
          SU: 6,
        };
        return dayMap[wd] ?? 0;
      }
      return 0;
    });

    // Find unavailable days (0-6, Mon-Sun)
    const all_days = [0, 1, 2, 3, 4, 5, 6];
    return all_days.filter((day) => !available_days.includes(day));
  } catch (error) {
    console.error("Error parsing RRule:", error);
    return [];
  }
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
  available_timeslots: { date: string; slots: { start: Date; end: Date }[] }[],
  options: {
    ignore_days_of_week?: number[];
    start_date?: Date;
    end_date?: Date;
  } = {},
): Date[] {
  const ignore_days_of_week = options.ignore_days_of_week || [];

  let unavailable_dates: Date[] = [];
  const available_dates = available_timeslots.map((o) => o.date);
  if (available_dates.length === 0) return unavailable_dates;

  const start_date = options.start_date || new Date();
  const last_date =
    options.end_date ||
    new Date(
      available_dates.reduce((latest, current) => {
        const latestDate = new Date(latest);
        const currentDate = new Date(current);
        return currentDate > latestDate ? current : latest;
      }, available_dates[0]),
    );

  const d = new Date(format(start_date, "yyyy-MM-dd"));
  while (d <= last_date) {
    unavailable_dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  unavailable_dates = unavailable_dates
    .filter((date) => !ignore_days_of_week.includes(date.getDay()))
    .filter((date) => !available_dates.includes(format(date, "yyyy-MM-dd")));
  return unavailable_dates;
}

/**
 * Get the time slots available on the date provided from availableTimeSlots
 * @param date The date to get the time slots for
 * @param availableTimeSlots Array of available timeslots
 * @returns An array of the available timeslots for the provided date
 */
function getDateTimeSlots(
  date: Date | undefined,
  availableTimeSlots: { date: string; slots: { start: Date; end: Date }[] }[],
): { start: Date; end: Date }[] {
  if (date === undefined) return [];
  const date_string = format(date, "yyyy-MM-dd");
  const date_availability = availableTimeSlots.find(
    (o) => o.date === date_string,
  );
  if (date_availability === undefined) return [];
  return date_availability.slots;
}

/**
 * Returns true if the time provided is within one of the time slots provided
 * @param time An HH:MM string representing a valid time
 * @param slots An array of timeslots
 * @returns True if time param is contained within one of the timeslots
 */
function timeInTimeSlots(
  time: string,
  slots: { start: Date; end: Date }[],
): boolean {
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
 * @param roomAvailability The room's availability information
 * @param filter_out_unavailable If true removes unavailable options from array
 * returned, otherwise sets disabled to true for these options
 * @param option_length The time between options e.g. 30 returns 08:00, 08:30
 * @returns An array of of select options of times in HH:MM format between the
 * room's opening and closing times, and within timeslots provided
 */
function getTimeSelectOptionsInSlots(
  slots: { start: Date; end: Date }[],
  roomAvailability: { start_datetime: Date; end_datetime: Date },
  filter_out_unavailable: boolean = true,
  option_length: number = 30,
): { value: string; label: string; disabled: boolean }[] {
  const time_options: { value: string; label: string; disabled: boolean }[] =
    [];
  const slot_length = new Date(new Date(0).setMinutes(option_length)).getTime();

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

  if (filter_out_unavailable) return time_options.filter((o) => !o.disabled);
  return time_options;
}

/**
 * Get the available end_times given a start_time and available time slots,
 * restricts the end_times to be within the same time slot as the start time
 * and after the start time.
 * @param start_time The value of the start_time field
 * @param timeslots The timeslots of the current date
 * @param roomAvailability The room's availability information
 * @returns An array of SelectOptions with the end time options
 */
function getEndTimeOptions(
  start_time: string,
  timeslots: { start: Date; end: Date }[],
  roomAvailability: { start_datetime: Date; end_datetime: Date },
): { value: string; label: string; disabled: boolean }[] {
  let end_options: { value: string; label: string; disabled: boolean }[] = [];
  if (start_time === "") {
    end_options = getTimeSelectOptionsInSlots(timeslots, roomAvailability);
  } else {
    for (let i = 0; i < timeslots.length; i++) {
      const slot = timeslots[i];
      if (timeInTimeSlots(start_time, [slot])) {
        end_options = getTimeSelectOptionsInSlots(
          [slot],
          roomAvailability,
        ).filter((opt) => {
          // Remove end times before start
          const start = new Date(formatDateTime(new Date(), start_time));
          const opt_time = new Date(formatDateTime(new Date(), opt.value));
          return start < opt_time;
        });
        break;
      }
    }
  }
  return end_options;
}

export {
  formatDateTime,
  getAMPMTimeString,
  getDateTimeSlots,
  getEndTimeOptions,
  getTimeSelectOptionsInSlots,
  getUnavailableDates,
  getUnavailableDaysOfWeek,
  timeInTimeSlots,
};
