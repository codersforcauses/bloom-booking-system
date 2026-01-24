"use client";

import { Building, Calendar, ClipboardList, Users } from "lucide-react";

import { DashboardCard } from "@/components/dashboard-card";

export default function TestDashboardCardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            value={5}
            label="Total Meeting Rooms"
            color="var(--bloom-yellow)"
            icon={Building}
            onClick={() => (window.location.href = "http://localhost:3000")}
          />
          <DashboardCard
            value={20}
            label="Total Bookings"
            color="var(--bloom-blue)"
            icon={Calendar}
            onClick={() => (window.location.href = "http://localhost:3000")}
          />
          <DashboardCard
            value={2}
            label="Weekly Bookings"
            color="var(--bloom-red)"
            icon={ClipboardList}
            onClick={() => (window.location.href = "http://localhost:3000")}
          />
          <DashboardCard
            value={3}
            label="Total Users"
            color="var(--bloom-orbit)"
            icon={Users}
            onClick={() => (window.location.href = "http://localhost:3000")}
          />
        </div>
      </div>
    </div>
  );
}
