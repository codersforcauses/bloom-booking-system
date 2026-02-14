"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { BiCalendarEdit } from "react-icons/bi";
import { BsPersonCheck } from "react-icons/bs";
import { SiGooglecalendar, SiGoogleclassroom } from "react-icons/si";

import { DashboardCard, DashboardCardProps } from "@/components/dashboard-card";
import { useFetchDashboardStats } from "@/hooks/dashboard";

export function BookingsStats() {
  const router = useRouter();
  const { data, isLoading } = useFetchDashboardStats();

  const metrics: DashboardCardProps[] = [
    {
      label: "Total Meeting Rooms",
      value: data?.total_meeting_rooms ?? 0,
      icon: SiGoogleclassroom,
      colorClass: "border-bloom-yellow text-bloom-yellow",
      onClick: () => router.push("/meeting-room"),
    },
    {
      label: "Total Bookings",
      value: data?.total_bookings ?? 0,
      icon: SiGooglecalendar,
      colorClass: "border-bloom-blue text-bloom-blue",
    },
    {
      label: "Weekly Bookings",
      value: data?.weekly_bookings ?? 0,
      icon: BiCalendarEdit,
      colorClass: "border-bloom-red text-bloom-red",
    },
    {
      label: "Total Users",
      value: data?.total_users ?? 0,
      icon: BsPersonCheck,
      colorClass: "border-bloom-orbit text-bloom-orbit",
    },
  ];
  // loading state
  return (
    <div className="grid grid-cols-1 gap-4 pb-6 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <DashboardCard key={metric.label} {...metric} />
      ))}
    </div>
  );
}
