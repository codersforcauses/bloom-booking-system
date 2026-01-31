import AddMeetingRoomForm from "./add-meeting-room-form";

export default function AddMeetingRoomPage() {
  return (
    <div className="space-y-6">
      {/* Admin-only form */}
      <AddMeetingRoomForm />
    </div>
  );
}
