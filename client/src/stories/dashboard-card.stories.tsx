// src/stories/dashboard-card.stories.tsx

import type { Meta, StoryObj } from "@storybook/nextjs";
import React from "react";
import { FaCalendarAlt, FaDoorOpen, FaUsers } from "react-icons/fa";

import { DashboardCard } from "@/components/dashboard-card";

const meta: Meta = {
  title: "Dashboard/DashboardCard",
  component: DashboardCard,
};

export default meta;

type Story = StoryObj<typeof DashboardCard>;

export const Default: Story = {
  args: {
    value: 128,
    label: "Total Users",
    colorClass: "border-l-blue-500 text-blue-500",
    icon: FaUsers,
  },
};

export const Clickable: Story = {
  args: {
    value: 42,
    label: "Active Bookings",
    colorClass: "border-l-green-500 text-green-500",
    icon: FaCalendarAlt,
    onClick: () => alert("Card clicked"),
  },
};

export const LongLabel: Story = {
  args: {
    value: 9999,
    label:
      "Total Active Bookings Across All Campuses With Extended Reporting Period",
    colorClass: "border-l-purple-500 text-purple-500",
    icon: FaDoorOpen,
  },
};

export const GridPreview: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-4 p-8 sm:grid-cols-2 lg:grid-cols-3">
      <DashboardCard
        value={128}
        label="Total Users"
        colorClass="border-l-blue-500 text-blue-500"
        icon={FaUsers}
      />
      <DashboardCard
        value={42}
        label="Active Bookings"
        colorClass="border-l-green-500 text-green-500"
        icon={FaCalendarAlt}
      />
      <DashboardCard
        value="12%"
        label="Utilisation Rate"
        colorClass="border-l-orange-500 text-orange-500"
        icon={FaDoorOpen}
      />
    </div>
  ),
};
