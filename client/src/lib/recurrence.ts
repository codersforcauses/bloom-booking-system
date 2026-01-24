import { rrulestr } from "rrule";

export type RecurrenceSummary = {
  label: string; // "One Time", "Daily", "Weekly", etc.
  detail?: string; // optional, e.g., "Mon, Wed, Fri"
  upcoming?: string[]; // first N dates as strings
  text?: string;
};

/**
 * Parse RRULE string and return a summary.
 *
 * - Only generates the first `limit` occurrences using the `all()` iterator.
 * - Safe for endless recurrence rules.
 */
export function parseRecurrenceRule(
  rruleString?: string,
  start?: string,
  limit = 20,
): RecurrenceSummary {
  if (!rruleString || !start) return { label: "One Time" };

  const dtStart = new Date(start);
  let recurrence: RecurrenceSummary = { label: "Custom" };

  try {
    const rule = rrulestr(
      `DTSTART:${dtStart.toISOString().replace(/[-:]|\.\d{3}/g, "")}\nRRULE:${rruleString}`,
    );

    // Map FREQ to a human-friendly label
    const freq = rruleString.split(";")[0].replace("FREQ=", "");
    recurrence.label =
      freq === "DAILY"
        ? "Daily"
        : freq === "WEEKLY"
          ? "Weekly"
          : freq === "MONTHLY"
            ? "Monthly"
            : freq === "YEARLY"
              ? "Yearly"
              : "Custom";

    // Use iterator with `all()` to stop after first N occurrences
    const upcoming: string[] = [];
    rule.all((date, len) => {
      if (len >= limit) return false; // stop iteration
      upcoming.push(formatDateForRRule(date));
      return true; // continue
    });

    recurrence.upcoming = upcoming;
    recurrence.detail =
      upcoming.length > 0 ? formatUpcomingDates(upcoming, limit) : undefined;
    recurrence.text = rule.toText();
    return recurrence;
  } catch {
    return { label: "Custom" };
  }
}

function formatDateForRRule(d: Date) {
  const w = d.toLocaleDateString(undefined, { weekday: "short" });
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${w} ${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Format upcoming dates for display in AlertDialog
 * - Splits into lines of up to 5 dates per line
 * - Adds ellipsis if truncated
 */
function formatUpcomingDates(dates: string[], limit: number) {
  const perLine = 2;
  const lines: string[] = [];

  for (let i = 0; i < dates.length; i += perLine) {
    lines.push(dates.slice(i, i + perLine).join(", "));
  }

  if (dates.length === limit) {
    lines[lines.length - 1] += " …";
  }

  return lines.join("\n"); // each line will show in a separate line in AlertDialog
}
