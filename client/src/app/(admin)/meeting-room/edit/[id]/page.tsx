import EditMeetingRoomForm from "../edit-meeting-room-form";

type PageProps = {
  params: { id: string };
};

export default function EditMeetingRoomPage({ params }: PageProps) {
  const roomId = Number(params.id);

  return (
    <div className="space-y-6">
      <EditMeetingRoomForm roomId={roomId} />
    </div>
  );
}
