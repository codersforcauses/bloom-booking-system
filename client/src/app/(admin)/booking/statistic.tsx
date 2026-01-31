"use client";

import React from "react";
import { BiCalendarEdit } from "react-icons/bi";
import { BsPersonCheck } from "react-icons/bs";
import { SiGooglecalendar, SiGoogleclassroom } from "react-icons/si";

import { DashboardCard, DashboardCardProps } from "@/components/dashboard-card";

const metrics: DashboardCardProps[] = [
  {
    label: "Total Meeting Rooms",
    value: 5,
    icon: SiGoogleclassroom,
    color: "border-bloom-yellow text-bloom-yellow",
    onClick: () => {}, // shadow
  },
  {
    label: "Total Bookings",
    value: 20,
    icon: SiGooglecalendar,
    color: "border-bloom-blue text-bloom-blue",
  },
  {
    label: "Weekly Bookings",
    value: 2,
    icon: BiCalendarEdit,
    color: "border-bloom-red text-bloom-red",
  },
  {
    label: "Total Users",
    value: 3,
    icon: BsPersonCheck,
    color: "border-bloom-orbit text-bloom-orbit",
  },
];

export function BookingsStats() {
  return (
    <div className="grid grid-cols-1 gap-4 pb-6 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <DashboardCard key={metric.label} {...metric} />
      ))}
    </div>
  );
}
