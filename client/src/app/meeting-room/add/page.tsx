import Breadcrumb from "@/components/breadcrumb";

export default function AddMeetingRoomPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Meeting Room", href: "/meeting-room" },
          { label: "Add Meeting Room" },
        ]}
      />

      <h1 className="text-2xl font-semibold">Add Meeting Room</h1>
    </div>
  );
}
