import Link from "next/link";
import { BiCalendarCheck, BiCalendarEdit, BiWindowClose } from "react-icons/bi";

import { Column, DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Booking } from "@/types/booking";

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
const columns: Column<Booking>[] = [
  { key: "id", header: "ID", className: "h-12" },
  // Nested keys are allowed. This reads booking.room.name
  { key: "room.name", header: "Room Name" },
  { key: "visitor_name", header: "Visitor Name" },
  { key: "visitor_email", header: "Visitor Email" },
  {
    key: "start_datetime",
    header: "Start Date & Time",
    render: (row) => new Date(row.start_datetime).toLocaleString(),
  },
  {
    key: "end_datetime",
    header: "End Date & Time",
    render: (row) => new Date(row.end_datetime).toLocaleString(),
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
];

const renderActions = (row: Booking) => {
  const isActive = row.status === "COMPLETED";

  return (
    <span className="flex space-x-2">
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
          <Link href="#">
            <BiCalendarEdit size={20} />
          </Link>
        ) : (
          <BiCalendarCheck size={20} />
        )}
      </Button>

      <Button
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
      >
        <Link href="#">
          <BiWindowClose size={20} />
        </Link>
      </Button>
      <span />
    </span>
  );
};

export default function DemoTable({
  data,
  isLoading,
}: {
  data: Booking[];
  isLoading?: boolean;
}) {
  return (
    <div className="bg-inherit">
      <DataTable<Booking>
        data={data}
        columns={columns}
        isLoading={isLoading}
        actions={renderActions}
      />
    </div>
  );
}
