import Link from "next/link";
import { BiCalendarCheck, BiCalendarEdit, BiWindowClose } from "react-icons/bi";

import { AlertDialogVariant } from "@/components/alert-dialog";
import { Column, DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { BookingResponse } from "@/lib/api-types";
import { parseRecurrenceRule } from "@/lib/recurrence";
import { cn } from "@/lib/utils";

export default function BookingTable({
  data,
  isLoading,
  showAlert,
  isAdminPage = false,
}: {
  data: BookingResponse[];
  isLoading?: boolean;
  isAdminPage?: boolean;
  showAlert?: (
    variant: AlertDialogVariant,
    title: string,
    desc: string,
  ) => void;
}) {
  /**
   * Table column configuration for Booking data.
   *
   * @template Booking
   * Each column describes how a Booking field should be displayed.
   *
   * Generic usage:
   * - Column<Booking> means each row passed to the table is a Booking object
   * - `key` must exist on Booking (or be supported dot-notation)
   * - `render` receives a Booking row
   */
  const columns: Column<BookingResponse>[] = [
    // Nested keys are allowed. This reads booking.room.name
    { key: "room.name", header: "Room Name", className: "h-12" },
    { key: "visitor_name", header: "Visitor Name" },
    { key: "visitor_email", header: "Visitor Email" },
    {
      key: "start_datetime",
      header: "Start Date & Time",
      render: (row) => (
        <span className="whitespace-nowrap">
          {new Date(row.start_datetime).toLocaleString()}
        </span>
      ),
    },
    {
      key: "end_datetime",
      header: "End Date & Time",
      render: (row) => (
        <span className="whitespace-nowrap">
          {new Date(row.end_datetime).toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      // render is optional and only needed when
      // you want custom UI instead of raw text
      render: (row) => (
        <span
          className={cn(
            row.status === "COMPLETED"
              ? "text-green-600"
              : row.status === "CONFIRMED"
                ? "text-blue-600"
                : "text-gray-500",
          )}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "recurrence_rule",
      header: "Recurrence",
      render: (row) => {
        const recurrence = parseRecurrenceRule(
          row.recurrence_rule,
          row.start_datetime,
        );

        // One Time = plain text, repeating = clickable button
        return recurrence.label === "One Time" ? (
          <span>{recurrence.label}</span>
        ) : (
          <button
            type="button"
            className="text-sm text-bloom-blue underline hover:text-bloom-blue-light"
            onClick={() =>
              showAlert?.(
                recurrence.label && recurrence.detail ? "info" : "error",
                recurrence.text
                  ? `${recurrence.label} (${recurrence.text})`
                  : recurrence.label,
                recurrence.detail ??
                  `Cannot be defined with rule: ${row.recurrence_rule}.`,
              )
            }
          >
            {recurrence.label}
          </button>
        );
      },
    },
  ];

  const renderActions = (row: BookingResponse) => {
    const isActive = row.status === "CONFIRMED";

    return (
      <span className="flex justify-center">
        <span className="absolute left-0 top-0 h-full border-l-2" />
        {/* View / Edit */}
        <Button
          size="icon"
          title="View"
          aria-label="View"
          disabled={!isActive}
          className={cn(
            "rounded-full border-2 bg-transparent p-0",
            isActive
              ? "border-bloom-yellow text-bloom-yellow hover:bg-muted"
              : "cursor-not-allowed border-gray-300 text-gray-300",
          )}
        >
          {isActive ? (
            <Link
              href={
                isAdminPage
                  ? `/bookings/${row.id}`
                  : `/find-my-booking/${row.id}?email=${encodeURIComponent(row.visitor_email)}`
              }
            >
              <BiCalendarEdit size={20} />
            </Link>
          ) : (
            <BiCalendarCheck size={20} />
          )}
        </Button>

        {/* <Button
          size="icon"
          title="Cancel"
          aria-label="Cancel"
          disabled={!isActive}
          className={cn(
            "rounded-full border-2 bg-transparent p-0",
            isActive
              ? "border-bloom-red text-bloom-red hover:bg-muted"
              : "cursor-not-allowed border-gray-300 text-gray-300",
          )}
          onClick={() =>
            showAlert?.(
              "confirm",
              "Cancel booking?",
              "This action cannot be undone.",
            )
          }
        >
          <BiWindowClose size={20} />
        </Button> */}
        <span />
      </span>
    );
  };

  return (
    <div className="bg-inherit">
      <DataTable<BookingResponse>
        data={data}
        columns={columns}
        isLoading={isLoading}
        actions={renderActions}
      />
    </div>
  );
}
