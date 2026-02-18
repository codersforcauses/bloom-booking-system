// src/stories/data-table.stories.tsx

import type { Meta, StoryObj } from "@storybook/nextjs";
import React from "react";

import { type Column,DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";

type PersonRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Pending" | "Disabled";
  location: {
    building: string;
    room: string;
  };
};

const meta: Meta = {
  title: "Data/DataTable",
};

export default meta;

type Story = StoryObj;

/* ----------------------------
   Data
---------------------------- */

const rows: PersonRow[] = [
  {
    id: 1,
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    role: "Admin",
    status: "Active",
    location: { building: "Building A", room: "2.14" },
  },
  {
    id: 2,
    name: "Priya Shah",
    email: "priya.shah@example.com",
    role: "Manager",
    status: "Pending",
    location: { building: "Engineering Complex", room: "4.21" },
  },
  {
    id: 3,
    name: "Sam Lee",
    email: "sam.lee@example.com",
    role: "Staff",
    status: "Active",
    location: { building: "Library", room: "G.03" },
  },
  {
    id: 4,
    name: "Morgan Chen",
    email: "morgan.chen@example.com",
    role: "Staff",
    status: "Disabled",
    location: { building: "Student Guild", room: "Events Hall" },
  },
];

const longRows: PersonRow[] = Array.from({ length: 18 }).map((_, i) => ({
  id: i + 1,
  name:
    i % 3 === 0
      ? "Alexandria Catherine Johnson-Smythe — Extremely Long Name For Overflow Testing"
      : i % 3 === 1
        ? "Priyanka Shreya Shah — Cross-Functional Stakeholder Liaison (APAC + EMEA)"
        : "Morgan-Chen-Lee — Long Name (With Hyphens) For Layout Checks",
  email:
    i % 2 === 0
      ? "very.long.email.address+storybook.regression.testing@example-university-domain.edu.au"
      : "short@example.com",
  role:
    i % 4 === 0 ? "Administrator" : i % 4 === 1 ? "Manager" : "Staff Member",
  status: (["Active", "Pending", "Disabled"] as const)[i % 3],
  location: {
    building:
      i % 2 === 0
        ? "Engineering Complex — Level 4 — Room 4.21 — Restricted After Hours — Swipe Access Only"
        : "Student Guild — Events Hall — Back Entrance — Past Courtyard — Near Loading Bay",
    room: i % 2 === 0 ? "4.21B (North Wing)" : "Events Hall (Main)",
  },
}));

/* ----------------------------
   Columns
---------------------------- */

const makeColumns = (showStatusPill: boolean): Column<PersonRow>[] => [
  { key: "name", header: "Name", className: "min-w-[220px]" },
  { key: "email", header: "Email", className: "min-w-[320px]" },
  { key: "role", header: "Role", className: "min-w-[160px]" },
  showStatusPill
    ? {
        key: "status",
        header: "Status",
        className: "min-w-[140px]",
        render: (row) => {
          const pill =
            row.status === "Active"
              ? "bg-green-100 text-green-800"
              : row.status === "Pending"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800";

          return (
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs ${pill}`}
            >
              {row.status}
            </span>
          );
        },
      }
    : { key: "status", header: "Status", className: "min-w-[140px]" },
  { key: "location.building", header: "Building", className: "min-w-[340px]" },
  { key: "location.room", header: "Room", className: "min-w-[180px]" },
];

/* ----------------------------
   Stories
---------------------------- */

type NormalArgs = {
  isLoading: boolean;
  showActions: boolean;
  showStatusPill: boolean;
  rowCount: number;
};

export const Normal: StoryObj<NormalArgs> = {
  name: "Interactive",
  args: {
    isLoading: false,
    showActions: true,
    showStatusPill: true,
    rowCount: 4,
  },
  argTypes: {
    isLoading: { control: "boolean" },
    showActions: { control: "boolean" },
    showStatusPill: { control: "boolean" },
    rowCount: { control: { type: "number", min: 0, max: 18, step: 1 } },
  },
  render: (args) => {
    const data = rows.slice(
      0,
      Math.max(0, Math.min(args.rowCount, rows.length)),
    );
    const columns = makeColumns(args.showStatusPill);

    return (
      <div className="p-8">
        <DataTable<PersonRow>
          data={data}
          columns={columns}
          isLoading={args.isLoading}
          actions={
            args.showActions
              ? (row) => (
                  <div className="flex items-center justify-end gap-2 px-2 py-1">
                    <Button variant="outline" onClick={() => {}}>
                      View
                    </Button>
                    <Button variant="warning" onClick={() => {}}>
                      Remove
                    </Button>
                  </div>
                )
              : undefined
          }
        />
      </div>
    );
  },
};

export const Empty: Story = {
  render: () => (
    <div className="p-8">
      <DataTable<PersonRow>
        data={[]}
        columns={makeColumns(true)}
        actions={() => null}
      />
    </div>
  ),
};

export const LongValues: Story = {
  name: "Long values",
  render: () => (
    <div className="p-8">
      <DataTable<PersonRow>
        data={longRows}
        columns={makeColumns(true)}
        actions={(row) => (
          <div className="flex items-center justify-end gap-2 px-2 py-1">
            <Button variant="outline" onClick={() => {}}>
              View
            </Button>
            <Button variant="warning" onClick={() => {}}>
              Remove
            </Button>
          </div>
        )}
      />
    </div>
  ),
};
