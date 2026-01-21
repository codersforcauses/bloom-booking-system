import Link from "next/link";
import { BiCalendarCheck, BiCalendarEdit, BiWindowClose } from "react-icons/bi";

import { Column, DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TableRow = {
  id: number;
  name: string;
  status: string;
};

const columns: Column<TableRow>[] = [
  {
    key: "id",
    header: "ID with Super Long Header Name To Test Sticky Behavior",
    className: "h-12",
  },
  {
    key: "name",
    header: "Name with Super Long Header Name To Test Sticky Behavior",
  },
  {
    key: "status",
    header: "Status with Super Long Header Name To Test Sticky Behavior",
    render: (row) => (
      <span
        className={row.status === "Active" ? "text-green-600" : "text-gray-500"}
      >
        {row.status}
      </span>
    ),
  },
];

const renderActions = (row: TableRow) => {
  const isActive = row.status === "Active";

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
  title,
  data,
}: {
  title?: string;
  data: TableRow[];
}) {
  return (
    <div className="bg-inherit">
      {title && <h2 className="mb-4 text-xl font-semibold">{title}</h2>}

      <DataTable<TableRow>
        data={data}
        columns={columns}
        actions={renderActions}
      />
    </div>
  );
}
