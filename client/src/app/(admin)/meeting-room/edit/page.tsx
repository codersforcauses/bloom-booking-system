import { redirect } from "next/navigation";

export default function EditMeetingRoomPage() {
  // This route is kept only as a safety net and should not be used for editing.
  // The canonical edit route is /meeting-room/edit/[id].
  redirect("/meeting-room");
}
