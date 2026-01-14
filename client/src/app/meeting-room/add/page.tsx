import Breadcrumb from "@/components/breadcrumb";

import AddMeetingRoomForm from "./add-meeting-room-form";

export default function AddMeetingRoomPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Meeting Room", href: "/meeting-room" },
          { label: "Add Meeting Room" },
        ]}
      />
      {/* Page title */}
      <h1 className="text-2xl font-semibold">Meeting Rooms</h1>

      {/* Admin-only form */}
      <AddMeetingRoomForm />
    </div>
  );
}
