import { HeaderCard } from "@/components/ui/header-card";

export default function TestHeaderCardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <HeaderCard value={5} label="Total Meeting Rooms" variant="rooms" />
          <HeaderCard value={20} label="Total Bookings" variant="bookings" />
          <HeaderCard value={2} label="Weekly Bookings" variant="weekly" />
          <HeaderCard value={3} label="Total Users" variant="users" />
        </div>
      </div>
    </div>
  );
}
