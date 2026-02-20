import EditMeetingRoomForm from "./edit-meeting-room-form";

type PageProps = {
  searchParams?: { id?: string };
};

export default function EditMeetingRoomPage({ searchParams }: PageProps) {
  const roomId = Number(searchParams?.id);

  if (!roomId) {
    return <div className="p-6">Room id is missing.</div>;
  }

  return (
    <div className="space-y-6">
      <EditMeetingRoomForm roomId={roomId} />
    </div>
  );
}
