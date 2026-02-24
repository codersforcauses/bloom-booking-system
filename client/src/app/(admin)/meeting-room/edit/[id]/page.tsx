import EditMeetingRoomForm from "../edit-meeting-room-form";

type PageProps = {
  params: { id: string };
};

export default async function EditMeetingRoomPage({ params }: PageProps) {
  const roomId = params.id ? parseInt(params.id, 10) : NaN;

  if (Number.isNaN(roomId) || roomId <= 0) {
    return (
      <div className="space-y-6">
        <p>Invalid meeting room ID.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EditMeetingRoomForm roomId={roomId} />
    </div>
  );
}
