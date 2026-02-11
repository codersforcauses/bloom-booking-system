// Utility functions for room booking (date formatting, recurrence, etc.)
import { format } from "date-fns";
/**
 * Converts google calendar day strings to 3 letter day strings
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
  const display_hours = hours % 12 || 12;
  const display_mins = datetime.getMinutes().toString().padStart(2, "0");
  const suffix = hours >= 12 ? "pm" : "am";
  return `${display_hours}:${display_mins}${suffix}`;
}

export {
  DayNumber,
  formatDateTime,
  getAMPMTimeString,
  getDaysFromRRule,
  GoogleCalendarDayConversion,
};
