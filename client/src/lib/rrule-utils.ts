// copied from issue 115
import { TZDate } from "@date-fns/tz";
import { differenceInMinutes, endOfDay, format, startOfDay } from "date-fns";
import { RRule, rrulestr } from "rrule";

import { RoomResponse } from "@/lib/api-types";

// helper function to calculate available slots based on start datetime, end datetime and recurrence rule (no booking considered)
export const getAvailableSlots = (
  room: RoomResponse | undefined,
  rangeStart: string,
  rangeEnd: string,
) => {
  const PERTH_TZ = "Australia/Perth";
  if (!room) return new Set<number>();

  const availableSet = new Set<number>();
  const roomStart = new TZDate(room.start_datetime, PERTH_TZ);
  const roomEnd = new TZDate(room.end_datetime, PERTH_TZ);
  const durationMinutes = differenceInMinutes(roomEnd, roomStart);

  const startString = format(roomStart, "yyyy-MM-dd'T'HH:mm:ss");
  const fakeUtcStart = new Date(startString + "Z");
  const searchStart = new TZDate(rangeStart, PERTH_TZ);
  const searchStartString = format(searchStart, "yyyy-MM-dd'T'00:00:00");
  const fakeUtcSearchStart = new Date(searchStartString + "Z");
  const searchEnd = new TZDate(rangeEnd, PERTH_TZ);
  const searchEndString = format(searchEnd, "yyyy-MM-dd'T'23:59:59");
  const fakeUtcSearchEnd = new Date(searchEndString + "Z");

  if (room.recurrence_rule) {
    // Use RRule if it exists (pretend it is in utc)
    const options = RRule.parseString(room.recurrence_rule);
    options.dtstart = fakeUtcStart;
    const rule = new RRule(options);
    const occurrences = rule.between(
      fakeUtcSearchStart,
      fakeUtcSearchEnd,
      true,
    );

    occurrences.forEach((fakeOccurrenceStart) => {
      const plainString = fakeOccurrenceStart.toISOString().split(".")[0];
      const occurrenceStart = new TZDate(plainString, PERTH_TZ);
      const startTimeMs = occurrenceStart.getTime();
      const endTimeMs = startTimeMs + durationMinutes * 60000; // timestamps in number

      let current = startTimeMs;
      while (current < endTimeMs) {
        availableSet.add(current);
        current += 30 * 60000; // 30-minute slot
      }
    });
  } else {
    const dayStart = startOfDay(roomStart);
    const dayEnd = endOfDay(roomEnd);

    // Only generate slots if roomStart is within search range
    if (dayEnd >= searchStart && dayStart <= searchEnd) {
      const startOffset = roomStart.getHours() * 60 + roomStart.getMinutes();
      const startTimeMs = dayStart.getTime() + startOffset * 60000;
      const endTimeMs = startTimeMs + durationMinutes * 60000;

      let current = startTimeMs;
      while (current < endTimeMs) {
        availableSet.add(current);
        current += 30 * 60000;
      }
    }
  }
  return availableSet;
};

// helper function to transform start_datetime, end_datetime and rrule to readable string
export const getAvailabilityText = (
  isActive: boolean,
  startDt: Date,
  endDt: Date,
  ruleString: string,
) => {
  const PERTH_TZ = "Australia/Perth";
  if (!isActive) return "Inactive";
  try {
    // Extract and format the times
    const startDtPerth = new TZDate(startDt, PERTH_TZ);
    const endDtPerth = new TZDate(endDt, PERTH_TZ);
    const datePart = format(startDtPerth, "yyyy-MM-dd");
    const startTime = format(startDtPerth, "hh:mm aa");
    const endTime = format(endDtPerth, "hh:mm aa");

    // No rrule, return the date
    if (!ruleString) return `${datePart}, ${startTime} - ${endTime}`;

    // With rrule, return with rule text
    const rule = rrulestr(ruleString);
    const ruleText = rule.toText();
    return `${startTime} - ${endTime}, ${ruleText}`;
  } catch (e) {
    console.error("Error parsing schedule:", e);
    return "Invalid schedule format";
  }
};
