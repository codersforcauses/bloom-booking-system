"use client";

import { useParams } from "next/navigation";

import EditMeetingRoomForm from "../edit-meeting-room-form";

export default function EditMeetingRoomPage() {
  const params = useParams();
  const roomId = parseInt(params.id as string, 10);

  if (isNaN(roomId) || roomId <= 0) {
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
